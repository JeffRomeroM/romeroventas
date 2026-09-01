<template>
  <div class="catalogo-container">
    <!-- HERO / INFO DEL NEGOCIO -->
    <header class="negocio-hero">
      <div class="hero-contenido">
        <div class="hero-avatar">{{ obtenerInicial(negocio.nombre_negocio) }}</div>
        <div class="hero-texto">
          <h1>{{ negocio.nombre_negocio }}</h1>
          <div class="hero-datos">
            <!-- Dirección: Muestra fallback si viene vacía -->
            <span class="hero-dato">
              <Icon icon="mdi:map-marker-outline" />
              {{ negocio.direccion || 'Dirección no especificada' }}
            </span>
            <!-- Teléfono para llamadas directas -->
            <span v-if="negocio.telefono" class="hero-dato">
              <Icon icon="mdi:phone-outline" />
              <a :href="`tel:${telefonoLlamada}`" class="link-telefono">{{ negocio.telefono }}</a>
            </span>
          </div>
        </div>
      </div>
      
      <!-- BOTÓN WHATSAPP CONSULTA GENERAL EN EL HERO -->
      <a
        v-if="telefonoWhatsApp"
        :href="generarLinkWhatsAppGeneral()"
        target="_blank"
        class="btn-whatsapp-hero"
      >
        <Icon icon="mdi:whatsapp" />
        <span>Consulta General por WhatsApp</span>
      </a>
    </header>

    <!-- Barra de Búsqueda -->
    <div class="search-box">
      <Icon icon="mdi:magnify" class="search-icon" />
      <input
        v-model="busqueda"
        type="text"
        placeholder="Buscar producto..."
      />
    </div>

    <!-- Categorías como botones -->
    <div class="categorias-scroll" v-if="categorias.length > 0">
      <button
        class="btn-categoria"
        :class="{ activo: categoriaFiltro === '' }"
        @click="categoriaFiltro = ''"
      >
        Todas
      </button>
      <button
        v-for="cat in categorias"
        :key="cat.id"
        class="btn-categoria"
        :class="{ activo: categoriaFiltro === cat.id }"
        @click="categoriaFiltro = cat.id"
      >
        {{ cat.nombre }}
      </button>
    </div>

    <!-- Estado de Carga / Vacío -->
    <div v-if="cargando" class="estado-mensaje">
      <Icon icon="mdi:loading" class="spin" />
      <p>Cargando catálogo...</p>
    </div>

    <div v-else-if="productosFiltrados.length === 0" class="estado-mensaje">
      <Icon icon="mdi:package-variant-remove" class="icon-empty" />
      <p>No hay productos disponibles por el momento.</p>
    </div>

    <!-- Grid de Tarjetas de Productos -->
    <div v-else class="productos-grid">
      <div v-for="prod in productosFiltrados" :key="prod.id" class="producto-card">
        <div class="avatar-producto" :style="{ background: obtenerColorAvatar(prod.nombre) }">
          {{ obtenerInicial(prod.nombre) }}
        </div>

        <div class="card-body">
          <span class="categoria-tag">{{ prod.categorias?.nombre || 'General' }}</span>
          <h3 class="producto-nombre">{{ prod.nombre }}</h3>
          <p class="producto-descripcion">{{ prod.descripcion || 'Sin descripción disponible.' }}</p>

          <div class="precio-block">
            <span class="precio-label">Precio</span>
            <span class="precio-valor">C$ {{ Number(prod.precio_venta || 0).toFixed(2) }}</span>
          </div>

          <div class="card-acciones">
            <button class="btn-agregar" @click="agregarAlCarrito(prod)">
              <Icon icon="mdi:cart-plus" />
              <span>Agregar</span>
            </button>
            
            <!-- BOTÓN CONSULTAR PRODUCTO ESPECÍFICO POR WHATSAPP -->
            <a
              v-if="telefonoWhatsApp"
              :href="generarLinkWhatsAppProducto(prod)"
              target="_blank"
              class="btn-whatsapp-card"
              title="Consultar por este producto en WhatsApp"
            >
              <Icon icon="mdi:whatsapp" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- BOTÓN FLOTANTE: WHATSAPP GENERAL -->
    <a
      v-if="telefonoWhatsApp"
      :href="generarLinkWhatsAppGeneral()"
      target="_blank"
      class="fab fab-whatsapp"
      title="Contactar por WhatsApp"
    >
      <Icon icon="mdi:whatsapp" />
    </a>

    <!-- BOTÓN FLOTANTE: CARRITO -->
    <button
      class="fab fab-carrito"
      @click="mostrarCarrito = true"
      title="Ver carrito"
    >
      <Icon icon="mdi:cart-outline" />
      <span v-if="cantidadTotalCarrito > 0" class="fab-badge">{{ cantidadTotalCarrito }}</span>
    </button>

    <!-- PANEL DEL CARRITO -->
    <transition name="fade">
      <div v-if="mostrarCarrito" class="carrito-overlay" @click.self="mostrarCarrito = false">
        <div class="carrito-panel">
          <div class="carrito-header">
            <h3>
              <Icon icon="mdi:cart-outline" />
              Tu Pedido
            </h3>
            <button class="btn-cerrar" @click="mostrarCarrito = false">
              <Icon icon="mdi:close" />
            </button>
          </div>

          <div v-if="carrito.length === 0" class="carrito-vacio">
            <Icon icon="mdi:cart-outline" class="icon-vacio" />
            <p>Aún no has agregado productos</p>
          </div>

          <div v-else class="carrito-items">
            <div v-for="(item, idx) in carrito" :key="item.producto_id" class="carrito-item">
              <div class="item-info">
                <span class="item-nombre">{{ item.nombre }}</span>
                <span class="item-precio">C$ {{ item.precio_unitario.toFixed(2) }} c/u</span>
              </div>
              <div class="item-controles">
                <button class="btn-step" @click="decrementarCantidad(item, idx)">
                  <Icon icon="mdi:minus" />
                </button>
                <span class="item-cantidad">{{ item.cantidad }}</span>
                <button class="btn-step" @click="incrementarCantidad(item)">
                  <Icon icon="mdi:plus" />
                </button>
              </div>
              <span class="item-subtotal">C$ {{ (item.precio_unitario * item.cantidad).toFixed(2) }}</span>
              <button class="btn-quitar" @click="quitarDelCarrito(idx)">
                <Icon icon="mdi:close" />
              </button>
            </div>
          </div>

          <div v-if="carrito.length > 0" class="carrito-footer">
            <div class="linea-total">
              <span>Total</span>
              <span class="monto-total">C$ {{ totalCarrito.toFixed(2) }}</span>
            </div>
            
            <!-- BOTÓN HACER PEDIDO DEL CARRITO POR WHATSAPP -->
            <a
              v-if="telefonoWhatsApp"
              :href="generarLinkWhatsAppPedido()"
              target="_blank"
              class="btn-pedido-whatsapp"
            >
              <Icon icon="mdi:whatsapp" />
              <span>Enviar Pedido por WhatsApp</span>
            </a>
            <p v-else class="alerta-sin-telefono">Este negocio aún no ha configurado un teléfono de contacto.</p>

            <button class="btn-vaciar-carrito" @click="vaciarCarrito">
              Vaciar carrito
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { supabase } from '../supabase/supabase.js'

