/* eslint-disable no-unused-vars */
import express from 'express';
import db from '../connections/connection.js';
import nodemailer from 'nodemailer';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import {
  loginRateLimit,
  signupRateLimit,
  otpRateLimit,
  requireAuth,
  requireAdmin,
  requireDean,
  validateLogin,
  validateSignup,
  generateTokens,
  hashPassword,
  comparePassword,
  errorHandler
} from '../middleware/authMiddleware.js';

const router = express.Router();

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Configure Nodemailer using SMTP_* envs (with EMAIL_* fallbacks)
const SMTP_HOST = process.env.SMTP_HOST || process.env.EMAIL_HOST || (!process.env.EMAIL_SERVICE ? 'smtp.gmail.com' : undefined);
const SMTP_PORT = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
const SMTP_SECURE = (() => {
  const raw = (process.env.SMTP_SECURE ?? process.env.EMAIL_SECURE ?? '').toString().toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return SMTP_PORT === 465; // infer from port when not provided
})();
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER; // required
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS; // required
const EMAIL_FROM = process.env.MAIL_FROM || process.env.EMAIL_FROM || SMTP_USER;
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';

let transporter;
let smtpReady = false;
try {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE, // true for 465, false for 587
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
} catch (e) {
  console.error('Failed to initialize mail transporter:', e?.message || e);
}

// Verify transporter on startup for better diagnostics
(async () => {
  try {
    if (!transporter) throw new Error('Transporter not configured');
    console.log(`Attempting SMTP verify: host=${SMTP_HOST} port=${SMTP_PORT} secure=${SMTP_SECURE} user=${SMTP_USER}`);
    await transporter.verify();
    console.log(`[SMTP verify OK] host=${SMTP_HOST} port=${SMTP_PORT} secure=${SMTP_SECURE}`);
    smtpReady = true;
  } catch (err) {
    console.error('[SMTP verify FAILED]', {
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      user: SMTP_USER,
      error: err?.message || err,
      code: err?.code
    });
  }
})();

