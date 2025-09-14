<template>
  <!-- 悬浮按钮 -->
  <button class="ai-fab" @click="open = !open" :aria-expanded="open">
    🤖 {{ btnText }}
  </button>

  <!-- 浮动面板 -->
  <div v-if="open" class="ai-chat-panel">
    <div class="ai-chat-header">
      <span>{{ title }}</span>
      <button class="ai-close" @click="open = false">✕</button>
    </div>

    <div class="ai-chat-body" ref="scrollEl">
      <div v-for="(m, i) in msgs" :key="i" class="ai-msg" :class="m.role">
        <div class="ai-bubble">{{ m.content }}</div>
      </div>

      <div v-if="loading" class="ai-loading-row">
        <span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span>
      </div>

      <div v-if="error" class="ai-error">{{ error }}</div>
    </div>

    <form class="ai-input-row" @submit.prevent="send">
      <input
        v-model.trim="input"
        type="text"
        :placeholder="placeholder"
        :disabled="loading"
        @keydown.enter.exact.prevent="send"
      />
      <button type="submit" :disabled="loading || !input">Ask</button>
    </form>

    <div v-if="hint" class="ai-hint">{{ hint }}</div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'

const props = defineProps({
  /** 标题与按钮文案 */
  title: { type: String, default: 'Ask-AI · Comfort Education' },
  btnText: { type: String, default: 'Ask-AI' },
  /** 输入占位符与底部提示 */
  placeholder: { type: String, default: "Ask something like: Why are kids more vulnerable to heat?" },
  hint: { type: String, default: '' },
  /** 初始欢迎语 */
  greeting: { type: String, default: "Hi! I'm here to answer comfort & safety questions." },
  /** 接口配置 */
  endpoint: { type: String, default: `${import.meta.env.VITE_API_BASE}/ai/chat` }, // 可覆盖
  /** 后端返回字段名（默认 { reply: "..." }） */
  replyKey: { type: String, default: 'reply' }
})

const open = ref(false)
const input = ref('')
const loading = ref(false)
const error = ref('')
const msgs = ref([{ role: 'assistant', content: props.greeting }])
const scrollEl = ref(null)

function scrollToBottom() {
  nextTick(() => {
    if (scrollEl.value) {
      scrollEl.value.scrollTop = scrollEl.value.scrollHeight
    }
  })
}

async function send() {
  if (!input.value || loading.value) return
  error.value = ''
  const text = input.value
  input.value = ''
  msgs.value.push({ role: 'user', content: text })
  scrollToBottom()

  try {
    loading.value = true
    const resp = await fetch(props.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    const reply = (props.replyKey in data) ? data[props.replyKey] : data
    msgs.value.push({ role: 'assistant', content: String(reply ?? 'Sorry, no answer.') })
  } catch (e) {
    console.error(e)
    error.value = 'Failed to get AI reply. Please try again.'
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

onMounted(scrollToBottom)
</script>

<style scoped>
.ai-fab{
  position:fixed; right:24px; bottom:24px; z-index:999;
  background:#2e7d32; color:#fff; border:none; border-radius:999px;
  padding:10px 16px; font-weight:800; box-shadow:0 8px 20px rgba(0,0,0,.12);
  cursor:pointer;
}
.ai-fab:hover{ background:#256628; }

.ai-chat-panel{
  position:fixed; right:24px; bottom:84px; width:360px; max-height:540px;
  background:#fff; border:1px solid #e4efe1; border-radius:14px;
  box-shadow:0 12px 28px rgba(0,0,0,.16); display:flex; flex-direction:column; z-index:999;
}
.ai-chat-header{
  display:flex; justify-content:space-between; align-items:center;
  padding:10px 12px; background:#e8f6e3; color:#355f34; font-weight:900;
  border-top-left-radius:14px; border-top-right-radius:14px;
}
.ai-close{ border:none; background:transparent; font-size:16px; cursor:pointer; color:#466f45; }

.ai-chat-body{
  padding:12px; overflow-y:auto; flex:1; background:#fafdf9;
}
.ai-msg{ display:flex; margin-bottom:10px; }
.ai-msg.user{ justify-content:flex-end; }
.ai-msg.assistant{ justify-content:flex-start; }

.ai-bubble{
  max-width:78%; padding:10px 12px; border-radius:12px; line-height:1.4; font-size:14px; border:1px solid #e5efe3;
}
.ai-msg.user .ai-bubble{ background:#edfce0; color:#355f34; border-top-right-radius:4px; }
.ai-msg.assistant .ai-bubble{ background:#fff; color:#2f3d2c; border-top-left-radius:4px; }

.ai-input-row{
  display:grid; grid-template-columns:1fr auto; gap:8px; padding:10px; border-top:1px solid #eef5ec;
}
.ai-input-row input{
  border:1px solid #dfead8; border-radius:8px; padding:10px 12px; outline:none;
}
.ai-input-row button{
  border:none; background:#2e7d32; color:#fff; border-radius:8px; padding:10px 14px; font-weight:700; cursor:pointer;
}
.ai-input-row button[disabled]{ opacity:.6; cursor:not-allowed; }

.ai-hint{ font-size:11px; color:#6b7b67; padding:0 10px 10px; }

.ai-loading-row{ display:flex; gap:6px; padding:6px 4px; }
.ai-dot{ width:6px; height:6px; border-radius:50%; background:#9bc285; animation:ai-blink 1s infinite ease-in-out; }
.ai-dot:nth-child(2){ animation-delay:.15s; }
.ai-dot:nth-child(3){ animation-delay:.3s; }
@keyframes ai-blink{ 0%,100%{ opacity:.2; transform:translateY(0);} 50%{ opacity:1; transform:translateY(-2px);} }

.ai-error{ color:#b00020; font-size:12px; padding:4px 0; }
</style>
