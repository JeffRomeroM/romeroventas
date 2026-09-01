<template>
  <div class="clientes-container">
    <div class="vista-header">
      <div>
        <h2>Clientes</h2>
        <p class="subtitulo">Gestión del directorio de clientes y saldos de crédito</p>
      </div>
      <button class="btn-primario" @click="abrirModal()">
        <Icon icon="mdi:account-plus-outline" />
        <span>Nuevo Cliente</span>
      </button>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon blue">
          <Icon icon="mdi:account-group-outline" />
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Clientes</span>
          <span class="metric-value">{{ clientesFiltrados.length }}</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon red">
          <Icon icon="mdi:cash-clock" />
        </div>
        <div class="metric-info">
          <span class="metric-label">Deuda Total por Cobrar</span>
          <span class="metric-value text-red">C$ {{ formatMonto(totalDeudaGlobal) }}</span>
        </div>
      </div>
    </div>

    <div class="filtros-card">
      <div class="search-box">
        <Icon icon="mdi:magnify" class="search-icon" />
        <input 
          v-model="busqueda" 
          type="text" 
          placeholder="Buscar por nombre, teléfono o dirección..." 
        />
      </div>
    </div>

    <div class="tabla-card">
      <div v-if="cargando" class="estado-mensaje">
        <Icon icon="mdi:loading" class="spin" />
        <p>Cargando clientes y saldos...</p>
      </div>

      <div v-else-if="clientesFiltrados.length === 0" class="estado-mensaje">
        <Icon icon="mdi:account-off-outline" class="icon-empty" />
        <p>No se encontraron clientes registrados.</p>
      </div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Deuda Actual</th>
              <th>Límite de Crédito</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cliente in clientesFiltrados" :key="cliente.id">
              <td class="col-nombre">
                <span class="nombre">{{ cliente.nombre }}</span>
              </td>
              <td>
                <span v-if="cliente.telefono" class="telefono">
                  <Icon icon="mdi:phone-outline" />
                  {{ cliente.telefono }}
                </span>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span v-if="cliente.direccion" class="direccion">
                  {{ cliente.direccion }}
                </span>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span 
                  class="badge-deuda" 
                  :class="cliente.deudaActual > 0 ? 'con-deuda' : 'sin-deuda'"
                >
                  C$ {{ formatMonto(cliente.deudaActual) }}
                </span>
              </td>
              <td class="precio-destacado">
                C$ {{ formatMonto(cliente.limite_credito) }}
              </td>
              <td class="text-center">
                <div class="acciones">
                  <button class="btn-icon" @click="abrirModal(cliente)" title="Editar">
                    <Icon icon="mdi:pencil-outline" />
                  </button>
                  <button class="btn-icon danger" @click="confirmarEliminar(cliente)" title="Eliminar">
                    <Icon icon="mdi:trash-can-outline" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <transition name="fade">
      <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ editandoId ? 'Editar Cliente' : 'Nuevo Cliente' }}</h3>
            <button class="btn-close" @click="cerrarModal">
              <Icon icon="mdi:close" />
            </button>
          </div>

          <form @submit.prevent="guardarCliente" class="modal-form">
            <div v-if="errorForm" class="mensaje-error">
              <Icon icon="mdi:alert-circle-outline" />
              <span>{{ errorForm }}</span>
            </div>

            <div class="form-grid">
              <div class="form-group span-2">
                <label>Nombre del Cliente *</label>
                <input v-model="form.nombre" type="text" required placeholder="Ej. Juan Pérez" />
              </div>

              <div class="form-group">
                <label>Teléfono</label>
                <input v-model="form.telefono" type="text" placeholder="Ej. 8888-8888" />
              </div>

              <div class="form-group">
                <label>Límite de Crédito (C$)</label>
                <input v-model.number="form.limite_credito" type="number" step="0.01" min="0" placeholder="0.00" />
              </div>

              <div class="form-group span-2">
                <label>Dirección</label>
                <textarea v-model="form.direccion" rows="2" placeholder="Ej. Barrio Central, contiguo a la iglesia"></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secundario" @click="cerrarModal">Cancelar</button>
              <button type="submit" class="btn-primario" :disabled="guardando">
                <Icon v-if="guardando" icon="mdi:loading" class="spin" />
                <span>
                  {{ guardando 
                      ? (editandoId ? 'Actualizando...' : 'Guardando...') 
                      : (editandoId ? 'Actualizar Cliente' : 'Guardar Cliente') 
                  }}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="modalEliminarAbierto" class="modal-overlay" @click.self="cerrarModalEliminar">
        <div class="modal-card modal-confirm">
          <div class="modal-body-confirm">
            <div class="icon-warning">
              <Icon icon="eva:alert-triangle-outline" />
            </div>
            <h3>Eliminar Cliente</h3>
            <p>
              ¿Estás seguro de que deseas eliminar a <strong>{{ clienteAEliminar?.nombre }}</strong>? Esta acción no se puede deshacer.
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

