import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    host: '0.0.0.0', // Cho phép truy cập từ mọi địa chỉ IP
    port: 5173,       // Hoặc bất kỳ cổng nào bạn muốn
    allowedHosts: [
      'a081-2402-800-613e-5704-d878-958-f0ef-2a44.ngrok-free.app',
      '.ngrok-free.app'  // Cho phép tất cả các subdomain của ngrok-free.app
    ]
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  plugins: [
    {
      name: 'configure-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          next();
        });
      },
    },
  ],
}); 