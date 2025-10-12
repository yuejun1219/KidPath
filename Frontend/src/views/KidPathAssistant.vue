<!-- src/views/KidPathAssistant.vue -->
<template>
  <div class="assistant-page">
    <header class="assistant-header">
      <h1>KidPath Assistant</h1>
      <p class="sub">Ask comfort & safety questions for Melbourne CBD. Text, image, or voice — all here.</p>
    </header>

    <main class="chat-main" ref="scrollEl">
      <div v-for="(m, i) in msgs" :key="i" class="msg-row" :class="m.role">
        <div class="bubble">
          <div v-if="m.html" v-html="m.html"></div>
          <div v-else>{{ m.text }}</div>
        </div>
      </div>

      <div v-if="loading" class="loading-dots">
        <span></span><span></span><span></span>
      </div>

      <div v-if="error" class="err">{{ error }}</div>
    </main>

    <!-- ChatGPT 风格输入栏 -->
    <form class="input-bar" @submit.prevent="sendText">
      <button type="button" class="icon-btn" aria-label="Attach image" @click="imagePicker?.click()" :disabled="loading">＋</button>
      <input ref="imagePicker" type="file" accept="image/*" class="hidden" @change="onPickImage" />

      <input v-model.trim="input" class="text-input" :placeholder="placeholder" :disabled="loading" @keydown.enter.exact.prevent="sendText" />

      <button type="button" class="icon-btn mic" :class="{ rec: isRecording }" aria-label="Record voice"
              @click="toggleRecording" :disabled="loading || (micBusy && !isRecording)" title="Tap to start/stop recording">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2Zm-5 7v2m-4 0h8"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <button class="send" type="submit" :disabled="loading || !input">Send</button>
    </form>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

/** -------- env & endpoints -------- */
const API_BASE = import.meta.env.VITE_API_BASE || ''
const TEXT_URL  = `${API_BASE}/ai/text`
const VOICE_URL = `${API_BASE}/ai/voice`
const PHOTO_URL = `${API_BASE}/ai/photo`

/** -------- Markdown -------- */
let _md
function getMD () {
  if (_md) return _md
  _md = new MarkdownIt({
    html: false, linkify: true, breaks: true,
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try { return `<pre class="hljs"><code>${hljs.highlight(code, { language: lang }).value}</code></pre>` } catch {}
      }
      const esc = MarkdownIt().utils.escapeHtml(code)
      return `<pre class="hljs"><code>${esc}</code></pre>`
    }
  })
  return _md
}
const renderMD = (t)=>getMD().render(String(t||''))

/** -------- UI / state -------- */
const placeholder = 'Ask anything'
const greeting = "Hi! Ask me comfort & safety questions for Melbourne CBD."

const input = ref('')
const loading = ref(false)
const error = ref('')
const msgs = ref([{ role: 'assistant', text: greeting, html: null }])
const scrollEl = ref(null)
const imagePicker = ref(null)
const imageFile = ref(null)

/** -------- audio record state -------- */
const isRecording = ref(false)
const micBusy = ref(false)
let mediaRecorder = null, mediaStream = null, chunks = []