// Estado general
const clientes = ref([])
const cargando = ref(true)
const guardando = ref(false)
const eliminando = ref(false)
const busqueda = ref('')

// Modal Crear/Editar
const modalAbierto = ref(false)
const editandoId = ref(null)
const errorForm = ref(null)

// Modal Eliminar
const modalEliminarAbierto = ref(false)
const clienteAEliminar = ref(null)

const formInicial = {
  nombre: '',
  telefono: '',
  direccion: '',
  limite_credito: 0
}

const form = ref({ ...formInicial })

const formatMonto = (v) => Number(v || 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Computado de filtrado simple
const clientesFiltrados = computed(() => {
  const q = busqueda.value.toLowerCase().trim()
  if (!q) return clientes.value

  return clientes.value.filter(c => {
    return (
      (c.nombre && c.nombre.toLowerCase().includes(q)) ||
      (c.telefono && c.telefono.toLowerCase().includes(q)) ||
      (c.direccion && c.direccion.toLowerCase().includes(q))
    )
  })
})

const totalDeudaGlobal = computed(() => {
  return clientes.value.reduce((acc, c) => acc + (c.deudaActual || 0), 0)
})

// Carga de Clientes + Consulta de Deuda Real
const cargarClientes = async () => {
  cargando.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Obtener los clientes base
    const { data: dataClientes, error: errClientes } = await supabase
      .from('clientes')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre', { ascending: true })

    if (errClientes) throw errClientes

    // 2. Obtener resumen de deudas activas/pendientes desde la vista o tabla de créditos
    const { data: dataCreditos } = await supabase
      .from('vista_resumen_creditos_cliente')
      .select('cliente_id, saldo_pendiente')

    // Mapa auxiliar para asociar rápidamente cliente_id -> deuda acumulada
    const deudasMap = new Map()
    if (dataCreditos) {
      dataCreditos.forEach(c => {
        const id = c.cliente_id
        const saldo = Number(c.saldo_pendiente || 0)
        deudasMap.set(id, (deudasMap.get(id) || 0) + saldo)
      })
    }

    // 3. Mapear datos finales inyectando la deuda calculada
    clientes.value = (dataClientes || []).map(cliente => ({
      ...cliente,
      deudaActual: deudasMap.get(cliente.id) || Number(cliente.deuda || 0)
    }))

  } catch (err) {
    console.error('Error cargando clientes:', err.message)
  } finally {
    cargando.value = false
  }
}

const abrirModal = (cliente = null) => {
  errorForm.value = null
  if (cliente) {
    editandoId.value = cliente.id
    form.value = {
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      limite_credito: cliente.limite_credito ?? 0
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
  errorForm.value = null
  form.value = { ...formInicial }
}

const guardarCliente = async () => {
  errorForm.value = null

  if (!form.value.nombre || !form.value.nombre.trim()) {
    errorForm.value = 'El nombre del cliente es obligatorio.'
    return
  }

  guardando.value = true

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      errorForm.value = 'Sesión no válida. Vuelve a iniciar sesión.'
      return
    }

    const payload = {
      nombre: form.value.nombre.trim(),
      telefono: form.value.telefono ? form.value.telefono.trim() : null,
      direccion: form.value.direccion ? form.value.direccion.trim() : null,
      limite_credito: Number(form.value.limite_credito) || 0,
      user_id: user.id
    }

    if (editandoId.value) {
      const { error } = await supabase
        .from('clientes')
        .update(payload)
        .eq('id', editandoId.value)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('clientes')
        .insert([payload])

      if (error) throw error
    }

    cerrarModal()
    await cargarClientes()
  } catch (err) {
    errorForm.value = 'Error al guardar el cliente: ' + err.message
  } finally {
    guardando.value = false
  }
}

// Control del Modal de Eliminar
const confirmarEliminar = (cliente) => {
  clienteAEliminar.value = cliente
  modalEliminarAbierto.value = true
}

const cerrarModalEliminar = () => {
  modalEliminarAbierto.value = false
  clienteAEliminar.value = null
  eliminando.value = false
}

