/**
 * Date utilities for consistent date formatting throughout the application
 */

/**
 * Formats a date string or Date object to YYYY-MM-DD (South African format)
 * @param {string|Date} date - The date to format
 * @returns {string} The formatted date string
 */
export const formatDateSA = (date) => {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(d.getTime())) return '';
  
  // Format as YYYY-MM-DD
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Converts a date string from any format to YYYY-MM-DD (South African format)
 * @param {string} dateString - The date string to convert
 * @returns {string} The formatted date string
 */
export const toSADateFormat = (dateString) => {
  if (!dateString) return '';
  
  // If the date is already in YYYY-MM-DD format, return it as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Handle MM/DD/YYYY format (common in date inputs on some browsers)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [month, day, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  }
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  return formatDateSA(date);
};

/**
 * Parses a date input value to ensure YYYY-MM-DD format regardless of browser locale
 * @param {string} inputValue - The input value from a date field
 * @returns {string} The date in YYYY-MM-DD format
 */
export const parseDateInput = (inputValue) => {
  if (!inputValue) return '';
  
  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(inputValue)) {
    return inputValue;
  }
  
  // If in MM/DD/YYYY format (common in US locale browsers)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(inputValue)) {
    const [month, day, year] = inputValue.split('/');
    return `${year}-${month}-${day}`;
  }
  
  // Try to parse as a date and format
  try {
    const date = new Date(inputValue);
    if (!isNaN(date.getTime())) {
      return formatDateSA(date);
    }
  } catch (e) {
    return '';
  }
  
  return '';
};

/**
 * Formats a date for display to users while maintaining South African format
 * @param {string|Date} date - The date to format
 * @returns {string} The formatted date string for display
 */
export const displayDateSA = (date) => {
  return formatDateSA(date);
}; 