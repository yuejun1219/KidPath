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
/* KidPath tokens（与首页一致） */
.about-page{
  --kp-green:#2e7d32;
  --kp-purple:#5e35b1;
  --kp-text:#2f3d4a;
  --kp-muted:#667085;
  --kp-border:rgba(0,0,0,.08);
  --kp-shadow:0 12px 30px rgba(0,0,0,.12);
  --kp-shadow-hover:0 18px 40px rgba(0,0,0,.16);
  font-family:'Segoe UI','Arial',sans-serif;
  color:var(--kp-text);
  background:#fff;
  min-height:100vh;
}

/* ===== Hero ===== */
.hero-section{
  position:relative;
  padding-top:120px;
  min-height:420px;
  overflow:hidden;
  background:linear-gradient(180deg,#eef5ff 0%,#f7fcf8 100%);
}
.hero-section::after{ /* 顶部轻微渐变压黑，让标题更清晰 */
  content:"";
  position:absolute; inset:0;
  background:linear-gradient(0deg,rgba(0,0,0,.00) 40%,rgba(0,0,0,.18) 100%);
  pointer-events:none;
}
.hero-banner{
  position:absolute; inset:0;
  width:100%; height:100%;
  object-fit:cover;
  filter:brightness(.85) saturate(1.05);
}
.hero-text{
  position:relative; z-index:1;
  max-width:1100px; margin:0 auto;
  padding:48px 20px 64px;
  text-align:center;
  color:#fff;
}
.hero-title{
  font-weight:900;
  letter-spacing:.4px;
  font-size:clamp(28px,4vw,44px);
  margin:0 0 10px;
  text-shadow:0 6px 18px rgba(0,0,0,.25);
}
.hero-subtitle{
  margin:0 auto;
  max-width:780px;
  font-size:clamp(15px,1.8vw,18px);
  line-height:1.8;
  color:#ffffff;                        
  text-shadow:0 3px 16px rgba(0,0,0,.55);
  display:inline-block;
  padding:8px 14px;
  background:rgba(0,0,0,.28);
  backdrop-filter:blur(3px);
  border-radius:12px;
}


/* ===== Content ===== */
.content-section{
  padding:64px 0;
  background:linear-gradient(180deg,#f7fcf8 0%,#ffffff 100%);
}
.container{ max-width:1200px; margin:0 auto; padding:0 20px; }

.content-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
  gap:22px;
  margin-top:28px;
}
.content-card{
  background:linear-gradient(180deg,#ffffff 0%,#f9fbff 100%);
  border:1px solid var(--kp-border);
  border-radius:18px;
  padding:22px;
  box-shadow:var(--kp-shadow);
  transition:transform .18s ease, box-shadow .18s ease;
}
.content-card:hover{ transform:translateY(-3px); box-shadow:var(--kp-shadow-hover); }
.card-title{
  margin:2px 0 10px;
  font-weight:800;
  font-size:1.1rem;
  color:var(--kp-green);
  letter-spacing:.2px;
}
.card-text{
  color:var(--kp-muted);
  line-height:1.8;
  font-size:1rem;
}

/* ===== Features ===== */
.features-section{ padding:64px 0; background:#fff; }
.section-title{
  text-align:center;
  font-weight:900;
  color:var(--kp-green);
  font-size:clamp(22px,3vw,28px);
  margin:0 0 28px;
}
.features-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
  gap:20px;
}
.feature-item{
  text-align:center;
  padding:22px 18px;
  background:#fff;
  border:1px solid var(--kp-border);
  border-radius:16px;
  box-shadow:var(--kp-shadow);
  transition:transform .18s ease, box-shadow .18s ease;
}
.feature-item:hover{ transform:translateY(-3px); box-shadow:var(--kp-shadow-hover); }
.feature-icon{
  width:56px; height:56px; margin:0 auto 12px; display:grid; place-items:center;
  border-radius:50%;
  background:linear-gradient(135deg,#ede7f6,#e8f5e9);
  color:var(--kp-purple);
  font-size:28px;
  box-shadow:0 10px 24px rgba(94,53,177,.18);
}
.feature-title{
  margin:0 0 8px; font-weight:800; color:var(--kp-text); font-size:1.05rem;
}
.feature-description{
  color:var(--kp-muted); line-height:1.7; font-size:.98rem;
}

/* ===== Responsive ===== */
@media (max-width:768px){
  .hero-section{ padding-top:96px; min-height:360px; }
  .hero-text{ padding:40px 16px 56px; }
}
</style>

