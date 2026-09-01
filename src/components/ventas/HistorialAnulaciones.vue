<template>
  <div class="anulaciones-container">
    <div class="panel-card">
      
      <!-- Header de la sección -->
      <div class="panel-header">
        <div>
          <h3>Historial de Facturas y Anulaciones</h3>
          <p class="subtitulo">Gestiona y revierte transacciones del sistema</p>
        </div>
        <div class="header-acciones">
          <div class="search-box">
            <Icon icon="mdi:magnify" class="search-icon" />
            <input 
              v-model="busqueda" 
              type="text" 
              placeholder="Buscar por cliente o código..." 
              class="input-search"
            />
          </div>
          <button class="btn-secundario" @click="cargarVentas">
            <Icon icon="mdi:refresh" /> Refrescar
          </button>
        </div>
      </div>

      <!-- Tabla de Ventas -->
      <div class="table-container">
        <div v-if="cargando" class="estado-cargando">
          <Icon icon="mdi:loading" class="spin" /> Cargando ventas...
        </div>

        <table v-else class="tabla-ventas">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Cliente</th>
              <th>Método Pago</th>
              <th class="text-right">Total Facturado</th>
              <th class="text-center">Estado</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in ventasFiltradas" :key="v.id" :class="{ 'row-anulada': v.estado === 'Anulada' }">
              <td>
                <div class="fecha-col">
                  <span class="f-fecha">{{ new Date(v.created_at).toLocaleDateString() }}</span>
                  <span class="f-hora">{{ new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
                </div>
              </td>
              <td>
                <span class="cliente-name">{{ v.clientes?.nombre || 'Cliente General' }}</span>
              </td>
              <td>
                <span class="badge-pago">{{ v.tipo_pago }}</span>
              </td>
              <td class="text-right font-bold">
                C$ {{ formatMonto(v.total) }}
              </td>
              <td class="text-center">
                <span :class="['tag-estado', v.estado === 'Anulada' ? 'tag-anulada' : 'tag-completada']">
                  {{ v.estado }}
                </span>
              </td>
              <td class="text-center">
                <button 
                  v-if="v.estado !== 'Anulada'" 
                  class="btn-anular"
                  @click="abrirModal(v)"
                >
                  <Icon icon="mdi:cancel" /> Anular Factura
                </button>
                <div v-else class="info-anulacion" :title="v.motivo_anulacion">
                  <Icon icon="mdi:information-outline" /> Motivo: {{ v.motivo_anulacion || 'Sin motivo' }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

    <!-- MODAL DE CONFIRMACIÓN -->
    <div v-if="modalVisible" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title-box">
            <Icon icon="mdi:alert-octagon" class="icon-warning" />
            <h3>Confirmar Anulación</h3>
          </div>
          <button class="btn-close" @click="modalVisible = false">✕</button>
        </div>

        <div class="modal-body">
          <p class="desc-modal">
            Estás a punto de anular la factura por <strong>C$ {{ formatMonto(facturaSeleccionada?.total) }}</strong>.
          </p>
          <div class="alerta-info-devolucion">
            <Icon icon="mdi:package-variant-plus" />
            <span>Los productos se reincorporarán automáticamente al stock del inventario.</span>
          </div>

          <div class="campo margin-top">
            <label>Motivo de la Anulación *</label>
            <textarea 
              v-model="motivo" 
              rows="3" 
              placeholder="Escribe la razón (Ej: Devolución, error de digitación...)"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secundario" @click="modalVisible = false">Cancelar</button>
          <button 
            class="btn-danger" 
            :disabled="!motivo.trim() || procesando" 
            @click="ejecutarAnulacion"
          >
            <Icon v-if="procesando" icon="mdi:loading" class="spin" />
            <span>{{ procesando ? 'Anulando...' : 'Confirmar Anulación' }}</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../../supabase/supabase.js'

const ventas = ref([])
const busqueda = ref('')
const cargando = ref(true)

const modalVisible = ref(false)
const facturaSeleccionada = ref(null)
const motivo = ref('')
const procesando = ref(false)

const formatMonto = (num) => Number(num || 0).toFixed(2)

const ventasFiltradas = computed(() => {
  const q = busqueda.value.toLowerCase().trim()
  if (!q) return ventas.value
  return ventas.value.filter(v => 
    (v.clientes?.nombre && v.clientes.nombre.toLowerCase().includes(q)) ||
    v.tipo_pago.toLowerCase().includes(q)
  )
})

const cargarVentas = async () => {
  cargando.value = true
  try {
    // 0. OBTENER EL USUARIO AUTENTICADO
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No hay una sesión activa.')

    // 1. CARGAR VENTAS FILTRADAS POR EL USUARIO ACTUAL
    const { data, error } = await supabase
      .from('ventas')
      .select('id, total, tipo_pago, estado, motivo_anulacion, created_at, clientes(nombre)')
      .eq('user_id', user.id) // <--- Filtro por usuario
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) throw error
    ventas.value = data || []
  } catch (err) {
    console.error('Error cargando historial de ventas:', err.message)
  } finally {
    cargando.value = false
  }
}

const ejecutarAnulacion = async () => {
  if (!facturaSeleccionada.value || !motivo.value.trim()) return
  procesando.value = true

  try {
    // 0. OBTENER EL USUARIO AUTENTICADO
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No hay una sesión activa.')

    // 1. EJECUTAR ANULACIÓN PASANDO EL USER_ID O VERIFICANDO LA SESIÓN
    const { error } = await supabase.rpc('anular_factura', {
      p_venta_id: facturaSeleccionada.value.id,
      p_motivo: motivo.value.trim(),
      p_user_id: user.id // <--- Pasar user_id para validar pertenencia en PostgreSQL
    })

    if (error) throw error

    alert('Factura anulada con éxito.')
    modalVisible.value = false
    await cargarVentas()
  } catch (err) {
    alert('Error al anular: ' + err.message)
  } finally {
    procesando.value = false
  }
}

const abrirModal = (factura) => {
  facturaSeleccionada.value = factura
  motivo.value = ''
  modalVisible.value = true
}

onMounted(() => {
  cargarVentas()
})
</script>

<style scoped>
.anulaciones-container { padding: 1.25rem; max-width: 1280px; margin: 0 auto; }
.panel-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.panel-header h3 { margin: 0; font-size: 1.1rem; color: #0f172a; }
.subtitulo { margin: 0; font-size: 0.78rem; color: #64748b; }

.header-acciones { display: flex; gap: 0.75rem; align-items: center; }
.search-box { position: relative; width: 250px; }
.input-search { width: 100%; padding: 0.45rem 0.5rem 0.45rem 2rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; }
.search-icon { position: absolute; left: 0.5rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }

.btn-secundario { background: #f8fafc; border: 1px solid #cbd5e1; padding: 0.45rem 0.85rem; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.82rem; font-weight: 600; color: #334155; }

.table-container { overflow-x: auto; }
.tabla-ventas { width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; }
.tabla-ventas th { background: #f8fafc; color: #475569; padding: 0.75rem 0.85rem; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
.tabla-ventas td { padding: 0.75rem 0.85rem; border-bottom: 1px solid #f1f5f9; }

.row-anulada { background: #fef2f2; opacity: 0.7; }
.fecha-col { display: flex; flex-direction: column; }
.f-fecha { font-weight: 600; color: #1e293b; }
.f-hora { font-size: 0.72rem; color: #64748b; }

.badge-pago { background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; color: #475569; }

.tag-estado { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
.tag-completada { background: #f0fdf4; color: #16a34a; }
.tag-anulada { background: #fee2e2; color: #dc2626; }

.btn-anular { background: #fff; border: 1px solid #fecaca; color: #dc2626; padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem; transition: all 0.15s; }
.btn-anular:hover { background: #dc2626; color: #fff; }

.info-anulacion { font-size: 0.75rem; color: #94a3b8; display: inline-flex; align-items: center; gap: 0.2rem; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); }
.modal-card { background: #fff; border-radius: 12px; width: 100%; max-width: 440px; padding: 1.25rem; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; }
.modal-title-box { display: flex; align-items: center; gap: 0.4rem; color: #dc2626; }
.icon-warning { font-size: 1.4rem; }
.btn-close { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #94a3b8; }

.alerta-info-devolucion { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; padding: 0.6rem; border-radius: 6px; font-size: 0.78rem; display: flex; align-items: center; gap: 0.4rem; margin-top: 0.5rem; }
.campo textarea { width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; margin-top: 0.2rem; outline: none; }

.modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
.btn-danger { background: #dc2626; color: #fff; border: none; padding: 0.55rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.3rem; }
.btn-danger:disabled { background: #fca5a5; cursor: not-allowed; }

.estado-cargando { text-align: center; padding: 2rem; color: #64748b; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>