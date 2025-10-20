# New User Roles Implementation Guide

## Overview

Added three new user roles with DEAN-level permissions:
- **PRINCIPAL** - School principal with administrative authority
- **DEPT_SECRETARY** - Department secretary with administrative support role
- **PRESIDENT** - President/Director with leadership authority

These roles have the **same permissions and access as DEAN**.

---

## 🚀 Implementation Steps

### 1. Run Database Migration

Execute the SQL migration to update all role ENUM fields:

```bash
# Connect to your database and run:
mysql -u your_username -p your_database < migrations/add_new_user_roles.sql
```

**Or run directly in phpMyAdmin/MySQL Workbench:**

```sql
-- Update all tables with role ENUM fields
ALTER TABLE `dms_user` 
MODIFY COLUMN `role` ENUM('ADMIN','DEAN','FACULTY','PRINCIPAL','DEPT_SECRETARY','PRESIDENT') DEFAULT 'FACULTY';

ALTER TABLE `announcement_roles` 
MODIFY COLUMN `role` ENUM('ADMIN','DEAN','FACULTY','PRINCIPAL','DEPT_SECRETARY','PRESIDENT') NOT NULL;

ALTER TABLE `document_roles` 
MODIFY COLUMN `role` ENUM('ADMIN','DEAN','FACULTY','PRINCIPAL','DEPT_SECRETARY','PRESIDENT') NOT NULL;

ALTER TABLE `notification_roles` 
MODIFY COLUMN `role` ENUM('ADMIN','DEAN','FACULTY','PRINCIPAL','DEPT_SECRETARY','PRESIDENT') NOT NULL;

ALTER TABLE `document_actions` 
MODIFY COLUMN `assigned_to_role` ENUM('ADMIN','DEAN','FACULTY','PRINCIPAL','DEPT_SECRETARY','PRESIDENT') DEFAULT NULL;
```

### 2. Deploy Code Changes

```bash
cd ispsc_dms
git add -A
git commit -m "Add new user roles: PRINCIPAL, DEPT_SECRETARY, PRESIDENT"
git push
```

### 3. Verify Deployment

After deployment, check:
- ✅ Backend starts without errors
- ✅ Frontend builds successfully
- ✅ Role dropdowns show new roles

---

## 📁 Files Modified

### Backend Files:
1. **`src/lib/api/backend/utils/rolePermissions.js`** (NEW)
   - Centralized role permission logic
   - Functions: `isDeanLevel()`, `isAdminLevel()`, etc.

2. **`src/lib/api/backend/documents/RequestsAPI.js`**
   - Updated to use `isDeanLevel()` function
   - All dean-level roles now have same access

3. **`src/lib/api/backend/announcement/AnnouncementsAPI.js`**
   - Updated to use `isDeanLevel()` function
   - Dean-level roles can create department announcements

### Frontend Files:
1. **`src/lib/utils/rolePermissions.js`** (NEW)
   - Frontend version of role permission utilities
   - Includes display names for roles

2. **`src/dashboards/components/User.jsx`**
   - Added new roles to dropdowns
   - Updated role checks to use `isDeanLevel()`
   - Role filter includes all new roles

### Database Migration:
1. **`migrations/add_new_user_roles.sql`** (NEW)
   - Updates all ENUM fields to include new roles

---

## 🎯 Role Permissions

### ADMIN
- Full system access
- Can manage all users, documents, and settings
- Can assign any role

### DEAN-Level Roles (DEAN, PRINCIPAL, DEPT_SECRETARY, PRESIDENT)
- Administrative and leadership responsibilities
- Can view all pending requests
- Can create department-specific announcements
- Can manage users in their department
- **Same permissions as DEAN**

### FACULTY
- Teaching and academic responsibilities
- Can upload and view documents
- Can see requests assigned to them
- Limited administrative access

---

## 💡 Usage Examples

### Assigning New Roles

**In User Management:**
1. Go to User Management
2. Click "Update" on a user
3. Select role from dropdown:
   - Administrator
   - Dean
   - **Principal** ← NEW
   - **Department Secretary** ← NEW
   - **President** ← NEW
   - Faculty

### Filtering by Role

The role filter now includes:
- All Roles
- Administrator
- Dean
- Principal ← NEW
- Department Secretary ← NEW
- President ← NEW
- Faculty

### Creating Announcements

All dean-level roles can create announcements:
- Principals can announce to their department
- Department Secretaries can send department notices
- Presidents can make leadership announcements

---

## 🔍 Testing Checklist

### Database
- [ ] Run migration successfully
- [ ] Verify ENUM fields updated: `SHOW COLUMNS FROM dms_user LIKE 'role';`
- [ ] Check all 5 tables updated (dms_user, announcement_roles, document_roles, notification_roles, document_actions)

### Backend
- [ ] Server starts without errors
- [ ] Check logs for role permission initialization
- [ ] Test API endpoints with new roles

### Frontend
- [ ] Role dropdowns show all 6 roles
- [ ] Can assign new roles to users
- [ ] Role filter works correctly
- [ ] Dean-level permissions work for all new roles

### User Experience
- [ ] Create user with PRINCIPAL role
- [ ] Verify they can see all pending requests
- [ ] Verify they can create department announcements
- [ ] Verify they have same access as DEAN

---

## 🐛 Troubleshooting

### Issue: "Data truncated for column 'role'"
**Solution:** Run the migration SQL to update ENUM fields

### Issue: Role dropdown doesn't show new roles
**Solution:** 
1. Clear browser cache
2. Rebuild frontend: `npm run build`
3. Hard refresh (Ctrl+Shift+R)

### Issue: Permission denied for new roles
**Solution:** Check that `isDeanLevel()` function is imported and used correctly

### Issue: Can't assign new roles
**Solution:** Verify database migration completed successfully

---

## 📊 Role Comparison

| Feature | ADMIN | DEAN-Level* | FACULTY |
|---------|-------|-------------|---------|
| View All Documents | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ✅ (Dept) | ❌ |
| Create Announcements | ✅ | ✅ (Dept) | ❌ |
| View All Requests | ✅ | ✅ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| Assign Roles | ✅ | ✅ (Limited) | ❌ |

*DEAN-Level includes: DEAN, PRINCIPAL, DEPT_SECRETARY, PRESIDENT

---

## 🔐 Security Notes

1. **Role Hierarchy:**
   - ADMIN > DEAN-Level > FACULTY
   
2. **Permission Checks:**
   - All backend endpoints validate roles
   - Frontend UI adapts based on role
   - Database constraints enforce role values

3. **Best Practices:**
   - Assign roles based on actual job function
   - Review user roles periodically
   - Use least privilege principle

---

## 📞 Support

If you encounter issues:
1. Check database migration completed
2. Verify code deployed successfully
3. Check browser console for errors
4. Review server logs for permission errors

---

## ✅ Summary

**What Changed:**
- ✅ Added 3 new roles: PRINCIPAL, DEPT_SECRETARY, PRESIDENT
- ✅ All new roles have DEAN-level permissions
- ✅ Updated 5 database tables
- ✅ Centralized role permission logic
- ✅ Updated UI to show new roles

**What Stayed the Same:**
- ✅ Existing ADMIN, DEAN, FACULTY roles unchanged
- ✅ All existing permissions preserved
- ✅ No breaking changes to existing functionality

**Next Steps:**
1. Run database migration
2. Deploy code changes
3. Test with new roles
4. Assign roles to users as needed

---

**Last Updated:** October 2025
**Version:** 1.0