const route = useRoute()

const negocio = ref({
  user_id: null,
  nombre_negocio: 'Cargando Negocio...',
  telefono: '',
  direccion: ''
})

const productos = ref([])
const categorias = ref([])
const busqueda = ref('')
const categoriaFiltro = ref('')
const cargando = ref(true)

const carrito = ref([])
const mostrarCarrito = ref(false)

// Limpieza del número para URLs de WhatsApp y llamadas
const telefonoWhatsApp = computed(() => {
  if (!negocio.value.telefono) return ''
  return negocio.value.telefono.toString().replace(/\D/g, '')
})

const telefonoLlamada = computed(() => {
  return negocio.value.telefono ? negocio.value.telefono.trim() : ''
})

const PALETA_AVATARES = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d']

const obtenerInicial = (texto) => (texto ? texto.trim().charAt(0).toUpperCase() : '?')

const obtenerColorAvatar = (texto) => {
  if (!texto) return PALETA_AVATARES[0]
  const suma = texto.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return PALETA_AVATARES[suma % PALETA_AVATARES.length]
}

const productosFiltrados = computed(() => {
  return productos.value.filter(p => {
    const q = busqueda.value.toLowerCase().trim()
    const coincideBusqueda = !q ||
      (p.nombre && p.nombre.toLowerCase().includes(q)) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))

    const coincideCategoria = !categoriaFiltro.value || p.categoria_id === categoriaFiltro.value

    return coincideBusqueda && coincideCategoria
  })
})