/** -------- utils -------- */
function scrollToBottom(){ nextTick(() => { if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight }) }
function tryParseJSON(x){
  if (x && typeof x === 'object') return x
  if (typeof x !== 'string') return null
  const s = x.trim()
  if (!s || (s[0] !== '{' && s[0] !== '[')) return null
  try { return JSON.parse(s) } catch { return null }
}
function formatPhotoPayload(p){
  // 只要有 keyword / summary / recommendations 就格式化
  if (!p || (typeof p !== 'object')) return null
  if (!('summary' in p) && !('keyword' in p) && !('recommendations' in p)) return null
  const keyword = p.keyword ?? '-'
  const summary = p.summary ?? '-'
  const list = Array.isArray(p.recommendations) ? p.recommendations : []
  const lines = list.map((it, idx) => {
    const name = it?.name ?? `Item ${idx+1}`
    const features = it?.features ? String(it.features) : ''
    const shade = it?.shade ? ` _(shade: ${it.shade})_` : ''
    return `- **${name}** — ${features}${shade}`
  }).join('\n')
  return renderMD(`**Keyword:** ${keyword}\n\n**Summary:** ${summary}\n\n**Suggestions:**\n${lines || '- No items'}`)
}
function pushSmart(payload, { isPhoto = false } = {}){
  // 1) 优先把照片分析结构格式化
  const maybeObj = tryParseJSON(payload) ?? payload
  const photoHtml = formatPhotoPayload(maybeObj)
  if (isPhoto && photoHtml){
    msgs.value.push({ role:'assistant', text:'', html: photoHtml }); return
  }
  // 2) 后端直接返回 html 字段
  const html = maybeObj?.html
  if (html){ msgs.value.push({ role:'assistant', text:'', html }); return }
  // 3) 常规 reply/content
  const txt = maybeObj?.reply ?? maybeObj?.content ?? (typeof maybeObj === 'string' ? maybeObj : JSON.stringify(maybeObj))
  msgs.value.push({ role:'assistant', text:'', html: renderMD(txt) })
}

/** -------- text -------- */
async function sendText(){
  if (!input.value || loading.value) return
  error.value = ''
  const text = input.value; input.value = ''
  msgs.value.push({ role:'user', text, html:null })
  scrollToBottom()
  try{
    loading.value = true
    const resp = await fetch(TEXT_URL, {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ message: text, prompt: text })
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const ct = (resp.headers.get('content-type') || '').toLowerCase()
    const data = ct.includes('application/json') ? await resp.json() : await resp.text()
    pushSmart(data)  // 普通文本不做 photo 特殊格式化
  }catch(e){ console.error(e); error.value='Failed to get AI reply.' }
  finally{ loading.value=false; scrollToBottom() }
}

/** -------- image -------- */
function onPickImage(e){ imageFile.value = e.target.files?.[0] || null; if (imageFile.value) sendPhoto() }
async function sendPhoto(){
  if (!imageFile.value || loading.value) return
  error.value = ''
  msgs.value.push({ role:'user', text:'🖼️ Sent a photo…', html:null })
  scrollToBottom()
  try{
    loading.value = true
    const fd = new FormData(); fd.append('image', imageFile.value)
    const resp = await fetch(PHOTO_URL, { method:'POST', body: fd })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const ct = (resp.headers.get('content-type') || '').toLowerCase()
    const data = ct.includes('application/json') ? await resp.json() : await resp.text()
    // ✅ 无论 content-type，统一走智能格式化
    pushSmart(data, { isPhoto: true })
  }catch(e){ console.error(e); error.value='Photo upload failed.' }
  finally{ loading.value=false; scrollToBottom() }
}

/** -------- audio (click-to-record) -------- */
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
    const ext = blob.type.includes('mp3') ? 'mp3' : blob.type.includes('ogg') ? 'ogg' : blob.type.includes('wav') ? 'wav' : 'webm'
    const fd = new FormData(); fd.append('audio', blob, `recording.${ext}`)
    const resp = await fetch(VOICE_URL, { method:'POST', body: fd })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const ct = (resp.headers.get('content-type') || '').toLowerCase()
    const data = ct.includes('application/json') ? await resp.json() : await resp.text()
    pushSmart(data) // 语音回包按普通文本渲染
  }catch(e){ console.error(e); error.value='Voice send failed.' }
  finally{ loading.value=false; scrollToBottom() }
}
async function startRecording(){
  if (!navigator.mediaDevices?.getUserMedia){ error.value='This browser does not support microphone recording.'; return }
  try{
    micBusy.value = true
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    chunks = []
    mediaRecorder = new MediaRecorder(mediaStream)
    mediaRecorder.ondataavailable = e => { if (e.data && e.data.size>0) chunks.push(e.data) }
    mediaRecorder.onstop = async () => { const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' }); await sendVoiceBlob(blob); cleanupStream() }
    mediaRecorder.start()
    isRecording.value = true
    micBusy.value = false
  }catch(e){ console.error(e); error.value='Microphone permission denied.'; cleanupStream(); micBusy.value=false }
}
async function stopRecording(){ try{ if (mediaRecorder && mediaRecorder.state!=='inactive') mediaRecorder.stop() } finally{ isRecording.value=false } }
async function toggleRecording(){
  if (loading.value) return
  if (!isRecording.value && micBusy.value) return
  isRecording.value ? await stopRecording() : await startRecording()
}

/** -------- lifecycle -------- */
function onVis(){ if (document.visibilityState==='hidden' && isRecording.value) stopRecording() }
onMounted(() => {
  document.addEventListener('visibilitychange', onVis)
  msgs.value[0] = { role:'assistant', text:'', html: renderMD(greeting) }
  scrollToBottom()
})
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVis)
  if (isRecording.value) stopRecording()
  cleanupStream()
})
</script>

