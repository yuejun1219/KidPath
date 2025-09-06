<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-links">
        <router-link to="/comfort-insights" class="footer-link">INSIGHTS</router-link>
        <a href="#" class="footer-link">SUPPORT</a>
        <a href="#" class="footer-link">CONTACT</a>
      </div>
      
      <div class="footer-copyright">
        <span class="footer-text">&copy; 2024 KIDPATH</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
// No additional logic needed for this minimalistic footer
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.footer {
  background: transparent;
  padding: 15px 0;
  margin-top: auto;
  height: 60px;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 20;
}

.footer-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 60px;
  width: 100%;
  animation: slide-in-out 6s linear infinite;
}

.footer-links {
  display: flex;
  gap: 30px;
  align-items: center;
}

.footer-link {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #ffffff;
  text-decoration: none;
  padding: 4px 8px;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
}

.footer-link:hover {
  color: #00ff41;
  text-shadow: 0 0 15px rgba(0, 255, 65, 0.8);
  transform: scale(1.1);
}

.footer-copyright {
  display: flex;
  align-items: center;
}

.footer-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
}

@keyframes slide-in-out {
  0% {
    transform: translateX(-100vw);
    opacity: 0;
  }
  10% {
    transform: translateX(0);
    opacity: 1;
  }
  90% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(100vw);
    opacity: 0;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    gap: 15px;
    text-align: center;
    padding: 0 30px;
    max-width: 100%;
  }
  
  .footer-links {
    gap: 20px;
  }
  
  .footer-text {
    font-size: 6px;
  }
  
  .footer-link {
    font-size: 7px;
  }
}

@media (max-width: 480px) {
  .footer {
    height: 50px;
    padding: 10px 0;
  }
  
  .footer-content {
    padding: 0 20px;
    gap: 12px;
    max-width: 100%;
  }
  
  .footer-text {
    font-size: 5px;
  }
  
  .footer-link {
    font-size: 6px;
    padding: 2px 6px;
  }
}
</style>
