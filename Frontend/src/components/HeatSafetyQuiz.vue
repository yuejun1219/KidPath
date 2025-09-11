<template>
  <div class="heat-safety-quiz">
    <div class="quiz-header">
      <h2>🧠 Heat Safety Quiz for Parents</h2>
      <p class="quiz-subtitle">Test your knowledge and identify safety blind spots for summer outings</p>
    </div>

    <div v-if="!quizStarted" class="quiz-intro">
      <div class="intro-card">
        <h3>Ready to Test Your Knowledge?</h3>
        <p>This quiz will help you identify any safety blind spots when planning summer outings with your children.</p>
        <div class="quiz-stats">
          <div class="stat">
            <span class="stat-number">{{ questions.length }}</span>
            <span class="stat-label">Questions</span>
          </div>
          <div class="stat">
            <span class="stat-number">5</span>
            <span class="stat-label">Minutes</span>
          </div>
          <div class="stat">
            <span class="stat-number">100%</span>
            <span class="stat-label">Free</span>
          </div>
        </div>
        <button @click="startQuiz" class="start-btn">Start Quiz</button>
      </div>
    </div>

    <div v-else-if="currentQuestionIndex < questions.length" class="quiz-content">
      <div class="quiz-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        <p>Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}</p>
      </div>

      <div class="question-card">
        <div class="question-header">
          <div class="question-icon">{{ questions[currentQuestionIndex].icon }}</div>
          <h3>{{ questions[currentQuestionIndex].question }}</h3>
        </div>
        
        <div class="options">
          <label 
            v-for="(option, index) in questions[currentQuestionIndex].options" 
            :key="index"
            class="option"
            :class="{ 'selected': selectedAnswer === index }"
          >
            <input 
              type="radio" 
              :name="'question-' + currentQuestionIndex"
              :value="index"
              v-model="selectedAnswer"
            />
            <span class="option-text">{{ option.text }}</span>
          </label>
        </div>

        <div class="question-actions">
          <button 
            @click="nextQuestion" 
            :disabled="selectedAnswer === null"
            class="next-btn"
          >
            {{ currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question' }}
          </button>
        </div>
      </div>
    </div>

    <div v-else class="quiz-results">
      <div class="results-card">
        <div class="results-header">
          <div class="score-circle" :class="scoreClass">
            <span class="score-number">{{ Math.round((correctAnswers / questions.length) * 100) }}%</span>
            <span class="score-label">Score</span>
          </div>
          <h3>{{ getScoreMessage() }}</h3>
        </div>

        <div class="results-breakdown">
          <div class="breakdown-item">
            <span class="breakdown-label">Correct Answers:</span>
            <span class="breakdown-value">{{ correctAnswers }}/{{ questions.length }}</span>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">Safety Level:</span>
            <span class="breakdown-value" :class="scoreClass">{{ getSafetyLevel() }}</span>
          </div>
        </div>

        <div class="improvement-tips" v-if="correctAnswers < questions.length">
          <h4>🎯 Areas for Improvement:</h4>
          <ul>
            <li v-for="tip in getImprovementTips()" :key="tip">{{ tip }}</li>
          </ul>
        </div>

        <div class="results-actions">
          <button @click="retakeQuiz" class="retake-btn">Retake Quiz</button>
          <button @click="viewDetailedResults" class="details-btn">View Detailed Results</button>
        </div>
      </div>

      <div v-if="showDetailedResults" class="detailed-results">
        <h4>📋 Detailed Results</h4>
        <div class="result-items">
          <div 
            v-for="(question, index) in questions" 
            :key="index"
            class="result-item"
            :class="{ 'correct': userAnswers[index] === question.correctAnswer, 'incorrect': userAnswers[index] !== question.correctAnswer }"
          >
            <div class="result-question">
              <span class="result-icon">{{ question.icon }}</span>
              <span class="result-text">{{ question.question }}</span>
            </div>
            <div class="result-answer">
              <span class="answer-label">Your Answer:</span>
              <span class="answer-text">{{ question.options[userAnswers[index]]?.text }}</span>
            </div>
            <div class="result-explanation">
              <span class="explanation-label">Explanation:</span>
              <span class="explanation-text">{{ question.explanation }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const quizStarted = ref(false)
const currentQuestionIndex = ref(0)
const selectedAnswer = ref(null)
const userAnswers = ref([])
const showDetailedResults = ref(false)

const questions = ref([
  {
    icon: '🌡️',
    question: 'At what temperature should you avoid outdoor activities with children?',
    options: [
      { text: '25°C (77°F)' },
      { text: '30°C (86°F)' },
      { text: '35°C (95°F)' },
      { text: '40°C (104°F)' }
    ],
    correctAnswer: 1,
    explanation: 'Children should avoid strenuous outdoor activities when temperatures reach 30°C (86°F) or higher, especially with high humidity.'
  },
  {
    icon: '⏰',
    question: 'What are the safest times for outdoor play in summer?',
    options: [
      { text: '10 AM - 2 PM' },
      { text: '12 PM - 4 PM' },
      { text: 'Before 10 AM and after 4 PM' },
      { text: 'Any time with sunscreen' }
    ],
    correctAnswer: 2,
    explanation: 'The safest times are before 10 AM and after 4 PM when UV radiation and temperatures are lower.'
  },
  {
    icon: '💧',
    question: 'How often should children drink water during outdoor play?',
    options: [
      { text: 'Only when thirsty' },
      { text: 'Every 30 minutes' },
      { text: 'Every 15-20 minutes' },
      { text: 'Once per hour' }
    ],
    correctAnswer: 2,
    explanation: 'Children should drink water every 15-20 minutes during outdoor activities to prevent dehydration.'
  },
  {
    icon: '🧴',
    question: 'How often should sunscreen be reapplied?',
    options: [
      { text: 'Once in the morning' },
      { text: 'Every 4 hours' },
      { text: 'Every 2 hours or after swimming' },
      { text: 'Only on sunny days' }
    ],
    correctAnswer: 2,
    explanation: 'Sunscreen should be reapplied every 2 hours or immediately after swimming, sweating, or towel drying.'
  },
  {
    icon: '👕',
    question: 'What clothing is best for hot weather?',
    options: [
      { text: 'Dark colors to absorb heat' },
      { text: 'Light, loose-fitting, light-colored clothing' },
      { text: 'Heavy cotton layers' },
      { text: 'Synthetic materials' }
    ],
    correctAnswer: 1,
    explanation: 'Light, loose-fitting, light-colored clothing helps reflect heat and allows air circulation.'
  },
  {
    icon: '⚠️',
    question: 'What is the first sign of heat exhaustion in children?',
    options: [
      { text: 'High fever' },
      { text: 'Excessive sweating and fatigue' },
      { text: 'Loss of consciousness' },
      { text: 'Blue lips' }
    ],
    correctAnswer: 1,
    explanation: 'Excessive sweating, fatigue, and feeling weak are early signs of heat exhaustion that require immediate attention.'
  },
  {
    icon: '🏃',
    question: 'What should you do if a child shows signs of heat exhaustion?',
    options: [
      { text: 'Continue playing to build tolerance' },
      { text: 'Move to shade, give water, and rest' },
      { text: 'Wait and see if symptoms improve' },
      { text: 'Give them ice cream to cool down' }
    ],
    correctAnswer: 1,
    explanation: 'Immediately move the child to shade, provide water, and have them rest. Seek medical help if symptoms worsen.'
  },
  {
    icon: '🎒',
    question: 'What should you always pack for outdoor activities?',
    options: [
      { text: 'Extra toys' },
      { text: 'Water, sunscreen, hat, and first aid kit' },
      { text: 'Electronics for entertainment' },
      { text: 'Heavy blankets' }
    ],
    correctAnswer: 1,
    explanation: 'Essential items include water, sunscreen, hats, and a basic first aid kit for outdoor safety.'
  }
])

const progressPercentage = computed(() => {
  return ((currentQuestionIndex.value + 1) / questions.value.length) * 100
})

const correctAnswers = computed(() => {
  return userAnswers.value.filter((answer, index) => answer === questions.value[index].correctAnswer).length
})

const scoreClass = computed(() => {
  const percentage = (correctAnswers.value / questions.value.length) * 100
  if (percentage >= 80) return 'excellent'
  if (percentage >= 60) return 'good'
  if (percentage >= 40) return 'fair'
  return 'needs-improvement'
})

function startQuiz() {
  quizStarted.value = true
  currentQuestionIndex.value = 0
  selectedAnswer.value = null
  userAnswers.value = []
  showDetailedResults.value = false
}

function nextQuestion() {
  if (selectedAnswer.value !== null) {
    userAnswers.value.push(selectedAnswer.value)
    
    if (currentQuestionIndex.value < questions.value.length - 1) {
      currentQuestionIndex.value++
      selectedAnswer.value = null
    } else {
      // Quiz completed - increment to show results
      currentQuestionIndex.value++
    }
  }
}

function retakeQuiz() {
  startQuiz()
}

function viewDetailedResults() {
  showDetailedResults.value = !showDetailedResults.value
}

function getScoreMessage() {
  const percentage = (correctAnswers.value / questions.value.length) * 100
  if (percentage >= 80) return 'Excellent! You\'re well-prepared for summer safety!'
  if (percentage >= 60) return 'Good job! You have solid safety knowledge with room for improvement.'
  if (percentage >= 40) return 'Fair knowledge. Consider reviewing heat safety guidelines.'
  return 'Needs improvement. Please review the safety tips and retake the quiz.'
}

function getSafetyLevel() {
  const percentage = (correctAnswers.value / questions.value.length) * 100
  if (percentage >= 80) return 'High'
  if (percentage >= 60) return 'Good'
  if (percentage >= 40) return 'Moderate'
  return 'Low'
}

function getImprovementTips() {
  const tips = []
  const percentage = (correctAnswers.value / questions.value.length) * 100
  
  if (percentage < 80) {
    tips.push('Review the Parent Tips section for detailed safety information')
    tips.push('Plan outdoor activities during cooler hours (before 10 AM, after 4 PM)')
    tips.push('Always pack water, sunscreen, and hats for outdoor activities')
    tips.push('Learn to recognize early signs of heat exhaustion')
  }
  
  return tips
}
</script>

<style scoped>
/* ========= KidPath tokens ========= */
.heat-safety-quiz{
  --kp-green:#2e7d32;
  --kp-purple:#5e35b1;
  --kp-text:#2f3d4a;
  --kp-muted:#667085;
  --kp-border:rgba(0,0,0,.08);
  --kp-shadow:0 10px 28px rgba(0,0,0,.12);
  --kp-shadow-hover:0 16px 36px rgba(0,0,0,.16);
  max-width:880px;
  margin:0 auto;
  font-family:'Segoe UI','Arial',sans-serif;
  color:var(--kp-text);
}

/* ========= Header ========= */
.quiz-header{
  text-align:center;
  margin:16px auto 28px;
  padding:0 16px;
}
.quiz-header h2{
  font-weight:800;
  font-size:clamp(22px,3.2vw,34px);
  color:var(--kp-green);
  letter-spacing:.3px;
  margin-bottom:8px;
}
.quiz-subtitle{
  font-size:1.05rem;
  color:var(--kp-muted);
  max-width:720px;
  margin:0 auto;
  line-height:1.7;
}

/* ========= Intro card ========= */
.quiz-intro{ display:flex; justify-content:center; padding:0 16px; }
.intro-card{
  background:#fff;
  border:1px solid var(--kp-border);
  border-radius:18px;
  padding:28px 26px;
  text-align:center;
  box-shadow:var(--kp-shadow);
  max-width:560px;
}
.intro-card h3{
  margin:0 0 10px;
  font-weight:800;
  color:var(--kp-green);
  font-size:1.25rem;
}
.quiz-stats{
  display:flex; gap:18px; justify-content:center; margin:18px 0 22px;
}
.stat{text-align:center; min-width:110px;}
.stat-number{
  display:block; font-weight:800; font-size:1.4rem; color:var(--kp-purple);
}
.stat-label{ color:var(--kp-muted); font-size:.95rem; }

.start-btn{
  appearance:none;
  background:#fff;
  color:var(--kp-green);
  border:1px solid var(--kp-green);
  border-radius:12px;
  padding:12px 20px;
  font-weight:700;
  cursor:pointer;
  transition:all .18s ease;
  box-shadow:0 6px 18px rgba(46,125,50,.15);
}
.start-btn:hover{ background:rgba(46,125,50,.06); transform:translateY(-1px); }
.start-btn:focus-visible{ outline:3px solid rgba(94,53,177,.25); outline-offset:2px; }

/* ========= Progress ========= */
.quiz-progress{ margin:0 16px 16px; }
.progress-bar{
  width:100%; height:12px;
  background:#eef2ff;
  border-radius:999px;
  overflow:hidden;
  box-shadow:inset 0 1px 2px rgba(0,0,0,.06);
}
.progress-fill{
  height:100%;
  background:linear-gradient(90deg,var(--kp-purple),var(--kp-green));
  border-radius:999px;
  transition:width .3s ease;
}
.quiz-progress p{
  margin:.5rem 0 0; color:var(--kp-muted); font-size:.95rem; text-align:right;
}

/* ========= Question card ========= */
.question-card{
  background:#fff;
  border:1px solid var(--kp-border);
  border-radius:18px;
  padding:22px 20px;
  margin:0 16px 24px;
  box-shadow:var(--kp-shadow);
}
.question-header{
  display:flex; align-items:flex-start; gap:12px; margin-bottom:14px;
}
.question-icon{
  width:42px; height:42px; display:grid; place-items:center;
  border-radius:50%;
  background:linear-gradient(135deg,#ede7f6,#f3e5f5);
  color:var(--kp-purple);
  box-shadow:0 4px 12px rgba(94,53,177,.18);
  font-size:22px;
  flex:0 0 auto;
}
.question-header h3{
  margin:2px 0 0; font-weight:700; font-size:1.15rem; color:var(--kp-text);
  line-height:1.5;
}

/* ========= Options ========= */
.options{ margin-top:6px; }
.option{
  display:flex; align-items:center; gap:12px;
  padding:14px 14px;
  margin-bottom:10px;
  border:1px solid var(--kp-border);
  border-radius:14px;
  background:#fff;
  cursor:pointer;
  transition:all .18s ease;
  box-shadow:0 6px 18px rgba(0,0,0,.06);
}
.option:hover{ background:rgba(94,53,177,.06); }
.option.selected{
  border-color:var(--kp-purple);
  background:linear-gradient(135deg,#f6f1ff,#eef9f0);
  box-shadow:0 10px 24px rgba(94,53,177,.18);
}
.option input[type="radio"]{
  width:18px; height:18px; accent-color:var(--kp-purple); flex:0 0 auto;
}
.option-text{ font-size:1.05rem; line-height:1.6; color:var(--kp-text); }

/* ========= Navigation buttons ========= */
.question-actions{ display:flex; justify-content:flex-end; margin-top:6px; }
.next-btn{
  appearance:none;
  background:#fff;
  color:var(--kp-purple);
  border:1px solid var(--kp-purple);
  border-radius:12px;
  padding:10px 18px;
  font-weight:700;
  cursor:pointer;
  transition:all .18s ease;
  box-shadow:0 6px 18px rgba(94,53,177,.18);
}
.next-btn:hover:not(:disabled){ background:rgba(94,53,177,.07); transform:translateY(-1px); }
.next-btn:disabled{
  color:#9aa4b2; border-color:var(--kp-border); background:#f6f7f9; cursor:not-allowed; box-shadow:none;
}
.next-btn:focus-visible{ outline:3px solid rgba(94,53,177,.25); outline-offset:2px; }

/* ========= Results ========= */
.results-card{
  background:#fff;
  border:1px solid var(--kp-border);
  border-radius:18px;
  padding:26px 22px;
  text-align:center;
  box-shadow:var(--kp-shadow);
  margin:0 16px 20px;
}
.results-header{ margin-bottom:16px; }

.score-circle{
  width:130px; height:130px; border-radius:50%;
  margin:0 auto 12px; display:grid; place-items:center;
  border:6px solid transparent;
  background:#f6f7f9;
}
.score-circle.excellent{ border-color:#a5d6a7; background:#e8f5e9; }
.score-circle.good{ border-color:#ffe082; background:#fff8e1; }
.score-circle.fair{ border-color:#ffcc80; background:#fff3e0; }
.score-circle.needs-improvement{ border-color:#ef9a9a; background:#ffebee; }

.score-number{ font-size:1.6rem; font-weight:800; color:var(--kp-text); }
.score-label{ font-size:.85rem; color:var(--kp-muted); }

.results-breakdown{
  display:flex; justify-content:center; gap:24px; margin:12px 0 8px;
}
.breakdown-item{text-align:center;}
.breakdown-label{ display:block; color:var(--kp-muted); margin-bottom:4px; }
.breakdown-value{ font-weight:800; }
.breakdown-value.excellent{ color:var(--kp-green); }
.breakdown-value.good{ color:#7cb342; }
.breakdown-value.fair{ color:#f57c00; }
.breakdown-value.needs-improvement{ color:#d32f2f; }

/* Improvement tips */
.improvement-tips{
  text-align:left;
  background:#f7f6ff;
  border:1px solid rgba(94,53,177,.18);
  border-radius:14px;
  padding:16px;
  margin:14px 16px;
}
.improvement-tips h4{
  margin:0 0 8px; color:var(--kp-purple); font-weight:800; font-size:1rem;
}
.improvement-tips li{ line-height:1.6; margin:6px 0; }

/* Results actions */
.results-actions{
  display:flex; gap:12px; justify-content:center; margin-top:10px;
}
.retake-btn,.details-btn{
  appearance:none;
  background:#fff;
  border:1px solid var(--kp-green);
  color:var(--kp-green);
  border-radius:12px;
  padding:10px 16px;
  font-weight:700;
  cursor:pointer;
  transition:all .18s ease;
  box-shadow:0 6px 18px rgba(46,125,50,.15);
}
.retake-btn:hover,.details-btn:hover{ background:rgba(46,125,50,.08); transform:translateY(-1px); }

/* ========= Detailed results ========= */
.detailed-results{
  background:#fff;
  border:1px solid var(--kp-border);
  border-radius:18px;
  padding:22px 20px;
  box-shadow:var(--kp-shadow);
  margin:16px 16px 26px;
}
.detailed-results h4{
  margin:0 0 12px; color:var(--kp-green); font-weight:800; font-size:1.1rem;
}
.result-items{ display:flex; flex-direction:column; gap:12px; }
.result-item{
  border:1px solid var(--kp-border);
  border-left:6px solid transparent;
  border-radius:14px;
  padding:14px;
  background:#fff;
  box-shadow:0 6px 18px rgba(0,0,0,.06);
}
.result-item.correct{ border-left-color:var(--kp-green); background:#f4fbf5; }
.result-item.incorrect{ border-left-color:#d32f2f; background:#fff5f5; }

.result-question{ display:flex; gap:10px; align-items:center; margin-bottom:8px; }
.result-icon{ font-size:20px; }
.result-text{ font-weight:700; color:var(--kp-text); }
.result-answer,.result-explanation{ margin:4px 0; }
.answer-label,.explanation-label{ font-weight:700; color:var(--kp-muted); margin-right:6px; }
.answer-text,.explanation-text{ color:var(--kp-text); line-height:1.6; }

/* ========= Responsive ========= */
@media (max-width:768px){
  .quiz-stats{ flex-direction:column; }
  .results-breakdown{ flex-direction:column; gap:10px; }
  .results-actions{ flex-direction:column; }
  .question-header{ flex-direction:column; }
  .question-icon{ margin-bottom:6px; }
}
</style>
