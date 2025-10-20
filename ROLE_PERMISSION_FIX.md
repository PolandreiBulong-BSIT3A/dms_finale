# Role Permission Fix - isDeanLevel() Function

## Issue Found
The `isDeanLevel()` function was not handling case-insensitive role comparison, which caused it to fail when roles were passed in different cases (e.g., "dept_secretary" vs "DEPT_SECRETARY").

## Root Cause
The function was doing a direct array inclusion check without normalizing the input:
```javascript
// BEFORE (BROKEN)
export const isDeanLevel = (role) => {
  return DEAN_LEVEL_ROLES.includes(role);
};
```

This would fail if:
- Role was passed as lowercase: `"dept_secretary"` ❌
- Role was passed as mixed case: `"Dept_Secretary"` ❌
- Role was null or undefined ❌

## Fix Applied

### Frontend: `src/lib/utils/rolePermissions.js`
```javascript
// AFTER (FIXED)
export const isDeanLevel = (role) => {
  if (!role) return false;
  const roleUpper = String(role).toUpperCase();
  return DEAN_LEVEL_ROLES.includes(roleUpper);
};

export const isAdminLevel = (role) => {
  if (!role) return false;
  const roleUpper = String(role).toUpperCase();
  return ADMIN_LEVEL_ROLES.includes(roleUpper);
};
```

### Backend: `src/lib/api/backend/utils/rolePermissions.js`
```javascript
// AFTER (FIXED)
const isDeanLevel = (role) => {
  if (!role) return false;
  const roleUpper = String(role).toUpperCase();
  return DEAN_LEVEL_ROLES.includes(roleUpper);
};
```

## Impact
This fix ensures that ALL dean-level roles (DEAN, PRINCIPAL, DEPT_SECRETARY, PRESIDENT) will:
- ✅ Have proper dean-level permissions
- ✅ See all pending requests
- ✅ Create department announcements
- ✅ Access dean-level features
- ✅ Work regardless of case (DEPT_SECRETARY, dept_secretary, Dept_Secretary)

## Testing
After rebuilding the frontend (`npm run build`), verify:
1. DEPT_SECRETARY users can see all pending requests
2. PRINCIPAL users have dean-level access
3. PRESIDENT users have dean-level access
4. All role checks work correctly across the application

## Files Modified
1. ✅ `src/lib/utils/rolePermissions.js` (Frontend)
2. ✅ `src/lib/api/backend/utils/rolePermissions.js` (Backend)

## Next Steps
Run `npm run build` to apply the frontend changes.
