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
      <button class="ai-close" @click="closePanel">✕</button>
    </header>

    <!-- 消息区 -->
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

    <!-- 统一输入栏（ChatGPT 风格） -->
    <form class="input-bar" @submit.prevent="sendText">
      <!-- 左：选择图片 -->
      <button type="button" class="icon-btn" aria-label="Attach image"
              @click="imagePicker?.click()" :disabled="loading">＋</button>
      <input ref="imagePicker" type="file" accept="image/*" class="hidden" @change="onPickImage" />

      <!-- 中：文本输入 -->
      <input v-model.trim="input" class="text-input" :placeholder="placeholder"
             :disabled="loading" @keydown.enter.exact.prevent="sendText" />

      <!-- 右：麦克风（点一下开始录音/再点停止并发送） -->
      <button type="button" class="icon-btn mic" :class="{ rec: isRecording }"
              aria-label="Record voice" @click="toggleRecording"
              :disabled="loading || (!isRecording && micBusy)"
              title="Tap to start/stop recording">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2Zm-5 7v2m-4 0h8"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <button class="send" type="submit" :disabled="loading || !input">Send</button>
    </form>

    <p v-if="hint" class="ai-hint">{{ hint }}</p>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

/* ---------- Markdown（放最上，避免 TDZ） ---------- */
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
const renderMD = (t)=>getMD().render(String(t||''))

/* ---------- Helpers (统一智能渲染) ---------- */
function tryParseJSON(x){
  if (x && typeof x === 'object') return x
  if (typeof x !== 'string') return null
  const s = x.trim()
  if (!s || (s[0] !== '{' && s[0] !== '[')) return null
  try { return JSON.parse(s) } catch { return null }
}
function formatPhotoPayload(p){
  if (!p || typeof p !== 'object') return null
  if (!('summary' in p) && !('keyword' in p) && !('recommendations' in p)) return null
  const keyword = p.keyword ?? '-'
  const summary = p.summary ?? '-'
  const list = Array.isArray(p.recommendations) ? p.recommendations : []
  const lines = list.map((it, i)=>{
    const name = it?.name ?? `Item ${i+1}`
    const features = it?.features ? String(it.features) : ''
    const shade = it?.shade ? ` _(shade: ${it.shade})_` : ''
    return `- **${name}** — ${features}${shade}`
  }).join('\n')
  return renderMD(`**Keyword:** ${keyword}\n\n**Summary:** ${summary}\n\n**Suggestions:**\n${lines || '- No items'}`)
}
function pushSmart(payload, { isPhoto=false } = {}){
  const maybeObj = tryParseJSON(payload) ?? payload
  if (isPhoto){
    const html = formatPhotoPayload(maybeObj)
    if (html){ msgs.value.push({ role:'assistant', text:'', html }); return }
  }
  const html = maybeObj?.[props.htmlKey]
  if (html){ msgs.value.push({ role:'assistant', text:'', html }); return }
  const txt = maybeObj?.[props.replyKey] ?? maybeObj?.[props.contentKey] ??
              (typeof maybeObj === 'string' ? maybeObj : JSON.stringify(maybeObj))
  msgs.value.push({ role:'assistant', text:'', html: renderMD(txt) })
}
function scrollToBottom(){ nextTick(()=>{ if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight }) }

