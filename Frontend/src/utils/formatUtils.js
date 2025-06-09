/**
 * Capitalize the first letter of a string
 * @param {string} str - Input string
 * @returns {string} String with first letter capitalized
 */
export const capitalizeFirstLetter = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  
  /**
   * Format a status string to be more readable
   * @param {string} status - Status string (e.g., "not_completed")
   * @returns {string} Formatted status (e.g., "Not Completed")
   */
  export const formatStatus = (status) => {
    if (!status) return '';
    
    // Replace underscores with spaces
    const withSpaces = status.replace(/_/g, ' ');
    
    // Capitalize each word
    return withSpaces
      .split(' ')
      .map(word => capitalizeFirstLetter(word))
      .join(' ');
  };
  
  /**
   * Truncate a string to a specified length
   * @param {string} str - Input string
   * @param {number} length - Maximum length
   * @returns {string} Truncated string with ellipsis if needed
   */
  export const truncateString = (str, length = 50) => {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  };
  
  /**
   * Format a number with leading zeros
   * @param {number} num - Input number
   * @param {number} size - Desired string length
   * @returns {string} Formatted number with leading zeros
   */
  export const formatWithLeadingZeros = (num, size = 2) => {
    let numStr = num.toString();
    while (numStr.length < size) numStr = '0' + numStr;
    return numStr;
  };
  
  /**
   * Format a duration in minutes to hours and minutes
   * @param {number} minutes - Duration in minutes
   * @returns {string} Formatted duration (e.g., "1h 30m")
   */
  export const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return '';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };
  
  /**
   * Format a registration number based on user role
   * @param {string} regNumber - Registration number
   * @param {string} role - User role
   * @returns {string} Formatted registration number
   */
  export const formatRegistrationNumber = (regNumber, role) => {
    if (!regNumber) return '';
    
    // Admin: ADM123
    if (role === 'admin' || regNumber.startsWith('ADM')) {
      return regNumber.toUpperCase();
    }
    
    // Faculty: 1234567
    if (role === 'faculty' || regNumber.length === 7) {
      return regNumber;
    }
    
    // Student: 1234567890
    if (role === 'student' || regNumber.length === 10) {
      return regNumber;
    }
    
    return regNumber;
  };
  
  /**
   * Determine role from registration number format
   * @param {string} regNumber - Registration number
   * @returns {string|null} Role or null if invalid format
   */
  export const getRoleFromRegistrationNumber = (regNumber) => {
    if (!regNumber) return null;
    
    if (regNumber.match(/^ADM\d{3}$/i)) {
      return 'admin';
    }
    
    if (regNumber.match(/^\d{7}$/)) {
      return 'faculty';
    }
    
    if (regNumber.match(/^\d{10}$/)) {
      return 'student';
    }
    
    return null;
  };