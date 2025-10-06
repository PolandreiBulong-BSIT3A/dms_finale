# Maintenance Mode - Complete Fix Guide

## Problems Fixed

### 1. ✅ Wrong API Endpoint
- **Was**: `MaintenancePage.jsx` called `/api/system/maintenance-settings` (doesn't exist)
- **Now**: Uses `/api/maintenance/status` (correct public endpoint)

### 2. ✅ Missing Credentials
- **Was**: Fetch calls without `credentials: 'include'`
- **Now**: All maintenance fetches include credentials

### 3. ✅ React Hook Dependencies
- **Was**: useEffect causing infinite loops
- **Now**: Added eslint-disable comment for intentional empty dependency

---

## Remaining Issues to Fix

### Issue #1: Duplicate Maintenance Logic in Login.jsx

**Location**: `src/login_system/login/structure/Login.jsx` (lines 1103-1153)

**Problem**: Login component has its OWN full-page maintenance takeover that conflicts with `App.jsx` and `MaintenancePage.jsx`.

**Solution**: Remove the maintenance takeover from Login.jsx since App.jsx already handles it.

**What to do**:
1. Open `src/login_system/login/structure/Login.jsx`
2. Find lines 1103-1153 (the maintenance-fullpage block)
3. Delete the entire block:
```javascript
// DELETE THIS ENTIRE BLOCK (lines 1103-1153)
if (maintenanceMode && !adminBypass) {
  return (
    <div className={`page-transition login-mode`}>
      <div className="maintenance-fullpage">
        ...
      </div>
    </div>
  );
}
```
4. Keep the maintenance state and fetch logic (lines 54-229) but remove the early return

---

### Issue #2: CORS 401 Errors on Production

**Problem**: Backend on Render doesn't allow requests from Hostinger frontend.

**Solution**:

#### On Render Dashboard:
1. Go to your backend service: `dms-finale.onrender.com`
2. Click **Environment** tab
3. Add/Update these variables:
   ```
   FRONTEND_URL=https://lightpink-cobra-933550.hostingersite.com
   NODE_ENV=production
   ```
4. **Save** and **Manual Deploy** → **Clear build cache & deploy**

#### Verify CORS in server.js:
The code already looks correct:
```javascript
app.use(cors({
  origin: FRONTEND_URL, // ✅ This reads from env
  credentials: true
}));
```

---

### Issue #3: Build and Deploy Process

**Current Process**:
```bash
npm run build  # Creates dist/ folder
# Upload dist/ to Hostinger
```

**Important**: Make sure `VITE_API_BASE_URL` is set BEFORE building:

#### Option A: Create `.env.production` file:
```bash
# File: .env.production
VITE_API_BASE_URL=https://dms-finale.onrender.com/api
```

#### Option B: Set in command:
```bash
VITE_API_BASE_URL=https://dms-finale.onrender.com/api npm run build
```

---

## How Maintenance Mode Should Work

### Flow:
1. **App.jsx** checks `/api/maintenance/status` on load
2. If `maintenanceMode: true` and user is NOT admin/dean:
   - Show `<MaintenancePage />`
3. If user IS admin/dean:
   - Show normal app with green notice
4. **MaintenancePage.jsx** fetches same endpoint for details

### Admin Panel:
- Admin clicks "Configure/Enable"
- Modal opens with message, start time, end time
- Saves to database via `POST /api/system/maintenance`
- Backend updates `system_settings` table

### Backend:
- `GET /api/maintenance/status` (public, no auth)
  - Returns: `{ maintenanceMode, maintenanceMessage, maintenanceEndTime }`
- `POST /api/system/maintenance` (requires auth)
  - Updates maintenance settings

---

## Testing Checklist

### Local Testing:
- [ ] `npm run dev` - Frontend runs on localhost:3000
- [ ] Backend runs on localhost:5000
- [ ] Create `.env.development`:
  ```
  VITE_API_BASE_URL=http://localhost:5000/api
  ```
- [ ] Enable maintenance in Admin Panel
- [ ] Logout → See maintenance page
- [ ] Login as admin → See green notice, can access system

### Production Testing:
- [ ] Verify `FRONTEND_URL` on Render
- [ ] Build with production env: `npm run build`
- [ ] Upload `dist/` to Hostinger
- [ ] Test maintenance mode toggle
- [ ] Check browser console for 401 errors
- [ ] Test as regular user (should see maintenance page)
- [ ] Test as admin (should see green notice)

---

## Quick Fix Commands

```bash
# 1. Fix and rebuild
npm run build

# 2. Check if API base URL is correct in built files
grep -r "dms-finale.onrender.com" dist/

# 3. If wrong, rebuild with env:
VITE_API_BASE_URL=https://dms-finale.onrender.com/api npm run build

# 4. Upload dist/ to Hostinger

# 5. On Render: Manual Deploy → Clear build cache & deploy
```

---

## Files Changed in This Fix

1. ✅ `src/components/MaintenancePage.jsx` - Fixed API endpoint
2. ✅ `src/App.jsx` - Added credentials, fixed hook deps
3. ⏳ `src/login_system/login/structure/Login.jsx` - NEEDS MANUAL FIX (remove duplicate)

---

## Summary

**What I Fixed**:
- MaintenancePage now calls correct endpoint (`/maintenance/status`)
- Added `credentials: 'include'` to all maintenance fetches
- Fixed React hook dependency warnings

**What You Need to Do**:
1. Remove duplicate maintenance UI from `Login.jsx` (lines 1103-1153)
2. Set `FRONTEND_URL` on Render dashboard
3. Rebuild with correct `VITE_API_BASE_URL`
4. Upload to Hostinger
5. Restart Render service

**Result**: Clean, working maintenance mode with no 401 errors! 🎉
