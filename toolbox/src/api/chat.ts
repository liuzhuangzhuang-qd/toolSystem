/** 与后端 OpenAPI（通义千问对话服务）对齐 */

export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessageDto {
  role: ChatRole
  content: string
}

export interface ChatRequestDto {
  messages: ChatMessageDto[]
  model?: string
}

export interface ChatUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface ChatSuccessData {
  reply: string
  model: string
  usage?: ChatUsage
}

export interface ChatPostResponseBody {
  success: boolean
  data?: ChatSuccessData
  message?: string
}

export interface HealthResponseBody {
  success: boolean
  service?: string
  framework?: string
  uptime?: number
  timestamp?: string
}

function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''
  if (!base) return path.startsWith('/') ? path : `/${path}`
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

export class ChatApiError extends Error {
  readonly status: number
  readonly body?: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ChatApiError'
    this.status = status
    this.body = body
  }
}

function userFacingMessage(status: number, fallback: string): string {
  if (status === 400) return '消息格式不正确，请检查输入后重试。'
  if (status === 401) return '鉴权失败：请检查 API Key 或令牌配置。'
  if (status === 403) return '账号无权限或状态异常（可能欠费/停用），请在阿里云控制台检查账户与模型服务状态。'
  if (status === 503) return '服务暂不可用（未配置密钥或上游异常），请稍后重试。'
  return fallback || `请求失败（${status}）`
}

export async function getHealth(): Promise<HealthResponseBody | null> {
  const res = await fetch(apiUrl('/api/health'), { method: 'GET' })
  if (!res.ok) return null
  return res.json() as Promise<HealthResponseBody>
}

export async function postChat(req: ChatRequestDto): Promise<ChatSuccessData> {
  const res = await fetch(apiUrl('/api/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

  let json: Partial<ChatPostResponseBody> = {}
  try {
    json = (await res.json()) as Partial<ChatPostResponseBody>
  } catch {
    /* empty */
  }

  if (!res.ok) {
    const rawMsg = typeof json.message === 'string' ? json.message : ''
    const isAliyunAccountDenied =
      /access denied, please make sure your account is in good standing/i.test(rawMsg) ||
      /overdue-payment/i.test(rawMsg)
    const msg = isAliyunAccountDenied
      ? '阿里云账号状态异常（可能欠费）。请先在阿里云 Model Studio 完成续费或恢复服务后再重试。'
      : (rawMsg || userFacingMessage(res.status, res.statusText))
    throw new ChatApiError(res.status, msg, json)
  }

  if (!json.success || json.data == null || typeof json.data.reply !== 'string') {
    const msg =
      typeof json.message === 'string' && json.message
        ? json.message
        : '接口返回数据异常'
    throw new ChatApiError(res.status || 500, msg, json)
  }

  return json.data
}
