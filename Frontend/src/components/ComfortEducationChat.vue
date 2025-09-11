<template>
  <div class="comfort-education-chat">
    <div class="chat-header">
      <h2>🤖 AI Comfort Assistant</h2>
      <p class="chat-subtitle">Get instant answers to comfort and safety questions</p>
    </div>

    <div class="chat-container">
      <!-- Chat Messages -->
      <div class="chat-messages" ref="chatMessages">
        <div class="message bot-message">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <div class="message-text">
              Hi! I'm your AI Comfort Assistant. I can help you with questions about:
              <ul>
                <li>Heat safety for children</li>
                <li>Sun protection tips</li>
                <li>Recognizing warning signs</li>
                <li>Planning safe outdoor activities</li>
                <li>Emergency procedures</li>
              </ul>
              What would you like to know?
            </div>
            <div class="message-time">{{ getCurrentTime() }}</div>
          </div>
        </div>

        <div v-for="message in messages" :key="message.id" class="message" :class="message.type + '-message'">
          <div class="message-avatar">{{ message.type === 'user' ? '👤' : '🤖' }}</div>
          <div class="message-content">
            <div class="message-text" v-html="message.text"></div>
            <div class="message-time">{{ message.time }}</div>
          </div>
        </div>

        <div v-if="isTyping" class="message bot-message">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Questions -->
      <div class="quick-questions" v-if="messages.length === 0">
        <h4>💡 Quick Questions</h4>
        <div class="question-buttons">
          <button 
            v-for="question in quickQuestions" 
            :key="question"
            @click="askQuickQuestion(question)"
            class="quick-question-btn"
          >
            {{ question }}
          </button>
        </div>
      </div>

      <!-- Chat Input -->
      <div class="chat-input-container">
        <div class="chat-input">
          <input 
            v-model="userInput"
            @keyup.enter="sendMessage"
            placeholder="Ask me anything about child comfort and safety..."
            class="message-input"
            :disabled="isTyping"
          />
          <button 
            @click="sendMessage"
            :disabled="!userInput.trim() || isTyping"
            class="send-btn"
          >
            Send
          </button>
        </div>
        <div class="input-hints">
          <span>💡 Try: "What temperature is too hot for kids?" or "How do I prevent sunburn?"</span>
        </div>
      </div>
    </div>

    <!-- Knowledge Base -->
    <div class="knowledge-base">
      <h3>📚 Knowledge Base</h3>
      <div class="knowledge-categories">
        <div class="knowledge-category">
          <h4>🌡️ Temperature Safety</h4>
          <ul>
            <li>Safe temperature ranges for outdoor play</li>
            <li>Heat index calculations and warnings</li>
            <li>Cold weather protection guidelines</li>
          </ul>
        </div>
        
        <div class="knowledge-category">
          <h4>☀️ Sun Protection</h4>
          <ul>
            <li>UV index interpretation</li>
            <li>Sunscreen application and reapplication</li>
            <li>Clothing and hat recommendations</li>
          </ul>
        </div>
        
        <div class="knowledge-category">
          <h4>⚠️ Warning Signs</h4>
          <ul>
            <li>Heat exhaustion symptoms</li>
            <li>Heatstroke emergency signs</li>
            <li>Sunburn severity levels</li>
          </ul>
        </div>
        
        <div class="knowledge-category">
          <h4>🎒 Planning & Preparation</h4>
          <ul>
            <li>Essential items for outdoor activities</li>
            <li>Route planning for comfort</li>
            <li>Emergency contact information</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'

const messages = ref([])
const userInput = ref('')
const isTyping = ref(false)
const chatMessages = ref(null)

const quickQuestions = ref([
  'What temperature is too hot for kids?',
  'How often should I reapply sunscreen?',
  'What are signs of heat exhaustion?',
  'How much water should kids drink?',
  'What time is safest for outdoor play?',
  'How do I treat sunburn?'
])

