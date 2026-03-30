/** 工具卡片（与侧栏「工具分类」顺序一致） */
export type ToolCard = {
  title: string
  desc: string
  thumb: string
  icon: string
}

export type ToolCategory = {
  id: string
  title: string
  tools: ToolCard[]
}

function g(
  a: number,
  b: number,
  c: number,
  d: number,
): string {
  return `linear-gradient(135deg, hsl(${a}, ${b}%, ${c}%) 0%, hsl(${a + 20}, ${b}%, ${d}%) 100%)`
}

/** 首页每个分类最多展示数量 */
export const HOME_CATEGORY_PREVIEW = 12

const textTools: ToolCard[] = [
  { title: '文本替换', desc: '批量查找与替换，支持正则表达式与大小写匹配。', thumb: g(152, 70, 45, 38), icon: '🔁' },
  { title: '分割文本', desc: '按换行、空格或自定义分隔符拆分与合并文本。', thumb: g(250, 70, 65, 50), icon: '✂️' },
  { title: '摩斯电码', desc: '中文、英文与摩斯码互转，支持点划与声音节奏。', thumb: g(265, 75, 50, 42), icon: '📡' },
  { title: '文本去重', desc: '去除重复行或重复段落，保留顺序或去重统计。', thumb: g(330, 80, 65, 52), icon: '✨' },
  { title: '大小写转换', desc: '全大写、全小写、首字母大写、驼峰等多种格式。', thumb: g(200, 85, 55, 45), icon: '🔠' },
  { title: '字数统计', desc: '统计字数、词数、行数与字符数，支持中英文混合。', thumb: g(40, 95, 55, 42), icon: '📊' },
  { title: '行排序', desc: '按字典序、长度或自然排序对多行文本排序。', thumb: g(175, 70, 45, 38), icon: '⇅' },
  { title: '空白整理', desc: '去除多余空行、首尾空格与统一缩进风格。', thumb: g(215, 20, 55, 42), icon: '⬚' },
  { title: 'Unicode 转义', desc: '\\uXXXX 与字符互转，便于复制到代码或 JSON。', thumb: g(280, 75, 60, 48), icon: '∑' },
  { title: '简繁转换', desc: '简体与繁体中文互转，适合文稿与网页内容。', thumb: g(345, 85, 65, 52), icon: '文' },
  { title: 'Base64 文本', desc: '纯文本与 Base64 互转，无需上传文件。', thumb: g(220, 90, 58, 48), icon: '🔤' },
  { title: '文本对比', desc: '两段文本逐行或逐字对比，高亮差异。', thumb: g(30, 95, 58, 45), icon: '⚖' },
  { title: '行号与引用', desc: '为每行添加序号或引用符号，方便粘贴到文档。', thumb: g(170, 75, 80, 65), icon: '#' },
  { title: '反转文本', desc: '整段反转、按行反转或单词顺序反转。', thumb: g(350, 75, 70, 55), icon: '↩' },
  { title: 'HTML 实体', desc: 'HTML 实体编码与解码，防止 XSS 与乱码。', thumb: g(235, 75, 62, 50), icon: '&' },
  { title: '随机文本', desc: '生成随机字符串、UUID 或占位假文。', thumb: g(290, 80, 70, 55), icon: '🎲' },
]

const numTools: ToolCard[] = [
  { title: '进制转换', desc: '二、八、十、十六进制互转，支持大整数。', thumb: g(210, 80, 55, 45), icon: '🔢' },
  { title: '质数检测', desc: '判断质数、分解质因数与列出区间内质数。', thumb: g(340, 70, 55, 45), icon: '∑' },
  { title: '随机数生成', desc: '指定范围、小数位与批量随机数。', thumb: g(45, 90, 58, 48), icon: '🎲' },
  { title: '单位换算', desc: '长度、面积、体积、重量等常用单位换算。', thumb: g(190, 75, 55, 45), icon: '⚖' },
  { title: '百分比计算', desc: '增减百分比、占比与复合增长计算。', thumb: g(25, 85, 55, 45), icon: '%' },
  { title: '科学计数', desc: '科学记数法与普通数字互转。', thumb: g(200, 70, 50, 42), icon: 'e' },
  { title: '罗马数字', desc: '阿拉伯数字与罗马数字互转。', thumb: g(260, 65, 50, 42), icon: 'Ⅳ' },
  { title: '最大公约数', desc: 'GCD、LCM 与扩展欧几里得。', thumb: g(300, 75, 55, 45), icon: '∩' },
  { title: '三角函数', desc: '角度弧度换算与常用三角函数值。', thumb: g(230, 80, 55, 45), icon: '△' },
  { title: '贷款计算器', desc: '等额本息、等额本金与还款计划表。', thumb: g(145, 70, 55, 45), icon: '💰' },
  { title: '分数运算', desc: '通分、约分与四则运算。', thumb: g(15, 85, 55, 45), icon: '½' },
  { title: '因数分解', desc: '正整数质因数分解与所有因数列表。', thumb: g(320, 75, 55, 45), icon: '×' },
  { title: '概率模拟', desc: '蒙特卡洛与简单概率实验。', thumb: g(280, 70, 58, 48), icon: '📈' },
  { title: '大数运算', desc: '超出 JS 安全整数的大整数加减乘除。', thumb: g(180, 60, 50, 42), icon: '∞' },
]

