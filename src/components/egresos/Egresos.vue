<template>
  <div class="egresos-container">
    <!-- Header -->
    <div class="vista-header">
      <div>
        <h2>Egresos y Gastos</h2>
        <p class="subtitulo">Control de gastos operativos, salarios y servicios</p>
      </div>
      <button class="btn-primario" @click="abrirModal()">
        <Icon icon="mdi:minus-circle-outline" />
        <span>Registrar Egreso</span>
      </button>
    </div>

    <!-- Métricas -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon red">
          <Icon icon="mdi:cash-minus" />
        </div>
        <div class="metric-info">
          <span class="metric-label">Total Egresos</span>
          <span class="metric-value">C$ {{ totalMontoEgresos.toFixed(2) }}</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon slate">
          <Icon icon="mdi:format-list-bulleted" />
        </div>
        <div class="metric-info">
          <span class="metric-label">Registros</span>
          <span class="metric-value">{{ egresosFiltrados.length }}</span>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filtros-card">
      <div class="search-box">
        <Icon icon="mdi:magnify" class="search-icon" />
        <input 
          v-model="busqueda" 
          type="text" 
          placeholder="Buscar por concepto o comprobante..." 
        />
      </div>
      <select v-model="filtroCategoria" class="select-categoria">
        <option value="">Todas las categorías</option>
        <option v-for="cat in categorias" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>

    <!-- Tabla -->
    <div class="tabla-card">
      <div v-if="cargando" class="estado-mensaje">
        <Icon icon="mdi:loading" class="spin" />
        <p>Cargando egresos...</p>
      </div>

      <div v-else-if="egresosFiltrados.length === 0" class="estado-mensaje">
        <Icon icon="mdi:receipt-text-remove-outline" class="icon-empty" />
        <p>No se encontraron registros de egresos.</p>
      </div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Categoría</th>
              <th>Comprobante</th>
              <th>Monto</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="egreso in egresosFiltrados" :key="egreso.id">
              <td class="col-fecha">{{ formatearFecha(egreso.fecha) }}</td>
              <td class="col-concepto">
                <span class="concepto-texto">{{ egreso.concepto }}</span>
                <span v-if="egreso.observaciones" class="observacion-sub">{{ egreso.observaciones }}</span>
              </td>
              <td>
                <span class="badge-categoria">{{ egreso.categoria }}</span>
              </td>
              <td>{{ egreso.comprobante || '-' }}</td>
              <td class="monto-destacado">
                C$ {{ Number(egreso.monto).toFixed(2) }}
              </td>
              <td class="text-center">
                <div class="acciones">
                  <button class="btn-icon" @click="abrirModal(egreso)" title="Editar">
                    <Icon icon="mdi:pencil-outline" />
                  </button>
                  <button class="btn-icon danger" @click="confirmarEliminar(egreso)" title="Eliminar">
                    <Icon icon="mdi:trash-can-outline" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL CREAR / EDITAR EGRESO -->
    <transition name="fade">
      <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ editandoId ? 'Editar Egreso' : 'Nuevo Egreso' }}</h3>
            <button class="btn-close" @click="cerrarModal">
              <Icon icon="mdi:close" />
            </button>
          </div>

          <form @submit.prevent="guardarEgreso" class="modal-form">
            <div v-if="errorForm" class="mensaje-error">
              <Icon icon="mdi:alert-circle-outline" />
              <span>{{ errorForm }}</span>
            </div>

            <div class="form-grid">
              <div class="form-group span-2">
                <label>Concepto / Descripción *</label>
                <input v-model="form.concepto" type="text" required placeholder="Ej. Pago de energía eléctrica - local" />
              </div>

              <div class="form-group">
                <label>Categoría *</label>
                <select v-model="form.categoria" required>
                  <option value="" disabled>Seleccionar...</option>
                  <option v-for="cat in categorias" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>

              <div class="form-group">
                <label>Monto (C$) *</label>
                <input v-model.number="form.monto" type="number" step="0.01" min="0.01" required placeholder="0.00" />
              </div>

              <div class="form-group">
                <label>Fecha *</label>
                <input v-model="form.fecha" type="date" required />
              </div>

              <div class="form-group">
                <label>Nº Comprobante / Recibo</label>
                <input v-model="form.comprobante" type="text" placeholder="Ej. REC-00123" />
              </div>

              <div class="form-group span-2">
                <label>Observaciones</label>
                <textarea v-model="form.observaciones" rows="2" placeholder="Detalles adicionales sobre el egreso..."></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secundario" @click="cerrarModal">Cancelar</button>
              <button type="submit" class="btn-primario" :disabled="guardando">
                <Icon v-if="guardando" icon="mdi:loading" class="spin" />
                <span>
                  {{ guardando 
                      ? (editandoId ? 'Actualizando...' : 'Guardando...') 
                      : (editandoId ? 'Actualizar Egreso' : 'Guardar Egreso') 
                  }}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- MODAL CONFIRMACIÓN ELIMINACIÓN -->
    <transition name="fade">
      <div v-if="modalEliminarAbierto" class="modal-overlay" @click.self="cerrarModalEliminar">
        <div class="modal-card modal-confirm">
          <div class="modal-body-confirm">
            <div class="icon-warning">
              <Icon icon="mdi:alert-triangle-outline" />
            </div>
            <h3>Eliminar Egreso</h3>
            <p>
              ¿Estás seguro de que deseas eliminar el egreso <strong>"{{ egresoAEliminar?.concepto }}"</strong> de C$ {{ Number(egresoAEliminar?.monto || 0).toFixed(2) }}?
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

