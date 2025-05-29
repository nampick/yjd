import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  root: '.',
  server: {
    host: '0.0.0.0', // Cho phép truy cập từ mọi địa chỉ IP
    port: 3000,       // Hoặc bất kỳ cổng nào bạn muốn
    open: true
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
}); 