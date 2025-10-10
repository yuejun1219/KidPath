<!-- src/components/KidPathChat.vue -->
<template>
  <!-- 浮动按钮 -->
  <button class="ai-fab" @click="open = !open" :aria-expanded="open">
    🤖 {{ btnText }}
  </button>

  <!-- 浮动面板 -->
  <div v-if="open" class="ai-chat-panel">
    <header class="ai-chat-header">
      <span>{{ title }}</span>
      <button class="ai-close" @click="open = false">✕</button>
    </header>

    <!-- 消息区（支持 Markdown 渲染 + 代码高亮） -->
    <main class="ai-chat-body" ref="scrollEl">
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
    </main>

    <!-- ✅ 统一输入栏（ChatGPT风格） -->
    <form class="input-bar" @submit.prevent="sendText">
      <!-- 左：选择图片 -->
      <button
        type="button"
        class="icon-btn"
        aria-label="Attach image"
        @click="imagePicker?.click()"
        :disabled="loading"
      >＋</button>
      <input
        ref="imagePicker"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onPickImage"
      />

      <!-- 中：文本输入 -->
      <input
        v-model.trim="input"
        class="text-input"
        :placeholder="placeholder"
        :disabled="loading"
        @keydown.enter.exact.prevent="sendText"
      />

      <!-- 右：上传语音 -->
      <button
        type="button"
        class="icon-btn mic"
        aria-label="Upload audio"
        @click="audioPicker?.click()"
        :disabled="loading"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2Zm-5 7v2m-4 0h8"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <input
        ref="audioPicker"
        type="file"
        accept="audio/*"
        class="hidden"
        @change="onPickAudio"
      />

      <button class="send" type="submit" :disabled="loading || !input">Send</button>
    </form>

    <p v-if="hint" class="ai-hint">{{ hint }}</p>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

