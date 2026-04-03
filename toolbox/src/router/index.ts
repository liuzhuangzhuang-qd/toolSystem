import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/latest',
      name: 'latest',
      component: () => import('../views/PlaceholderView.vue'),
      meta: { title: '最新发布' },
    },
    {
      path: '/trending',
      name: 'trending',
      component: () => import('../views/PlaceholderView.vue'),
      meta: { title: '热度排行' },
    },
    {
      path: '/category/:id',
      name: 'category',
      component: () => import('../views/CategoryView.vue'),
      props: true,
    },
    {
      path: '/notes/dev',
      name: 'notes-dev',
      component: () => import('../views/NotesListView.vue'),
      meta: { title: '开发杂记', noteKind: 'dev' as const },
    },
    {
      path: '/notes/soft',
      name: 'notes-soft',
      component: () => import('../views/NotesListView.vue'),
      meta: { title: '软件推荐', noteKind: 'soft' as const },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
