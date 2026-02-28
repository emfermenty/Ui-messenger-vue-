<template>
  <router-view />
  <div class="version">Версия: 1.0.0</div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Roboto', sans-serif;
}

body {
  background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), 
              url('https://i.imgur.com/2iRGu14.jpeg') center/cover no-repeat;
  min-height: 100vh;
  overflow: hidden;
}

/* Или используйте ваше локальное изображение */
/* body {
  background: url('/src/assets/background.png') center/cover no-repeat;
} */

.version {
  position: fixed;
  bottom: 16px;
  left: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  pointer-events: none;
  z-index: 1000;
}
</style>