const categorias = [
  'Salarios',
  'Servicios Básicos',
  'Alquiler',
  'Mantenimiento',
  'Transporte y Fletes',
  'Suministros de Oficina',
  'Impuestos y Tasas',
  'Otros Gastos'
]

const egresos = ref([])
const cargando = ref(true)
const guardando = ref(false)
const eliminando = ref(false)
const busqueda = ref('')
const filtroCategoria = ref('')

const modalAbierto = ref(false)
const editandoId = ref(null)
const errorForm = ref(null)

const modalEliminarAbierto = ref(false)
const egresoAEliminar = ref(null)

const formInicial = {
  concepto: '',
  categoria: '',
  monto: null,
  fecha: new Date().toISOString().split('T')[0],
  comprobante: '',
  observaciones: ''
}

const form = ref({ ...formInicial })

const egresosFiltrados = computed(() => {
  return egresos.value.filter(e => {
    const q = busqueda.value.toLowerCase().trim()
    const coincideTexto = !q || 
      (e.concepto && e.concepto.toLowerCase().includes(q)) ||
      (e.comprobante && e.comprobante.toLowerCase().includes(q))

    const coincideCategoria = !filtroCategoria.value || e.categoria === filtroCategoria.value

    return coincideTexto && coincideCategoria
  })
})

const totalMontoEgresos = computed(() => {
  return egresosFiltrados.value.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0)
})

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '-'
  const [year, month, day] = fechaStr.split('-')
  return `${day}/${month}/${year}`
}

const cargarEgresos = async () => {
  cargando.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('egresos')
      .select('*')
      .eq('user_id', user.id)
      .order('fecha', { ascending: false })

    if (error) throw error
    egresos.value = data || []
  } catch (err) {
    console.error('Error cargando egresos:', err.message)
  } finally {
    cargando.value = false
  }
}

