<!-- src/components/KidPathChat.vue -->
<template>
  <!-- 浮动按钮 -->
  <button class="ai-fab" @click="open = !open" :aria-expanded="open">
    🤖 {{ btnText }}
  </button>

  <!-- 浮动面板 -->
  <div v-if="open" class="ai-chat-panel">
    <div class="ai-chat-header">
      <span>{{ title }}</span>
      <button class="ai-close" @click="open = false">✕</button>
    </div>

    <!-- 模式切换 -->
    <div class="ai-tabs">
      <button :class="['ai-tab', mode==='text' && 'active']"  @click="mode='text'">Text</button>
      <button :class="['ai-tab', mode==='voice' && 'active']" @click="mode='voice'">Voice</button>
      <button :class="['ai-tab', mode==='photo' && 'active']" @click="mode='photo'">Photo</button>
    </div>

    <!-- 消息区（支持 Markdown 渲染 + 代码高亮） -->
    <div class="ai-chat-body" ref="scrollEl">
      <div v-for="(m, i) in msgs" :key="i" class="ai-msg" :class="m.role">
        <div class="ai-bubble">
          <div v-if="m.html" v-html="m.html"></div>
          <div v-else>{{ m.text }}</div>
        </div>
      </div>

      <div v-if="loading" class="ai-loading-row">
        <span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span>
      </div>

      <div v-if="error" class="ai-error">{{ error }}</div>
    </div>

    <!-- 输入区：按模式切换 -->
    <form v-if="mode==='text'" class="ai-input-row" @submit.prevent="sendText">
      <input
        v-model.trim="input"
        type="text"
        :placeholder="placeholder"
        :disabled="loading"
        @keydown.enter.exact.prevent="sendText"
      />
      <button type="submit" :disabled="loading || !input">Ask</button>
    </form>

    <div v-else-if="mode==='voice'" class="ai-input-row is-uploader">
      <input type="file" accept="audio/*" @change="onPickAudio" :disabled="loading" />
      <button @click="sendVoice" :disabled="loading || !audioFile">Send voice</button>
    </div>

    <div v-else-if="mode==='photo'" class="ai-input-row is-uploader">
      <input type="file" accept="image/*" @change="onPickImage" :disabled="loading" />
      <button @click="sendPhoto" :disabled="loading || !imageFile">Analyze photo</button>
    </div>

    <div v-if="hint" class="ai-hint">{{ hint }}</div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css' // 代码块样式

