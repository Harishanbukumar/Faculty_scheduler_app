import apiService from './apiService';

const authService = {
  /**
   * Login user
   * @param {string} registration_number - User's registration number
   * @param {string} password - User's password
   * @param {boolean} remember_me - Remember user option
   * @returns {Promise} - Response with user data and token
   */
  login: async (registration_number, password, remember_me = false) => {
    try {
      const response = await apiService.post('/auth/login', {
        registration_number,
        password,
        remember_me
      });
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Register a new user
   * @param {Object} registrationData - User registration data
   * @returns {Promise} - Response with registration status
   */
  register: async (registrationData) => {
    try {
      const response = await apiService.post('/auth/register', registrationData);
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Request password reset
   * @param {string} registration_number - User's registration number
   * @returns {Promise} - Response with reset request status
   */
  resetPasswordRequest: async (registration_number) => {
    try {
      const response = await apiService.post('/auth/reset-password-request', {
        registration_number
      });
      return response;
    } catch (error) {
      console.error('Reset password request error:', error);
      throw error;
    }
  },

  /**
   * Reset password
   * @param {string} registration_number - User's registration number
   * @param {string} reset_token - Reset token
   * @param {string} new_password - New password
   * @returns {Promise} - Response with reset status
   */
  resetPassword: async (registration_number, reset_token, new_password) => {
    try {
      const response = await apiService.post('/auth/reset-password', {
        registration_number,
        reset_token,
        new_password
      });
      return response;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }
};

export default authService;