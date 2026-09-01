import { createRouter, createWebHistory } from 'vue-router'
import { createClient } from '@supabase/supabase-js'

import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import Clientes from '../views/Clientes.vue'
import NotFound from '../components/NotFound.vue'
import Inventario from '../views/Inventario.vue'
import Ventas from '../views/Ventas.vue'
import Egresos from '../views/Egresos.vue'
import FacturacionVentas from '../components/ventas/FacturacionVentas.vue'
import EditarPerfil from '../views/EditarPerfil.vue'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)



const routes = [
  { path: '/', component: Login },
  { path: '/register', component: Register },
  {
    path: '/catalogo/:userId',
    name: 'CatalogoPublico',
    component: () => import('../views/CatalogoPublico.vue')
  },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/perfil',
    component: EditarPerfil,
    meta: { requiresAuth: true }
  },
  {
    path: '/clientes',
    component: Clientes,
    meta: { requiresAuth: true }
  },
  // { 
  //   path: '/:pathMatch(.*)*', 
  //   name: 'NotFound', 
  //   component: NotFound,
  //   meta: { requiresAuth: true }
    
  // },
  // {
  //   path: '/inventario',
  //   name: 'Inventario',
  //   component: Inventario,
  //   meta: { requiresAuth: true }
  // },
  {
    path: '/pos',
    name: 'POS',
    component: FacturacionVentas,
    meta: { requiresAuth: true }
  },
  {
    path: '/ventas',
    name: 'Ventas',
    component: Ventas,
    meta: { requiresAuth: true }
  },
  {
     path: '/egresos',
     name: 'Egresos',
     component: Egresos,
     meta: { requiresAuth: true }
  },
  
 
  // {
  //   path: '/entradas',
  //   component: Entradas,
  //   meta: { requiresAuth: true }
  // },
   {
    path: '/inventario',
     component: Inventario,
     meta: { requiresAuth: true }
    },
  
  // {
  //   path: '/salidas',
  //   component: Salidas,
  //   meta: { requiresAuth: true }
  // },
  // {
  //   path: '/:nombre_tienda',
  //   component: VistaPublica
  // },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const { data } = await supabase.auth.getSession()
  const isAuthenticated = !!data.session

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
