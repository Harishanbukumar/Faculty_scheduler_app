/**
 * Validate registration number based on expected format
 * @param {string} registrationNumber - Registration number to validate
 * @returns {boolean} True if valid
 */
export const isValidRegistrationNumber = (registrationNumber) => {
    if (!registrationNumber) return false;
    
    // Admin: ADM followed by 3 digits
    const adminRegex = /^ADM\d{3}$/i;
    
    // Faculty: 7 digits
    const facultyRegex = /^\d{7}$/;
    
    // Student: 10 digits
    const studentRegex = /^\d{10}$/;
    
    return adminRegex.test(registrationNumber) || 
           facultyRegex.test(registrationNumber) || 
           studentRegex.test(registrationNumber);
  };
  
  /**
   * Validate mobile number (10 digits)
   * @param {string} mobileNumber - Mobile number to validate
   * @returns {boolean} True if valid
   */
  export const isValidMobileNumber = (mobileNumber) => {
    if (!mobileNumber) return false;
    
    const mobileRegex = /^\d{10}$/;
    return mobileRegex.test(mobileNumber);
  };
  
  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  export const isValidEmail = (email) => {
    if (!email) return false;
    
    // Basic email validation regex
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  };
  
  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {object} Validation result with status and message
   */
  export const validatePasswordStrength = (password) => {
    if (!password) {
      return { 
        isValid: false, 
        message: 'Password is required' 
      };
    }
    
    if (password.length < 8) {
      return { 
        isValid: false, 
        message: 'Password must be at least 8 characters' 
      };
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return { 
        isValid: false, 
        message: 'Password must contain at least one uppercase letter' 
      };
    }
    
    // Check for at least one number
    if (!/\d/.test(password)) {
      return { 
        isValid: false, 
        message: 'Password must contain at least one number' 
      };
    }
    
    return { 
      isValid: true, 
      message: 'Password is strong' 
    };
  };
  
  /**
   * Validate OTP (6 digits)
   * @param {string} otp - OTP to validate
   * @returns {boolean} True if valid
   */
  export const isValidOTP = (otp) => {
    if (!otp) return false;
    
    const otpRegex = /^\d{6}$/;
    return otpRegex.test(otp);
  };
  
  /**
   * Validate date string format (YYYY-MM-DD)
   * @param {string} dateString - Date string to validate
   * @returns {boolean} True if valid
   */
  export const isValidDateString = (dateString) => {
    if (!dateString) return false;
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    // Check if it's a valid date
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };
  
  /**
   * Validate time string format (HH:MM)
   * @param {string} timeString - Time string to validate
   * @returns {boolean} True if valid
   */
  export const isValidTimeString = (timeString) => {
    if (!timeString) return false;
    
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(timeString);
  };