const knowledgeBase = {
  temperature: {
    keywords: ['temperature', 'hot', 'cold', 'heat', 'weather'],
    responses: [
      'Children should avoid outdoor activities when temperatures reach 30°C (86°F) or higher, especially with high humidity.',
      'The heat index combines temperature and humidity. When it exceeds 32°C (90°F), children are at risk.',
      'In cold weather, children lose heat faster due to their larger head-to-body ratio. Layer clothing and limit time outdoors below 10°C (50°F).'
    ]
  },
  sunscreen: {
    keywords: ['sunscreen', 'spf', 'sun protection', 'uv'],
    responses: [
      'Use SPF 30+ sunscreen on all exposed skin. Reapply every 2 hours or immediately after swimming, sweating, or towel drying.',
      'Apply sunscreen 15-30 minutes before sun exposure. Use about 1 ounce (a shot glass full) for full body coverage.',
      'UV rays can penetrate clouds, so apply sunscreen even on overcast days. UV index 3+ requires protection.'
    ]
  },
  heatExhaustion: {
    keywords: ['heat exhaustion', 'heat stroke', 'symptoms', 'warning signs'],
    responses: [
      'Heat exhaustion signs: heavy sweating, cold/pale skin, fast weak pulse, nausea, muscle cramps, tiredness, dizziness.',
      'Heatstroke signs: high body temperature (40°C+), hot/dry skin, rapid strong pulse, throbbing headache, confusion, loss of consciousness.',
      'If you suspect heatstroke, call emergency services immediately. Move to shade, remove excess clothing, apply cool water.'
    ]
  },
  hydration: {
    keywords: ['water', 'hydration', 'drink', 'dehydration'],
    responses: [
      'Children should drink water every 15-20 minutes during outdoor activities. Pack extra water bottles.',
      'Signs of dehydration: extreme thirst, no urination for several hours, dry mouth, fatigue, dizziness.',
      'Avoid sugary drinks and caffeine. Water is best for hydration during outdoor activities.'
    ]
  },
  timing: {
    keywords: ['time', 'when', 'schedule', 'hours', 'morning', 'afternoon'],
    responses: [
      'The safest times for outdoor play are before 10 AM and after 4 PM when UV radiation and temperatures are lower.',
      'Avoid outdoor activities during peak heat hours (12 PM - 3 PM) when temperatures and UV radiation are highest.',
      'Plan activities around weather forecasts. Check heat index and UV index before heading out.'
    ]
  },
  sunburn: {
    keywords: ['sunburn', 'burn', 'red skin', 'treatment'],
    responses: [
      'For sunburn: apply cool compress, use aloe vera gel, give pain relief if needed, avoid further sun exposure.',
      'Severe sunburn with blisters, fever, or nausea requires medical attention. Keep child hydrated and comfortable.',
      'Prevention is key: use SPF 30+ sunscreen, seek shade, wear protective clothing, and avoid peak UV hours.'
    ]
  }
}

function getCurrentTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function askQuickQuestion(question) {
  userInput.value = question
  sendMessage()
}

async function sendMessage() {
  if (!userInput.value.trim() || isTyping.value) return

  const userMessage = {
    id: Date.now(),
    type: 'user',
    text: userInput.value,
    time: getCurrentTime()
  }

  messages.value.push(userMessage)
  const question = userInput.value.toLowerCase()
  userInput.value = ''
  isTyping.value = true

  // Scroll to bottom
  await nextTick()
  scrollToBottom()

  // Simulate typing delay
  setTimeout(() => {
    const response = generateResponse(question)
    const botMessage = {
      id: Date.now() + 1,
      type: 'bot',
      text: response,
      time: getCurrentTime()
    }
    
    messages.value.push(botMessage)
    isTyping.value = false
    
    nextTick(() => {
      scrollToBottom()
    })
  }, 1500)
}

function generateResponse(question) {
  // Find matching knowledge base category
  for (const [category, data] of Object.entries(knowledgeBase)) {
    if (data.keywords.some(keyword => question.includes(keyword))) {
      const randomResponse = data.responses[Math.floor(Math.random() * data.responses.length)]
      return randomResponse
    }
  }

  // Default responses for common questions
  if (question.includes('hello') || question.includes('hi')) {
    return 'Hello! I\'m here to help with any questions about child comfort and safety. What would you like to know?'
  }

  if (question.includes('thank')) {
    return 'You\'re welcome! Feel free to ask if you have any other questions about keeping your children safe and comfortable outdoors.'
  }

  if (question.includes('help')) {
    return 'I can help with questions about heat safety, sun protection, recognizing warning signs, planning outdoor activities, and emergency procedures. What specific topic interests you?'
  }

  // Fallback response
  return 'That\'s a great question! While I have extensive knowledge about child comfort and safety, I recommend consulting with healthcare professionals for specific medical concerns. For general safety questions, I\'m happy to help!'
}