// Unified email sender with Brevo HTTP fallback
const sendViaBrevoHttp = async ({ from, to, subject, html }) => {
  if (!BREVO_API_KEY) throw new Error('BREVO_API_KEY missing');
  const sender = (() => {
    // Parse display name if provided in from string
    if (typeof from === 'string') {
      const match = from.match(/^(.*)<(.+@.+)>\s*$/);
      if (match) {
        return { name: match[1].trim().replace(/\"/g, ''), email: match[2].trim() };
      }
      return { email: from.replace(/["<>]/g, '').trim() };
    }
    if (from && typeof from === 'object') return from;
    throw new Error('Invalid MAIL_FROM');
  })();

  const payload = {
    sender,
    to: Array.isArray(to) ? to.map(e => (typeof e === 'string' ? { email: e } : e)) : [{ email: to }],
    subject,
    htmlContent: html,
  };

  console.log('[Brevo HTTP] Sending email:', { sender, to: payload.to, subject });
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[Brevo HTTP] Failed:', res.status, text);
    const err = new Error(`Brevo HTTP send failed: ${res.status} ${text}`);
    err.status = res.status;
    throw err;
  }
  console.log('[Brevo HTTP] Email sent successfully');
};

const sendEmail = async ({ from, to, subject, html }) => {
  // Try SMTP first if verified
  if (smtpReady && transporter) {
    try {
      await transporter.sendMail({ from, to, subject, html });
      return;
    } catch (e) {
      const code = e?.code || '';
      const msg = e?.message || '';
      console.warn('SMTP sendMail failed, will try Brevo HTTP fallback:', code, msg);
      // fall through to HTTP
    }
  }
  // Fallback to Brevo HTTP API
  await sendViaBrevoHttp({ from, to, subject, html });
};

// Multer for profile picture upload (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// ----- Auth helpers -----
const normalizeRole = (role) => (role || '').toString().trim().toLowerCase();
const isAdminRole = (role) => {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'administrator';
};
const isDeanRole = (role) => {
  const r = normalizeRole(role);
      return r === 'dean';
};

// User Registration with OTP Email Verification
router.post('/signup', signupRateLimit, validateSignup, async (req, res) => {
  const { username, firstname, lastname, email, password, department, contactNumber } = req.body;
  
  // Convert department to department_id if it's a string
  let department_id = null;
  if (department) {
    if (isNaN(department)) {
      // If department is a string (old format), try to find the department_id
      const [deptResults] = await db.promise().query(
        'SELECT department_id FROM departments WHERE code = ? OR name = ?',
        [department, department]
      );
      if (deptResults.length > 0) {
        department_id = deptResults[0].department_id;
      }
    } else {
      // If department is already a number, use it as department_id
      department_id = parseInt(department);
    }
  }
  
  try {
    // Check if user already exists
    const [existingUsers] = await db.promise().query(
      'SELECT user_id FROM dms_user WHERE user_email = ? OR Username = ?', 
      [email, username]
    );

    if (existingUsers.length > 0) {
      // Check if email exists first
      const emailExists = existingUsers.some(user => user.user_email === email);
      if (emailExists) {
        return res.status(409).json({ 
          success: false, 
          message: 'Email already registered.',
          code: 'EMAIL_EXISTS'
        });
      } else {
        return res.status(409).json({ 
          success: false, 
          message: 'Email already taken.',
          code: 'USERNAME_EXISTS'
        });
      }
    }

    // Hash password with enhanced security
    const hashedPassword = await hashPassword(password);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert new user
    const [result] = await db.promise().query(
        'INSERT INTO dms_user (user_email, password, Username, firstname, lastname, Contact_number, department_id, role, is_verified, verification_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, username, firstname, lastname, contactNumber, department_id, 'FACULTY', 'no', otp, 'pending']
    );

    const newUserId = result.insertId;

    // Create notification for new user registration
    try {
      const notifTitle = `New User Registration: ${firstname} ${lastname}`;
      const notifMessage = `A new user "${username}" (${email}) has registered via signup form.`;
      
      // Create notification visible to admins and deans
      const [notifResult] = await db.promise().query(
        `INSERT INTO notifications (title, message, type, visible_to_all, created_at, related_doc_id)
         VALUES (?, ?, 'user_registration', 0, NOW(), NULL)`,
        [notifTitle, notifMessage]
      );
      
      const notificationId = notifResult.insertId;
      
      // Target admins and deans
      const [adminUsers] = await db.promise().query(
        'SELECT user_id FROM dms_user WHERE role IN (?, ?)',
        ['ADMIN', 'DEAN']
      );
      
      if (adminUsers.length > 0) {
        const userTargets = adminUsers.map(u => [notificationId, u.user_id]);
        await db.promise().query(
          'INSERT INTO notification_users (notification_id, user_id) VALUES ?',
          [userTargets]
        );
      }
      
      // Emit real-time notification
      try {
        req.io?.emit?.('notification:new', {
          id: notificationId,
          title: notifTitle,
          message: notifMessage,
          type: 'user_registration',
          visible_to_all: 0,
          created_at: new Date().toISOString(),
          related_doc_id: null,
        });
      } catch (socketError) {
        console.warn('Failed to emit user registration notification:', socketError);
      }
      
      console.log(`Created user registration notification for user ID: ${newUserId}`);
    } catch (notifError) {
      console.error('Failed to create user registration notification:', notifError);
      // Don't fail the signup if notification creation fails
    }

    // Send OTP email
    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: 'ISPSC DMS - Email Verification',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #dc2626;">Welcome to ISPSc DMS</h2>
<p>Hi ${firstname},</p>
<p>Thank you for registering with ISPSc DMS. To complete your registration, please use the verification code below:</p>
<div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
<h1 style="color: #dc2626; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
</div>
<p>This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
<p>Best regards,<br>ISPSc DMS Team</p>
</div>`
    };

    try {
      await sendEmail(mailOptions);
      res.json({ 
        success: true, 
        message: 'Account created successfully! Please check your email for the verification code.',
        emailSent: true 
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError);
      res.json({ 
        success: true, 
        message: 'Account created. Email sending failed; please use the code if received or request resend.',
        emailSent: false 
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration.',
      code: 'SIGNUP_ERROR'
    });
  }
});

// OTP Verification Endpoint
router.post('/verify-otp', otpRateLimit, async (req, res) => {
  const { email, code } = req.body;
  
  if (!email || !code) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and verification code are required.',
      code: 'MISSING_FIELDS'
    });
  }
  
  try {
    // Verify the user exists and the code matches
    const [results] = await db.promise().query(
      'SELECT * FROM dms_user WHERE user_email = ? AND verification_code = ? AND is_verified = ?', 
      [email, code, 'no']
    );
    
    if (results.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code, email not found, or account already verified.',
        code: 'INVALID_OTP'
      });
    }
    
    // Update verification status
    await db.promise().query(
      "UPDATE dms_user SET is_verified = 'yes', verification_code = NULL WHERE user_email = ? AND is_verified = 'no'", 
      [email]
    );
    
    res.json({ 
      success: true, 
      message: 'Email verified successfully! Your account is now active and you can log in.',
      code: 'VERIFICATION_SUCCESS'
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during verification.',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// User Login with JWT tokens
router.post('/login', loginRateLimit, validateLogin, async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check maintenance mode first
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
    // Find user by email
    const [results] = await db.promise().query(
      'SELECT * FROM dms_user WHERE user_email = ?', 
      [email]
    );

    if (results.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = results[0];

    // Check if user is deleted
    if (user.status === 'deleted') {
      return res.status(403).json({ 
        success: false, 
        message: 'This account has been deleted and cannot be accessed.',
        code: 'ACCOUNT_DELETED'
      });
    }

    // Check if user is verified
    if (user.is_verified !== 'yes') {
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }
    
    // Check if user has a password (manual signup) or not (Google signup)
    if (!user.password || user.password === '') {
      return res.status(401).json({ 
        success: false, 
        message: 'This account was created using Google Sign-In. Please use the "Sign In with Google" button to login.',
        accountType: 'google',
        code: 'GOOGLE_ACCOUNT'
      });
    }
    
    // Verify password
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Check maintenance mode after successful authentication
    if (maintenanceMode) {
      const isAdmin = user.role && user.role.toLowerCase() === 'admin';
      if (!isAdmin) {
        return res.status(503).json({
          success: false,
          message: 'System is currently under maintenance. Only administrators can access the system.',
          maintenanceMode: true,
          code: 'MAINTENANCE_MODE'
        });
      }
    }
    
    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Create session for backward compatibility
    req.session.user = {
      user_id: user.user_id,
      user_email: user.user_email,
      Username: user.Username,
      role: user.role,
      department: user.department
    };
    
    // Set secure cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ 
      success: true, 
      message: 'Login successful!',
      user: {
        id: user.user_id,
        email: user.user_email,
        username: user.Username,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        department: user.department,
        contactNumber: user.Contact_number,
        profilePic: user.profile_pic,
        status: user.status,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login.',
      code: 'LOGIN_ERROR'
    });
  }
});

// Token refresh endpoint
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.cookies || req.body;
  
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token required.',
      code: 'REFRESH_TOKEN_MISSING'
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded);
    
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully.',
      tokens: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token.',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

// Get current user from session/JWT
router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT u.*, d.name as department_name, d.code as department_code 
      FROM dms_user u 
      LEFT JOIN departments d ON u.department_id = d.department_id 
      WHERE u.user_id = ?
    `, [req.currentUser.id]);
      
      if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
      }
      
      const user = results[0];
    res.json({
        success: true,
        user: {
          id: user.user_id,
          email: user.user_email,
          username: user.Username,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role,
          department_id: user.department_id,
          department_name: user.department_name,
          department_code: user.department_code,
          contactNumber: user.Contact_number,
          profilePic: user.profile_pic,
          status: user.status,
          isVerified: user.is_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
    });
  } catch (error) {
    console.error('Error in /auth/me:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error.',
      code: 'SERVER_ERROR'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  
  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Could not log out.',
        code: 'LOGOUT_ERROR'
      });
    }
    res.json({ 
      success: true, 
      message: 'Logged out successfully.',
      code: 'LOGOUT_SUCCESS'
    });
  });
});