const imgTools: ToolCard[] = [
  { title: '图片压缩', desc: '有损/无损压缩，控制体积与画质。', thumb: g(200, 85, 55, 45), icon: '🗜' },
  { title: '格式转换', desc: 'PNG、JPG、WebP、GIF 等格式互转。', thumb: g(250, 75, 58, 48), icon: '🔄' },
  { title: '裁剪与旋转', desc: '固定比例裁剪与任意角度旋转。', thumb: g(120, 80, 55, 45), icon: '✂' },
  { title: '水印工具', desc: '文字或图片平铺、单点水印。', thumb: g(210, 70, 55, 45), icon: '💧' },
  { title: '九宫格切图', desc: '一键切朋友圈、微博九宫格。', thumb: g(330, 75, 60, 50), icon: '▦' },
  { title: '取色与调色', desc: '从图片取色并简单曲线调色。', thumb: g(300, 90, 60, 52), icon: '🎨' },
  { title: '圆角与阴影', desc: '批量生成圆角图与投影效果。', thumb: g(260, 65, 55, 45), icon: '◱' },
  { title: '合并长图', desc: '纵向或横向拼接多张图片。', thumb: g(180, 75, 55, 45), icon: '⫿' },
  { title: '二维码叠图', desc: '在图片中心嵌入二维码。', thumb: g(140, 80, 55, 45), icon: '▣' },
  { title: 'EXIF 查看', desc: '查看拍摄参数与地理位置（脱敏）。', thumb: g(220, 60, 50, 42), icon: 'ℹ' },
  { title: '图标生成', desc: '从图片生成多尺寸 App 图标。', thumb: g(270, 75, 58, 48), icon: '📱' },
  { title: '动图分解', desc: 'GIF 拆帧与帧编辑。', thumb: g(350, 80, 60, 50), icon: '🎞' },
  { title: '背景移除', desc: '简单抠图与纯色背景替换（演示）。', thumb: g(160, 75, 55, 45), icon: '👤' },
  { title: '像素画转换', desc: '将照片转为低分辨率像素风格预览。', thumb: g(310, 75, 55, 45), icon: '🧱' },
]

const codeTools: ToolCard[] = [
  { title: 'JSON 格式化', desc: '美化、压缩与 JSON 路径查询。', thumb: g(145, 75, 55, 45), icon: '{}' },
  { title: '正则调试', desc: '实时匹配高亮与替换预览。', thumb: g(280, 70, 55, 45), icon: '.*' },
  { title: 'Diff 对比', desc: '文本或代码行级差异对比。', thumb: g(40, 85, 55, 45), icon: '±' },
  { title: 'SQL 格式化', desc: 'SQL 美化与关键字高亮。', thumb: g(200, 65, 50, 42), icon: 'SQL' },
  { title: 'Cron 解析', desc: 'Cron 表达式解析与自然语言说明。', thumb: g(30, 80, 55, 45), icon: '⏰' },
  { title: 'UUID 生成', desc: '批量生成 UUID v4。', thumb: g(220, 90, 58, 48), icon: '🆔' },
  { title: 'Hash 计算', desc: 'MD5、SHA 系列文件与文本摘要。', thumb: g(260, 75, 55, 45), icon: '#' },
  { title: 'URL 编解码', desc: 'Query 与路径组件编解码。', thumb: g(210, 80, 55, 45), icon: '🔗' },
  { title: 'JWT 解析', desc: '仅客户端解析 Payload（勿泄露密钥）。', thumb: g(340, 70, 55, 45), icon: '🎫' },
  { title: '颜色变量', desc: 'HEX/RGB/HSL 与 CSS 变量互转。', thumb: g(300, 85, 60, 52), icon: '🌈' },
  { title: 'Shell 转义', desc: '字符串在 Bash/PowerShell 中的安全转义。', thumb: g(180, 70, 50, 42), icon: '>_ ' },
  { title: 'Protobuf 预览', desc: '简单 .proto 语法高亮（只读）。', thumb: g(230, 65, 50, 42), icon: 'PB' },
  { title: 'YAML ↔ JSON', desc: 'YAML 与 JSON 互转与校验。', thumb: g(170, 75, 55, 45), icon: '⇄' },
  { title: 'Gitignore 模板', desc: '按语言生成常用 .gitignore 片段。', thumb: g(150, 65, 50, 42), icon: '⎇' },
]