const cargarDatosPublicos = async () => {
  cargando.value = true
  try {
    const parametroUrl = route.params.userId || route.params.id || route.query.uid

    if (!parametroUrl) {
      negocio.value.nombre_negocio = 'Catálogo no encontrado'
      cargando.value = false
      return
    }

    const esUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parametroUrl)

    let negocioQuery = supabase
      .from('negocios')
      .select('user_id, nombre_negocio, telefono, direccion')

    if (esUUID) {
      negocioQuery = negocioQuery.eq('user_id', parametroUrl)
    } else {
      const nombreBuscado = decodeURIComponent(parametroUrl).replace(/-/g, ' ')
      negocioQuery = negocioQuery.ilike('nombre_negocio', nombreBuscado)
    }

    const { data: negocioData, error: errNegocio } = await negocioQuery.maybeSingle()

    if (errNegocio) throw errNegocio

    if (!negocioData) {
      negocio.value.nombre_negocio = 'El negocio no existe'
      cargando.value = false
      return
    }

    negocio.value = {
      user_id: negocioData.user_id,
      nombre_negocio: negocioData.nombre_negocio || 'Nuestro Negocio',
      telefono: negocioData.telefono || '',
      direccion: negocioData.direccion || ''
    }

    const realUserId = negocioData.user_id

    const { data: catData, error: errCat } = await supabase
      .from('categorias')
      .select('id, nombre')
      .eq('user_id', realUserId)
      .order('nombre', { ascending: true })

    if (errCat) throw errCat
    categorias.value = catData || []

    const { data: prodData, error: errProd } = await supabase
      .from('productos')
      .select('id, nombre, descripcion, sku, precio_venta, stock_actual, categoria_id, categorias(nombre)')
      .eq('user_id', realUserId)
      .gt('stock_actual', 0)
      .order('nombre', { ascending: true })

    if (errProd) throw errProd
    productos.value = prodData || []

  } catch (err) {
    console.error('Error al cargar catálogo público:', err.message || err)
  } finally {
    cargando.value = false
  }
}

// ============================================================
// CARRITO
// ============================================================
const agregarAlCarrito = (prod) => {
  const existente = carrito.value.find(item => item.producto_id === prod.id)
  const stockDisponible = Number(prod.stock_actual || 0)

  if (existente) {
    if (existente.cantidad < stockDisponible) {
      existente.cantidad++
    }
  } else {
    carrito.value.push({
      producto_id: prod.id,
      nombre: prod.nombre,
      precio_unitario: Number(prod.precio_venta || 0),
      cantidad: 1,
      stock_disponible: stockDisponible
    })
  }
  mostrarCarrito.value = true
}

const incrementarCantidad = (item) => {
  if (item.cantidad < item.stock_disponible) {
    item.cantidad++
  }
}

const decrementarCantidad = (item, index) => {
  if (item.cantidad > 1) {
    item.cantidad--
  } else {
    quitarDelCarrito(index)
  }
}

const quitarDelCarrito = (index) => carrito.value.splice(index, 1)
const vaciarCarrito = () => { carrito.value = [] }

const totalCarrito = computed(() => {
  return carrito.value.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0)
})

const cantidadTotalCarrito = computed(() => {
  return carrito.value.reduce((acc, item) => acc + item.cantidad, 0)
})

// ============================================================
// GENERACIÓN DE LINKS DE WHATSAPP
// ============================================================
const generarLinkWhatsAppProducto = (prod) => {
  const mensaje = encodeURIComponent(
    `Hola, tengo una consulta sobre este producto:\n*${prod.nombre}* (C$ ${Number(prod.precio_venta).toFixed(2)})`
  )
  return `https://wa.me/${telefonoWhatsApp.value}?text=${mensaje}`
}

const generarLinkWhatsAppGeneral = () => {
  const mensaje = encodeURIComponent(
    `Hola, estoy viendo el catálogo de *${negocio.value.nombre_negocio}* y me gustaría hacer una consulta.`
  )
  return `https://wa.me/${telefonoWhatsApp.value}?text=${mensaje}`
}

