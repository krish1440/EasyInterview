import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Vercel exposes env variables on process.env, but Vite expects import.meta.env
    // This allows process.env.API_KEY to work in the build
    'process.env': process.env
  }
});