const abrirModal = (egreso = null) => {
  errorForm.value = null
  if (egreso) {
    editandoId.value = egreso.id
    form.value = {
      concepto: egreso.concepto || '',
      categoria: egreso.categoria || '',
      monto: egreso.monto ?? null,
      fecha: egreso.fecha || new Date().toISOString().split('T')[0],
      comprobante: egreso.comprobante || '',
      observaciones: egreso.observaciones || ''
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

const guardarEgreso = async () => {
  errorForm.value = null

  if (!form.value.concepto || !form.value.concepto.trim()) {
    errorForm.value = 'El concepto es obligatorio.'
    return
  }
  if (!form.value.categoria) {
    errorForm.value = 'Debes seleccionar una categoría.'
    return
  }
  if (!form.value.monto || form.value.monto <= 0) {
    errorForm.value = 'Ingresa un monto válido mayor a 0.'
    return
  }

  guardando.value = true

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Sesión no válida.')

    const payload = {
      concepto: form.value.concepto.trim(),
      categoria: form.value.categoria,
      monto: Number(form.value.monto),
      fecha: form.value.fecha,
      comprobante: form.value.comprobante ? form.value.comprobante.trim() : null,
      observaciones: form.value.observaciones ? form.value.observaciones.trim() : null,
      user_id: user.id
    }

    if (editandoId.value) {
      const { error } = await supabase
        .from('egresos')
        .update(payload)
        .eq('id', editandoId.value)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('egresos')
        .insert([payload])
      if (error) throw error
    }

    cerrarModal()
    await cargarEgresos()
  } catch (err) {
    errorForm.value = 'Error al guardar el egreso: ' + err.message
  } finally {
    guardando.value = false
  }
}

const confirmarEliminar = (egreso) => {
  egresoAEliminar.value = egreso
  modalEliminarAbierto.value = true
}

const cerrarModalEliminar = () => {
  modalEliminarAbierto.value = false
  egresoAEliminar.value = null
  eliminando.value = false
}

const ejecutarEliminacion = async () => {
  if (!egresoAEliminar.value) return

  eliminando.value = true
  try {
    const { error } = await supabase
      .from('egresos')
      .delete()
      .eq('id', egresoAEliminar.value.id)

    if (error) throw error

    cerrarModalEliminar()
    await cargarEgresos()
  } catch (err) {
    alert('Error al eliminar egreso: ' + err.message)
    eliminando.value = false
  }
}

onMounted(() => {
  cargarEgresos()
})
</script>

<style scoped>
.egresos-container {
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

.vista-header h2 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
.subtitulo { font-size: 0.85rem; color: #64748b; margin-top: 0.15rem; }

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

.metric-icon.red { background: #fef2f2; color: #dc2626; }
.metric-icon.slate { background: #f8fafc; color: #475569; }

.metric-info { display: flex; flex-direction: column; }
.metric-label { font-size: 0.78rem; color: #64748b; font-weight: 600; }
.metric-value { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-top: 0.1rem; }

.filtros-card {
  background: #ffffff;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  margin-bottom: 1.25rem;
  display: flex;
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
}

.search-icon { font-size: 1.2rem; color: #94a3b8; }
.search-box input { border: none; background: transparent; outline: none; width: 100%; font-size: 0.88rem; color: #0f172a; }

.select-categoria {
  padding: 0.45rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  font-size: 0.88rem;
  color: #0f172a;
  outline: none;
}

.tabla-card { background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; }
.table-wrapper { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem; }
th { background: #f8fafc; color: #475569; font-weight: 700; padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
td { padding: 0.85rem 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
tr:hover { background: #f8fafc; }

.col-fecha { font-family: monospace; color: #64748b; white-space: nowrap; }
.col-concepto { display: flex; flex-direction: column; }
.concepto-texto { font-weight: 600; color: #0f172a; }
.observacion-sub { font-size: 0.78rem; color: #64748b; }

.badge-categoria {
  background: #f1f5f9;
  color: #334155;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.monto-destacado { font-weight: 700; color: #dc2626; white-space: nowrap; }

.acciones { display: flex; justify-content: center; gap: 0.4rem; }
.btn-icon { background: none; border: none; font-size: 1.1rem; color: #64748b; padding: 0.3rem; border-radius: 6px; cursor: pointer; }
.btn-icon:hover { background: #f1f5f9; color: #0f172a; }
.btn-icon.danger:hover { background: #fef2f2; color: #dc2626; }

.btn-primario {
  display: flex; align-items: center; gap: 0.4rem; background: #dc2626; color: #ffffff;
  border: none; padding: 0.55rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.88rem; cursor: pointer;
}
.btn-primario:hover { background: #b91c1c; }

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
.modal-card { background: #ffffff; border-radius: 12px; width: 100%; max-width: 520px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; }
.modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
.btn-close { background: none; border: none; font-size: 1.2rem; color: #64748b; cursor: pointer; }

.modal-form { padding: 1.25rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
.span-2 { grid-column: span 2; }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group label { font-size: 0.78rem; font-weight: 700; color: #475569; }
.form-group input, .form-group select, .form-group textarea { padding: 0.5rem 0.65rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem; outline: none; font-family: inherit; background: #ffffff; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #dc2626; }

.mensaje-error {
  display: flex; align-items: center; gap: 0.5rem; background-color: #fef2f2;
  border: 1px solid #fecaca; color: #dc2626; padding: 0.65rem 0.85rem;
  border-radius: 8px; font-size: 0.82rem; font-weight: 600; margin-bottom: 1rem;
}

.modal-footer { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; }

.modal-confirm { max-width: 400px; text-align: center; }
.modal-body-confirm { padding: 1.5rem 1.25rem 1rem 1.25rem; display: flex; flex-direction: column; align-items: center; }
.icon-warning { width: 50px; height: 50px; background: #fef2f2; color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin-bottom: 0.85rem; }
.modal-body-confirm h3 { font-size: 1.15rem; color: #0f172a; margin: 0 0 0.5rem 0; font-weight: 700; }
.modal-body-confirm p { font-size: 0.88rem; color: #64748b; margin: 0; line-height: 1.4; }
.modal-footer-confirm { display: flex; justify-content: center; gap: 0.75rem; padding: 1rem 1.25rem 1.25rem 1.25rem; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@media screen and (max-width: 640px) {
  .vista-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .filtros-card { flex-direction: column; }
  .form-grid { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
}
</style>