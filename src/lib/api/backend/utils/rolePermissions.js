// Role Permission Utilities (Backend)
// Centralized role permission checks for backend

// Roles that have DEAN-level permissions
const DEAN_LEVEL_ROLES = ['DEAN', 'PRINCIPAL', 'DEPT_SECRETARY', 'PRESIDENT'];

// Roles that have ADMIN-level permissions
const ADMIN_LEVEL_ROLES = ['ADMIN', 'ADMINISTRATOR'];

// All available roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  DEAN: 'DEAN',
  PRINCIPAL: 'PRINCIPAL',
  DEPT_SECRETARY: 'DEPT_SECRETARY',
  PRESIDENT: 'PRESIDENT',
  FACULTY: 'FACULTY'
};

/**
 * Check if a role has DEAN-level permissions
 * @param {string} role - The role to check
 * @returns {boolean}
 */
const isDeanLevel = (role) => {
  if (!role) return false;
  const roleUpper = String(role).toUpperCase();
  return DEAN_LEVEL_ROLES.includes(roleUpper);
};

/**
 * Check if a role has ADMIN-level permissions
 * @param {string} role - The role to check
 * @returns {boolean}
 */
export const isAdminLevel = (role) => {
  if (!role) return false;
  const roleUpper = role.toString().toUpperCase();
  return ADMIN_LEVEL_ROLES.includes(roleUpper);
};

/**
 * Check if a role has ADMIN or DEAN-level permissions
 * @param {string} role - The role to check
 * @returns {boolean}
 */
export const isAdminOrDeanLevel = (role) => {
  return isAdminLevel(role) || isDeanLevel(role);
};

/**
 * Check if a role is FACULTY
 * @param {string} role - The role to check
 * @returns {boolean}
 */
export const isFaculty = (role) => {
  if (!role) return false;
  const roleUpper = role.toString().toUpperCase();
  return roleUpper === USER_ROLES.FACULTY;
};

/**
 * Get all roles that should be included when checking for DEAN permissions
 * Useful for SQL IN clauses
 * @returns {string[]}
 */
export const getDeanLevelRoles = () => {
  return [...DEAN_LEVEL_ROLES];
};

/**
 * Get all roles that should be included when checking for ADMIN permissions
 * @returns {string[]}
 */
export const getAdminLevelRoles = () => {
  return [...ADMIN_LEVEL_ROLES];
};

/**
 * Check if user has permission to perform an action
 * @param {string} userRole - The user's role
 * @param {string} requiredPermission - 'ADMIN', 'DEAN', or 'FACULTY'
 * @returns {boolean}
 */
export const hasPermission = (userRole, requiredPermission) => {
  if (!userRole || !requiredPermission) return false;
  
  const reqUpper = requiredPermission.toString().toUpperCase();
  
  if (reqUpper === 'ADMIN') {
    return isAdminLevel(userRole);
  }
  if (reqUpper === 'DEAN') {
    return isAdminOrDeanLevel(userRole);
  }
  if (reqUpper === 'FACULTY') {
    return true; // All roles have at least FACULTY permissions
  }
  return false;
};

/**
 * Get SQL condition for role-based queries
 * @param {string} userRole - The user's role
 * @param {string} roleColumn - The column name for role in SQL (default: 'role')
 * @returns {string} SQL condition
 */
export const getRoleSQLCondition = (userRole, roleColumn = 'role') => {
  if (isAdminLevel(userRole)) {
    // Admin sees everything
    return '1=1';
  }
  if (isDeanLevel(userRole)) {
    // Dean-level sees DEAN, PRINCIPAL, DEPT_SECRETARY, PRESIDENT, FACULTY
    const roles = [...DEAN_LEVEL_ROLES, 'FACULTY'].map(r => `'${r}'`).join(',');
    return `${roleColumn} IN (${roles})`;
  }
  // Faculty only sees FACULTY
  return `${roleColumn} = 'FACULTY'`;
};