const generarLinkWhatsAppPedido = () => {
  let mensaje = `Hola, quisiera hacer el siguiente pedido en *${negocio.value.nombre_negocio}*:\n\n`

  carrito.value.forEach(item => {
    mensaje += `• ${item.cantidad}x *${item.nombre}* - C$ ${(item.precio_unitario * item.cantidad).toFixed(2)}\n`
  })

  mensaje += `\n*TOTAL DEL PEDIDO: C$ ${totalCarrito.value.toFixed(2)}*\n\n¿Me confirman si disponen de stock para la entrega? ¡Muchas gracias!`

  return `https://wa.me/${telefonoWhatsApp.value}?text=${encodeURIComponent(mensaje)}`
}

onMounted(() => {
  cargarDatosPublicos()
})
</script>

<style scoped>
.catalogo-container {
  padding: 1.25rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: inherit;
  padding-bottom: 6rem;
}

.negocio-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  flex-wrap: wrap;
  background: linear-gradient(135deg, #eff6ff, #f8fafc);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.hero-contenido { display: flex; align-items: center; gap: 1rem; min-width: 0; }
.hero-avatar { flex-shrink: 0; width: 56px; height: 56px; border-radius: 16px; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; }
.hero-texto { min-width: 0; }
.hero-texto h1 { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0 0 0.4rem 0; }
.hero-datos { display: flex; flex-wrap: wrap; gap: 0.35rem 1rem; }
.hero-dato { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.85rem; color: #475569; }
.link-telefono { color: #475569; text-decoration: none; font-weight: 600; }
.link-telefono:hover { text-decoration: underline; color: #2563eb; }

.btn-whatsapp-hero { display: inline-flex; align-items: center; gap: 0.5rem; background: #25d366; color: #fff; text-decoration: none; padding: 0.65rem 1.1rem; border-radius: 10px; font-weight: 700; font-size: 0.9rem; white-space: nowrap; transition: background 0.15s ease; flex-shrink: 0; }
.btn-whatsapp-hero:hover { background: #1da851; }

.search-box { display: flex; align-items: center; gap: 0.5rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 0.65rem 0.9rem; margin-bottom: 1rem; }
.search-icon { font-size: 1.2rem; color: #94a3b8; flex-shrink: 0; }
.search-box input { border: none; outline: none; width: 100%; font-size: 0.92rem; background: transparent; }

.categorias-scroll { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 1.5rem; scrollbar-width: thin; }
.btn-categoria { flex-shrink: 0; background: #ffffff; border: 1px solid #cbd5e1; color: #475569; padding: 0.5rem 1rem; border-radius: 999px; font-size: 0.85rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.15s ease; }
.btn-categoria:hover { border-color: #2563eb; color: #2563eb; }
.btn-categoria.activo { background: #2563eb; border-color: #2563eb; color: #fff; }

.productos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem; }
.producto-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: transform 0.15s ease, box-shadow 0.15s ease; }
.producto-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }

.avatar-producto { height: 110px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 2.5rem; font-weight: 800; }
.card-body { padding: 1.1rem; display: flex; flex-direction: column; flex: 1; }
.categoria-tag { font-size: 0.68rem; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 0.2rem 0.5rem; border-radius: 4px; width: fit-content; text-transform: uppercase; }
.producto-nombre { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0.55rem 0 0.3rem 0; }
.producto-descripcion { font-size: 0.82rem; color: #64748b; margin: 0 0 0.9rem 0; line-height: 1.4; flex: 1; }
.precio-block { display: flex; flex-direction: column; margin-bottom: 0.9rem; }
.precio-label { font-size: 0.68rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
.precio-valor { font-size: 1.2rem; font-weight: 800; color: #0f172a; }

.card-acciones { display: flex; gap: 0.5rem; }
.btn-agregar { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem; background: #2563eb; color: #fff; border: none; padding: 0.6rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: background 0.15s ease; }
.btn-agregar:hover { background: #1d4ed8; }
.btn-whatsapp-card { flex-shrink: 0; width: 42px; display: flex; align-items: center; justify-content: center; background: #25d366; color: #fff; border-radius: 8px; font-size: 1.2rem; text-decoration: none; transition: background 0.15s ease; }
.btn-whatsapp-card:hover { background: #1da851; }

.estado-mensaje { text-align: center; padding: 4rem 1rem; color: #64748b; }
.icon-empty { font-size: 2.5rem; color: #cbd5e1; }
.spin { animation: spin 1s linear infinite; font-size: 2rem; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.fab { position: fixed; right: 1.25rem; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; color: #fff; border: none; cursor: pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.18); text-decoration: none; z-index: 60; transition: transform 0.15s ease; }
.fab:hover { transform: scale(1.06); }
.fab-whatsapp { bottom: 6rem; background: #25d366; }
.fab-carrito { bottom: 1.25rem; background: #2563eb; }
.fab-badge { position: absolute; top: -4px; right: -4px; background: #dc2626; color: #fff; font-size: 0.7rem; font-weight: 700; min-width: 20px; height: 20px; border-radius: 999px; display: flex; align-items: center; justify-content: center; padding: 0 4px; }

.carrito-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); z-index: 100; display: flex; justify-content: flex-end; }
.carrito-panel { background: #fff; width: 100%; max-width: 420px; height: 100%; display: flex; flex-direction: column; box-shadow: -10px 0 30px rgba(0,0,0,0.15); }
.carrito-header { display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 1.25rem; border-bottom: 1px solid #e2e8f0; }
.carrito-header h3 { display: flex; align-items: center; gap: 0.5rem; margin: 0; font-size: 1.1rem; color: #0f172a; }
.btn-cerrar { background: none; border: none; font-size: 1.2rem; color: #64748b; cursor: pointer; }
.carrito-vacio { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; gap: 0.5rem; }
.icon-vacio { font-size: 2.5rem; }
.carrito-items { flex: 1; overflow-y: auto; padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; }
.carrito-item { display: grid; grid-template-columns: 1fr auto auto auto; align-items: center; gap: 0.6rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.85rem; }
.item-info { display: flex; flex-direction: column; min-width: 0; }
.item-nombre { font-size: 0.88rem; font-weight: 600; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-precio { font-size: 0.75rem; color: #64748b; }
.item-controles { display: inline-flex; align-items: center; background: #f1f5f9; border-radius: 6px; padding: 0.15rem; }
.btn-step { background: #fff; border: 1px solid #cbd5e1; color: #334155; width: 22px; height: 22px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.75rem; }
.btn-step:hover { background: #2563eb; color: #fff; border-color: #2563eb; }
.item-cantidad { padding: 0 0.4rem; font-weight: 700; font-size: 0.8rem; min-width: 18px; text-align: center; }
.item-subtotal { font-size: 0.85rem; font-weight: 700; color: #0f172a; white-space: nowrap; }
.btn-quitar { background: none; border: none; color: #cbd5e1; cursor: pointer; font-size: 1rem; }
.btn-quitar:hover { color: #dc2626; }

.carrito-footer { border-top: 1px solid #e2e8f0; padding: 1.1rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
.linea-total { display: flex; justify-content: space-between; font-size: 1rem; font-weight: 700; color: #0f172a; }
.monto-total { color: #2563eb; font-size: 1.2rem; }
.btn-pedido-whatsapp { display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #25d366; color: #fff; text-decoration: none; padding: 0.75rem; border-radius: 8px; font-weight: 700; font-size: 0.92rem; }
.btn-pedido-whatsapp:hover { background: #1da851; }
.alerta-sin-telefono { font-size: 0.8rem; color: #dc2626; text-align: center; margin: 0; }
.btn-vaciar-carrito { background: none; border: none; color: #94a3b8; font-size: 0.82rem; cursor: pointer; text-align: center; }
.btn-vaciar-carrito:hover { color: #dc2626; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media screen and (max-width: 640px) {
  .catalogo-container { padding: 1rem; padding-bottom: 6rem; }
  .negocio-hero { flex-direction: column; align-items: flex-start; padding: 1.1rem; }
  .btn-whatsapp-hero { width: 100%; justify-content: center; }
  .hero-texto h1 { font-size: 1.2rem; }
  .productos-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.85rem; }
  .avatar-producto { height: 90px; font-size: 2rem; }
  .card-body { padding: 0.9rem; }
  .carrito-panel { max-width: 100%; }
  .fab { width: 50px; height: 50px; font-size: 1.4rem; right: 1rem; }
  .fab-whatsapp { bottom: 5.25rem; }
  .fab-carrito { bottom: 1rem; }
}
</style>