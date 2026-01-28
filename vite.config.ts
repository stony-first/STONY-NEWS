
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use '.' to specify the root directory for loadEnv. 
  // This avoids the "Property 'cwd' does not exist on type 'Process'" TypeScript error
  // while correctly pointing to the current working directory in a Vite project.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Remplace process.env.API_KEY par la valeur réelle ou une chaîne vide
      'process.env.API_KEY': JSON.stringify(env.API_KEY || "")
    },
    build: {
      outDir: 'dist',
    }
  };
});