// Cancel signup and delete unverified user
router.post('/cancel-signup', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
  db.query("DELETE FROM dms_user WHERE user_email = ? AND is_verified = 'no'", [email], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error.' });
    return res.json({ success: true, message: 'Account deleted.' });
  });
});

// Set password for Google users
router.post('/setup-password', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  
  try {
    // Check if user exists and is a Google user (no password)
    db.query('SELECT * FROM dms_user WHERE user_email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.' });
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      
      const user = results[0];
      if (user.password && user.password !== '') {
        return res.status(400).json({ success: false, message: 'This account already has a password set up.' });
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update user with password
      db.query('UPDATE dms_user SET password = ? WHERE user_email = ?', [hashedPassword, email], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error.' });
        return res.json({ success: true, message: 'Password set up successfully! You can now login manually.' });
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Resend verification code
router.post('/resend-otp', otpRateLimit, async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required.',
      code: 'EMAIL_REQUIRED'
    });
  }

  try {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const [result] = await db.promise().query(
      'UPDATE dms_user SET verification_code = ? WHERE user_email = ? AND (is_verified = ? OR is_verified IS NULL)', 
      [otp, email, 'no']
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email not found or already verified.',
        code: 'EMAIL_NOT_FOUND'
      });
    }

    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: 'ISPSc DMS - New Verification Code',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #dc2626;">New Verification Code</h2>