const chartTools: ToolCard[] = [
  { title: '折线图', desc: '粘贴表格数据快速生成折线图。', thumb: g(210, 85, 58, 48), icon: '📈' },
  { title: '柱状图', desc: '分组柱状与堆叠柱状图。', thumb: g(190, 75, 55, 45), icon: '📊' },
  { title: '饼图', desc: '占比饼图与环形图。', thumb: g(330, 80, 60, 50), icon: '◐' },
  { title: '散点图', desc: '二维散点与简单回归线。', thumb: g(280, 70, 55, 45), icon: '·' },
  { title: '雷达图', desc: '多维度能力雷达图。', thumb: g(250, 75, 58, 48), icon: '⬡' },
  { title: '漏斗图', desc: '转化漏斗各阶段人数。', thumb: g(300, 75, 55, 45), icon: '▽' },
  { title: '甘特图', desc: '简单项目时间线与里程碑。', thumb: g(45, 70, 55, 45), icon: '▬' },
  { title: '词云', desc: '根据词频生成词云图。', thumb: g(350, 75, 60, 52), icon: '☁' },
  { title: '地图热力', desc: '基于行政区或经纬度的热力示意。', thumb: g(200, 80, 55, 45), icon: '🗺' },
  { title: '表格转图', desc: '将 Markdown 表格渲染为图表。', thumb: g(160, 75, 55, 45), icon: '⊞' },
  { title: '箱线图', desc: '五数概括与离群点示意。', thumb: g(320, 65, 50, 42), icon: '▬' },
  { title: '面积图', desc: '堆叠面积与百分比面积。', thumb: g(230, 80, 58, 48), icon: '⌒' },
  { title: '桑基图', desc: '流量分配与转化路径（简化版）。', thumb: g(270, 70, 55, 45), icon: '⟿' },
]

const officeTools: ToolCard[] = [
  { title: 'PDF 合并', desc: '多个 PDF 合并为一个文件。', thumb: g(0, 75, 55, 45), icon: '📄' },
  { title: 'PDF 拆分', desc: '按页码或书签拆分 PDF。', thumb: g(220, 70, 55, 45), icon: '📑' },
  { title: '表格转 CSV', desc: 'Excel 粘贴为 CSV 或反之。', thumb: g(145, 80, 55, 45), icon: ',' },
  { title: '会议计时', desc: '议程倒计时与发言提醒。', thumb: g(40, 85, 55, 45), icon: '⏱' },
  { title: '姓名牌生成', desc: '批量生成折叠姓名牌 PDF。', thumb: g(300, 75, 58, 48), icon: '🏷' },
  { title: '合同编号', desc: '按规则生成唯一合同编号。', thumb: g(260, 65, 50, 42), icon: '§' },
  { title: '发票验真指引', desc: '发票要素校验与格式说明（演示）。', thumb: g(350, 70, 55, 45), icon: '🧾' },
  { title: '会议纪要模板', desc: '结构化纪要 Markdown 模板。', thumb: g(200, 75, 55, 45), icon: '📝' },
  { title: '工时统计', desc: '按项目汇总每日工时。', thumb: g(180, 80, 55, 45), icon: '⏳' },
  { title: '名片二维码', desc: 'vCard 与二维码合成。', thumb: g(280, 85, 58, 48), icon: '👤' },
  { title: '幻灯片比例', desc: '4:3 / 16:9 画布尺寸换算。', thumb: g(230, 75, 55, 45), icon: '▭' },
  { title: '邮件头解析', desc: '解析 Received 链路与延迟。', thumb: g(320, 60, 50, 42), icon: '✉' },
  { title: '目录编号', desc: '为标题自动添加多级编号。', thumb: g(160, 75, 55, 45), icon: '📌' },
]

