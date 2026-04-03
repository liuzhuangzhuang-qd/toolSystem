import os from 'node:os'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

/** 开发时供页面读取：Local URL、局域网 IP（与终端 Network 一致） */
function devServerInfoPlugin(): Plugin {
  return {
    name: 'dev-server-info',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/__dev-server-info') {
          next()
          return
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        const port = server.config.server.port ?? 5173
        const lanIp = getLanIPv4()
        const localUrl = `http://localhost:${port}/`
        const networkUrl = lanIp ? `http://${lanIp}:${port}/` : null
        res.end(
          JSON.stringify({
            localUrl,
            lanIp: lanIp ?? null,
            networkUrl,
          }),
        )
      })
    },
  }
}

function getLanIPv4(): string | null {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.internal) continue
      const fam = net.family as string | number
      if (fam !== 'IPv4' && fam !== 4) continue
      return net.address
    }
  }
  return null
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), devServerInfoPlugin()],
  server: {
    host: true,
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
