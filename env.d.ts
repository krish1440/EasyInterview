/**
 * Global Environment Definitions
 * 
 * Extends the NodeJS namespace to provide type safety for environment variables 
 * injected into the application via Vite's 'define' property.
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** The Google Gemini API Key used for multimodal orchestration */
      API_KEY: string;
    }
  }
}

export {};