const lifeTools: ToolCard[] = [
  { title: '倒计时', desc: '重要日子倒数与桌面通知。', thumb: g(340, 85, 60, 52), icon: '🎂' },
  { title: '番茄钟', desc: '专注与休息节奏计时。', thumb: g(0, 90, 58, 48), icon: '🍅' },
  { title: ' BMI 计算', desc: '身高体重计算 BMI 与区间说明。', thumb: g(200, 75, 55, 45), icon: '⚕' },
  { title: '房贷计算', desc: '月供、总利息与提前还款试算。', thumb: g(45, 80, 55, 45), icon: '🏠' },
  { title: '汇率换算', desc: '常用货币汇率换算（演示数据）。', thumb: g(210, 85, 58, 48), icon: '💱' },
  { title: '油耗计算', desc: '百公里油耗与油费估算。', thumb: g(30, 75, 55, 45), icon: '⛽' },
  { title: '尺码对照', desc: '中欧美鞋服尺码对照表。', thumb: g(300, 70, 55, 45), icon: '👕' },
  { title: '生理期预测', desc: '简易周期记录与预测（仅供参考）。', thumb: g(330, 75, 60, 50), icon: '📅' },
  { title: '垃圾分类', desc: '常见物品分类查询（地域规则演示）。', thumb: g(120, 80, 55, 45), icon: '♻' },
  { title: '菜谱份量', desc: '按人数缩放食材用量。', thumb: g(50, 85, 58, 48), icon: '🍳' },
  { title: '旅行清单', desc: '可勾选的出行物品清单。', thumb: g(270, 75, 55, 45), icon: '✈' },
  { title: '随机决定', desc: '转盘、掷骰子帮你做选择。', thumb: g(290, 80, 60, 52), icon: '🎲' },
  { title: '饮水提醒', desc: '按体重估算每日饮水量与提醒。', thumb: g(190, 85, 55, 45), icon: '💧' },
]

const aiTools: ToolCard[] = [
  { title: '文案扩写', desc: '将短句扩展为段落（演示接口）。', thumb: g(280, 75, 58, 48), icon: '✨' },
  { title: '摘要生成', desc: '长文自动摘要要点。', thumb: g(240, 80, 55, 45), icon: '📋' },
  { title: '翻译助手', desc: '多语言互译与术语表（演示）。', thumb: g(200, 85, 58, 48), icon: '🌐' },
  { title: '关键词提取', desc: '从文本提取关键词与权重。', thumb: g(320, 70, 55, 45), icon: '🔑' },
  { title: '情感分析', desc: '简单正负向情感打分（演示）。', thumb: g(350, 75, 60, 52), icon: '😊' },
  { title: '代码解释', desc: '选中代码生成自然语言说明。', thumb: g(220, 65, 50, 42), icon: '💡' },
  { title: 'SQL 生成', desc: '自然语言描述生成 SQL（需谨慎校验）。', thumb: g(180, 70, 55, 45), icon: '🗄' },
  { title: '正则生成', desc: '用自然语言描述生成正则草稿。', thumb: g(300, 75, 55, 45), icon: '.*' },
  { title: '命名建议', desc: '变量、函数、类命名风格建议。', thumb: g(260, 80, 58, 48), icon: '✎' },
  { title: '错别字检查', desc: '中文拼写与常见混淆词提示。', thumb: g(0, 75, 55, 45), icon: '✓' },
  { title: '会议纪要润色', desc: '口语化纪要改为书面语。', thumb: g(150, 75, 55, 45), icon: '📝' },
  { title: '面试题生成', desc: '按岗位与难度生成面试题清单。', thumb: g(310, 70, 55, 45), icon: '💼' },
  { title: '提示词优化', desc: '优化 Chat 提示词结构与约束。', thumb: g(270, 85, 58, 48), icon: '🎯' },
]

/** 与侧栏「工具分类」顺序一致 */
export const toolCategories: ToolCategory[] = [
  { id: 'cat-text', title: '文本工具', tools: textTools },
  { id: 'cat-num', title: '数字工具', tools: numTools },
  { id: 'cat-img', title: '图片工具', tools: imgTools },
  { id: 'cat-code', title: '编程相关', tools: codeTools },
  { id: 'cat-chart', title: '图表工具', tools: chartTools },
  { id: 'cat-office', title: '办公工具', tools: officeTools },
  { id: 'cat-life', title: '生活工具', tools: lifeTools },
  { id: 'cat-ai', title: 'AI 工具', tools: aiTools },
]

export function getCategoryById(id: string): ToolCategory | undefined {
  return toolCategories.find((c) => c.id === id)
}
