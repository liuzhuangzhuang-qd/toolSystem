import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    /** 未设置 VITE_API_BASE 时，/api 走代理，默认与 .env 中后端一致 */
    proxy: {
      '/api': {
        target: 'http://116.62.63.9:3030',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 全量引入 element-plus 时单包约 ~950KB（gzip ~300KB），属预期体积
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@element-plus/icons-vue')) {
            return 'element-plus-icons'
          }
          if (id.includes('element-plus')) {
            return 'element-plus'
          }
          if (id.includes('vue-router')) {
            return 'vue-router'
          }
          if (id.includes('@vue') || id.includes('/vue/')) {
            return 'vue-core'
          }
        },
      },
    },
  },
})
