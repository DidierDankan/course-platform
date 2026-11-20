import { defineConfig, loadEnv } from 'vite'
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

// VITE_SITE_URL is the address visitors use. index.html pastes it into the Open Graph tags (%VITE_SITE_URL%), and the
// app builds canonical links and structured data from it, so a missing or malformed value would ship broken previews
// without any error: stop here instead, like server/config.js does.
function checkSiteUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("VITE_SITE_URL is missing or not a URL. Set it in client/.env (e.g. http://localhost:5173).");
  }
  if (!["http:", "https:"].includes(url.protocol) || value.endsWith("/") || url.pathname !== "/") {
    throw new Error("VITE_SITE_URL must be a site origin without a path or trailing slash (e.g. https://lumen.example).");
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "VITE_"); // .env files + VITE_ variables already in the environment (CI, Vercel)
  checkSiteUrl(env.VITE_SITE_URL);

  return {
    plugins: [react()],
    server: {
      // Live, Vercel forwards these two to the API (DEPLOY.txt 2.5); in development Vite does, so they sit at the same
      // address as the pages, where crawlers look for them.
      proxy: Object.fromEntries(["/robots.txt", "/sitemap.xml"].map((file) => [file, env.VITE_API_URL])),
    },
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
  };
});
