import { createRouter, createWebHistory } from 'vue-router'
// Importa tu instancia centralizada de Supabase
import { supabase } from '../supabase/supabase.js'

// Carga directa solo para las vistas públicas de entrada
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

const routes = [
  { 
    path: '/', 
    name: 'Login', 
    component: Login 
  },
  { 
    path: '/register', 
    name: 'Register', 
    component: Register 
  },
  {
    path: '/catalogo/:userId',
    name: 'CatalogoPublico',
    component: () => import('../views/CatalogoPublico.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/perfil',
    name: 'Perfil',
    component: () => import('../views/EditarPerfil.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/clientes',
    name: 'Clientes',
    component: () => import('../views/VistaClientes.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pos',
    name: 'POS',
    // OJO: Asegúrate de que la carpeta sea /Ventas/ o /ventas/ exactamente igual en Git
    component: () => import('../components/ventas/FacturacionVentas.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ventas',
    name: 'Ventas',
    component: () => import('../views/VistaVentas.vue'),
    meta: { requiresAuth: true }
  },
  {
     path: '/egresos',
     name: 'Egresos',
     component: () => import('../views/VistaEgresos.vue'),
     meta: { requiresAuth: true }
  },
  {
    path: '/inventario',
    name: 'Inventario',
    component: () => import('../views/VistaInventario.vue'),
    meta: { requiresAuth: true }
  },
  { 
    path: '/:pathMatch(.*)*', 
    name: 'NotFound', 
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard de navegación para autenticación
router.beforeEach(async (to, from, next) => {
  const { data } = await supabase.auth.getSession()
  const isAuthenticated = !!data.session

  // Si requiere autenticación y no hay sesión, redirige al Login
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login' })
  } 
  // Si ya está autenticado e intenta ir a Login o Register, redirige al Dashboard
  else if ((to.path === '/' || to.path === '/register') && isAuthenticated) {
    next({ name: 'pos' })
  } 
  else {
    next()
  }
})

export default router