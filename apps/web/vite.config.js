import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from both root and apps/web
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '../..'), '')
  const appEnv = loadEnv(mode, __dirname, '')
  const env = { ...rootEnv, ...appEnv }

  // Expose env vars to Vite client
  const defineEnv = Object.keys(env).reduce((acc, key) => {
    if (key.startsWith('VITE_')) {
      acc[`import.meta.env.${key}`] = JSON.stringify(env[key])
    }
    return acc
  }, {})

  return {
    plugins: [react()],
    define: defineEnv,
    envDir: path.resolve(__dirname, '../..'),
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      proxy: {
        // Proxy all /api/* requests to the Express backend during development
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
