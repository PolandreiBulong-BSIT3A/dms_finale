# Revert to 3 Roles Only

## Changes Made

Reverted the system back to **3 roles only**:
- ✅ **ADMIN** - Administrator
- ✅ **DEAN** - Dean
- ✅ **FACULTY** - Faculty

Removed roles:
- ❌ PRINCIPAL
- ❌ DEPT_SECRETARY (Department Secretary)
- ❌ PRESIDENT

---

## Files Modified

### Frontend Files:
1. ✅ `src/dashboards/components/User.jsx`
   - Removed PRINCIPAL, DEPT_SECRETARY, PRESIDENT from role filter dropdown
   - Removed extra roles from update modal dropdown
   - Removed import of `isDeanLevel` and `ROLE_DISPLAY_NAMES`

2. ✅ `src/lib/utils/rolePermissions.js`
   - Updated `DEAN_LEVEL_ROLES` to only include `['DEAN']`
   - Updated `USER_ROLES` to only include 3 roles
   - Updated `ROLE_DISPLAY_NAMES` to only include 3 roles

### Backend Files:
1. ✅ `src/lib/api/backend/users/UsersAPI.js`
   - Already set to allow only `['ADMIN', 'ADMINISTRATOR', 'DEAN', 'FACULTY']`

2. ✅ `src/lib/api/backend/utils/rolePermissions.js`
   - Updated `DEAN_LEVEL_ROLES` to only include `['DEAN']`
   - Updated `USER_ROLES` to only include 3 roles

### Database Migration:
1. ✅ `migrations/revert_to_3_roles.sql`
   - SQL script to convert existing PRINCIPAL/DEPT_SECRETARY/PRESIDENT users to DEAN
   - Updates all 5 tables with ENUM role columns
   - Removes extra roles from database schema

---

## Deployment Steps

### 1. Run Database Migration
```sql
-- Run this in MySQL
source migrations/revert_to_3_roles.sql;

-- OR copy and paste the SQL from the file
```

### 2. Rebuild Frontend
```bash
npm run build
```

### 3. Commit Changes
```bash
git add -A
git commit -m "Revert to 3 roles only (ADMIN, DEAN, FACULTY)"
git push
```

---

## What Happens to Existing Users?

Any users currently assigned to the removed roles will be **automatically converted to DEAN**:
- PRINCIPAL → DEAN
- DEPT_SECRETARY → DEAN
- PRESIDENT → DEAN

This ensures no users lose access and all dean-level permissions are preserved.

---

## Role Permissions After Revert

### ADMIN
- Full system access
- Can manage all users
- Can manage all departments
- Can see all documents

### DEAN
- Department-level access
- Can manage users in their department
- Can see department documents
- Can create announcements for their department

### FACULTY
- Basic user access
- Can view documents
- Can upload documents
- Limited to their own department

---

## Verification

After deployment, verify:
1. ✅ Role dropdown only shows 3 options
2. ✅ No errors when updating user roles
3. ✅ Existing users still have access
4. ✅ Database ENUM columns only allow 3 roles

---

**Status:** ✅ All changes completed and ready for deployment