function scrollToBottom() {
  if (chatMessages.value) {
    chatMessages.value.scrollTop = chatMessages.value.scrollHeight
  }
}

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
/* ============ KidPath 统一设计 token ============ */
.comfort-education-chat{
  --kp-green:#2e7d32;
  --kp-purple:#5e35b1;
  --kp-text:#2f3d4a;
  --kp-muted:#667085;
  --kp-border:rgba(0,0,0,.10);
  --kp-shadow:0 12px 30px rgba(0,0,0,.12);
  --kp-shadow-hover:0 18px 40px rgba(0,0,0,.16);
  font-family:'Segoe UI','Arial',sans-serif;
  color:var(--kp-text);
  max-width:1000px;
  margin:0 auto;
}

/* ============ 顶部 ============ */
.chat-header{
  text-align:center;
  margin:6px 0 22px;
}
.chat-header h2{
  margin:0 0 8px;
  font-weight:900;
  letter-spacing:.3px;
  font-size:clamp(22px,3.2vw,28px);
  color:#2e7d32;            
  text-shadow:0 4px 14px rgba(0,0,0,.08);
  background:none !important;
  -webkit-background-clip:initial !important;
  -webkit-text-fill-color:initial !important;
}

.chat-subtitle{
  margin:0 auto;
  max-width:700px;
  color:var(--kp-muted);
  font-size:1rem;
}

