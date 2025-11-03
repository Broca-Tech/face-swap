import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 環境変数を読み込む
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.VITE_AKOOL_API_KEY;

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/akool': {
          target: 'https://openapi.akool.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/akool/, '/api/open/v3'),
          configure: proxy => {
            proxy.on('proxyReq', proxyReq => {
              // APIキーをサーバー側で追加
              if (apiKey) {
                proxyReq.setHeader('x-api-key', apiKey);
                console.log('[Proxy] Added x-api-key header to request');
              } else {
                console.warn('[Proxy] VITE_AKOOL_API_KEY is not set!');
              }
            });
          },
        },
        '/api/sg3': {
          target: 'https://sg3.akool.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/sg3/, ''),
          configure: proxy => {
            proxy.on('proxyReq', proxyReq => {
              // APIキーをサーバー側で追加
              if (apiKey) {
                proxyReq.setHeader('x-api-key', apiKey);
                console.log('[Proxy] Added x-api-key header to request');
              } else {
                console.warn('[Proxy] VITE_AKOOL_API_KEY is not set!');
              }
            });
          },
        },
      },
    },
  };
});