<style scoped>
/* page */
.assistant-page{ min-height:100vh; background: linear-gradient(180deg,#f8faf8 0%,#e8f5e8 100%); display:flex; flex-direction:column; }
.assistant-header{ max-width:980px; margin:28px auto 12px; padding:0 16px; }
.assistant-header h1{ margin:0; font-size:28px; font-weight:900; color:#1b5e20; }
.assistant-header .sub{ margin:6px 0 0; color:#5a6b60; }

/* chat */
.chat-main{ flex:1; max-width:980px; width:100%; margin:0 auto; padding:12px 16px 90px; overflow-y:auto; }
.msg-row{ display:flex; margin:10px 0; }
.msg-row.user{ justify-content:flex-end; }
.msg-row.assistant{ justify-content:flex-start; }
.bubble{ max-width:min(80%,720px); border:1px solid #e6efe3; border-radius:14px; padding:10px 12px; line-height:1.55; font-size:15px; background:#fff; }
.msg-row.user .bubble{ background:#edfce0; color:#355f34; border-top-right-radius:6px; }
.msg-row.assistant .bubble{ background:#fff; color:#2f3d2c; border-top-left-radius:6px; }
:deep(.hljs){ background:#f6f8fa; padding:10px; border-radius:8px; }

/* loading dots */
.loading-dots{ display:flex; gap:6px; padding:6px 2px; }
.loading-dots span{ width:6px; height:6px; border-radius:50%; background:#9bc285; animation:b 1s infinite ease-in-out; }
.loading-dots span:nth-child(2){ animation-delay:.15s; }
.loading-dots span:nth-child(3){ animation-delay:.3s; }
@keyframes b{ 0%,100%{opacity:.2; transform:translateY(0)} 50%{opacity:1; transform:translateY(-2px)} }
.err{ color:#b00020; font-size:12px; margin:4px 0; }

/* input bar */
.input-bar{
  position:fixed; left:50%; transform:translateX(-50%);
  bottom:18px; width:min(980px, calc(100% - 24px));
  display:grid; grid-template-columns:auto 1fr auto auto; align-items:center; gap:10px;
  background:#fff; border:1px solid #e5e7eb; border-radius:999px; padding:10px 12px;
  box-shadow:0 10px 24px rgba(0,0,0,.06);
}
.text-input{ width:100%; border:none; outline:none; font-size:16px; padding:6px 2px; color:#111827; }
.icon-btn{ border:none; background:#fff; color:#6b7280; width:36px; height:36px; border-radius:999px; display:grid; place-items:center; cursor:pointer; }
.icon-btn:hover{ background:#f3f4f6; }
.icon-btn:disabled{ opacity:.6; cursor:not-allowed; }
.icon-btn.mic.rec{ color:#fff; background:#ef4444; animation:pulse 1s infinite; }
@keyframes pulse{ 0%{ box-shadow:0 0 0 0 rgba(239,68,68,.45);} 100%{ box-shadow:0 0 0 12px rgba(239,68,68,0);} }
.send{ border:none; background:#2e7d32; color:#fff; font-weight:800; padding:10px 16px; border-radius:999px; }
.send:disabled{ opacity:.6; cursor:not-allowed; }
.hidden{ display:none; }
</style>
