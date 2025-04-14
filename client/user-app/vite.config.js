// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'userAuth',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App',
        './UserComponent': './src/UserComponent',
      },
      shared: ['react', 'react-dom', '@apollo/client', 'graphql', 'react-router-dom'],
    }),
  ],

  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
});