// ==== 一定要先放在最上面，避免 TDZ ====
let _md
function getMD() {
  if (_md) return _md
  _md = new MarkdownIt({
    html: false,       // 不信任原始 HTML
    linkify: true,
    breaks: true,
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${
            hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
          }</code></pre>`
        } catch {}
      }
      // 注意：这里不要引用 md/utils（会形成对未初始化变量的访问），用新的实例取 utils 即可
      return `<pre class="hljs"><code>${
        new MarkdownIt().utils.escapeHtml(code)
      }</code></pre>`
    }
  })
  return _md
}
function renderMD(text) {
  return getMD().render(String(text || ''))
}

// ==== props 定义（在 renderMD 之后没有问题）====
const props = defineProps({
  title: { type: String, default: 'Ask-AI · Comfort Education' },
  btnText: { type: String, default: 'Ask-AI' },
  placeholder: { type: String, default: 'Ask something about Melbourne CBD...' },
  hint: { type: String, default: '' },
  greeting: { type: String, default: "Hi! Ask me comfort & safety questions for Melbourne CBD." },

  // 与后端 aiRoutes.js 对齐
  textEndpoint:  { type: String, default: `${import.meta.env.VITE_API_BASE || ''}/ai/text` },
  voiceEndpoint: { type: String, default: `${import.meta.env.VITE_API_BASE || ''}/ai/voice` },
  photoEndpoint: { type: String, default: `${import.meta.env.VITE_API_BASE || ''}/ai/photo` },

  // 后端返回键名：优先 reply / content；如果你后端直接给 html，可自动用 html 渲染
  htmlKey:    { type: String, default: 'html' },
  replyKey:   { type: String, default: 'reply' },
  contentKey: { type: String, default: 'content' },
})

// ==== 组件状态 ====
const open = ref(false)
const mode = ref('text')      // 'text' | 'voice' | 'photo'
const input = ref('')
const loading = ref(false)
const error = ref('')
const msgs = ref([{ role: 'assistant', text: '', html: renderMD(props.greeting) }])
const scrollEl = ref(null)

const audioFile = ref(null)
const imageFile = ref(null)

// ==== 工具函数 ====
function scrollToBottom() {
  nextTick(() => { if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight })
}

function pushAssistantFromData(data) {
  const html = data?.[props.htmlKey]
  if (html) { msgs.value.push({ role: 'assistant', text: '', html }); return }
  const txt = data?.[props.replyKey] ?? data?.[props.contentKey] ?? (typeof data === 'string' ? data : JSON.stringify(data))
  msgs.value.push({ role: 'assistant', text: '', html: renderMD(txt) })
}

// ==== 发送文本 ====
async function sendText() {
  if (!input.value || loading.value) return
  error.value = ''
  const text = input.value
  input.value = ''
  msgs.value.push({ role: 'user', text, html: null })
  scrollToBottom()

  try {
    loading.value = true
    const resp = await fetch(props.textEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, prompt: text }) // 兼容你的后端
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const ct = (resp.headers.get('content-type') || '').toLowerCase()
    if (ct.includes('application/json')) {
      const data = await resp.json()
      pushAssistantFromData(data)
    } else {
      const txt = await resp.text()
      pushAssistantFromData({ [props.contentKey]: txt })
    }
  } catch (e) {
    console.error(e)
    error.value = 'Failed to get AI reply. Please try again.'
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

// ==== 发送语音 ====
function onPickAudio(e) { audioFile.value = e.target.files?.[0] || null }
async function sendVoice() {
  if (!audioFile.value || loading.value) return
  error.value = ''
  msgs.value.push({ role: 'user', text: '🎤 Sent a voice message…', html: null })
  scrollToBottom()

  try {
    loading.value = true
    const fd = new FormData()
    fd.append('audio', audioFile.value) // 字段名固定：audio
    const resp = await fetch(props.voiceEndpoint, { method: 'POST', body: fd })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const ct = (resp.headers.get('content-type') || '').toLowerCase()
    if (ct.includes('application/json')) {
      const data = await resp.json()
      pushAssistantFromData(data)
    } else {
      const txt = await resp.text()
      pushAssistantFromData({ [props.contentKey]: txt })
    }
  } catch (e) {
    console.error(e)
    error.value = 'Voice upload failed.'
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

// ==== 发送图片 ====
function onPickImage(e) { imageFile.value = e.target.files?.[0] || null }
async function sendPhoto() {
  if (!imageFile.value || loading.value) return
  error.value = ''
  msgs.value.push({ role: 'user', text: '🖼️ Sent a photo…', html: null })
  scrollToBottom()

  try {
    loading.value = true
    const fd = new FormData()
    fd.append('image', imageFile.value) // 字段名固定：image
    const resp = await fetch(props.photoEndpoint, { method: 'POST', body: fd })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const ct = (resp.headers.get('content-type') || '').toLowerCase()

    if (ct.includes('application/json')) {
      const data = await resp.json()
      // 你的后端会返回 { keyword, summary, recommendations: [...] }
      if (data && data.summary) {
        const list = Array.isArray(data.recommendations)
          ? data.recommendations.map(p => `- **${p.name}** — ${p.features || ''}${p.shade ? ` _(shade: ${p.shade})_` : ''}`).join('\n')
          : ''
        const mdText = `**Keyword:** ${data.keyword || '-'}\n\n**Summary:** ${data.summary}\n\n**Suggestions:**\n${list || '- No items'}`
        pushAssistantFromData({ [props.contentKey]: mdText })
      } else {
        pushAssistantFromData(data)
      }
    } else {
      const txt = await resp.text()
      pushAssistantFromData({ [props.contentKey]: txt })
    }
  } catch (e) {
    console.error(e)
    error.value = 'Photo analysis failed.'
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
  position:fixed; right:24px; bottom:84px; width:360px; max-height:640px;
  background:#fff; border:1px solid #e4efe1; border-radius:14px;
  box-shadow:0 12px 28px rgba(0,0,0,.16); display:flex; flex-direction:column; z-index:999;
}
.ai-chat-header{
  display:flex; justify-content:space-between; align-items:center;
  padding:10px 12px; background:#e8f6e3; color:#355f34; font-weight:900;
  border-top-left-radius:14px; border-top-right-radius:14px;
}
.ai-close{ border:none; background:transparent; font-size:16px; cursor:pointer; color:#466f45; }

.ai-tabs{ display:flex; gap:6px; padding:8px 10px; border-bottom:1px solid #eef5ec; }
.ai-tab{ border:1px solid #dfead8; background:#f7fbf5; color:#355f34; border-radius:999px; padding:6px 10px; font-weight:700; cursor:pointer; }
.ai-tab.active{ background:#2e7d32; color:#fff; border-color:#2e7d32; }

.ai-chat-body{ padding:12px; overflow-y:auto; flex:1; background:#fafdf9; }
.ai-msg{ display:flex; margin-bottom:10px; }
.ai-msg.user{ justify-content:flex-end; }
.ai-msg.assistant{ justify-content:flex-start; }
.ai-bubble{ max-width:78%; padding:10px 12px; border-radius:12px; line-height:1.4; font-size:14px; border:1px solid #e5efe3; }
.ai-msg.user .ai-bubble{ background:#edfce0; color:#355f34; border-top-right-radius:4px; }
.ai-msg.assistant .ai-bubble{ background:#fff; color:#2f3d2c; border-top-left-radius:4px; }

.ai-input-row{ display:grid; grid-template-columns:1fr auto; gap:8px; padding:10px; border-top:1px solid #eef5ec; }
.ai-input-row.is-uploader{ grid-template-columns:1fr auto; }
.ai-input-row input[type='text']{ border:1px solid #dfead8; border-radius:8px; padding:10px 12px; outline:none; }
.ai-input-row button{ border:none; background:#2e7d32; color:#fff; border-radius:8px; padding:10px 14px; font-weight:700; cursor:pointer; }
.ai-input-row button[disabled]{ opacity:.6; cursor:not-allowed; }

.ai-hint{ font-size:11px; color:#6b7b67; padding:0 10px 10px; }

.ai-loading-row{ display:flex; gap:6px; padding:6px 4px; }
.ai-dot{ width:6px; height:6px; border-radius:50%; background:#9bc285; animation:ai-blink 1s infinite ease-in-out; }
.ai-dot:nth-child(2){ animation-delay:.15s; }
.ai-dot:nth-child(3){ animation-delay:.3s; }
@keyframes ai-blink{ 0%,100%{ opacity:.2; transform:translateY(0);} 50%{ opacity:1; transform:translateY(-2px);} }

.ai-error{ color:#b00020; font-size:12px; padding:4px 10px 10px; }

/* 代码高亮背景 */
:deep(.hljs){ background:#f6f8fa; }
</style>
