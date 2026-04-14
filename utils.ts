/**
 * Converts a browser File object to a raw base64 encoded string.
 * 
 * @description
 * This utility facilitates multimodal data transmission by:
 * 1. Reading the file content as a Data URL.
 * 2. Parsing the resulting string to extract only the base64 payload.
 * 3. Sanitizing the output for compatibility with Google Gemini API parts.
 * 
 * @param {File} file - The source file (e.g., PDF, Image) to be converted.
 * @returns {Promise<string>} A promise resolving to the sanitized base64 string.
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
 * Generates a non-cryptographic pseudo-random Alphanumeric identifier.
 * Ideal for temporary DOM keys or session tracking.
 * 
 * @returns {string} A 9-character base-36 string.
 */
export const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Transforms a Date instance into a localized, human-friendly string.
 * Uses the UK Locale (en-GB) for standard day-month-year sequencing.
 * 
 * @example "15 Apr, 01:25"
 * @param {Date} date - The date object to be formatted.
 * @returns {string} The formatted chronological string.
 */
export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
};