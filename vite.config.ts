import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration
 * 
 * Configures the build pipeline and development server.
 * 
 * Key Configurations:
 * - **Environment Variable Mapping**: Bridges the gap between browser and Node environments 
 *   by mapping 'VITE_GEMINI_API_KEY' to 'process.env.API_KEY' used in the service layer.
 * - **React Plugin**: Enables Fast Refresh and optimized JSX transformations.
 * - **Build settings**: Defines the distribution directory.
 * 
 * @param {object} config - Vite configuration input containing the current execution mode.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
    },
    build: {
      outDir: 'dist',
    }
  };
});