/** 侧栏 index 与路由路径映射 */
const MENU_TO_PATH: Record<string, string> = {
  home: '/',
  latest: '/latest',
  trending: '/trending',
  'cat-text': '/category/cat-text',
  'cat-num': '/category/cat-num',
  'cat-img': '/category/cat-img',
  'cat-code': '/category/cat-code',
  'cat-chart': '/category/cat-chart',
  'cat-office': '/category/cat-office',
  'cat-life': '/category/cat-life',
  'cat-ai': '/category/cat-ai',
  'notes-dev': '/notes/dev',
  'notes-soft': '/notes/soft',
}

export function menuKeyToPath(key: string): string {
  return MENU_TO_PATH[key] ?? '/'
}

export function pathToMenuKey(path: string): string {
  if (path === '/') return 'home'
  if (path === '/latest') return 'latest'
  if (path === '/trending') return 'trending'
  if (path === '/notes/dev') return 'notes-dev'
  if (path === '/notes/soft') return 'notes-soft'
  if (path === '/tools/ai-chat') return 'cat-ai'
  const m = /^\/category\/([^/]+)$/.exec(path)
  if (m?.[1]) return m[1]
  return 'home'
}
