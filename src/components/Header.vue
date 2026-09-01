<template>
  <div class="app-container" @click="cerrarMenu">
    <header class="header">
      <!-- Logo y Nombre de Marca (disparador de menú móvil) -->
      <div class="brand-section" @click.stop="menuAbierto = !menuAbierto">
        <img src="/logo.png" alt="Logo" class="brand-logo" />
        <span class="brand-text">{{ nombreNegocio || 'Mi Negocio' }}</span>
      </div>

      <!-- Navegación Desktop -->
      <nav class="nav-links">
        <router-link to="/pos" @click="cerrarMenu" class="link">
          <Icon icon="mdi:store-outline" class="nav-icon" />
          <span>POS</span>
        </router-link>
        <router-link to="/dashboard" @click="cerrarMenu" class="link">
          <Icon icon="mdi:view-dashboard-outline" class="nav-icon" />
          <span>Dashboard</span>
        </router-link>
        <router-link to="/ventas" @click="cerrarMenu" class="link">
          <Icon icon="mdi:cart-outline" class="nav-icon" />
          <span> Reporte de Ventas</span>
        </router-link>
        
        <router-link to="/inventario" @click="cerrarMenu" class="link">
          <Icon icon="mdi:package-variant-closed" class="nav-icon" />
          <span>Inventario</span>
        </router-link>
        
        <router-link to="/egresos" @click="cerrarMenu" class="link">
          <Icon icon="mdi:cash-minus" class="nav-icon" />
          <span>Egresos</span>
        </router-link>
        <router-link to="/clientes" @click="cerrarMenu" class="link">
          <Icon icon="mdi:account-group" class="nav-icon" />
          <span>Clientes</span>
        </router-link>
      </nav>

      <!-- Menú de Usuario -->
      <div class="usuario-container" @click.stop="mostrarMenu = !mostrarMenu">
        <div class="user-card" :class="{ active: mostrarMenu }">
          <div class="store-avatar">
            {{ inicialesNegocio }}
          </div>
          <div class="info-stack">
            <span class="tienda">{{ nombreNegocio || 'Mi Negocio' }}</span>
            <span class="nombre">{{ nombre || 'Usuario' }}</span>
          </div>
          <Icon icon="mdi:chevron-down" class="chevron-icon" :class="{ rotated: mostrarMenu }" />
        </div>

        <transition name="fade">
          <div v-if="mostrarMenu" class="menu-user">
            <!-- Lista desplegable si hay más de un negocio -->
            <div v-if="listaNegocios.length > 1" class="seccion-negocios">
              <p class="label">Cambiar negocio</p>
              <div 
                v-for="negocio in listaNegocios" 
                :key="negocio.id" 
                class="negocio-item"
                :class="{ activo: negocio.id === negocioActivo?.id }"
                @click="seleccionarNegocio(negocio)"
              >
                <Icon icon="mdi:store" class="item-icon" />
                <span>{{ negocio.nombre || negocio.nombre_negocio }}</span>
              </div>
              <hr />
            </div>

            <button class="btn-logout" @click="logout">
              <Icon icon="mdi:logout" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </transition>
      </div>
    </header>

    <!-- Overlay y Sidebar Lateral para Móviles -->
    <transition name="fade">
      <div v-if="menuAbierto" class="overlay" @click="cerrarMenu"></div>
    </transition>

    <transition name="slide">
      <aside v-if="menuAbierto" class="sidebar" @click.stop>
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <img src="/logo.png" alt="Logo" class="sidebar-logo" />
            <span class="sidebar-brand-text">{{ nombreNegocio || 'Mi Negocio' }}</span>
          </div>
          <button class="btn-close" @click="cerrarMenu">
            <Icon icon="mdi:close" />
          </button>
        </div>
        
        <p class="label">Más opciones</p>
        <nav class="sidebar-links">
          <router-link to="/perfil" @click="cerrarMenu" class="link-sidebar">
            <Icon icon="mdi:account-edit" />
            <span>Editar perfil</span>
          </router-link>
          
          <!-- Enlace Dinámico al Catálogo -->
          <router-link :to="urlCatalogoNegocio" @click="cerrarMenu" class="link-sidebar" target="_blank">
            <Icon icon="mdi:store-search" />
            <span>Ver catálogo público</span>
          </router-link>

          <!-- Botón para Compartir Catálogo Dinámico -->
          <button class="btn-sidebar-action" @click="copiarLinkCatalogo">
            <Icon :icon="copiado ? 'mdi:check' : 'mdi:share-variant'" :class="{ 'text-green': copiado }" />
            <span>{{ copiado ? '¡Enlace copiado!' : 'Compartir Catálogo' }}</span>
          </button>

          
        </nav>
      </aside>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { supabase } from '../supabase/supabase.js'