/* ---------- Markdown（放最上面，避免 TDZ） ---------- */
let _md
function getMD () {
  if (_md) return _md
  _md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${hljs.highlight(code, { language: lang, ignoreIllegals: true }).value}</code></pre>`
        } catch {}
      }
      const esc = new MarkdownIt().utils.escapeHtml(code)
      return `<pre class="hljs"><code>${esc}</code></pre>`
    }
  })
  return _md
}
function renderMD(text){ return getMD().render(String(text || '')) }

/* ---------- Props ---------- */
const props = defineProps({
  title: { type: String, default: 'Ask-AI · Comfort Education' },
  btnText: { type: String, default: 'Ask-AI' },
  placeholder: { type: String, default: 'Ask anything' },
  hint: { type: String, default: '' },
  greeting: { type: String, default: "Hi! Ask me comfort & safety questions for Melbourne CBD." },

  // 直接走你后端 /ai/*，API_BASE 由 .env*.local 提供
  textEndpoint:  { type: String, default: `${import.meta.env.VITE_API_BASE || ''}/ai/text` },
  voiceEndpoint: { type: String, default: `${import.meta.env.VITE_API_BASE || ''}/ai/voice` },
  photoEndpoint: { type: String, default: `${import.meta.env.VITE_API_BASE || ''}/ai/photo` },

  htmlKey:    { type: String, default: 'html' },
  replyKey:   { type: String, default: 'reply' },
  contentKey: { type: String, default: 'content' },
})

/* ---------- State ---------- */
const open = ref(false)
const input = ref('')
const loading = ref(false)
const error = ref('')
const msgs = ref([{ role: 'assistant', text: '', html: renderMD(props.greeting) }])
const scrollEl = ref(null)

const imagePicker = ref(null)
const audioPicker = ref(null)
const imageFile = ref(null)
const audioFile = ref(null)

/* ---------- Helpers ---------- */
function scrollToBottom(){
  nextTick(() => { if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight })
}
function pushAssistantFromData(data){
  const html = data?.[props.htmlKey]
  if (html){ msgs.value.push({ role:'assistant', text:'', html }); return }
  const txt = data?.[props.replyKey] ?? data?.[props.contentKey] ?? (typeof data === 'string' ? data : JSON.stringify(data))
  msgs.value.push({ role:'assistant', text:'', html: renderMD(txt) })
}

/* ---------- Text ---------- */
async function sendText(){
  if (!input.value || loading.value) return
  error.value = ''
  const text = input.value
  input.value = ''
  msgs.value.push({ role:'user', text, html:null })
  scrollToBottom()

  try{
    loading.value = true
    const resp = await fetch(props.textEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, prompt: text })
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const ct = (resp.headers.get('content-type') || '').toLowerCase()
    if (ct.includes('application/json')){
      pushAssistantFromData(await resp.json())
    } else {
      pushAssistantFromData({ [props.contentKey]: await resp.text() })
    }
  } catch(e){
    console.error(e)
    error.value = 'Failed to get AI reply.'
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

/* ---------- Image ---------- */
function onPickImage(e){ imageFile.value = e.target.files?.[0] || null; if (imageFile.value) sendPhoto() }
async function sendPhoto(){
  if (!imageFile.value || loading.value) return
  error.value = ''
  msgs.value.push({ role:'user', text:'🖼️ Sent a photo…', html:null })
  scrollToBottom()

  try{
    loading.value = true
    const fd = new FormData()
    fd.append('image', imageFile.value)
    const resp = await fetch(props.photoEndpoint, { method:'POST', body: fd })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const ct = (resp.headers.get('content-type') || '').toLowerCase()
    if (ct.includes('application/json')){
      const data = await resp.json()
      if (data && data.summary){
        const list = Array.isArray(data.recommendations)
          ? data.recommendations.map(p => `- **${p.name}** — ${p.features || ''}${p.shade ? ` _(shade: ${p.shade})_` : ''}`).join('\n')
          : ''
        const mdText = `**Keyword:** ${data.keyword || '-'}\n\n**Summary:** ${data.summary}\n\n**Suggestions:**\n${list || '- No items'}`
        pushAssistantFromData({ [props.contentKey]: mdText })
      } else {
        pushAssistantFromData(data)
      }
    } else {
      pushAssistantFromData({ [props.contentKey]: await resp.text() })
    }
  } catch(e){
    console.error(e)
    error.value = 'Photo upload failed.'
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

/* ---------- Voice ---------- */
function onPickAudio(e){ audioFile.value = e.target.files?.[0] || null; if (audioFile.value) sendVoice() }
async function sendVoice(){
  if (!audioFile.value || loading.value) return
  error.value = ''
  msgs.value.push({ role:'user', text:'🎤 Sent a voice message…', html:null })
  scrollToBottom()

  try{
    loading.value = true
    const fd = new FormData()
    fd.append('audio', audioFile.value)
    const resp = await fetch(props.voiceEndpoint, { method:'POST', body: fd })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const ct = (resp.headers.get('content-type') || '').toLowerCase()
    if (ct.includes('application/json')){
      pushAssistantFromData(await resp.json())
    } else {
      pushAssistantFromData({ [props.contentKey]: await resp.text() })
    }
  } catch(e){
    console.error(e)
    error.value = 'Voice upload failed.'
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

onMounted(scrollToBottom)
</script>

<style scoped>
/* 浮动入口按钮 */
.ai-fab{
  position:fixed; right:24px; bottom:24px; z-index:999;
  background:#2e7d32; color:#fff; border:none; border-radius:999px;
  padding:10px 16px; font-weight:800; box-shadow:0 8px 20px rgba(0,0,0,.12);
  cursor:pointer;
}
.ai-fab:hover{ background:#256628; }

/* 面板 */
.ai-chat-panel{
  position:fixed; right:24px; bottom:84px; width:380px; max-height:70vh;
  background:#fff; border:1px solid #e4efe1; border-radius:16px;
  box-shadow:0 12px 28px rgba(0,0,0,.16); display:flex; flex-direction:column; z-index:999;
}
.ai-chat-header{
  display:flex; justify-content:space-between; align-items:center;
  padding:10px 12px; background:#e8f6e3; color:#355f34; font-weight:900;
  border-top-left-radius:16px; border-top-right-radius:16px;
}
.ai-close{ border:none; background:transparent; font-size:16px; cursor:pointer; color:#466f45; }

.ai-chat-body{ padding:12px; overflow-y:auto; flex:1; background:#fafdf9; }
.ai-msg{ display:flex; margin-bottom:10px; }
.ai-msg.user{ justify-content:flex-end; }
.ai-msg.assistant{ justify-content:flex-start; }
.ai-bubble{ max-width:78%; padding:10px 12px; border-radius:12px; line-height:1.5; font-size:14px; border:1px solid #e5efe3; }
.ai-msg.user .ai-bubble{ background:#edfce0; color:#355f34; border-top-right-radius:6px; }
.ai-msg.assistant .ai-bubble{ background:#fff; color:#2f3d2c; border-top-left-radius:6px; }

/* ChatGPT风格输入条（固定在面板底部） */
.input-bar{
  display:grid; grid-template-columns:auto 1fr auto auto; align-items:center; gap:10px;
  background:#fff; border-top:1px solid #eef5ec; padding:10px 12px;
}
.text-input{
  width:100%; border:1px solid #e5e7eb; background:#fff; border-radius:999px;
  padding:10px 14px; outline:none; font-size:14px; color:#111827;
}
.icon-btn{
  border:none; background:#fff; color:#6b7280; width:36px; height:36px; border-radius:999px;
  display:grid; place-items:center; cursor:pointer;
}
.icon-btn:hover{ background:#f3f4f6; }
.icon-btn:disabled{ opacity:.6; cursor:not-allowed; }
.send{
  border:none; background:#2e7d32; color:#fff; font-weight:800; padding:10px 16px; border-radius:999px;
}
.send:disabled{ opacity:.6; cursor:not-allowed; }
.hidden{ display:none; }

.ai-hint{ font-size:11px; color:#6b7b67; padding:6px 12px 12px; }

/* loading 三点 */
.ai-loading-row{ display:flex; gap:6px; padding:6px 4px; }
.ai-dot{ width:6px; height:6px; border-radius:50%; background:#9bc285; animation:ai-blink 1s infinite ease-in-out; }
.ai-dot:nth-child(2){ animation-delay:.15s; }
.ai-dot:nth-child(3){ animation-delay:.3s; }
@keyframes ai-blink{ 0%,100%{ opacity:.2; transform:translateY(0);} 50%{ opacity:1; transform:translateY(-2px);} }

/* 代码高亮背景 */
:deep(.hljs){ background:#f6f8fa; padding:10px; border-radius:8px; }

.ai-error{ color:#b00020; font-size:12px; padding:4px 10px 10px; }
</style>
