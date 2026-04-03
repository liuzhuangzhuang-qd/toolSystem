<script setup lang="ts">
import { Right, Document } from '@element-plus/icons-vue'
import ToolGrid from '../components/ToolGrid.vue'
import {
  toolCategories,
  HOME_CATEGORY_PREVIEW,
} from '../data/tools'
import {onMounted, nextTick} from "vue";

const todayItems = [
  { title: 'Markdown 编辑器', desc: '在线编辑与预览 Markdown', color: '#5c67f2' },
  { title: 'JSON 格式化', desc: '美化与校验 JSON 数据', color: '#10b981' },
  { title: '正则测试', desc: '快速验证正则表达式', color: '#f59e0b' },
]

const studyNotes = [
  'Linux / NAS / Windows 混合环境踩坑记录',
  'Flutter 跨端项目结构与实践',
  'Vue 3 + TypeScript 组件设计笔记',
  'Docker Compose 本地开发模板',
]

const carouselItems = [
  {
    title: '字帖生成',
    desc: '自定义字帖、笔顺练习，支持导出打印',
    iconBg: 'linear-gradient(145deg, #60a5fa 0%, #3b82f6 100%)',
  },
  {
    title: '配色方案生成',
    desc: '一键生成和谐配色与 CSS 变量',
    iconBg: 'linear-gradient(145deg, #a78bfa 0%, #7c3aed 100%)',
  },
  {
    title: 'API 文档生成',
    desc: '从 OpenAPI 规范生成可读文档',
    iconBg: 'linear-gradient(145deg, #34d399 0%, #059669 100%)',
  },
]

/** 最新工具（跨分类精选，带 New 角标） */
const latestTools = [
  {
    title: '在线 PS 精简版',
    desc: '浏览器内完成常见图片裁剪、调色与导出，无需安装软件。',
    thumb: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: '🖼️',
  },
  {
    title: 'AI 换脸体验',
    desc: '上传照片体验趣味换脸效果，仅供娱乐与学习。',
    thumb: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    icon: '🎭',
  },
  {
    title: '代码片段分享',
    desc: '带语法高亮的短链分享，支持多语言与过期时间。',
    thumb: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    icon: '📋',
  },
  {
    title: '时间戳转换',
    desc: 'Unix 时间与本地时间互转，支持时区选择。',
    thumb: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    icon: '⏱️',
  },
  {
    title: '二维码生成',
    desc: '文本、链接、WiFi 信息一键生成二维码。',
    thumb: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    icon: '▣',
  },
  {
    title: 'Base64 编解码',
    desc: '文本与文件 Base64 互转，支持拖拽上传。',
    thumb: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    icon: '🔤',
  },
  {
    title: '颜色取色器',
    desc: '屏幕取色并复制 HEX / RGB / HSL。',
    thumb: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    icon: '🎨',
  },
  {
    title: 'Markdown 转 PDF',
    desc: '保留样式的文档导出，适合简历与说明文档。',
    thumb: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    icon: '📄',
  },
]
onMounted(async () => {
  console.log('mounted>>>>>>', )
  await nextTick()
  // 2. 提取整个页面完整 HTML
  const fullPageHtml = document.documentElement.outerHTML
  console.log('完整页面HTML：', fullPageHtml)
})
</script>

