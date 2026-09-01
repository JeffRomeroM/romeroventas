<template>
  <div class="inventario-container">
    <!-- Header de la Vista -->
    <div class="vista-header">
      <div>
        <h2>Inventario</h2>
        <p class="subtitulo">Gestiona tus productos y controla el stock</p>
      </div>
      <Categoria @actualizado="recargarVista"/>
      <button class="btn-primario" @click="abrirModal()">
        <Icon icon="mdi:plus" />
        <span>Nuevo Producto</span>
      </button>
    </div>

    <!-- Tarjetas de Métricas Resumen -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon blue">
          <Icon icon="mdi:package-variant-closed" />
        </div>
        <div class="metric-info">
          <span class="metric-label">Total tipos de Productos</span>
          <span class="metric-value">{{ productosFiltrados.length }} </span>
        </div>
        <div class="metric-info">
          <span class="metric-label">Total de artículos</span>
          <span class="metric-value">{{ productosFiltrados.reduce((total, prod) => total + parseInt(prod.stock_actual || 0), 0) }} </span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon green">
          <Icon icon="mdi:currency-usd" />
        </div>
        <div class="metric-info">
          <span class="metric-label">Valor del Inventario</span>
          <span class="metric-value">C$ {{ valorInventario.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
        </div>
      </div>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="filtros-card">
      <div class="search-box">
        <Icon icon="mdi:magnify" class="search-icon" />
        <input 
          v-model="busqueda" 
          type="text" 
          placeholder="Buscar por nombre, SKU o descripción..." 
        />
      </div>

      
      <div class="filter-select">
      <select v-model="stockFiltro">
        <option value="">Todos los niveles de stock</option>
        <option value="critico">Stock Crítico (Mínimo o inferior)</option>
      </select>
    </div>
      
      <div class="filter-select">
        <select v-model="categoriaFiltro">
          <option value="">Todas las categorías</option>
          <option v-for="cat in categorias" :key="cat.id" :value="cat.id">
            {{ cat.nombre }}
          </option>
        </select>
      </div>

      
    </div>

    <!-- Tabla de Productos -->
    <div class="tabla-card">
      <div v-if="cargando" class="estado-mensaje">
        <Icon icon="mdi:loading" class="spin" />
        <p>Cargando inventario...</p>
      </div>

      <div v-else-if="productosFiltrados.length === 0" class="estado-mensaje">
        <Icon icon="mdi:package-variant-remove" class="icon-empty" />
        <p>No se encontraron productos registrados.</p>
      </div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>SKU</th>
              <th>Costo</th>
              <th>Precio Venta</th>
              <th>P. Mayorista</th>
              <th>Stock</th>
              <th>Tipo</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="prod in productosFiltrados" :key="prod.id">
              <td class="col-producto">
                <div class="info-nombre">
                  <span class="nombre">{{ prod.nombre }}</span>
                  <span v-if="Number(prod.stock_actual) <= Number(prod.stock_minimo)" class="badge-alerta">
                    Stock bajo
                  </span>
                </div>
              </td>
              <td>
                <span class="categoria-badge">{{ prod.descripcion || 'Ninguna' }}</span>
              </td>
              <td>
                <span class="categoria-badge">{{ prod.categorias?.nombre || 'Sin Categoría' }}</span>
              </td>
              <td class="sku">{{ prod.sku || '-' }}</td>
              <td>C$ {{ Number(prod.costo || 0).toFixed(2) }}</td>
              <td class="precio-destacado">C$ {{ Number(prod.precio_venta || 0).toFixed(2) }}</td>
              <td>
                <template v-if="prod.precio_mayorista && Number(prod.precio_mayorista) > 0">
                  C$ {{ Number(prod.precio_mayorista).toFixed(2) }}
                </template>
              </td>
              <td>
                <span class="stock-pill" :class="{ 'critico': Number(prod.stock_actual) <= Number(prod.stock_minimo) }">
                  {{ prod.stock_actual ?? 0 }}
                </span>
              </td>
              <td>
                <span class="tipo-tag">{{ prod.tipo || 'producto' }}</span>
              </td>
              <td class="text-center">
                <div class="acciones">
                  <button class="btn-icon" @click="abrirModal(prod)" title="Editar">
                    <Icon icon="mdi:pencil-outline" />
                  </button>
                  <button class="btn-icon danger" @click="confirmarEliminar(prod)" title="Eliminar">
                    <Icon icon="mdi:trash-can-outline" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Formulario (Crear / Editar) -->
    <transition name="fade">
      <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ editandoId ? 'Editar Producto' : 'Nuevo Producto' }}</h3>
            <button class="btn-close" @click="cerrarModal">
              <Icon icon="mdi:close" />
            </button>
          </div>
          <div v-if="errorForm" class="mensaje-error">
                    <Icon icon="mdi:alert-circle-outline" />
                    <span>{{ errorForm }}</span>
                </div>

          <form @submit.prevent="guardarProducto" class="modal-form">
            <div class="form-grid">
                <!-- Banner de error dinámico -->
                
              <div class="form-group span-2">
                <label>Nombre del Producto *</label>
                <input v-model="form.nombre" type="text" required placeholder="Ej. Filtro de Aceite" />
              </div>

              <div class="form-group span-2">
                <label>Descripción</label>
                <input v-model="form.descripcion" type="text" placeholder="Ej. Filtro de Aceite de alta calidad" />
              </div>

              <div class="form-group">
                <label>SKU / Código</label>
                <input v-model="form.sku" type="text" placeholder="Ej. MOP-102" />
              </div>

              <div class="form-group">
                <label>Categoría</label>
                <select v-model="form.categoria_id" required>
                  <option :value="null" disabled>Selecciona una categoría</option>
                  <option v-for="cat in categorias" :key="cat.id" :value="cat.id">
                    {{ cat.nombre }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Tipo</label>
                <select v-model="form.tipo">
                  <option value="producto">Producto</option>
                  <option value="servicio">Servicio</option>
                </select>
              </div>

              <div class="form-group">
                <label>Costo (C$)</label>
                <input v-model.number="form.costo" type="number" step="0.01" min="0" placeholder="0.00" required/>
              </div>

              <div class="form-group">
                <label>Precio Venta (C$) *</label>
                <input v-model.number="form.precio_venta" type="number" step="0.01" min="0" required placeholder="0.00" />
              </div>

              <div class="form-group span-2">
                <label>Precio Mayorista (C$)</label>
                <input v-model.number="form.precio_mayorista" type="number" step="0.01" min="0" placeholder="Opcional" />
              </div>

              <div class="form-group">
                <label>Stock Actual</label>
                <input v-model.number="form.stock_actual" type="number" step="any" placeholder="0" />
              </div>

              <div class="form-group">
                <label>Stock Mínimo</label>
                <input v-model.number="form.stock_minimo" type="number" step="any" placeholder="5" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secundario" @click="cerrarModal">Cancelar</button>
              <button type="submit" class="btn-primario" :disabled="guardando">
                <Icon v-if="guardando" icon="mdi:loading" class="spin" />
                <span>{{ guardando ? 'Guardando...' : 'Guardar Producto' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
    <transition name="fade">
      <div v-if="modalEliminarAbierto" class="modal-overlay-eliminar" @click.self="cerrarModalEliminar">
        <div class="modal-confirm">
          <div class="modal-body-confirm">
            <div class="icon-warning">
              <Icon icon="eva:alert-triangle-outline" />
            </div>
            <h3>Eliminar Producto</h3>
            <p>
              ¿Estás seguro de que deseas eliminar a <strong>{{ productoAEliminar?.nombre }}</strong>? Esta acción no se puede deshacer.
            </p>
          </div>

          <div class="modal-footer-confirm">
            <button class="btn-secundario" @click="cerrarModalEliminar" :disabled="eliminando">
              Cancelar
            </button>
            <button class="btn-danger" @click="ejecutarEliminacion" :disabled="eliminando">
              <Icon v-if="eliminando" icon="mdi:loading" class="spin" />
              <span>{{ eliminando ? 'Eliminando...' : 'Sí, eliminar' }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../../supabase/supabase.js'
import Categoria from '../categorias/Categoria.vue'

const productos = ref([])
const categorias = ref([])
const busqueda = ref('')
const categoriaFiltro = ref('')
const stockFiltro = ref('') 
const cargando = ref(true)
const guardando = ref(false)
const modalAbierto = ref(false)
const editandoId = ref(null)
const eliminando = ref(false)


// Modal Eliminar
const modalEliminarAbierto = ref(false)
const productoAEliminar = ref(null)

const formInicial = {
  sku: '',
  nombre: '',
  descripcion: '',
  costo: null,
  precio_venta: null,
  precio_mayorista: null,
  stock_actual: 0,
  stock_minimo: 5,
  tipo: 'producto',
  categoria_id: null
}

const form = ref({ ...formInicial })


// Computada unificada que combina Búsqueda + Categoría + Stock Crítico
const productosFiltrados = computed(() => {
  return productos.value.filter(p => {
    // 1. Filtro por Texto (Búsqueda por Nombre o SKU)
    const q = busqueda.value.toLowerCase().trim()
    const coincideBusqueda = !q || 
      (p.nombre && p.nombre.toLowerCase().includes(q)) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))

    // 2. Filtro por Categoría
    const coincideCategoria = !categoriaFiltro.value || p.categoria_id === categoriaFiltro.value

    // 3. Filtro por Stock Crítico
    let coincideStock = true
    if (stockFiltro.value === 'critico') {
      const stock = Number(p.stock_actual ?? 0)
      const minimo = Number(p.stock_minimo ?? 0)
      coincideStock = stock <= minimo
    }

    // Deben cumplirse los tres filtros simultáneamente
    return coincideBusqueda && coincideCategoria && coincideStock
  })
})

const valorInventario = computed(() => {
  return productos.value.reduce((total, prod) => {
    const costo = Number(prod.costo || 0)
    const stock = Number(prod.stock_actual || 0)
    return total + (costo * stock)
  }, 0)
})

const cargarCategorias = async () => {
  try {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return

    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('user_id', userId)
      .order('nombre', { ascending: true })

    if (error) throw error
    categorias.value = data || []
  } catch (err) {
    console.error('Error cargando categorías:', err.message)
  }
}

const cargarProductos = async () => {
  cargando.value = true
  try {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id

    if (!userId) return

    // Hacemos un JOIN con la tabla de categorías para obtener el nombre directamente
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(nombre)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    productos.value = data || []
  } catch (err) {
    console.error('Error cargando productos:', err.message)
  } finally {
    cargando.value = false
  }
}



const errorForm = ref(null)


const abrirModal = (prod = null) => {
  errorForm.value = null // Limpiar error
  if (prod) {
    editandoId.value = prod.id
    form.value = {
      sku: prod.sku || '',
      nombre: prod.nombre || '',
      costo: prod.costo,
      precio_venta: prod.precio_venta,
      precio_mayorista: prod.precio_mayorista,
      stock_actual: prod.stock_actual ?? 0,
      stock_minimo: prod.stock_minimo ?? 5,
      tipo: prod.tipo || 'producto',
      categoria_id: prod.categoria_id || null
    }
  } else {
    editandoId.value = null
    form.value = { ...formInicial }
  }
  modalAbierto.value = true
}

const cerrarModal = () => {
  modalAbierto.value = false
  editandoId.value = null
  errorForm.value = null // Limpiar error
  form.value = { ...formInicial }
}
const guardarProducto = async () => {
  errorForm.value = null

  // 1. Validar nombre
  if (!form.value.nombre || !form.value.nombre.trim()) {
    errorForm.value = 'El nombre del producto es obligatorio.'
    return
  }

  if (!form.value.categoria_id) {
    errorForm.value = 'Debes seleccionar una categoría obligatoria para el producto.'
    return
  }


  // 2. Normalizar valores a números reales
  const costo = Number(form.value.costo) || 0
  const precioVenta = Number(form.value.precio_venta) || 0

  // Validar que se ingresó un precio de venta válido
  if (precioVenta <= 0) {
    errorForm.value = 'Ingresa un precio de venta mayor a 0.'
    return
  }

  // Validar costo vs precio de venta
  if (costo > 0 && precioVenta < costo) {
    errorForm.value = `El precio de venta (C$ ${precioVenta.toFixed(2)}) no puede ser menor al costo (C$ ${costo.toFixed(2)}).`
    return
  }

  const skuLimpio = form.value.sku ? String(form.value.sku).trim() : null
  guardando.value = true

  try {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id

    if (!userId) {
      errorForm.value = 'Sesión no válida. Por favor, vuelve a iniciar sesión.'
      return
    }

    // 3. Validar SKU duplicado localmente
    if (skuLimpio) {
      const existeSku = productos.value.some(p => 
        p.sku && 
        String(p.sku).toLowerCase() === skuLimpio.toLowerCase() && 
        p.id !== editandoId.value
      )

      if (existeSku) {
        errorForm.value = `El SKU "${skuLimpio}" ya está registrado.`
        return
      }
    }

    
    // Preparar datos limpios para Supabase (Protegido contra null/undefined)
    const payload = {
      sku: skuLimpio,
      nombre: form.value.nombre.trim(),
      // Protegido: Si es null o undefined usa '' antes de aplicar trim
      descripcion: (form.value.descripcion || '').trim(), 
      costo: form.value.costo !== null && form.value.costo !== '' ? Number(form.value.costo) : null,
      precio_venta: precioVenta,
      precio_mayorista: form.value.precio_mayorista !== null && form.value.precio_mayorista !== '' ? Number(form.value.precio_mayorista) : null,
      stock_actual: form.value.stock_actual ? Number(form.value.stock_actual) : 0,
      stock_minimo: form.value.stock_minimo ? Number(form.value.stock_minimo) : 0,
      //  Protegido: Si tipo es null o undefined asigna 'producto'
      tipo: form.value.tipo ? String(form.value.tipo).toLowerCase() : 'producto',
      categoria_id: form.value.categoria_id || null,
      user_id: userId
    }

    if (editandoId.value) {
      const { error } = await supabase
        .from('productos')
        .update(payload)
        .eq('id', editandoId.value)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('productos')
        .insert([payload])

      if (error) throw error
    }

    cerrarModal()
    await cargarProductos()
  } catch (err) {
    if (err.code === '23505' || err.message?.includes('productos_sku_user_id_key')) {
      errorForm.value = `El SKU "${skuLimpio}" ya existe en la base de datos.`
    } else {
      errorForm.value = 'Error al guardar: ' + err.message
    }
  } finally {
    guardando.value = false
  }
}

// Control del Modal de Eliminar
const confirmarEliminar = (cliente) => {
  productoAEliminar.value = cliente
  modalEliminarAbierto.value = true
}

const cerrarModalEliminar = () => {
  modalEliminarAbierto.value = false
  productoAEliminar.value = null
  eliminando.value = false
}
const ejecutarEliminacion = async () => {
  if (!productoAEliminar.value) return

  eliminando.value = true
  try {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', productoAEliminar.value.id)

    if (error) throw error

    cerrarModalEliminar()
    await cargarProductos()
  } catch (err) {
    alert('Error al eliminar producto: ' + err.message)
    eliminando.value = false
  }
}
// const eliminarProducto = async (id) => {
//   if (!confirm('¿Estás seguro de eliminar este producto?')) return
//   try {
//     const { error } = await supabase.from('productos').delete().eq('id', id)
//     if (error) throw error
//     await cargarProductos()
//   } catch (err) {
//     alert('Error al eliminar: ' + err.message)
//   }
// }

onMounted(() => {
  cargarCategorias()
  cargarProductos()
})

const recargarVista = async () => {
  await cargarCategorias()
  await cargarProductos()
}
</script>

<style scoped>
.inventario-container {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.vista-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.vista-header h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.subtitulo {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.15rem;
}

/* Tarjetas de Métricas */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.metric-card {
  background: #ffffff;
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.metric-icon {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.metric-icon.blue {
  background: #eff6ff;
  color: #2563eb;
}

.metric-icon.green {
  background: #f0fdf4;
  color: #16a34a;
}

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 600;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin-top: 0.1rem;
}

/* Filtros */
.filtros-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  margin-bottom: 1.25rem;
  gap: 1rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  flex: 1;
  max-width: 380px;
}

.search-icon {
  font-size: 1.2rem;
  color: #94a3b8;
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
  font-size: 0.88rem;
  color: #0f172a;
}

.filter-select select {
  padding: 0.45rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  font-size: 0.88rem;
  color: #334155;
  outline: none;
}

.tabla-card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.88rem;
}

th {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}

tr:hover {
  background: #f8fafc;
}

.col-producto {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info-nombre {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.info-nombre .nombre {
  font-weight: 600;
  color: #0f172a;
}

.categoria-badge {
  font-size: 0.78rem;
  color: #475569;
  background: #f1f5f9;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.badge-alerta {
  font-size: 0.68rem;
  font-weight: 700;
  color: #dc2626;
  background: #fef2f2;
  padding: 1px 6px;
  border-radius: 4px;
  width: fit-content;
}

.sku {
  font-family: monospace;
  font-size: 0.82rem;
  color: #64748b;
}

.precio-destacado {
  font-weight: 700;
  color: #0f172a;
}

.stock-pill {
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  background: #f1f5f9;
  color: #334155;
}

.stock-pill.critico {
  background: #fef2f2;
  color: #dc2626;
}

.tipo-tag {
  text-transform: capitalize;
  font-size: 0.75rem;
  background: #eff6ff;
  color: #2563eb;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
}

.acciones {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #64748b;
  padding: 0.3rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-icon:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-icon.danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

.estado-mensaje {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem;
  color: #64748b;
  gap: 0.5rem;
}

.icon-empty {
  font-size: 2.5rem;
  color: #cbd5e1;
}

/* Botones Principales */
.btn-primario {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-primario:hover {
  background: #1d4ed8;
}

.btn-secundario {
  background: #f1f5f9;
  color: #334155;
  border: none;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-card {
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
  max-height:100vh;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
  overflow:scroll;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #64748b;
  cursor: pointer;
}
.mensaje-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.mensaje-error svg {
  font-size: 1.1rem;
  flex-shrink: 0;
}
.modal-form {
  padding: 1.25rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.span-2 {
  grid-column: span 2;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-group label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
}

.form-group input, .form-group select {
  padding: 0.5rem 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.88rem;
  outline: none;
}

.form-group input:focus, .form-group select:focus {
  border-color: #2563eb;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.spin {
  animation: spin 1s linear infinite;
}


/* Estilos para modal de confirmación */
.modal-overlay-eliminar {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal-confirm { 
  background: #ffffff;
  border-radius: 12px;
  max-width: 400px; 
  text-align: center; 
}

.modal-body-confirm { 
  padding: 1.5rem 1.25rem 1rem 1.25rem; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
}

.icon-warning { 
  width: 50px; 
  height: 50px; 
  background: #fef2f2; 
  color: #dc2626; 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 1.8rem; 
  margin-bottom: 0.85rem; 
}

.modal-body-confirm h3 { 
  font-size: 1.15rem; 
  color: #0f172a; 
  margin: 0 0 0.5rem 0; 
  font-weight: 700; 
}

.modal-body-confirm p { 
  font-size: 0.88rem; 
  color: #64748b; 
  margin: 0; 
  line-height: 1.4; 
}

.modal-footer-confirm { 
  display: flex; 
  justify-content: center; 
  gap: 0.75rem; 
  padding: 1rem 1.25rem 1.25rem 1.25rem; 
}

.btn-danger {
  display: flex; 
  align-items: center; 
  gap: 0.4rem; 
  background: #dc2626; 
  color: #ffffff;
  border: none; 
  padding: 0.55rem 1rem; 
  border-radius: 8px; 
  font-weight: 600; 
  font-size: 0.88rem; 
  cursor: pointer;
}

.btn-danger:hover { 
  background: #b91c1c; 
}

.fade-enter-active, .fade-leave-active { 
  transition: opacity 0.2s ease; 
}

.fade-enter-from, .fade-leave-to { 
  opacity: 0; 
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media screen and (max-width: 640px) {
   .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.4);
        z-index: 1050;
        display: flex;
        align-items: center;
        justify-content: center;
        padding:1rem;

    }
    .modal-form{
        padding:.1rem;
        overflow: scroll;
    }
  .vista-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .filtros-card {
    flex-direction: column;
    align-items: stretch;
  }
  .search-box {
    max-width: 100%;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .span-2 {
    grid-column: span 1;
  }
}
</style>