const ejecutarEliminacion = async () => {
  if (!clienteAEliminar.value) return

  eliminando.value = true
  try {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', clienteAEliminar.value.id)

    if (error) throw error

    cerrarModalEliminar()
    await cargarClientes()
  } catch (err) {
    alert('Error al eliminar cliente: ' + err.message)
    eliminando.value = false
  }
}

onMounted(() => {
  cargarClientes()
})
</script>

<style scoped>
.clientes-container {
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

.metric-icon.blue { background: #eff6ff; color: #2563eb; }
.metric-icon.red { background: #fef2f2; color: #dc2626; }

.metric-info { display: flex; flex-direction: column; }
.metric-label { font-size: 0.78rem; color: #64748b; font-weight: 600; }
.metric-value { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-top: 0.1rem; }
.text-red { color: #dc2626; }

.filtros-card {
  background: #ffffff;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  margin-bottom: 1.25rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  width: 100%;
}

.search-icon { font-size: 1.2rem; color: #94a3b8; }
.search-box input { border: none; background: transparent; outline: none; width: 100%; font-size: 0.88rem; color: #0f172a; }

.tabla-card { background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; }
.table-wrapper { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; }
th { background: #f8fafc; color: #475569; font-weight: 700; padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
td { padding: 0.85rem 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
tr:hover { background: #f8fafc; }

.col-nombre .nombre { font-weight: 600; color: #0f172a; }
.telefono { display: inline-flex; align-items: center; gap: 0.3rem; font-family: monospace; color: #475569; }
.direccion { color: #475569; font-size: 0.85rem; }
.precio-destacado { font-weight: 700; color: #0f172a; }
.text-muted { color: #94a3b8; }

.badge-deuda {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.82rem;
}
.badge-deuda.con-deuda { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.badge-deuda.sin-deuda { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

.acciones { display: flex; justify-content: center; gap: 0.4rem; }
.btn-icon { background: none; border: none; font-size: 1.1rem; color: #64748b; padding: 0.3rem; border-radius: 6px; cursor: pointer; }
.btn-icon:hover { background: #f1f5f9; color: #0f172a; }
.btn-icon.danger:hover { background: #fef2f2; color: #dc2626; }

.btn-primario {
  display: flex; align-items: center; gap: 0.4rem; background: #2563eb; color: #ffffff;
  border: none; padding: 0.55rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.88rem; cursor: pointer;
}
.btn-primario:hover { background: #1d4ed8; }

.btn-secundario {
  background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 0.55rem 1rem;
  border-radius: 8px; font-weight: 600; font-size: 0.88rem; cursor: pointer;
}

.btn-danger {
  display: flex; align-items: center; gap: 0.4rem; background: #dc2626; color: #ffffff;
  border: none; padding: 0.55rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.88rem; cursor: pointer;
}
.btn-danger:hover { background: #b91c1c; }

.estado-mensaje { display: flex; flex-direction: column; align-items: center; padding: 3rem 1rem; color: #64748b; gap: 0.5rem; }
.icon-empty { font-size: 2.5rem; color: #cbd5e1; }

.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.modal-card { background: #ffffff; border-radius: 12px; width: 100%; max-width: 480px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; }
.modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
.btn-close { background: none; border: none; font-size: 1.2rem; color: #64748b; cursor: pointer; }

.modal-form { padding: 1.25rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
.span-2 { grid-column: span 2; }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group label { font-size: 0.78rem; font-weight: 700; color: #475569; }
.form-group input, .form-group textarea { padding: 0.5rem 0.65rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem; outline: none; font-family: inherit; }
.form-group input:focus, .form-group textarea:focus { border-color: #2563eb; }

.mensaje-error {
  display: flex; align-items: center; gap: 0.5rem; background-color: #fef2f2;
  border: 1px solid #fecaca; color: #dc2626; padding: 0.65rem 0.85rem;
  border-radius: 8px; font-size: 0.82rem; font-weight: 600; margin-bottom: 1rem;
}

.modal-footer { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }

.modal-confirm { max-width: 400px; text-align: center; }
.modal-body-confirm { padding: 1.5rem 1.25rem 1rem 1.25rem; display: flex; flex-direction: column; align-items: center; }
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

.modal-body-confirm h3 { font-size: 1.15rem; color: #0f172a; margin: 0 0 0.5rem 0; font-weight: 700; }
.modal-body-confirm p { font-size: 0.88rem; color: #64748b; margin: 0; line-height: 1.4; }
.modal-footer-confirm { display: flex; justify-content: center; gap: 0.75rem; padding: 1rem 1.25rem 1.25rem 1.25rem; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@media screen and (max-width: 640px) {
  .vista-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .form-grid { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
}
</style>