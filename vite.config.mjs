import {defineConfig} from 'vite';
import {motionStudio} from 'motion-studio';
import react from '@vitejs/plugin-react';
// Editor-only Vite configuration. Production continues to use build-ui.mjs.
export default defineConfig({
 publicDir:'dist',
 plugins:[motionStudio(),react()],
 server:{host:'127.0.0.1',port:5173},
});
