import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatApiError, getHealth, postChat, type ChatRequestDto } from '../api/chat'

export function useAiTool(systemPrompt: string) {
  const model = ref('')
  const generating = ref(false)
  const outputText = ref('')
  const healthOk = ref<boolean | null>(null)

  async function refreshHealth() {
    try {
      const h = await getHealth()
      healthOk.value = !!h?.success
    } catch {
      healthOk.value = false
    }
  }

  onMounted(() => {
    void refreshHealth()
  })

  async function runPrompt(userPrompt: string, emptyWarning: string) {
    if (!userPrompt.trim() || generating.value) return
    generating.value = true
    outputText.value = ''
    try {
      const body: ChatRequestDto = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }
      if (model.value.trim()) body.model = model.value.trim()
      const data = await postChat(body)
      outputText.value = data.reply.trim()
      if (!outputText.value) ElMessage.warning(emptyWarning)
    } catch (e) {
      if (e instanceof ChatApiError) ElMessage.error(e.message)
      else ElMessage.error('请求失败，请检查网络或稍后重试。')
    } finally {
      generating.value = false
    }
  }

  function clearOutput() {
    outputText.value = ''
  }

  async function copyOutput(successMessage: string) {
    if (!outputText.value) return
    try {
      await navigator.clipboard.writeText(outputText.value)
      ElMessage.success(successMessage)
    } catch {
      ElMessage.error('复制失败，请手动复制。')
    }
  }

  return {
    model,
    generating,
    outputText,
    healthOk,
    runPrompt,
    clearOutput,
    copyOutput,
  }
}