<template>
  <div class="home-view">
    <el-row :gutter="24" class="top-row">
      <el-col :xs="24" :md="8" :lg="6" class="stretch-col">
        <el-card shadow="never" class="card-block card-elevated">
          <template #header>
            <span class="card-title">今日推荐1</span>
          </template>
          <ul class="today-list">
            <li v-for="(item, i) in todayItems" :key="i" class="today-item">
              <div class="today-thumb" :style="{ background: item.color }" />
              <div class="today-text">
                <div class="today-name">{{ item.title }}</div>
                <div class="today-desc">{{ item.desc }}</div>
              </div>
            </li>
          </ul>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="16" :lg="12" class="stretch-col">
        <el-card shadow="never" class="carousel-card card-block card-elevated">
          <el-carousel height="100%" class="top-banner-carousel" :interval="5000">
            <el-carousel-item v-for="(c, i) in carouselItems" :key="i">
              <div class="banner-slide">
                <div class="banner-icon" :style="{ background: c.iconBg }">
                  <el-icon :size="40" color="#fff"><Document /></el-icon>
                </div>
                <h3 class="banner-title">{{ c.title }}</h3>
                <p class="banner-desc">{{ c.desc }}</p>
                <el-button type="primary" round class="banner-btn">
                  立即使用
                  <el-icon class="el-icon--right"><Right /></el-icon>
                </el-button>
              </div>
            </el-carousel-item>
          </el-carousel>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="24" :lg="6" class="stretch-col">
        <el-card shadow="never" class="card-block card-elevated">
          <template #header>
            <span class="card-title">学习随记</span>
          </template>
          <ul class="notes-list">
            <li v-for="(n, i) in studyNotes" :key="i" class="notes-item">
              <router-link :to="i % 2 === 0 ? '/notes/dev' : '/notes/soft'">{{
                n
              }}</router-link>
            </li>
          </ul>
        </el-card>
      </el-col>
    </el-row>

    <section class="section-category section-latest">
      <h2 class="section-heading--inline section-latest__title">最新工具</h2>
      <ToolGrid :tools="latestTools" show-new />
    </section>

    <section
      v-for="cat in toolCategories"
      :key="cat.id"
      class="section-category"
    >
      <div class="section-category__head">
        <h2 class="section-heading--inline">{{ cat.title }}</h2>
        <router-link
          v-if="cat.tools.length > HOME_CATEGORY_PREVIEW"
          :to="{ name: 'category', params: { id: cat.id } }"
          class="section-category__more-link"
        >
          更多
        </router-link>
      </div>
      <ToolGrid :tools="cat.tools.slice(0, HOME_CATEGORY_PREVIEW)" />
    </section>
  </div>
</template>

<style scoped>
.home-view {
  width: 100%;
}

.top-row {
  margin-bottom: 30px;
  align-items: stretch;
}

.card-block {
  border-radius: 10px;
}
.card-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--uu-text);
}

.top-row .stretch-col .card-block {
  flex: 1;
  width: 100%;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

@media (min-width: 992px) {
  .top-row .stretch-col .card-block {
    margin-bottom: 0;
  }
}

/* 三列等高：卡片 body 撑满列高 */
.top-row .card-block :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.today-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.today-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.today-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.today-item:first-child {
  padding-top: 0;
}
.today-thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  flex-shrink: 0;
}
.today-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--uu-text);
}
.today-desc {
  font-size: 12px;
  color: var(--uu-text-secondary);
  margin-top: 4px;
  line-height: 1.4;
}

.carousel-card :deep(.el-card__body) {
  padding: 0;
}

/* 轮播随中间列等高拉伸，占满卡片 body，避免底部留白 */
.carousel-card :deep(.top-banner-carousel) {
  flex: 1;
  width: 100%;
  min-height: 220px;
  overflow: hidden;
  border-radius: 8px;
}
.carousel-card :deep(.top-banner-carousel .el-carousel__container) {
  height: 100% !important;
}
.carousel-card :deep(.top-banner-carousel .el-carousel__item) {
  height: 100%;
}

.banner-slide {
  height: 100%;
  min-height: 220px;
  border-radius: 8px;
  background: linear-gradient(160deg, #3b82f6 0%, #93c5fd 55%, #e0f2fe 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  color: #fff;
  text-align: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
.banner-icon {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
.banner-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
}
.banner-desc {
  margin: 0 0 16px;
  font-size: 13px;
  opacity: 0.95;
  max-width: 280px;
  line-height: 1.5;
}
.banner-btn {
  --el-button-bg-color: rgba(255, 255, 255, 0.95);
  --el-button-border-color: transparent;
  --el-button-text-color: #2563eb;
  --el-button-hover-bg-color: #fff;
  --el-button-hover-text-color: #1d4ed8;
}

.notes-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.notes-item {
  padding: 10px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
  font-size: 13px;
  line-height: 1.55;
}
.notes-item:last-child {
  border-bottom: none;
}
.notes-item a {
  color: var(--uu-text);
  text-decoration: none;
  transition: color 0.2s;
}
.notes-item a:hover {
  color: var(--uu-primary);
}

.section-category {
  margin-top: 8px;
}

.section-latest {
  margin-top: 16px;
  margin-bottom: 8px;
}
.section-latest__title {
  margin-bottom: 20px;
}

.section-category__more-link {
  color: var(--el-color-primary);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}
.section-category__more-link:hover {
  opacity: 0.88;
}
</style>
