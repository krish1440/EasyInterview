/**
 * Converts a File object to a base64 encoded string.
 * This utility strips the Data URL prefix (e.g., "data:application/pdf;base64,") 
 * to return only the raw base64 data.
 * 
 * @param {File} file - The file to be converted.
 * @returns {Promise<string>} A promise that resolves to the base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Generates a pseudo-random alphanumeric string for unique identification.
 * 
 * @returns {string} A 9-character random string.
 */
export const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Formats a JavaScript Date object into a human-readable string.
 * Format example: "Oct 10, 10:32 PM"
 * 
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};