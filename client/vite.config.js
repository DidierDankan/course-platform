import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname does not exist in ES modules ("type": "module"): derive the folder from import.meta.url.
const rootDir = path.dirname(fileURLToPath(import.meta.url));

// The libraries every page needs go in one "vendor" file. They change far less often than our code, so after a deploy a
// returning visitor keeps them cached and only downloads the app's new code. Page-specific libraries (Formik, Yup, the
// carousel, react-select) stay out of it: they arrive with the lazy page that uses them.
const VENDOR_PACKAGES = ["react", "react-dom", "scheduler", "react-router", "react-router-dom", "@reduxjs/toolkit", "react-redux", "redux", "immer", "reselect"];
const isVendor = (id) => VENDOR_PACKAGES.some((pkg) => id.includes(`/node_modules/${pkg}/`));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => (isVendor(id.replaceAll("\\", "/")) ? "vendor" : undefined),
      },
    },
  },
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
