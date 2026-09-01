<script setup>
import Header from './components/Header.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MenuAbajo from './components/MenuAbajo.vue'

const route = useRoute()

const mostrarHeader = computed(() => {
  // 1. Ocultar en rutas exactas de autenticación e inicio
  const rutasRutasExactas = ['/', '/login', '/register']
  if (rutasRutasExactas.includes(route.path)) return false

  // 2. Ocultar en cualquier subruta de /catalogo (ej: /catalogo/abc-123)
  if (route.path.startsWith('/catalogo/')) return false

  // 3. Opcional: Ocultar por nombre de la ruta si la definiste en tu router
  if (route.name === 'CatalogoPublico' || route.name === 'NotFound') return false

  return true
})
</script>

<template>
  <Header v-if="mostrarHeader" />
  <router-view />
  <MenuAbajo v-if="mostrarHeader" />
</template>

<style>
* {
  margin: 0;
  padding: 0;
}
html, body {
  height: 100%;
  margin: 0;
}
</style>