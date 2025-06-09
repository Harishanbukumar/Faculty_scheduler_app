import { useState, useCallback } from 'react';
import apiService from '../services/apiService';
import { useToast } from '../context/ToastContext';

/**
 * Custom hook for making API calls with loading and error states
 */
const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showError } = useToast();

  /**
   * Make a GET request
   * @param {string} url - API endpoint
   * @param {object} params - Query parameters
   * @param {boolean} showErrorToast - Whether to show error toast
   * @returns {Promise} API response
   */
  const get = useCallback(async (url, params = {}, showErrorToast = true) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get(url, params);
      return response;
    } catch (err) {
      setError(err);
      if (showErrorToast) {
        showError(err.error || 'Failed to fetch data. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  /**
   * Make a POST request
   * @param {string} url - API endpoint
   * @param {object} data - Request body
   * @param {boolean} showErrorToast - Whether to show error toast
   * @returns {Promise} API response
   */
  const post = useCallback(async (url, data = {}, showErrorToast = true) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.post(url, data);
      return response;
    } catch (err) {
      setError(err);
      if (showErrorToast) {
        showError(err.error || 'Failed to submit data. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  /**
   * Make a PUT request
   * @param {string} url - API endpoint
   * @param {object} data - Request body
   * @param {boolean} showErrorToast - Whether to show error toast
   * @returns {Promise} API response
   */
  const put = useCallback(async (url, data = {}, showErrorToast = true) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.put(url, data);
      return response;
    } catch (err) {
      setError(err);
      if (showErrorToast) {
        showError(err.error || 'Failed to update data. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  /**
   * Make a DELETE request
   * @param {string} url - API endpoint
   * @param {boolean} showErrorToast - Whether to show error toast
   * @returns {Promise} API response
   */
  const del = useCallback(async (url, showErrorToast = true) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.delete(url);
      return response;
    } catch (err) {
      setError(err);
      if (showErrorToast) {
        showError(err.error || 'Failed to delete data. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showError]);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del
  };
};

export default useApi;