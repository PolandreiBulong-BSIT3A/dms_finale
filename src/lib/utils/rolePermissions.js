// Role Permission Utilities
// Centralized role permission checks

// Roles that have DEAN-level permissions
const DEAN_LEVEL_ROLES = ['DEAN'];

// Roles that have ADMIN-level permissions
const ADMIN_LEVEL_ROLES = ['ADMIN'];

// All available roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  DEAN: 'DEAN',
  FACULTY: 'FACULTY'
};

// Role display names
export const ROLE_DISPLAY_NAMES = {
  ADMIN: 'Administrator',
  DEAN: 'Dean',
  FACULTY: 'Faculty'
};

/**
 * Check if a role has DEAN-level permissions
 * @param {string} role - The role to check
 * @returns {boolean}
 */
export const isDeanLevel = (role) => {
  return DEAN_LEVEL_ROLES.includes(role);
};

/**
 * Check if a role has ADMIN-level permissions
 * @param {string} role - The role to check
 * @returns {boolean}
 */
export const isAdminLevel = (role) => {
  return ADMIN_LEVEL_ROLES.includes(role);
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
  return role === USER_ROLES.FACULTY;
};

/**
 * Get all roles that should be included when checking for DEAN permissions
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
 * Get display name for a role
 * @param {string} role - The role
 * @returns {string}
 */
export const getRoleDisplayName = (role) => {
  return ROLE_DISPLAY_NAMES[role] || role;
};

/**
 * Get all available roles for dropdowns
 * @returns {Array<{value: string, label: string}>}
 */
export const getAllRolesForSelect = () => {
  return Object.keys(USER_ROLES).map(key => ({
    value: USER_ROLES[key],
    label: ROLE_DISPLAY_NAMES[USER_ROLES[key]]
  }));
};

/**
 * Check if user has permission to perform an action
 * @param {string} userRole - The user's role
 * @param {string} requiredPermission - 'ADMIN', 'DEAN', or 'FACULTY'
 * @returns {boolean}
 */
export const hasPermission = (userRole, requiredPermission) => {
  if (requiredPermission === 'ADMIN') {
    return isAdminLevel(userRole);
  }
  if (requiredPermission === 'DEAN') {
    return isAdminOrDeanLevel(userRole);
  }
  if (requiredPermission === 'FACULTY') {
    return true; // All roles have at least FACULTY permissions
  }
  return false;
};
