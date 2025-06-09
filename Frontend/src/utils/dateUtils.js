import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Format a date string to display time
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time (e.g., "14:30")
 */
export const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return format(date, 'HH:mm');
};

/**
 * Format a date string to display date
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date (e.g., "Mon, 15 Jan")
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return format(date, 'E, d MMM');
};

/**
 * Format a date string to display date and time
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date and time (e.g., "Mon, 15 Jan at 14:30")
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return format(date, 'E, d MMM') + ' at ' + format(date, 'HH:mm');
};

/**
 * Format a date string to display relative time
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return formatDistanceToNow(date, { addSuffix: true });
};

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 * @returns {string} Today's date in ISO format
 */
export const getTodayISOString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Get date for n days from today as ISO string
 * @param {number} days - Number of days from today
 * @returns {string} Future/past date in ISO format
 */
export const getDateFromToday = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

/**
 * Check if a date is today
 * @param {string} dateString - ISO date string
 * @returns {boolean} True if date is today
 */
export const isToday = (dateString) => {
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Get day name from date
 * @param {string} dateString - ISO date string
 * @returns {string} Day name (e.g., "Monday")
 */
export const getDayName = (dateString) => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return format(date, 'EEEE');
};

/**
 * Create a date range array between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Array of dates
 */
export const getDateRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};