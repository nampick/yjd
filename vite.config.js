import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    host: '0.0.0.0', // Cho phép truy cập từ mọi địa chỉ IP
    port: 5173,       // Hoặc bất kỳ cổng nào bạn muốn
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
}); 