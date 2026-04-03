export type NoteArticle = {
  id: string
  title: string
  author: string
  date: string
}

/** 开发杂记 */
export const devNoteArticles: NoteArticle[] = [
  {
    id: 'win-share',
    title: 'Windows 10/11 共享文件夹访问问题排查与解决',
    author: 'admin',
    date: '2025-02-26',
  },
  {
    id: 'flutter-web',
    title: 'Flutter Web 构建与 UI 适配常见坑',
    author: 'admin',
    date: '2025-02-20',
  },
  {
    id: 'linux-s3',
    title: 'CentOS / Ubuntu 上使用 goofys、s3fs 挂载对象存储',
    author: 'admin',
    date: '2025-02-14',
  },
  {
    id: 'bbr-yum',
    title: 'Linux 服务器 BBR 与 yum 源配置笔记',
    author: 'admin',
    date: '2025-02-08',
  },
  {
    id: 'nginx-lsyncd',
    title: 'Nginx 动态模块与 lsyncd + rsync 同步实践',
    author: 'admin',
    date: '2025-01-28',
  },
  {
    id: 'm3u8-cdn',
    title: 'M3U8 点播与 CDN 缓存策略简述',
    author: 'admin',
    date: '2025-01-15',
  },
]

/** 软件推荐 */
export const softNoteArticles: NoteArticle[] = [
  {
    id: 'vscode',
    title: 'VS Code：插件与工作区配置推荐',
    author: 'admin',
    date: '2025-02-22',
  },
  {
    id: 'docker-desktop',
    title: 'Docker Desktop 与 WSL2 本地开发环境',
    author: 'admin',
    date: '2025-02-18',
  },
  {
    id: 'obsidian',
    title: 'Obsidian：本地优先的知识库工具',
    author: 'admin',
    date: '2025-02-10',
  },
  {
    id: 'wireshark',
    title: 'Wireshark 网络抓包入门',
    author: 'admin',
    date: '2025-02-01',
  },
]

export function getNoteArticles(kind: 'dev' | 'soft'): NoteArticle[] {
  return kind === 'dev' ? devNoteArticles : softNoteArticles
}
