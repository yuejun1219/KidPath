<template>
  <div class="about-page">
    <!-- Hero（无背景图，干净渐变 + 装饰） -->
    <section class="hero-section">
      <div class="hero-inner">
        <h1 class="hero-title">About KidPath</h1>
        <p class="hero-subtitle">
          Making outdoor adventures safe and comfortable for families
        </p>
      </div>
      <!-- 装饰泡泡 -->
      <span class="blob b1"></span>
      <span class="blob b2"></span>
      <span class="blob b3"></span>
    </section>

    <!-- 主内容：四卡片并列 -->
    <section class="content-section">
      <div class="container">
        <div class="content-grid">
          <article class="content-card">
            <h2 class="card-title">Our Mission</h2>
            <p class="card-text">
              KidPath is dedicated to helping families discover safe, comfortable
              outdoor spaces for children. We provide real-time weather insights,
              seasonal comfort guides, and interactive maps so every adventure is
              both fun and safe.
            </p>
          </article>

          <article class="content-card">
            <h2 class="card-title">What We Do</h2>
            <p class="card-text">
              We combine weather data, spatial analysis, and user-friendly
              interfaces to help parents make informed outdoor decisions — from
              nearby water access to seasonal comfort levels.
            </p>
          </article>

          <article class="content-card">
            <h2 class="card-title">Technology</h2>
            <p class="card-text">
              Built with Vue, Node.js and modern geospatial services, KidPath
              delivers accurate, real-time information to help families enjoy the
              outdoors safely.
            </p>
          </article>

          <article class="content-card">
            <h2 class="card-title">Community</h2>
            <p class="card-text">
              We believe in community-driven insights. KidPath grows stronger
              when families share experiences and help others discover new safe
              spaces to play and explore.
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- 可选：功能一览（保留更清爽的风格） -->
    <section class="features-section">
      <div class="container">
        <h2 class="section-title">Key Features</h2>
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">🌡️</div>
            <h3 class="feature-title">Weather Insights</h3>
            <p class="feature-description">Real-time weather to plan activities</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🗺️</div>
            <h3 class="feature-title">Interactive Maps</h3>
            <p class="feature-description">Find playgrounds & family spots</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🌱</div>
            <h3 class="feature-title">Seasonal Guides</h3>
            <p class="feature-description">Comfort tips by season & weather</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">💧</div>
            <h3 class="feature-title">Water Access</h3>
            <p class="feature-description">Nearby fountains & refill stations</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// 无逻辑即可
</script>

<style scoped>
/* ========= Tokens ========= */
.about-page{
  --kp-green:#2e7d32;
  --kp-purple:#5e35b1;
  --kp-text:#2f3d4a;
  --kp-muted:#667085;
  --kp-border:rgba(0,0,0,.08);
  --shadow-1:0 10px 24px rgba(0,0,0,.08);
  --shadow-2:0 18px 40px rgba(0,0,0,.14);
  font-family:'Segoe UI','Arial',sans-serif;
  color:var(--kp-text);
  background:#fff;
}

/* ========= Hero（无图） ========= */
.hero-section{
  position:relative;
  padding:120px 20px 72px;
  background:
    radial-gradient(1200px 300px at 10% -20%, rgba(13,71,161,.06), transparent 60%),
    radial-gradient(1100px 300px at 110% -10%, rgba(46,125,50,.08), transparent 60%),
    linear-gradient(180deg,#f6fbff 0%, #f8fff9 100%);
  overflow:hidden;
}
.hero-inner{ max-width:1100px; margin:0 auto; text-align:center; }
.hero-title{
  margin:0 0 10px;
  font-weight:900;
  font-size:clamp(28px,4vw,44px);
  letter-spacing:.3px;
  background:linear-gradient(90deg,#2e7d32 0%, #5e35b1 85%);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.hero-subtitle{
  margin:0 auto;
  max-width:760px;
  color:var(--kp-muted);
  font-size:clamp(15px,1.8vw,18px);
  line-height:1.8;
}

/* 装饰 blob */
.blob{ position:absolute; border-radius:50%; filter: blur(18px); opacity:.25; }
.b1{ width:280px; height:280px; left:-80px; top:-60px; background:#c8e6c9; }
.b2{ width:240px; height:240px; right:-60px; top:-40px; background:#d1c4e9; }
.b3{ width:160px; height:160px; right:16%; top:40%; background:#e3f2fd; }

/* ========= Content（四列并列） ========= */
.content-section{ padding:64px 0; }
.container{ max-width:1200px; margin:0 auto; padding:0 20px; }

.content-grid{
  display:grid;
  grid-template-columns:repeat(4, minmax(0, 1fr)); /* ← 桌面端固定四列 */
  gap:22px;
}
.content-card{
  background:linear-gradient(180deg,#ffffff 0%,#fbfcff 100%);
  border:1px solid var(--kp-border);
  border-radius:18px;
  padding:22px;
  box-shadow:var(--shadow-1);
  transition:transform .16s ease, box-shadow .16s ease, border-color .16s ease;
}
.content-card:hover{ transform:translateY(-3px); box-shadow:var(--shadow-2); border-color:rgba(46,125,50,.2); }
.card-title{
  margin:2px 0 10px;
  font-weight:800;
  font-size:1.1rem;
  color:var(--kp-green);
}
.card-text{ color:var(--kp-muted); line-height:1.8; font-size:1rem; }

/* ========= Features ========= */
.features-section{ padding:64px 0 80px; background:#fff; }
.section-title{
  text-align:center;
  font-weight:900;
  color:var(--kp-green);
  font-size:clamp(22px,3vw,28px);
  margin:0 0 28px;
}
.features-grid{
  display:grid;
  grid-template-columns:repeat(4, minmax(0, 1fr)); /* 这里也四列保持一致 */
  gap:20px;
}
.feature-item{
  text-align:center;
  padding:22px 18px;
  background:#fff;
  border:1px solid var(--kp-border);
  border-radius:16px;
  box-shadow:var(--shadow-1);
  transition:transform .16s ease, box-shadow .16s ease;
}
.feature-item:hover{ transform:translateY(-3px); box-shadow:var(--shadow-2); }
.feature-icon{
  width:56px; height:56px; margin:0 auto 12px; display:grid; place-items:center;
  border-radius:50%;
  background:linear-gradient(135deg,#ede7f6,#e8f5e9);
  color:var(--kp-purple);
  font-size:28px;
  box-shadow:0 10px 24px rgba(94,53,177,.18);
}
.feature-title{ margin:0 0 8px; font-weight:800; color:var(--kp-text); font-size:1.05rem; }
.feature-description{ color:var(--kp-muted); line-height:1.7; font-size:.98rem; }

/* ========= 响应式（宽度不足时降级） ========= */
@media (max-width: 1100px){
  .content-grid, .features-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px){
  .content-grid, .features-grid{ grid-template-columns: 1fr; }
  .hero-section{ padding:100px 16px 56px; }
}
</style>