const router = useRouter()
const nombre = ref('')
const listaNegocios = ref([])
const negocioActivo = ref(null)
const menuAbierto = ref(false)
const mostrarMenu = ref(false)
const copiado = ref(false)

const nombreNegocio = computed(() => {
  if (!negocioActivo.value) return ''
  return negocioActivo.value.nombre || negocioActivo.value.nombre_negocio || ''
})

const inicialesNegocio = computed(() => {
  const target = nombreNegocio.value || nombre.value
  if (!target) return 'R'
  return target.substring(0, 2).toUpperCase()
})

// Función helper para formatear un nombre a Slug (ej: "Pizzería Don Pepe" -> "pizzeria-don-pepe")
const generarSlug = (texto) => {
  if (!texto) return ''
  return texto
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '') // Remueve caracteres especiales
    .replace(/\s+/g, '-') // Sustituye espacios por guiones
    .replace(/-+/g, '-') // Evita guiones dobles
}

// Propiedad computada para la ruta dinámica
const urlCatalogoNegocio = computed(() => {
  if (!negocioActivo.value) return '/catalogo'
  
  // Si tu tabla 'negocios' ya tiene una columna 'slug', úsala directamente:
  if (negocioActivo.value.slug) {
    return `/catalogo/${negocioActivo.value.slug}`
  }
  
  // Si no hay slug guardado en la base de datos, lo generamos dinámicamente con el nombre:
  const slugNombre = generarSlug(nombreNegocio.value)
  if (slugNombre) {
    return `/catalogo/${slugNombre}`
  }

  // Fallback si no hay nombre: usar el ID del negocio
  return `/catalogo/${negocioActivo.value.id}`
})

onMounted(async () => {
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) return

  // 1. Cargar Perfil de usuario
  const { data: profile } = await supabase
    .from('perfiles')
    .select('nombre')
    .eq('id', user.id)
    .maybeSingle()
  
  if (profile?.nombre) {
    nombre.value = profile.nombre
  } else {
    nombre.value = user.user_metadata?.username || user.user_metadata?.nombre || user.email.split('@')[0]
  }

  // 2. Cargar negocios del propietario
  const { data } = await supabase
    .from('negocios')
    .select('*')
    .or(`user_id.eq.${user.id},propietario_id.eq.${user.id}`)
  
  listaNegocios.value = data || []

  // 3. Selección y persistencia del negocio activo
  const savedId = localStorage.getItem('negocio_activo_id')
  const existe = listaNegocios.value.find(n => String(n.id) === String(savedId))

  if (existe) {
    negocioActivo.value = existe
  } else if (listaNegocios.value.length > 0) {
    negocioActivo.value = listaNegocios.value[0]
    localStorage.setItem('negocio_activo_id', listaNegocios.value[0].id)
  }
})

const seleccionarNegocio = (negocio) => {
  negocioActivo.value = negocio
  localStorage.setItem('negocio_activo_id', negocio.id)
  mostrarMenu.value = false
  window.location.reload()
}

const copiarLinkCatalogo = async () => {
  const fullUrl = `${window.location.origin}${urlCatalogoNegocio.value}`

  if (navigator.share) {
    try {
      await navigator.share({
        title: nombreNegocio.value || 'Catálogo de Productos',
        text: `Mira el catálogo oficial de ${nombreNegocio.value}:`,
        url: fullUrl
      })
      cerrarMenu()
      return
    } catch (err) {
      if (err.name === 'AbortError') return
    }
  }

  navigator.clipboard.writeText(fullUrl).then(() => {
    copiado.value = true
    setTimeout(() => {
      copiado.value = false
      cerrarMenu()
    }, 1500)
  }).catch(err => {
    console.error('Error al copiar enlace:', err)
  })
}

const logout = async () => {
  localStorage.removeItem('negocio_activo_id')
  await supabase.auth.signOut()
  router.push('/')
}

const cerrarMenu = () => { 
  menuAbierto.value = false
  mostrarMenu.value = false 
}
</script>

<style scoped>
.app-container {
  width: 100%;
}

.header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 0.65rem 1.75rem; 
  background: #ffffff; 
  border-bottom: 1px solid #e2e8f0; 
  position: relative;
  z-index: 20;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
}

.brand-logo {
  height: 38px;
  width: auto;
  object-fit: contain;
  display: block;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 800;
  color: #2563eb;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.nav-links {
  display: flex;
  flex-direction: row;    
  align-items: center;  
  gap: 1.75rem;
  margin: 0;
  padding: 0;
}

