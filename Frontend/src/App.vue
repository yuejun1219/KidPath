<script setup>
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div id="app">
    <NavBar />
    <router-view />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
}

#app {
  min-height: 100vh;
}

/* Global button styles */
button {
  cursor: pointer;
  font-family: inherit;
}

/* Global link styles */
a {
  text-decoration: none;
  color: inherit;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}
</style>
