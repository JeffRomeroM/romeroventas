<template>
  <div class="error-container">
    <h1>404</h1>
    <p>Página no encontrada</p>
    <router-link to="/dashboard">Volver al inicio</router-link>
  </div>
</template>

<style scoped>
.error-container { 
  display: flex; flex-direction: column; align-items: center; 
  justify-content: center; height: 100vh; text-align: center; 
}
</style>