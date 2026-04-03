import { ref, onMounted } from 'vue'

type DevServerInfo = {
  localUrl: string
  lanIp: string | null
  networkUrl: string | null
}

/**
 * Local：本机访问地址（开发时与终端 Local 一致）
 * IP / Network：局域网 IP 与同网段访问地址（仅 dev，由 Vite 中间件提供）
 * 公网：出口 IP（ipify）
 */
export function useRuntimeInfo() {
  const localUrl = ref('')
  const lanIp = ref<string | null>(null)
  const networkUrl = ref<string | null>(null)
  const publicIp = ref<string | null>(null)
  const loading = ref(true)

  onMounted(async () => {
    localUrl.value = `${window.location.origin}/`

    const jobs: Promise<void>[] = []

    if (import.meta.env.DEV) {
      jobs.push(
        fetch('/__dev-server-info')
          .then((r) => {
            if (!r.ok) throw new Error('dev info')
            return r.json() as Promise<DevServerInfo>
          })
          .then((d) => {
            if (d.localUrl) localUrl.value = d.localUrl
            lanIp.value = d.lanIp ?? null
            networkUrl.value = d.networkUrl ?? null
          })
          .catch(() => {
            /* 非 dev 或中间件未就绪时忽略 */
          }),
      )
    }

    jobs.push(
      fetch('https://api.ipify.org?format=json')
        .then((r) => {
          if (!r.ok) throw new Error('ipify')
          return r.json() as Promise<{ ip?: string }>
        })
        .then((d) => {
          publicIp.value = d.ip ?? null
        })
        .catch(() => {
          publicIp.value = null
        }),
    )

    await Promise.all(jobs)
    loading.value = false
  })

  return { localUrl, lanIp, networkUrl, publicIp, loading }
}
