import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import db from '../connections/connection.js';

// Environment variables (no hardcoded secrets)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Passport serialization (required for sessions)
passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser((id, done) => {
  db.query('SELECT * FROM dms_user WHERE user_id = ?', [id], (err, results) => {
    if (err) return done(err);
    if (results.length === 0) return done(null, false);
    done(null, results[0]);
  });
});

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: GOOGLE_REDIRECT_URI
}, (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
    const profilePic = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

    console.log('Google OAuth strategy called for email:', email);

    if (!email) {
      console.error('No email returned from Google profile');
      return done(new Error('No email returned from Google'));
    }

    db.query('SELECT * FROM dms_user WHERE user_email = ?', [email], (err, results) => {
      if (err) {
        console.error('Database error during Google OAuth user lookup:', err);
        return done(err);
      }

      if (results.length > 0) {
        // Existing user - login
        console.log('Existing Google user found:', email);
        const existingUser = results[0];
        
        // Check if user is deleted
        if (existingUser.status === 'deleted') {
          console.log('Attempted login for deleted user:', email);
          return done(null, false, { code: 'ACCOUNT_DELETED', message: 'This account has been deleted and cannot be accessed.' });
        }
        
        // Update profile pic if changed
        if (existingUser.profile_pic !== profilePic) {
          console.log('Updating profile picture for user:', email);
          db.query('UPDATE dms_user SET profile_pic = ? WHERE user_id = ?', [profilePic, existingUser.user_id], (updateErr) => {
            if (updateErr) {
              console.error('Error updating profile picture:', updateErr);
            }
          });
        }
        
        const user = { ...existingUser, profile_pic: profilePic, isNewGoogleUser: false };
        return done(null, user);
      }

      // New user - create account
      console.log('Creating new Google user:', email);
      const googleUsername = profile.displayName || profile.emails[0].value.split('@')[0];
       
      db.query(
        "INSERT INTO dms_user (user_email, Username, is_verified, role, profile_pic, status) VALUES (?, ?, 'yes', ?, ?, 'active')",
        [email, googleUsername, 'FACULTY', profilePic],
        (insertErr, result) => {
          if (insertErr) {
            console.error('Error creating new Google user:', insertErr);
            return done(insertErr);
          }
          
          console.log('New Google user created with ID:', result.insertId);
          const newUserId = result.insertId;
          
          // Create notification for new Google user registration
          const notifTitle = `New User Registration: ${profile.displayName || googleUsername}`;
          const notifMessage = `A new user "${googleUsername}" (${email}) has registered via Google OAuth.`;
          
          // Create notification visible to admins and deans
          db.query(
            `INSERT INTO notifications (title, message, type, visible_to_all, created_at, related_doc_id)
             VALUES (?, ?, 'user_registration', 0, NOW(), NULL)`,
            [notifTitle, notifMessage],
            (notifErr, notifResult) => {
              if (notifErr) {
                console.error('Failed to create Google user registration notification:', notifErr);
              } else {
                const notificationId = notifResult.insertId;
                
                // Target admins and deans
                db.query(
                  'SELECT user_id FROM dms_user WHERE role IN (?, ?)',
                  ['ADMIN', 'DEAN'],
                  (adminErr, adminUsers) => {
                    if (!adminErr && adminUsers.length > 0) {
                      const userTargets = adminUsers.map(u => [notificationId, u.user_id]);
                      db.query(
                        'INSERT INTO notification_users (notification_id, user_id) VALUES ?',
                        [userTargets],
                        (targetErr) => {
                          if (targetErr) {
                            console.error('Failed to target notification users:', targetErr);
                          }
                        }
                      );
                    }
                  }
                );
                
                console.log(`Created Google user registration notification for user ID: ${newUserId}`);
              }
            }
          );
          
          db.query('SELECT * FROM dms_user WHERE user_id = ?', [result.insertId], (fetchErr, users) => {
            if (fetchErr) {
              console.error('Error fetching newly created user:', fetchErr);
              return done(fetchErr);
            }
            const user = { ...users[0], isNewGoogleUser: true };
            return done(null, user);
          });
        }
      );
    });
  } catch (e) {
    console.error('Exception in Google OAuth strategy:', e);
    return done(e);
  }
}));

const router = express.Router();

// Start Google OAuth
router.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
  })
);

// Google OAuth callback
router.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', async (err, user, info) => {
    if (err) {
      console.error('Passport error during Google callback:', err);
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_error`);
    }

    // Handle deleted account
    if (info && (info.code === 'ACCOUNT_DELETED' || (info.message && info.message.includes('deleted')))) {
      return res.redirect(`${FRONTEND_URL}/login?error=account_deleted`);
    }

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }

    // Check maintenance mode before establishing session
    let maintenanceMode = false;
    try {
      const [maintenanceRows] = await db.promise().execute(
        'SELECT maintenance_mode FROM system_settings WHERE id = 1'
      );
      maintenanceMode = maintenanceRows.length > 0 ? maintenanceRows[0].maintenance_mode === 1 : false;
    } catch (dbError) {
      // Table doesn't exist yet, maintenance mode is off
      maintenanceMode = false;
    }

    if (maintenanceMode) {
      const isAdmin = user.role && user.role.toLowerCase() === 'admin';
      if (!isAdmin) {
        return res.redirect(`${FRONTEND_URL}/login?error=maintenance_mode`);
      }
    }

    // Establish a login session
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('Error establishing session after Google login:', loginErr);
        return res.redirect(`${FRONTEND_URL}/login?error=oauth_error`);
      }

      try {
        const userData = encodeURIComponent(JSON.stringify({
          id: user.user_id,
          email: user.user_email,
          username: user.Username,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role,
          profilePic: user.profile_pic,
          department: user.department,
          contactNumber: user.Contact_number,
          status: user.status,
          isVerified: user.is_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          isNewGoogleUser: user.isNewGoogleUser || false
        }));
        return res.redirect(`${FRONTEND_URL}/login?user=${userData}`);
      } catch (serializeErr) {
        console.error('Error serializing user data for redirect:', serializeErr);
        return res.redirect(`${FRONTEND_URL}/login?error=oauth_error`);
      }
    });
  })(req, res, next);
});

export default router;
