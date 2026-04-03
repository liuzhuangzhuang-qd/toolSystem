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
    const msg =
      typeof json.message === 'string' && json.message
        ? json.message
        : userFacingMessage(res.status, res.statusText)
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
