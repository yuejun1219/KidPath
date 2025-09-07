<template>
  <div class="about-page">
    <!-- Hero Section with News Articles Image -->
    <section class="hero-section">
      <img 
        src="/images/news-articles.png" 
        alt="News Articles" 
        class="hero-banner"
      />
      <div class="hero-text">
        <h1 class="hero-title">About KidPath</h1>
        <p class="hero-subtitle">Making outdoor adventures safe and comfortable for families</p>
      </div>
    </section>

    <!-- Main Content Section -->
    <section class="content-section">
      <div class="container">
        <div class="about-content">
          <div class="content-grid">
            <div class="content-card">
              <h2 class="card-title">Our Mission</h2>
              <p class="card-text">
                KidPath is dedicated to helping families discover safe, comfortable outdoor spaces 
                for children. We provide real-time weather insights, seasonal comfort guides, and 
                interactive maps to ensure every outdoor adventure is both fun and safe.
              </p>
            </div>

            <div class="content-card">
              <h2 class="card-title">What We Do</h2>
              <p class="card-text">
                Our platform combines weather data, spatial analysis, and user-friendly interfaces 
                to help parents make informed decisions about outdoor activities. From finding 
                nearby water fountains to checking seasonal comfort levels, we've got you covered.
              </p>
            </div>

            <div class="content-card">
              <h2 class="card-title">Technology</h2>
              <p class="card-text">
                Built with modern web technologies including Vue.js, Node.js, and advanced 
                geospatial services, KidPath delivers accurate, real-time information to help 
                families enjoy the great outdoors safely.
              </p>
            </div>

            <div class="content-card">
              <h2 class="card-title">Community</h2>
              <p class="card-text">
                We believe in the power of community-driven insights. Our platform grows stronger 
                with every family that shares their experiences and helps others discover new 
                safe spaces for children to play and explore.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="container">
        <h2 class="section-title">Key Features</h2>
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">🌡️</div>
            <h3 class="feature-title">Weather Insights</h3>
            <p class="feature-description">Real-time weather data to help you plan outdoor activities</p>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">🗺️</div>
            <h3 class="feature-title">Interactive Maps</h3>
            <p class="feature-description">Discover nearby playgrounds, fountains, and safe spaces</p>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">🌱</div>
            <h3 class="feature-title">Seasonal Guides</h3>
            <p class="feature-description">Comfort recommendations based on current weather conditions</p>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">💧</div>
            <h3 class="feature-title">Water Access</h3>
            <p class="feature-description">Find nearby water fountains and hydration stations</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// Component logic can be added here if needed
</script>

<style scoped>
/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.about-page {
  min-height: 100vh;
  background: #ffffff;
  color: #333333;
}

/* Hero Section */
.hero-section {
  background: #ffffff;
  position: relative;
  overflow: hidden;
  padding-top: 150px;
}

.hero-banner {
  width: 100%;
  height: 400px;
  object-fit: contain;
  display: block;
}

.hero-text {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
  text-align: center;
}

.hero-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 32px;
  margin-bottom: 20px;
  color: #333333;
  line-height: 1.4;
}

.hero-subtitle {
  font-size: 18px;
  line-height: 1.6;
  color: #666666;
  font-weight: 300;
}

/* Content Section */
.content-section {
  padding: 80px 0;
  background: #ffffff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.content-card {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 15px;
  border: 1px solid #e9ecef;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.content-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}

.card-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 16px;
  margin-bottom: 15px;
  color: #00ff41;
  line-height: 1.4;
}

.card-text {
  font-size: 16px;
  line-height: 1.6;
  color: #666666;
}

/* Features Section */
.features-section {
  padding: 80px 0;
  background: #ffffff;
}

.section-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 24px;
  text-align: center;
  margin-bottom: 50px;
  color: #333333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.feature-item {
  text-align: center;
  padding: 30px 20px;
  background: #f8f9fa;
  border-radius: 15px;
  border: 1px solid #e9ecef;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 20px;
  display: block;
}

.feature-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  margin-bottom: 15px;
  color: #00ff41;
  line-height: 1.4;
}

.feature-description {
  font-size: 14px;
  line-height: 1.6;
  color: #666666;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-banner {
    display: none;
  }
  
  .hero-text {
    padding: 40px 20px;
  }
  
  .hero-title {
    font-size: 24px;
  }
  
  .hero-subtitle {
    font-size: 16px;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .card-title {
    font-size: 14px;
  }
  
  .card-text {
    font-size: 14px;
  }
  
  .feature-title {
    font-size: 12px;
  }
  
  .feature-description {
    font-size: 12px;
  }
}
</style>