<p>You requested a new verification code. Here it is:</p>
<div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
<h1 style="color: #dc2626; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
</div>
<p>This code will expire in 10 minutes.</p>
<p>Best regards,<br>ISPSc DMS Team</p>
</div>`
    };

    await sendEmail(mailOptions);
    res.json({ 
      success: true, 
      message: 'Verification code resent successfully.',
      code: 'OTP_RESENT'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send verification email.',
      code: 'EMAIL_SEND_ERROR'
    });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', otpRateLimit, async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required.',
      code: 'EMAIL_REQUIRED'
    });
  }

  try {
    // Check if user exists and is verified
    const [users] = await db.promise().query(
      'SELECT user_id, user_email, firstname FROM dms_user WHERE user_email = ? AND is_verified = ?',
      [email, 'yes']
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No verified account found with this email.',
        code: 'EMAIL_NOT_FOUND'
      });
    }

    const user = users[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in password_reset_code column (add this column if not exists)
    await db.promise().query(
      'UPDATE dms_user SET password_reset_code = ?, password_reset_expires = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE user_email = ?',
      [otp, email]
    );

    // Send OTP email
    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: 'ISPSC DMS - Password Reset Code',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #dc2626;">Password Reset Request</h2>
<p>Hi ${user.firstname || 'User'},</p>
<p>You requested to reset your password. Use the verification code below to proceed:</p>
<div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
<h1 style="color: #dc2626; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
</div>
<p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
<p>Best regards,<br>ISPSc DMS Team</p>
</div>`
    };

    await sendEmail(mailOptions);
    res.json({ 
      success: true, 
      message: 'Password reset code sent to your email.',
      code: 'OTP_SENT'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send password reset code.',
      code: 'EMAIL_SEND_ERROR'
    });
  }
});

// Verify Forgot Password OTP
router.post('/verify-forgot-password-otp', otpRateLimit, async (req, res) => {
  const { email, code } = req.body;
  
  if (!email || !code) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and verification code are required.',
      code: 'MISSING_FIELDS'
    });
  }

  try {
    const [users] = await db.promise().query(
      'SELECT user_id FROM dms_user WHERE user_email = ? AND password_reset_code = ? AND password_reset_expires > NOW()',
      [email, code]
    );

    if (users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification code.',
        code: 'INVALID_OTP'
      });
    }

    res.json({ 
      success: true, 
      message: 'Verification code confirmed.',
      code: 'OTP_VERIFIED'
    });
  } catch (error) {
    console.error('Verify forgot password OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during verification.',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Update Password
router.post('/update-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  
  if (!email || !code || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email, verification code, and new password are required.',
      code: 'MISSING_FIELDS'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 8 characters long.',
      code: 'PASSWORD_TOO_SHORT'
    });
  }

  try {
    // Verify OTP is still valid
    const [users] = await db.promise().query(
      'SELECT user_id FROM dms_user WHERE user_email = ? AND password_reset_code = ? AND password_reset_expires > NOW()',
      [email, code]
    );

    if (users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired verification code.',
        code: 'INVALID_OTP'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset code
    await db.promise().query(
      'UPDATE dms_user SET password = ?, password_reset_code = NULL, password_reset_expires = NULL WHERE user_email = ?',
      [hashedPassword, email]
    );

    res.json({ 
      success: true, 
      message: 'Password updated successfully.',
      code: 'PASSWORD_UPDATED'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update password.',
      code: 'UPDATE_ERROR'
    });
  }
});

// Get all departments
router.get('/departments', async (req, res) => {
  try {
    console.log('Fetching departments from database...');
    const [departments] = await db.promise().query(
      'SELECT department_id, name, code, is_active FROM departments WHERE is_active = 1 ORDER BY name'
    );

    console.log('Raw departments from DB:', departments);

    // Format departments for frontend select options
    const formattedDepartments = departments.map(dept => ({
      value: dept.department_id.toString(),
      label: dept.name,
      code: dept.code
    }));

    console.log('Formatted departments:', formattedDepartments);

    res.json({
      success: true,
      departments: formattedDepartments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments'
    });
  }
});

// Get specific department by ID
router.get('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [departments] = await db.promise().query(
      'SELECT department_id, name, code, is_active FROM departments WHERE department_id = ? AND is_active = 1',
      [id]
    );

    if (departments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      department: departments[0]
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department'
    });
  }
});


export default router;
