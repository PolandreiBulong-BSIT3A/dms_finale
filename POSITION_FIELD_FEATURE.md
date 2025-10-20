# Position/Designation Field Feature

## Overview
Added position and position_description fields to allow users to have the same role but different positions/designations.

**Example Use Case:**
- **Role:** DEAN
- **Position:** Secretary, Dean, Assistant Dean, Department Head, etc.

This eliminates the need to create new user roles for different positions.

---

## Database Changes

### Migration File: `migrations/add_position_field.sql`

**New Columns Added to `users` table:**
```sql
ALTER TABLE users 
ADD COLUMN position VARCHAR(100) NULL AFTER role,
ADD COLUMN position_description TEXT NULL AFTER position;
```

**Index Added:**
```sql
CREATE INDEX idx_users_position ON users(position);
```

**Default Values (Optional):**
- ADMIN → Position: "Administrator"
- DEAN → Position: "Dean"
- FACULTY → Position: "Faculty Member"

---

## Backend Changes

### File: `src/lib/api/backend/users/UsersAPI.js`

#### 1. GET `/api/users` - List Users
**Added to SELECT:**
```javascript
u.position,
u.position_description,
```

#### 2. PUT `/api/users/:id` - Update User
**Added to request body handling:**
```javascript
let { department_id, role, position, position_description } = req.body || {};

// Handle position field
if (position !== undefined) {
  const trimmedPosition = String(position || '').trim();
  fields.push('position = ?');
  values.push(trimmedPosition || null);
}

// Handle position_description field
if (position_description !== undefined) {
  const trimmedDesc = String(position_description || '').trim();
  fields.push('position_description = ?');
  values.push(trimmedDesc || null);
}
```

---

## Frontend Changes

### File: `src/dashboards/components/User.jsx`

#### 1. User Normalization
**Added to `normalizeUser()` function:**
```javascript
const positionVal = row?.position ?? '';
const positionDesc = row?.position_description ?? '';

return {
  // ... other fields
  position: positionVal || '',
  position_description: positionDesc || '',
};
```

#### 2. User Table Display
**Added Position Column:**
```jsx
<th style={styles.tableHeaderCell}>
  <button onClick={() => handleSort('position')} style={styles.sortBtn}>
    Position {getSortIcon('position')}
  </button>
</th>

// In table body:
<td style={styles.tableCell}>{user.position || '-'}</td>
```

#### 3. Update Modal Form
**Added to `updateForm` state:**
```javascript
const [updateForm, setUpdateForm] = useState({
  department: '',
  role: '',
  position: '',
  position_description: ''
});
```

**Added Position Input Fields:**
```jsx
{/* Position Field */}
<div style={styles.formFieldGroup}>
  <div style={styles.fieldLabel}>
    <FiUser size={16} style={styles.fieldIcon} />
    <span>Position/Designation</span>
  </div>
  <input
    type="text"
    value={updateForm.position}
    onChange={(e) => handleFormChange('position', e.target.value)}
    placeholder="e.g., Secretary, Assistant Dean, Department Head"
    style={styles.modernInput}
  />
  <div style={styles.roleDescription}>
    Specific position or designation within the role
  </div>
</div>

{/* Position Description Field */}
<div style={styles.formFieldGroup}>
  <div style={styles.fieldLabel}>
    <FiUser size={16} style={styles.fieldIcon} />
    <span>Position Description</span>
  </div>
  <textarea
    value={updateForm.position_description}
    onChange={(e) => handleFormChange('position_description', e.target.value)}
    placeholder="Brief description of responsibilities (optional)"
    style={{...styles.modernInput, minHeight: '80px', resize: 'vertical'}}
  />
</div>
```

#### 4. Update Submission
**Added to API request body:**
```javascript
const body = {
  department_id: deptIdNum,
  role: String(updateForm.role).toUpperCase(),
  position: updateForm.position || '',
  position_description: updateForm.position_description || ''
};
```

---

## Usage Examples

### Example 1: Dean with Secretary Position
```json
{
  "role": "DEAN",
  "position": "Secretary",
  "position_description": "Handles administrative tasks and documentation for the Dean's office"
}
```

### Example 2: Dean with Department Head Position
```json
{
  "role": "DEAN",
  "position": "Department Head",
  "position_description": "Leads the Computer Science department and oversees curriculum development"
}
```

### Example 3: Faculty with Program Coordinator Position
```json
{
  "role": "FACULTY",
  "position": "Program Coordinator",
  "position_description": "Coordinates the IT program and manages student internships"
}
```

---

## Deployment Steps

### 1. Run Database Migration
```bash
# Connect to MySQL
mysql -u root -p

# Select database
USE ispsc_dms;

# Run migration
source migrations/add_position_field.sql;

# Verify changes
DESCRIBE users;
```

### 2. Build and Deploy Frontend
```bash
npm run build
```

### 3. Commit and Push
```bash
git add -A
git commit -m "Add position/designation field to users"
git push
```

---

## Benefits

✅ **Flexibility:** Same role, different positions without creating new roles
✅ **Clarity:** Clear distinction between role (permissions) and position (title)
✅ **Scalability:** Easy to add new positions without database schema changes
✅ **Optional:** Position field is optional, doesn't break existing functionality
✅ **Searchable:** Indexed for fast queries

---

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Verify new columns exist in users table
- [ ] Test GET /api/users returns position fields
- [ ] Test PUT /api/users/:id updates position fields
- [ ] Verify position column appears in user table
- [ ] Test sorting by position works
- [ ] Test update modal shows position fields
- [ ] Test updating user with position works
- [ ] Test updating user without position works (optional field)
- [ ] Verify existing users still work without position

---

**Status:** ✅ Ready for deployment
**Files Modified:** 3 (UsersAPI.js, User.jsx, add_position_field.sql)
