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
.heat-safety-quiz {
  max-width: 800px;
  margin: 0 auto;
}

.quiz-header {
  text-align: center;
  margin-bottom: 40px;
}

.quiz-header h2 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 15px;
}

.quiz-subtitle {
  font-size: 1.1rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

.quiz-intro {
  display: flex;
  justify-content: center;
}

.intro-card {
  background: white;
  border: 3px solid #000;
  padding: 40px;
  text-align: center;
  box-shadow: 5px 5px 0 #000;
  max-width: 500px;
}

.intro-card h3 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 20px;
}

.quiz-stats {
  display: flex;
  justify-content: space-around;
  margin: 30px 0;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  color: #00ff41;
  font-weight: bold;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

.start-btn {
  background: #00ff41;
  color: #000;
  border: 3px solid #000;
  padding: 15px 30px;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  cursor: pointer;
  box-shadow: 3px 3px 0 #000;
  transition: all 0.1s;
}

.start-btn:hover {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 #000;
}

.quiz-progress {
  margin-bottom: 30px;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #f0f0f0;
  border: 2px solid #000;
  margin-bottom: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #00ff41;
  transition: width 0.3s ease;
}

.question-card {
  background: white;
  border: 3px solid #000;
  padding: 30px;
  box-shadow: 5px 5px 0 #000;
}

.question-header {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
}

.question-icon {
  font-size: 2rem;
  margin-right: 15px;
}

.question-header h3 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1rem;
  color: #333;
  margin: 0;
  line-height: 1.3;
}

.options {
  margin-bottom: 30px;
}

.option {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  border: 2px solid #000;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.option:hover {
  background: #f0f8ff;
}

.option.selected {
  background: #00ff41;
  color: #000;
}

.option input[type="radio"] {
  width: 20px;
  height: 20px;
  margin-right: 15px;
  accent-color: #00ff41;
}

.option-text {
  font-size: 1rem;
  line-height: 1.3;
}

.next-btn {
  background: #00ff41;
  color: #000;
  border: 3px solid #000;
  padding: 12px 24px;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
  cursor: pointer;
  box-shadow: 3px 3px 0 #000;
  transition: all 0.1s;
}

.next-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: 3px 3px 0 #000;
}

.next-btn:not(:disabled):hover {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 #000;
}

.results-card {
  background: white;
  border: 3px solid #000;
  padding: 40px;
  text-align: center;
  box-shadow: 5px 5px 0 #000;
  margin-bottom: 30px;
}

.results-header {
  margin-bottom: 30px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0 auto 20px;
}

.score-circle.excellent { background: #00ff41; }
.score-circle.good { background: #ffff00; }
.score-circle.fair { background: #ffaa00; }
.score-circle.needs-improvement { background: #ff4444; }

.score-number {
  font-family: 'Press Start 2P', monospace;
  font-size: 1.5rem;
  font-weight: bold;
  color: #000;
}

.score-label {
  font-size: 0.7rem;
  color: #000;
}

.results-breakdown {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
}

.breakdown-item {
  text-align: center;
}

.breakdown-label {
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
}

.breakdown-value {
  font-family: 'Press Start 2P', monospace;
  font-size: 1rem;
  font-weight: bold;
}

.breakdown-value.excellent { color: #00ff41; }
.breakdown-value.good { color: #ffff00; }
.breakdown-value.fair { color: #ffaa00; }
.breakdown-value.needs-improvement { color: #ff4444; }

.improvement-tips {
  background: #f0f8ff;
  border: 2px solid #000;
  padding: 20px;
  margin-bottom: 30px;
  text-align: left;
}

.improvement-tips h4 {
  font-family: 'Press Start 2P', monospace;
  font-size: 0.8rem;
  color: #00ff41;
  margin-bottom: 15px;
}

.improvement-tips ul {
  margin: 0;
  padding-left: 20px;
}

.improvement-tips li {
  margin-bottom: 8px;
  line-height: 1.4;
}

.results-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.retake-btn, .details-btn {
  background: #00ff41;
  color: #000;
  border: 3px solid #000;
  padding: 12px 24px;
  font-family: 'Press Start 2P', monospace;
  font-size: 0.7rem;
  cursor: pointer;
  box-shadow: 3px 3px 0 #000;
  transition: all 0.1s;
}

.retake-btn:hover, .details-btn:hover {
  transform: translate(1px, 1px);
  box-shadow: 2px 2px 0 #000;
}

.detailed-results {
  background: white;
  border: 3px solid #000;
  padding: 30px;
  box-shadow: 5px 5px 0 #000;
}

.detailed-results h4 {
  font-family: 'Press Start 2P', monospace;
  font-size: 1rem;
  color: #333;
  margin-bottom: 20px;
}

.result-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-item {
  border: 2px solid #000;
  padding: 20px;
}

.result-item.correct {
  background: #f0fff0;
  border-color: #00ff41;
}

.result-item.incorrect {
  background: #fff0f0;
  border-color: #ff4444;
}

.result-question {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.result-icon {
  font-size: 1.5rem;
  margin-right: 10px;
}

.result-text {
  font-weight: bold;
  line-height: 1.3;
}

.result-answer, .result-explanation {
  margin-bottom: 8px;
}

.answer-label, .explanation-label {
  font-weight: bold;
  margin-right: 8px;
}

.answer-text, .explanation-text {
  line-height: 1.4;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .quiz-stats {
    flex-direction: column;
    gap: 20px;
  }
  
  .results-breakdown {
    flex-direction: column;
    gap: 15px;
  }
  
  .results-actions {
    flex-direction: column;
  }
  
  .question-header {
    flex-direction: column;
    text-align: center;
  }
  
  .question-icon {
    margin-right: 0;
    margin-bottom: 10px;
  }
}
</style>
