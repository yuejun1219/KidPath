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
.comfort-education-chat {
  max-width: 1000px;
  margin: 0 auto;
}

.chat-header {
  text-align: center;
  margin-bottom: 30px;
}

.chat-header h2 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 15px;
}

.chat-subtitle {
  font-size: 1.1rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

.chat-container {
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  box-shadow: 5px 5px 0 #000;
  margin-bottom: 40px;
  overflow: hidden;
}

.chat-messages {
  height: 400px;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

.message {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 15px;
  flex-shrink: 0;
}

.bot-message .message-avatar {
  background: #00ff41;
  border: 2px solid #000;
}

.user-message .message-avatar {
  background: #007bff;
  border: 2px solid #000;
}

.message-content {
  flex: 1;
  max-width: 80%;
}

.message-text {
  background: white;
  border: 2px solid #000;
  padding: 15px;
  border-radius: 0;
  line-height: 1.4;
  box-shadow: 2px 2px 0 #000;
}

.user-message .message-text {
  background: #e3f2fd;
}

.message-time {
  font-size: 0.8rem;
  color: #666;
  margin-top: 5px;
  text-align: right;
}

.typing-indicator {
  display: flex;
  align-items: center;
  padding: 15px;
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  box-shadow: 2px 2px 0 #000;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00ff41;
  margin-right: 4px;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.quick-questions {
  padding: 20px;
  background: #f0f8ff;
  border-top: 2px solid #000;
}

.quick-questions h4 {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  color: #00ff41;
  margin-bottom: 15px;
}

.question-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-question-btn {
  background: #00ff41;
  color: #000;
  border: 2px solid #000;
  padding: 8px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  box-shadow: 2px 2px 0 #000;
  transition: all 0.1s;
  white-space: nowrap;
}

.quick-question-btn:hover {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #000;
}

.chat-input-container {
  padding: 20px;
  background: white;
  border-top: 2px solid #000;
}

.chat-input {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.message-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #000;
  border-radius: 0;
  font-size: 1rem;
  font-family: inherit;
}

.message-input:focus {
  outline: none;
  border-color: #00ff41;
  box-shadow: 0 0 0 2px rgba(0, 255, 65, 0.2);
}

.send-btn {
  background: #00ff41;
  color: #000;
  border: 2px solid #000;
  padding: 12px 20px;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
  cursor: pointer;
  box-shadow: 2px 2px 0 #000;
  transition: all 0.1s;
}

.send-btn:hover:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 #000;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: 2px 2px 0 #000;
}

.input-hints {
  font-size: 0.8rem;
  color: #666;
  text-align: center;
}

.knowledge-base {
  background: white;
  border: 3px solid #000;
  padding: 30px;
  box-shadow: 5px 5px 0 #000;
}

.knowledge-base h3 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 25px;
  text-align: center;
}

.knowledge-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
}

.knowledge-category {
  background: #f0f8ff;
  border: 2px solid #000;
  padding: 20px;
}

.knowledge-category h4 {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  color: #00ff41;
  margin-bottom: 15px;
}

.knowledge-category ul {
  margin: 0;
  padding-left: 20px;
}

.knowledge-category li {
  margin-bottom: 8px;
  line-height: 1.4;
  font-size: 0.9rem;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .chat-messages {
    height: 300px;
  }
  
  .message-content {
    max-width: 90%;
  }
  
  .question-buttons {
    flex-direction: column;
  }
  
  .quick-question-btn {
    white-space: normal;
    text-align: left;
  }
  
  .knowledge-categories {
    grid-template-columns: 1fr;
  }
  
  .chat-header h2 {
    font-size: 1.2rem;
  }
}
</style>
