import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname does not exist in ES modules ("type": "module"): derive the folder from import.meta.url.
const rootDir = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@store': path.resolve(rootDir, 'src/store'),
      '@api': path.resolve(rootDir, 'src/api'),
      '@assets': path.resolve(rootDir, 'src/assets'),
      '@view': path.resolve(rootDir, 'src/view'),
      '@utils': path.resolve(rootDir, 'src/utils'),
      '@components': path.resolve(rootDir, 'src/components'),
      '@hooks': path.resolve(rootDir, 'src/hooks'),

    },
  },
})