.nav-links .link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  font-size: 0.9rem;  
  padding: 0.4rem 0.2rem;
  transition: all 0.2s ease;
}

.nav-icon {
  font-size: 1.1rem;
}

.nav-links .link:hover {
  color: #0f172a;
}

.nav-links .link.router-link-active {
  color: #2563eb;
  font-weight: 600;
  border-bottom: 2px solid #2563eb;
}

/* User Card */
.usuario-container { 
  position: relative; 
  cursor: pointer; 
  user-select: none;
}

.user-card { 
  display: flex; 
  align-items: center; 
  gap: 0.75rem;
  background: #f8fafc;
  padding: 0.45rem 0.85rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.user-card:hover, .user-card.active {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.store-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #2563eb;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
}

.info-stack { 
  display: flex; 
  flex-direction: column; 
  align-items: flex-start;
  line-height: 1.15;
}

.tienda { 
  font-size: 0.85rem; 
  color: #0f172a; 
  font-weight: 700; 
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nombre { 
  font-size: 0.73rem; 
  font-weight: 500; 
  color: #64748b;
}

.chevron-icon {
  font-size: 1.1rem;
  color: #94a3b8;
  transition: transform 0.2s ease;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

/* Menú Desplegable */
.menu-user { 
  position: absolute; 
  right: 0; 
  top: calc(100% + 8px); 
  background: #ffffff; 
  padding: 0.6rem; 
  border-radius: 10px; 
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05); 
  width: 220px; 
  border: 1px solid #e2e8f0; 
  z-index: 40;
}

.seccion-negocios {
  margin-bottom: 4px;
}

.negocio-item { 
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 8px 10px; 
  cursor: pointer; 
  font-size: 0.85rem; 
  border-radius: 6px; 
  margin-bottom: 4px; 
  color: #334155;
  transition: background 0.15s ease;
}

.item-icon {
  font-size: 1rem;
  color: #64748b;
}

.negocio-item:hover { 
  background: #f1f5f9; 
}

.negocio-item.activo { 
  background: #eff6ff; 
  color: #2563eb; 
  font-weight: 600; 
}

.negocio-item.activo .item-icon {
  color: #2563eb;
}

.label { 
  font-size: 0.68rem; 
  color: #94a3b8; 
  text-transform: uppercase; 
  margin-bottom: 6px; 
  padding-left: 6px;
  font-weight: 700; 
  letter-spacing: 0.03em;
}

hr {
  border: none;
  border-top: 1px solid #f1f5f9;
  margin: 6px 0;
}

.btn-logout { 
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%; 
  border: none; 
  background: #fef2f2; 
  color: #dc2626; 
  padding: 8px; 
  border-radius: 6px; 
  font-size: 0.82rem; 
  font-weight: 600;
  cursor: pointer; 
  transition: background 0.15s ease;
}

.btn-logout:hover {
  background: #fee2e2;
}

/* Sidebar y Móvil */
.sidebar { 
  position: fixed; 
  top: 0; 
  left: 0; 
  height: 100vh; 
  width: 260px; 
  background: #ffffff; 
  padding: 1.5rem 1.25rem; 
  z-index: 35; 
  box-shadow: 4px 0 24px rgba(0,0,0,0.08); 
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sidebar-logo {
  height: 30px;
  width: auto;
  object-fit: contain;
}

.sidebar-brand-text {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.3rem;
  color: #64748b;
  cursor: pointer;
}

.sidebar-links {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.link-sidebar {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  text-decoration: none;
  color: #334155;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.65rem 0.8rem;
  border-radius: 8px;
  transition: background 0.15s ease;
}

.link-sidebar:hover {
  background: #f1f5f9;
}

.link-sidebar.router-link-active {
  background: #eff6ff;
  color: #2563eb;
}

.btn-sidebar-action {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  border: none;
  background: transparent;
  color: #334155;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.65rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}

.btn-sidebar-action:hover {
  background: #f1f5f9;
}

.text-green {
  color: #16a34a;
}

.overlay { 
  position: fixed; 
  inset: 0; 
  background: rgba(15, 23, 42, 0.4); 
  z-index: 25; 
}

/* Transiciones */
.slide-enter-active, .slide-leave-active { transition: transform 0.25s ease-out; }
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media screen and (max-width: 840px) {
  .nav-links { display: none; }
  .brand-text { display: none; }
  .header { padding: 0.65rem 1rem; }
  .brand-logo { height: 32px; }
  .tienda { max-width: 100px; }
}
</style>