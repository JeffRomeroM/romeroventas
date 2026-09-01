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
          <button class="btn-secundario btn-refrescar" @click="cargarVentas">
            <Icon icon="mdi:refresh" /> Refrescar
          </button>
        </div>
      </div>

      <!-- Estado de Carga -->
      <div v-if="cargando" class="estado-cargando">
        <Icon icon="mdi:loading" class="spin" /> Cargando ventas...
      </div>

      <template v-else>
        <!-- Tabla de Ventas (Desktop) -->
        <div class="table-container desktop-only">
          <table class="tabla-ventas">
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
              <tr v-if="ventasFiltradas.length === 0">
                <td colspan="6" class="text-center empty-state">
                  No se encontraron ventas para mostrar.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Vista en Tarjetas (Móviles) -->
        <div class="mobile-only ventas-mobile-list">
          <div 
            v-for="v in ventasFiltradas" 
            :key="`mob-${v.id}`" 
            class="card-venta-mobile"
            :class="{ 'row-anulada': v.estado === 'Anulada' }"
          >
            <div class="card-venta-header">
              <div>
                <span class="cliente-name">{{ v.clientes?.nombre || 'Cliente General' }}</span>
                <div class="fecha-mobile">
                  {{ new Date(v.created_at).toLocaleDateString() }} - {{ new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                </div>
              </div>
              <span :class="['tag-estado', v.estado === 'Anulada' ? 'tag-anulada' : 'tag-completada']">
                {{ v.estado }}
              </span>
            </div>

            <div class="card-venta-body">
              <div class="info-pago">
                <span class="badge-pago">{{ v.tipo_pago }}</span>
              </div>
              <div class="monto-box text-right">
                <span class="lbl">Total</span>
                <span class="val font-bold">C$ {{ formatMonto(v.total) }}</span>
              </div>
            </div>

            <div class="card-venta-acciones">
              <button 
                v-if="v.estado !== 'Anulada'" 
                class="btn-anular-mobile"
                @click="abrirModal(v)"
              >
                <Icon icon="mdi:cancel" /> Anular Factura
              </button>
              <div v-else class="info-anulacion-mobile">
                <Icon icon="mdi:information-outline" /> <strong>Motivo:</strong> {{ v.motivo_anulacion || 'Sin motivo' }}
              </div>
            </div>
          </div>

          <div v-if="ventasFiltradas.length === 0" class="empty-state text-center">
            No se encontraron ventas para mostrar.
          </div>
        </div>
      </template>

    </div>

    <!-- MODAL DE CONFIRMACIÓN -->
    <div v-if="modalVisible" class="modal-overlay" @click.self="modalVisible = false">
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
            <label class="lbl-motivo">Motivo de la Anulación *</label>
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No hay una sesión activa.')

    const { data, error } = await supabase
      .from('ventas')
      .select('id, total, tipo_pago, estado, motivo_anulacion, created_at, clientes(nombre)')
      .eq('user_id', user.id)
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No hay una sesión activa.')

    const { error } = await supabase.rpc('anular_factura', {
      p_venta_id: facturaSeleccionada.value.id,
      p_motivo: motivo.value.trim(),
      p_user_id: user.id
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
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
.panel-header h3 { margin: 0; font-size: 1.1rem; color: #0f172a; }
.subtitulo { margin: 0; font-size: 0.78rem; color: #64748b; }

.header-acciones { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
.search-box { position: relative; width: 250px; }
.input-search { width: 100%; padding: 0.45rem 0.5rem 0.45rem 2rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; }
.search-icon { position: absolute; left: 0.5rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }

.btn-secundario { background: #f8fafc; border: 1px solid #cbd5e1; padding: 0.45rem 0.85rem; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.82rem; font-weight: 600; color: #334155; }
.btn-secundario:hover { background: #f1f5f9; }

.table-container { overflow-x: auto; }
.tabla-ventas { width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; }
.tabla-ventas th { background: #f8fafc; color: #475569; padding: 0.75rem 0.85rem; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
.tabla-ventas td { padding: 0.75rem 0.85rem; border-bottom: 1px solid #f1f5f9; }

.row-anulada { background: #fef2f2; opacity: 0.85; }
.fecha-col { display: flex; flex-direction: column; }
.f-fecha { font-weight: 600; color: #1e293b; }
.f-hora { font-size: 0.72rem; color: #64748b; }
.cliente-name { font-weight: 600; color: #0f172a; }

.badge-pago { background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; color: #475569; display: inline-block; }

.tag-estado { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; display: inline-block; }
.tag-completada { background: #f0fdf4; color: #16a34a; }
.tag-anulada { background: #fee2e2; color: #dc2626; }

.btn-anular { background: #fff; border: 1px solid #fecaca; color: #dc2626; padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem; transition: all 0.15s; }
.btn-anular:hover { background: #dc2626; color: #fff; }

.info-anulacion { font-size: 0.75rem; color: #94a3b8; display: inline-flex; align-items: center; gap: 0.2rem; }
.empty-state { padding: 2rem; color: #94a3b8; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); padding: 1rem; }
.modal-card { background: #fff; border-radius: 12px; width: 100%; max-width: 440px; padding: 1.25rem; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; }
.modal-header h3 { margin: 0; font-size: 1.05rem; }
.modal-title-box { display: flex; align-items: center; gap: 0.4rem; color: #dc2626; }
.icon-warning { font-size: 1.4rem; }
.btn-close { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #94a3b8; }

.desc-modal { font-size: 0.88rem; color: #334155; margin: 0 0 0.5rem 0; }
.alerta-info-devolucion { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; padding: 0.6rem; border-radius: 6px; font-size: 0.78rem; display: flex; align-items: center; gap: 0.4rem; margin-top: 0.5rem; }
.margin-top { margin-top: 0.85rem; }
.lbl-motivo { font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 0.25rem; }
.campo textarea { width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; outline: none; box-sizing: border-box; }

.modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
.btn-danger { background: #dc2626; color: #fff; border: none; padding: 0.55rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.3rem; font-size: 0.82rem; }
.btn-danger:disabled { background: #fca5a5; cursor: not-allowed; }

.estado-cargando { text-align: center; padding: 2rem; color: #64748b; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.font-bold { font-weight: 700; }
.text-right { text-align: right; }
.text-center { text-align: center; }

/* Control Responsivo */
.desktop-only { display: block; }
.mobile-only { display: none; }

/* ==========================================================================
   ADAPTACIONES MÓVILES
   ========================================================================== */
@media (max-width: 640px) {
  .desktop-only { display: none; }
  .mobile-only { display: flex; }

  .anulaciones-container { padding: 0.75rem; }
  .panel-card { padding: 0.85rem; }

  .header-acciones {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }

  .btn-refrescar {
    justify-content: center;
    width: 100%;
  }

  /* Tarjetas móviles */
  .ventas-mobile-list {
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  .card-venta-mobile {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 0.85rem;
    background: #fff;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .card-venta-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .fecha-mobile {
    font-size: 0.72rem;
    color: #64748b;
    margin-top: 0.1rem;
  }

  .card-venta-body {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px dashed #e2e8f0;
    padding-top: 0.5rem;
  }

  .monto-box {
    display: flex;
    flex-direction: column;
  }

  .monto-box .lbl {
    font-size: 0.7rem;
    color: #64748b;
    text-transform: uppercase;
  }

  .monto-box .val {
    font-size: 0.9rem;
    color: #0f172a;
  }

  .card-venta-acciones {
    margin-top: 0.2rem;
  }

  .btn-anular-mobile {
    width: 100%;
    background: #fff;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 0.45rem;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
  }

  .info-anulacion-mobile {
    font-size: 0.78rem;
    color: #64748b;
    background: #f8fafc;
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    border: 1px solid #f1f5f9;
  }
}
</style>