// product-app/vite.config.js for productApp
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
//
export default defineConfig({
  server: {
    port: 3002, // Specify the port to avoid conflicts
  },
  plugins: [
    react(),
    federation({
      name: 'commEngagement',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App',
        './ChatBox': './src/components/Chatbox',
        './BusinessProfile': './src/components/BusinessProfile',
        './AccountSettings': './src/components/AccountSettings',
      },
      shared: ['react', 'react-dom', '@apollo/client', 'graphql'],
    }),
  ],
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },

});

