# Positions CRUD Implementation

## ✅ Complete System for Managing User Positions

### **Overview:**
Created a full CRUD system for managing positions in the admin panel with a dropdown selector in the user management interface.

---

## 📋 What Was Implemented

### **1. Database Table** ✅
**File:** `migrations/create_positions_table.sql`

**Table Structure:**
```sql
CREATE TABLE positions (
  position_id INT(11) AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  role_type ENUM('ADMIN', 'DEAN', 'FACULTY', 'ALL') DEFAULT 'ALL',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Default Positions Inserted:**
- **ADMIN:** Administrator, Developer, IT Support
- **DEAN:** Dean, Assistant Dean, Secretary, Department Head
- **FACULTY:** Faculty Member, Professor, Associate Professor, Assistant Professor, Instructor, Program Coordinator, Research Coordinator

---

### **2. Backend API** ✅
**File:** `src/lib/api/backend/positions/PositionsAPI.js`

**Endpoints:**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/positions` | Get all positions (with filters) | ✅ User |
| GET | `/api/positions/:id` | Get single position | ✅ User |
| POST | `/api/positions` | Create new position | ✅ Admin |
| PUT | `/api/positions/:id` | Update position | ✅ Admin |
| DELETE | `/api/positions/:id` | Delete position | ✅ Admin |

**Query Parameters:**
- `role_type` - Filter by role (ADMIN, DEAN, FACULTY, ALL)
- `is_active` - Filter by active status (true/false)

**Features:**
- ✅ Prevents duplicate position names
- ✅ Prevents deletion if position is in use
- ✅ Role-based filtering
- ✅ Active/inactive status

---

### **3. Admin Panel Component** ✅
**File:** `src/dashboards/components/PositionsManagement.jsx`

**Features:**
- ✅ **Create** new positions
- ✅ **Read** all positions in a table
- ✅ **Update** existing positions
- ✅ **Delete** positions (with confirmation)
- ✅ Filter by role type
- ✅ Toggle active/inactive status
- ✅ Modern UI with modals
- ✅ Real-time validation

**UI Elements:**
- Clean table layout
- Color-coded role type badges
- Active/inactive status badges
- Inline edit/delete actions
- Modal forms for create/edit

---

### **4. User Management Dropdown** ✅
**File:** `src/dashboards/components/User.jsx`

**Changes Made:**

**A. State Management:**
```javascript
const [positionOptions, setPositionOptions] = useState([]);
```

**B. Fetch Positions Function:**
```javascript
const fetchPositions = async (roleType = null) => {
  const url = roleType 
    ? buildUrl(`positions?role_type=${roleType}&is_active=true`)
    : buildUrl('positions?is_active=true');
  const resp = await fetchJson(url, { method: 'GET' });
  if (resp && resp.success) {
    setPositionOptions(resp.positions);
  }
};
```

**C. Dynamic Position Loading:**
- Positions load when opening update modal
- Positions refresh when role changes
- Only shows positions for selected role
- Position field clears when role changes

**D. Dropdown UI:**
```jsx
<select
  value={updateForm.position}
  onChange={(e) => handleFormChange('position', e.target.value)}
  style={styles.modernSelect}
>
  <option value="">Select Position (Optional)</option>
  {positionOptions.map((pos) => (
    <option key={pos.position_id} value={pos.name}>
      {pos.name}
    </option>
  ))}
</select>
```

---

### **5. Server Integration** ✅
**File:** `server.js`

**Added:**
```javascript
import PositionsRouter from './src/lib/api/backend/positions/PositionsAPI.js';
app.use('/api', PositionsRouter);
```

---

## 🚀 Deployment Steps

### **1. Run Database Migration**
```bash
mysql -u root -p
USE u185173985_ispsc_tag_dms;
source migrations/create_positions_table.sql;
```

### **2. Restart Server**
```bash
# Stop server (Ctrl+C)
npm start
```

### **3. Access Admin Panel**
Navigate to the Positions Management component in your admin dashboard.

---

## 📸 How It Works

### **Admin Panel Workflow:**

1. **View Positions**
   - See all positions in a table
   - Filter by role type
   - See active/inactive status

2. **Create Position**
   - Click "Create Position"
   - Enter name, description
   - Select role type (ADMIN, DEAN, FACULTY, ALL)
   - Set active status
   - Submit

3. **Edit Position**
   - Click edit icon
   - Modify fields
   - Save changes

4. **Delete Position**
   - Click delete icon
   - Confirm deletion
   - System prevents deletion if position is in use

### **User Management Workflow:**

1. **Update User**
   - Click edit on a user
   - Select role (ADMIN, DEAN, FACULTY)
   - Position dropdown auto-loads positions for that role
   - Select position from dropdown
   - Save

2. **Change Role**
   - When role changes, position dropdown refreshes
   - Shows only positions for new role
   - Previous position clears

---

## 🎯 Example Usage

### **Scenario 1: Create "Secretary" Position**
```json
{
  "name": "Secretary",
  "description": "Administrative secretary for dean's office",
  "role_type": "DEAN",
  "is_active": true
}
```

### **Scenario 2: Assign Position to User**
1. Open user edit modal
2. Select role: "DEAN"
3. Dropdown shows: Dean, Assistant Dean, Secretary, Department Head
4. Select: "Secretary"
5. Save

### **Scenario 3: Filter Positions by Role**
```
GET /api/positions?role_type=DEAN&is_active=true
```
Returns only active DEAN positions.

---

## ✅ Features Summary

| Feature | Status |
|---------|--------|
| Positions table created | ✅ |
| CRUD API endpoints | ✅ |
| Admin panel component | ✅ |
| User dropdown integration | ✅ |
| Role-based filtering | ✅ |
| Active/inactive toggle | ✅ |
| Duplicate prevention | ✅ |
| Delete protection | ✅ |
| Dynamic position loading | ✅ |
| Auto-refresh on role change | ✅ |

---

## 🔐 Security

- ✅ Only admins can create/edit/delete positions
- ✅ All users can view positions
- ✅ Prevents deletion of positions in use
- ✅ Validates unique position names
- ✅ Role-based access control

---

## 📝 Notes

- Position field is **optional** for users
- Positions are filtered by role type automatically
- "ALL" role type shows for all roles
- Inactive positions don't show in user dropdown
- Admin panel shows all positions (active and inactive)

---

**Status:** ✅ **Production Ready**
**Files Created/Modified:** 5
- `migrations/create_positions_table.sql` (NEW)
- `src/lib/api/backend/positions/PositionsAPI.js` (NEW)
- `src/dashboards/components/PositionsManagement.jsx` (NEW)
- `src/dashboards/components/User.jsx` (MODIFIED)
- `server.js` (MODIFIED)