/* ---------- Props ---------- */
const props = defineProps({
  title: { type: String, default: 'Ask-AI · Comfort Education' },
  btnText: { type: String, default: 'Ask-AI' },
  placeholder: { type: String, default: 'Ask anything' },
  hint: { type: String, default: '' },
  greeting: { type: String, default: "Hi! Ask me comfort & safety questions for Melbourne CBD." },

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
const imageFile = ref(null)

/* 录音相关 */
const isRecording = ref(false)
const micBusy = ref(false)
let mediaRecorder = null, mediaStream = null, chunks = []

/* ---------- Text ---------- */
async function sendText(){
  if (!input.value || loading.value) return
  error.value = ''
  const text = input.value; input.value = ''
  msgs.value.push({ role:'user', text, html:null })
  scrollToBottom()

  try{
    loading.value = true
    const resp = await fetch(props.textEndpoint, {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ message: text, prompt: text })
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const ct = (resp.headers.get('content-type') || '').toLowerCase()
    const data = ct.includes('application/json') ? await resp.json() : await resp.text()
    pushSmart(data)
  }catch(e){ console.error(e); error.value='Failed to get AI reply.' }
  finally{ loading.value=false; scrollToBottom() }
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
    const fd = new FormData(); fd.append('image', imageFile.value)
    const resp = await fetch(props.photoEndpoint, { method:'POST', body: fd })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const ct = (resp.headers.get('content-type') || '').toLowerCase()
    const data = ct.includes('application/json') ? await resp.json() : await resp.text()
    pushSmart(data, { isPhoto:true })
  }catch(e){ console.error(e); error.value='Photo upload failed.' }
  finally{ loading.value=false; scrollToBottom() }
}

/* ---------- Voice（点按录音） ---------- */
function cleanupStream(){
  if (mediaStream){ mediaStream.getTracks().forEach(t=>t.stop()); mediaStream = null }
  mediaRecorder = null; chunks = []
}
async function sendVoiceBlob(blob){
  error.value = ''
  msgs.value.push({ role:'user', text:'🎤 Voice message…', html:null })
  scrollToBottom()

  try{
    loading.value = true
    const ext = blob.type.includes('mp3') ? 'mp3' : blob.type.includes('ogg') ? 'ogg'
              : blob.type.includes('wav') ? 'wav' : 'webm'
    const fd = new FormData(); fd.append('audio', blob, `recording.${ext}`)
    const resp = await fetch(props.voiceEndpoint, { method:'POST', body: fd })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const ct = (resp.headers.get('content-type') || '').toLowerCase()
    const data = ct.includes('application/json') ? await resp.json() : await resp.text()
    pushSmart(data)
  }catch(e){ console.error(e); error.value='Voice send failed.' }
  finally{ loading.value=false; scrollToBottom() }
}
async function startRecording(){
  if (!navigator.mediaDevices?.getUserMedia){ error.value='This browser does not support microphone recording.'; return }
  try{
    micBusy.value = true
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio:true })
    chunks = []
    mediaRecorder = new MediaRecorder(mediaStream)
    mediaRecorder.ondataavailable = e => { if (e.data && e.data.size>0) chunks.push(e.data) }
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' })
      await sendVoiceBlob(blob)
      cleanupStream()
    }
    mediaRecorder.start()
    isRecording.value = true
  }catch(e){ console.error(e); error.value='Microphone permission denied.'; cleanupStream() }
  finally{ micBusy.value = false }
}
async function stopRecording(){
  try{ if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop() }
  finally{ isRecording.value = false }
}
async function toggleRecording(){
  if (loading.value) return
  if (isRecording.value) await stopRecording()
  else if (!micBusy.value) await startRecording()
}

/* ---------- Panel lifecycle ---------- */
function closePanel(){
  if (isRecording.value) stopRecording()
  open.value = false
}
function onVis(){ if (document.visibilityState==='hidden' && isRecording.value) stopRecording() }

onMounted(()=>{
  document.addEventListener('visibilitychange', onVis)
  scrollToBottom()
})
onBeforeUnmount(()=>{
  document.removeEventListener('visibilitychange', onVis)
  if (isRecording.value) stopRecording()
  cleanupStream()
})

/* 打开面板时滚到底部 */
watch(open, v => { if (v) scrollToBottom() })
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
/* 录音中效果 */
.icon-btn.mic.rec{
  color:#fff;
  background:#ef4444;
  animation:pulse 1s infinite;
}
@keyframes pulse{
  0%{ box-shadow:0 0 0 0 rgba(239,68,68,.45); }
  100%{ box-shadow:0 0 0 12px rgba(239,68,68,0); }
}
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

/* ===== Markdown 内容格式美化 ===== */
.ai-bubble :where(p, ul, ol, pre, blockquote, table){
  margin: 0.5rem 0;
  line-height: 1.6;
}

.ai-bubble :where(ul, ol){
  padding-left: 1.5rem;
  list-style-position: outside;
}

.ai-bubble ul { list-style-type: disc; }
.ai-bubble ul ul { list-style-type: circle; }
.ai-bubble ul ul ul { list-style-type: square; }

.ai-bubble ol { list-style-type: decimal; }
.ai-bubble ol ol { list-style-type: lower-alpha; }
.ai-bubble ol ol ol { list-style-type: lower-roman; }

.ai-bubble li {
  margin: 0.25rem 0;
}

.ai-bubble li > :where(p, ul, ol){
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
}

.ai-bubble pre {
  background: #f6f8fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 14px;
  overflow-x: auto;
}

.ai-bubble code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.92em;
  background: #f6f8fa;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 2px 4px;
}

.ai-bubble blockquote {
  border-left: 3px solid #d1e3d4;
  padding-left: 0.8rem;
  margin: 0.6rem 0;
  color: #47524b;
  background: #f8fbf7;
  border-radius: 6px;
}

</style>
