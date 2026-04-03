import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/home/HomeView/index.vue'),
    },
    {
      path: '/latest',
      name: 'latest',
      component: () => import('../views/placeholder/PlaceholderView/index.vue'),
      meta: { title: '最新发布' },
    },
    {
      path: '/trending',
      name: 'trending',
      component: () => import('../views/placeholder/PlaceholderView/index.vue'),
      meta: { title: '热度排行' },
    },
    {
      path: '/category/:id',
      name: 'category',
      component: () => import('../views/category/CategoryView/index.vue'),
      props: true,
    },
    {
      path: '/notes/dev',
      name: 'notes-dev',
      component: () => import('../views/notes/NotesListView/index.vue'),
      meta: { title: '开发杂记', noteKind: 'dev' as const },
    },
    {
      path: '/notes/soft',
      name: 'notes-soft',
      component: () => import('../views/notes/NotesListView/index.vue'),
      meta: { title: '软件推荐', noteKind: 'soft' as const },
    },
    {
      path: '/tools/ai-chat',
      name: 'ai-chat',
      component: () => import('../views/catAi/AiChatView/index.vue'),
      meta: { title: 'AI对话', layout: 'chat' as const },
    },
    {
      path: '/tools/img-format',
      name: 'img-format',
      component: () => import('../views/catImg/ImageFormatView/index.vue'),
      meta: { title: '图片格式转换' },
    },
    {
      path: '/tools/radix-convert',
      name: 'radix-convert',
      component: () => import('../views/catNum/RadixConvertView/index.vue'),
      meta: { title: '进制转换' },
    },
    {
      path: '/tools/img-base64',
      name: 'img-base64',
      component: () => import('../views/catImg/ImageBase64View/index.vue'),
      meta: { title: '图片 Base64 编解码' },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
