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
    {
      path: '/tools/img-compress',
      name: 'img-compress',
      component: () => import('../views/catImg/ImageCompressView/index.vue'),
      meta: { title: '图片压缩' },
    },
    {
      path: '/tools/img-merge-long',
      name: 'img-merge-long',
      component: () => import('../views/catImg/ImageMergeLongView/index.vue'),
      meta: { title: '合并长图' },
    },
    {
      path: '/tools/img-grid9',
      name: 'img-grid9',
      component: () => import('../views/catImg/ImageGrid9View/index.vue'),
      meta: { title: '九宫格切图' },
    },
    {
      path: '/tools/id-card-generate',
      name: 'id-card-generate',
      component: () => import('../views/catDoc/IdCardGenerateView/index.vue'),
      meta: { title: '身份证生成' },
    },
    {
      path: '/tools/bank-card-generate',
      name: 'bank-card-generate',
      component: () => import('../views/catDoc/BankCardGenerateView/index.vue'),
      meta: { title: '银行卡生成' },
    },
    {
      path: '/tools/vin-generate',
      name: 'vin-generate',
      component: () => import('../views/catDoc/VinGenerateView/index.vue'),
      meta: { title: 'VIN码生成' },
    },
    {
      path: '/tools/plate-generate',
      name: 'plate-generate',
      component: () => import('../views/catDoc/PlateGenerateView/index.vue'),
      meta: { title: '车牌号生成' },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