/* ============ 容器 ============ */
.chat-container{
  background:#fff;
  border:1px solid var(--kp-border);
  border-radius:16px;
  box-shadow:var(--kp-shadow);
  margin-bottom:28px;
  overflow:hidden;
}
.chat-messages{
  height:420px;
  overflow-y:auto;
  padding:18px;
  background:
    radial-gradient(1200px 300px at 50% -80px, rgba(94,53,177,.08), transparent 60%),
    linear-gradient(180deg,#ffffff 0%,#f7fbff 100%);
}

/* 滚动条（可选） */
.chat-messages::-webkit-scrollbar{ width:10px; }
.chat-messages::-webkit-scrollbar-thumb{
  background:rgba(0,0,0,.12); border-radius:999px;
}

/* ============ 消息 ============ */
.message{
  display:flex; gap:12px; align-items:flex-start;
  margin:0 0 16px;
}
.message-avatar{
  width:36px;height:36px;flex:0 0 36px;
  display:grid;place-items:center;
  border-radius:50%;
  background:linear-gradient(135deg,#ede7f6,#e8f5e9);
  color:var(--kp-purple);
  font-size:20px;
  box-shadow:0 10px 22px rgba(94,53,177,.18);
}
.bot-message .message-avatar{ color:var(--kp-purple); }
.user-message .message-avatar{ color:var(--kp-green); }

.message-content{ flex:1; max-width:82%; }

.message-text{
  background:#fff;
  border:1px solid var(--kp-border);
  border-radius:14px;
  padding:14px 16px;
  line-height:1.7;
  box-shadow:0 10px 22px rgba(0,0,0,.06);
}
.user-message .message-text{
  background:linear-gradient(180deg,#f7fcf8 0%,#ffffff 100%);
  border-color:rgba(46,125,50,.22);
}
.bot-message .message-text{
  background:linear-gradient(180deg,#ffffff 0%,#f9fbff 100%);
  border-color:rgba(94,53,177,.20);
}

.message-time{
  margin-top:6px; text-align:right;
  font-size:.86rem; color:#94a3b8;
}

/* 打字中... */
.typing-indicator{
  display:flex; gap:6px; align-items:center;
  border:1px solid var(--kp-border);
  border-radius:14px;
  padding:12px 14px;
  background:#fff;
  box-shadow:0 10px 22px rgba(0,0,0,.06);
}
.typing-indicator span{
  width:8px;height:8px;border-radius:50%;
  background:var(--kp-purple);
  animation:typing 1.2s infinite ease-in-out;
}
.typing-indicator span:nth-child(2){ animation-delay:.15s; }
.typing-indicator span:nth-child(3){ animation-delay:.3s; }
@keyframes typing{
  0%,60%,100%{ transform:translateY(0); opacity:.7; }
  30%{ transform:translateY(-8px); opacity:1; }
}

/* ============ Quick Questions ============ */
.quick-questions{
  padding:16px 18px;
  background:#fff;
  border-top:1px dashed var(--kp-border);
}
.quick-questions h4{
  margin:0 0 10px;
  font-weight:800; color:var(--kp-green);
  font-size:1rem;
}
.question-buttons{ display:flex; flex-wrap:wrap; gap:10px; }
.quick-question-btn{
  display:inline-flex; align-items:center; gap:6px;
  padding:10px 14px;
  border:1px solid var(--kp-border);
  border-radius:999px;
  background:#fff; color:var(--kp-text);
  font-weight:700; font-size:.95rem;
  box-shadow:0 8px 18px rgba(46,125,50,.08);
  transition:transform .15s ease, box-shadow .15s ease, border-color .15s ease;
  cursor:pointer; white-space:nowrap;
}
.quick-question-btn:hover{
  transform:translateY(-1px);
  border-color:#c9d7cc;
  box-shadow:var(--kp-shadow-hover);
}

/* ============ 输入区 ============ */
.chat-input-container{
  padding:16px 18px;
  background:#fff;
  border-top:1px solid var(--kp-border);
}
.chat-input{
  display:flex; gap:10px; align-items:center; margin-bottom:8px;
  border:1px solid var(--kp-border);
  border-radius:12px; padding:8px;
  background:#fff; box-shadow:0 10px 22px rgba(0,0,0,.06);
}
.message-input{
  flex:1; border:none; outline:none; background:transparent;
  font-size:1rem; font-family:inherit; color:var(--kp-text);
}
.message-input::placeholder{ color:#9aa6b2; }
.send-btn{
  background:linear-gradient(135deg,#e8f5e9,#ede7f6);
  color:var(--kp-purple);
  border:1px solid rgba(94,53,177,.2);
  border-radius:10px;
  font-weight:800; padding:10px 14px;
  transition:transform .12s ease, box-shadow .12s ease, opacity .12s ease;
}
.send-btn:hover:not(:disabled){
  transform:translateY(-1px);
  box-shadow:0 12px 26px rgba(94,53,177,.18);
}
.send-btn:disabled{ opacity:.5; cursor:not-allowed; }

.input-hints{
  text-align:center; color:var(--kp-muted); font-size:.9rem;
}

/* ============ 知识库 ============ */
.knowledge-base{
  background:#fff;
  border:1px solid var(--kp-border);
  border-radius:16px;
  box-shadow:var(--kp-shadow);
  padding:26px;
}
.knowledge-base h3{
  margin:0 0 18px; text-align:center;
  font-weight:900; color:var(--kp-purple);
  font-size:clamp(18px,2.6vw,22px);
}
.knowledge-categories{
  display:grid; gap:18px;
  grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
}
.knowledge-category{
  background:linear-gradient(180deg,#ffffff 0%,#f7fbff 100%);
  border:1px solid var(--kp-border);
  border-radius:14px;
  padding:16px 18px;
  box-shadow:0 10px 22px rgba(0,0,0,.06);
}
.knowledge-category h4{
  margin:0 0 8px; color:var(--kp-green);
  font-weight:800; font-size:1rem;
}
.knowledge-category ul{ margin:0; padding-left:18px; }
.knowledge-category li{
  line-height:1.7; color:var(--kp-text); font-size:.98rem;
}

/* ============ 响应式 ============ */
@media (max-width:768px){
  .chat-messages{ height:320px; }
  .message-content{ max-width:90%; }
  .question-buttons{ flex-direction:column; }
  .quick-question-btn{ white-space:normal; text-align:left; }
}
</style>
