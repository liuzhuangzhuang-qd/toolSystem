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
      path: '/tools/ai-name-suggest',
      name: 'ai-name-suggest',
      component: () => import('../views/catAi/NameSuggestView/index.vue'),
      meta: { title: '命名建议' },
    },
    {
      path: '/tools/ai-summary-generate',
      name: 'ai-summary-generate',
      component: () => import('../views/catAi/SummaryGenerateView/index.vue'),
      meta: { title: '摘要生成' },
    },
    {
      path: '/tools/ai-copy-expand',
      name: 'ai-copy-expand',
      component: () => import('../views/catAi/CopyExpandView/index.vue'),
      meta: { title: '文案扩写' },
    },
    {
      path: '/tools/ai-translate-assistant',
      name: 'ai-translate-assistant',
      component: () => import('../views/catAi/TranslateAssistantView/index.vue'),
      meta: { title: '翻译助手' },
    },
    {
      path: '/tools/img-format',
      name: 'img-format',
      component: () => import('../views/catImg/ImageFormatView/index.vue'),
      meta: { title: '图片格式转换' },
    },
    {
      path: '/tools/img-generate',
      name: 'img-generate',
      component: () => import('../views/catImg/ImageGenerateView/index.vue'),
      meta: { title: '图片生成' },
    },
    {
      path: '/tools/radix-convert',
      name: 'radix-convert',
      component: () => import('../views/catNum/RadixConvertView/index.vue'),
      meta: { title: '进制转换' },
    },
    {
      path: '/tools/num-random-generate',
      name: 'num-random-generate',
      component: () => import('../views/catNum/RandomNumberView/index.vue'),
      meta: { title: '随机数生成' },
    },
    {
      path: '/tools/crypto-aes',
      name: 'crypto-aes',
      component: () => import('../views/catCrypto/AesCryptoView/index.vue'),
      meta: { title: 'AES 加解密' },
    },
    {
      path: '/tools/crypto-des',
      name: 'crypto-des',
      component: () => import('../views/catCrypto/DesCryptoView/index.vue'),
      meta: { title: 'DES 加解密' },
    },
    {
      path: '/tools/crypto-rsa',
      name: 'crypto-rsa',
      component: () => import('../views/catCrypto/RsaCryptoView/index.vue'),
      meta: { title: 'RSA 加解密' },
    },
    {
      path: '/tools/crypto-jwt-parse',
      name: 'crypto-jwt-parse',
      component: () => import('../views/catCrypto/JwtParseView/index.vue'),
      meta: { title: 'JWT 解析' },
    },
    {
      path: '/tools/crypto-md5',
      name: 'crypto-md5',
      component: () => import('../views/catCrypto/Md5HashView/index.vue'),
      meta: { title: 'MD5 计算' },
    },
    {
      path: '/tools/code-url-codec',
      name: 'code-url-codec',
      component: () => import('../views/catCode/UrlCodecView/index.vue'),
      meta: { title: 'URL 编解码' },
    },
    {
      path: '/tools/code-base64-codec',
      name: 'code-base64-codec',
      component: () => import('../views/catCode/Base64CodecView/index.vue'),
      meta: { title: 'Base64 编解码' },
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
      path: '/tools/text-case-convert',
      name: 'text-case-convert',
      component: () => import('../views/catText/TextCaseConvertView/index.vue'),
      meta: { title: '大小写转换' },
    },
    {
      path: '/tools/text-deduplicate',
      name: 'text-deduplicate',
      component: () => import('../views/catText/TextDeduplicateView/index.vue'),
      meta: { title: '文本去重' },
    },
    {
      path: '/tools/text-compare',
      name: 'text-compare',
      component: () => import('../views/catText/TextCompareView/index.vue'),
      meta: { title: '文本对比' },
    },
    {
      path: '/tools/img-pixelate',
      name: 'img-pixelate',
      component: () => import('../views/catImg/ImagePixelateView/index.vue'),
      meta: { title: '像素画转换' },
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
    {
      path: '/tools/pdf-merge',
      name: 'pdf-merge',
      component: () => import('../views/catOffice/PdfMergeView/index.vue'),
      meta: { title: 'PDF 合并' },
    },
    {
      path: '/tools/pdf-split',
      name: 'pdf-split',
      component: () => import('../views/catOffice/PdfSplitView/index.vue'),
      meta: { title: 'PDF 拆分' },
    },
    {
      path: '/tools/table-to-csv',
      name: 'table-to-csv',
      component: () => import('../views/catOffice/TableToCsvView/index.vue'),
      meta: { title: '表格转 CSV' },
    },
    {
      path: '/tools/life-random-wheel',
      name: 'life-random-wheel',
      component: () => import('../views/catLife/RandomWheelView/index.vue'),
      meta: { title: '随机转盘' },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
