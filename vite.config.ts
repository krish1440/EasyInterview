import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third argument '' ensures we load all variables, not just those with VITE_ prefix,
  // though we are specifically looking for VITE_GEMINI_API_KEY.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This maps the code's "process.env.API_KEY" to the value of "VITE_GEMINI_API_KEY"
      // This works for both local .env files and Vercel Environment Variables.
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
    },
    build: {
      outDir: 'dist',
    }
  };
});