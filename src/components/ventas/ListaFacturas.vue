<template>
  <div class="facturas-container">
    <div class="panel-card">
      <div class="panel-header">
        <div>
          <h3>Listado General de Facturas</h3>
          <p class="subtitulo">Consulta todas las ventas registradas y su estado de pago</p>
        </div>
        
        <!-- Filtros: Búsqueda y Rango de Fechas -->
        <div class="filtros-wrapper">
          <div class="date-group">
            <input v-model="fechaInicio" type="date" class="input-date" title="Fecha Inicio" />
            <span>a</span>
            <input v-model="fechaFin" type="date" class="input-date" title="Fecha Fin" />
          </div>

          <div class="search-box">
            <Icon icon="mdi:magnify" class="search-icon" />
            <input 
              v-model="filtro" 
              type="text" 
              placeholder="Buscar cliente o código..." 
              class="input-search"
            />
          </div>
          
          <button v-if="filtro || fechaInicio || fechaFin" class="btn-limpiar" @click="limpiarFiltros">
            Limpiar
          </button>
        </div>
      </div>

      <!-- Tabla Principal (Desktop) -->
      <div class="table-container desktop-only">
        <table class="tabla-custom">
          <thead>
            <tr>
              <th>N° Factura</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Tipo Pago</th>
              <th class="text-right">Total</th>
              <th class="text-right">Pendiente</th>
              <th class="text-center">Estado Pago</th>
              <th class="text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="f in facturasFiltradas" 
              :key="f.id" 
              class="fila-factura" 
              @click="verDetalle(f)"
            >
              <td class="font-bold">#{{ String(f.id).slice(0, 8) }}</td>
              <td>{{ formatFecha(f.created_at) }}</td>
              <td>{{ f.clientes?.nombre || 'Cliente General' }}</td>
              <td><span class="badge-pago">{{ f.tipo_pago }}</span></td>
              <td class="text-right font-bold">C$ {{ Number(f.total).toFixed(2) }}</td>
              <td class="text-right font-bold" :class="f.saldo_pendiente > 0 ? 'text-danger' : 'text-success'">
                C$ {{ Number(f.saldo_pendiente).toFixed(2) }}
              </td>
              <td class="text-center">
                <span :class="['tag-estado', getClaseEstadoPago(f)]">
                  {{ getTextoEstadoPago(f) }}
                </span>
              </td>
              <td class="text-center" @click.stop>
                <button class="btn-ver" @click="verDetalle(f)">
                  <Icon icon="mdi:eye" /> Ver
                </button>
              </td>
            </tr>
            <tr v-if="facturasFiltradas.length === 0">
              <td colspan="8" class="text-center empty-state">
                No se encontraron facturas en el rango seleccionado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tarjetas para Móviles -->
      <div class="mobile-only facturas-mobile-list">
        <div 
          v-for="f in facturasFiltradas" 
          :key="`mob-${f.id}`" 
          class="card-factura-mobile"
          @click="verDetalle(f)"
        >
          <div class="card-factura-header">
            <div>
              <span class="factura-id">#{{ String(f.id).slice(0, 8) }}</span>
              <span class="factura-cliente">{{ f.clientes?.nombre || 'Cliente General' }}</span>
            </div>
            <span :class="['tag-estado', getClaseEstadoPago(f)]">
              {{ getTextoEstadoPago(f) }}
            </span>
          </div>

          <div class="factura-sub-info">
            <span class="factura-fecha">{{ formatFecha(f.created_at) }}</span>
            <span class="badge-pago">{{ f.tipo_pago }}</span>
          </div>

          <div class="factura-valores">
            <div class="dato-col">
              <span class="lbl">Total Factura</span>
              <span class="val">C$ {{ Number(f.total).toFixed(2) }}</span>
            </div>
            <div class="dato-col text-right">
              <span class="lbl">Pendiente</span>
              <span class="val font-bold" :class="f.saldo_pendiente > 0 ? 'text-danger' : 'text-success'">
                C$ {{ Number(f.saldo_pendiente).toFixed(2) }}
              </span>
            </div>
          </div>

          <button class="btn-ver-mobile" @click.stop="verDetalle(f)">
            <Icon icon="mdi:eye" /> Ver Detalle
          </button>
        </div>

        <div v-if="facturasFiltradas.length === 0" class="empty-state text-center">
          No se encontraron facturas en el rango seleccionado.
        </div>
      </div>
    </div>

    <!-- MODAL DE DETALLE DE FACTURA -->
    <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h4>Detalle de Factura</h4>
            <span class="factura-id">ID: {{ facturaSeleccionada?.id }}</span>
          </div>
          <button class="btn-close" @click="cerrarModal">
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div v-if="cargandoDetalle" class="modal-body text-center py-4">
          <p class="texto-cargando">Cargando detalles y productos...</p>
        </div>

        <div v-else class="modal-body">
          <div class="info-grid">
            <div>
              <p class="label">Cliente</p>
              <p class="valor font-bold">{{ facturaSeleccionada?.clientes?.nombre || 'Cliente General' }}</p>
            </div>
            <div>
              <p class="label">Fecha</p>
              <p class="valor">{{ formatFecha(facturaSeleccionada?.created_at) }}</p>
            </div>
            <div>
              <p class="label">Tipo de Pago</p>
              <p class="valor">{{ facturaSeleccionada?.tipo_pago }}</p>
            </div>
            <div>
              <p class="label">Estado de Pago</p>
              <span :class="['tag-estado', getClaseEstadoPago(facturaSeleccionada)]">
                {{ getTextoEstadoPago(facturaSeleccionada) }}
              </span>
            </div>
          </div>

          <hr class="divider" />

          <h5>Productos Comprados</h5>
          <div class="table-container">
            <table class="tabla-detalle">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="text-center">Cant.</th>
                  <th class="text-right">Precio</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in itemsDetalle" :key="item.id">
                  <td>{{ item.nombre_producto }}</td>
                  <td class="text-center">{{ item.cantidad }}</td>
                  <td class="text-right">C$ {{ Number(item.precio_unitario).toFixed(2) }}</td>
                  <td class="text-right font-bold">C$ {{ (item.cantidad * item.precio_unitario).toFixed(2) }}</td>
                </tr>
                <tr v-if="itemsDetalle.length === 0">
                  <td colspan="4" class="text-center empty-state">
                    No se encontraron productos en esta factura.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- RESUMEN FINANCIERO -->
          <div class="resumen-financiero">
            <div class="fila-resumen">
              <span>Total Factura:</span>
              <span>C$ {{ Number(facturaSeleccionada?.total || 0).toFixed(2) }}</span>
            </div>
            <div class="fila-resumen text-success">
              <span>Total Abonado:</span>
              <span>C$ {{ Number(facturaSeleccionada?.total_abonado || 0).toFixed(2) }}</span>
            </div>
            <div class="fila-resumen total-destacado" :class="facturaSeleccionada?.saldo_pendiente > 0 ? 'text-danger' : 'text-success'">
              <span>Saldo Pendiente:</span>
              <span>C$ {{ Number(facturaSeleccionada?.saldo_pendiente || 0).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secundario" @click="cerrarModal">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../../supabase/supabase.js'

const facturas = ref([])
const filtro = ref('')
const fechaInicio = ref('')
const fechaFin = ref('')

// Estado del Modal
const modalAbierto = ref(false)
const facturaSeleccionada = ref(null)
const itemsDetalle = ref([])
const cargandoDetalle = ref(false)

const formatFecha = (f) => {
  if (!f) return '-'
  return new Date(f).toLocaleString('es-NI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTextoEstadoPago = (f) => {
  if (!f) return 'Pagada'
  if (f.estado === 'Anulada') return 'Anulada'
  if (f.saldo_pendiente <= 0) return 'Pagada'
  if (f.total_abonado > 0) return 'Abonado (Parcial)'
  return 'Pendiente'
}

const getClaseEstadoPago = (f) => {
  if (!f) return 'tag-completada'
  if (f.estado === 'Anulada') return 'tag-anulada'
  if (f.saldo_pendiente <= 0) return 'tag-completada'
  if (f.total_abonado > 0) return 'tag-parcial'
  return 'tag-pendiente'
}

const facturasFiltradas = computed(() => {
  return facturas.value.filter(f => {
    const q = filtro.value.toLowerCase().trim()
    const coincideTexto = !q || 
      String(f.id).toLowerCase().includes(q) ||
      (f.clientes?.nombre && f.clientes.nombre.toLowerCase().includes(q))

    const fechaFactura = new Date(f.created_at)
    let coincideFecha = true

    if (fechaInicio.value) {
      const fInicio = new Date(fechaInicio.value + 'T00:00:00')
      coincideFecha = coincideFecha && fechaFactura >= fInicio
    }

    if (fechaFin.value) {
      const fFin = new Date(fechaFin.value + 'T23:59:59')
      coincideFecha = coincideFecha && fechaFactura <= fFin
    }

    return coincideTexto && coincideFecha
  })
})

const cargarFacturas = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No hay una sesión activa.')

    const { data: ventasData, error: errVentas } = await supabase
      .from('ventas')
      .select('id, total, tipo_pago, estado, estado_pago, created_at, clientes(nombre)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (errVentas) throw errVentas

    const { data: pagosData, error: errPagos } = await supabase
      .from('pagos_credito')
      .select('venta_id, monto')
      .eq('user_id', user.id)

    if (errPagos) throw errPagos

    const abonosPorVenta = (pagosData || []).reduce((acc, pago) => {
      acc[pago.venta_id] = (acc[pago.venta_id] || 0) + Number(pago.monto || 0)
      return acc
    }, {})

    facturas.value = (ventasData || []).map(v => {
      const esCredito = v.tipo_pago === 'Credito' || v.tipo_pago === 'Crédito'
      const totalAbonado = esCredito ? (abonosPorVenta[v.id] || 0) : Number(v.total)
      const total = Number(v.total || 0)
      const saldoPendiente = esCredito ? Math.max(0, total - totalAbonado) : 0

      return {
        ...v,
        total_abonado: totalAbonado,
        saldo_pendiente: saldoPendiente
      }
    })

  } catch (error) {
    console.error('Error al cargar ventas:', error.message || error)
  }
}

const verDetalle = async (factura) => {
  facturaSeleccionada.value = factura
  modalAbierto.value = true
  cargandoDetalle.value = true
  itemsDetalle.value = []

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No hay una sesión activa.')

    const { data, error } = await supabase
      .from('detalle_venta')
      .select(`
        id,
        cantidad,
        precio_unitario,
        producto_id,
        productos ( nombre )
      `)
      .eq('venta_id', factura.id)

    if (error) throw error

    itemsDetalle.value = (data || []).map(item => ({
      ...item,
      nombre_producto: item.productos?.nombre || 'Producto sin nombre'
    }))
  } catch (error) {
    console.error('Error al cargar detalle:', error.message || error)
  } finally {
    cargandoDetalle.value = false
  }
}

const cerrarModal = () => {
  modalAbierto.value = false
  facturaSeleccionada.value = null
  itemsDetalle.value = []
}

const limpiarFiltros = () => {
  filtro.value = ''
  fechaInicio.value = ''
  fechaFin.value = ''
}

onMounted(() => {
  cargarFacturas()
})
</script>

<style scoped>
.facturas-container { padding: 1.25rem; max-width: 1200px; margin: 0 auto; }
.panel-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; }
.subtitulo { color: #64748b; font-size: 0.85rem; margin-top: 0.2rem; }
.panel-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }

.filtros-wrapper { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.date-group { display: flex; align-items: center; gap: 0.35rem; font-size: 0.85rem; color: #64748b; }
.input-date { padding: 0.35rem 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; }
.search-box { position: relative; width: 220px; }
.input-search { width: 100%; padding: 0.4rem 0.5rem 0.4rem 2rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; }
.search-icon { position: absolute; left: 0.5rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
.btn-limpiar { background: #f1f5f9; border: none; padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; color: #475569; }
.btn-limpiar:hover { background: #e2e8f0; }

.table-container { overflow-x: auto; width: 100%; }
.tabla-custom { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.tabla-custom th { background: #f8fafc; padding: 0.65rem; border-bottom: 1px solid #e2e8f0; text-align: left; }
.tabla-custom td { padding: 0.65rem; border-bottom: 1px solid #f1f5f9; }
.fila-factura { cursor: pointer; transition: background 0.15s; }
.fila-factura:hover { background: #f8fafc; }

.badge-pago { background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem; display: inline-block; }
.tag-estado { padding: 0.25rem 0.6rem; border-radius: 12px; font-weight: 700; font-size: 0.72rem; display: inline-block; }
.tag-completada { background: #dcfce7; color: #15803d; }
.tag-pendiente { background: #fef3c7; color: #b45309; }
.tag-parcial { background: #e0f2fe; color: #0369a1; }
.tag-anulada { background: #fee2e2; color: #dc2626; }

.btn-ver { background: #eff6ff; color: #2563eb; border: none; padding: 0.3rem 0.6rem; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.2rem; }
.btn-ver:hover { background: #dbeafe; }
.empty-state { padding: 2rem; color: #94a3b8; }

/* MODAL STYLES */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
.modal-content { background: #fff; border-radius: 12px; width: 100%; max-width: 520px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; max-height: 90vh; display: flex; flex-direction: column; }
.modal-header { padding: 1rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.modal-header h4 { margin: 0; font-size: 1.1rem; }
.factura-id { font-size: 0.75rem; color: #64748b; font-family: monospace; }
.btn-close { background: transparent; border: none; font-size: 1.25rem; color: #64748b; cursor: pointer; }

.modal-body { padding: 1.25rem; overflow-y: auto; flex: 1; }
.texto-cargando { color: #64748b; padding: 1rem 0; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.85rem; }
.info-grid .label { color: #64748b; margin: 0 0 0.1rem 0; font-size: 0.75rem; }
.info-grid .valor { margin: 0; color: #0f172a; }

.divider { border: none; border-top: 1px solid #e2e8f0; margin: 1rem 0; }
.tabla-detalle { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-top: 0.5rem; }
.tabla-detalle th { background: #f8fafc; padding: 0.4rem; text-align: left; color: #475569; }
.tabla-detalle td { padding: 0.4rem; border-bottom: 1px solid #f1f5f9; }

.resumen-financiero { margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed #cbd5e1; display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.88rem; }
.fila-resumen { display: flex; justify-content: space-between; font-weight: 600; }
.total-destacado { font-size: 1.05rem; font-weight: 700; padding-top: 0.3rem; border-top: 2px solid #0f172a; margin-top: 0.2rem; }

.modal-footer { padding: 0.75rem 1.25rem; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: right; }
.btn-secundario { background: #e2e8f0; color: #334155; border: none; padding: 0.4rem 0.9rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-secundario:hover { background: #cbd5e1; }

.text-right { text-align: right; }
.text-center { text-align: center; }
.font-bold { font-weight: 700; }
.text-success { color: #16a34a; }
.text-danger { color: #dc2626; }

/* Control Responsivo */
.desktop-only { display: block; }
.mobile-only { display: none; }

/* ==========================================================================
   ADAPTACIONES MÓVILES
   ========================================================================== */
@media (max-width: 640px) {
  .desktop-only { display: none; }
  .mobile-only { display: flex; }

  .facturas-container { padding: 0.75rem; }
  .panel-card { padding: 0.85rem; }

  .filtros-wrapper {
    flex-direction: column;
    width: 100%;
    align-items: stretch;
  }

  .date-group {
    justify-content: space-between;
    width: 100%;
  }

  .input-date {
    flex: 1;
    width: 40%;
  }

  .search-box {
    width: 100%;
  }

  .btn-limpiar {
    align-self: flex-end;
  }

  /* Formato de Tarjetas */
  .facturas-mobile-list {
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  .card-factura-mobile {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 0.85rem;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .card-factura-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .factura-cliente {
    display: block;
    font-weight: 700;
    font-size: 0.9rem;
    color: #0f172a;
  }

  .factura-sub-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.78rem;
    color: #64748b;
  }

  .factura-valores {
    display: flex;
    justify-content: space-between;
    border-top: 1px dashed #cbd5e1;
    padding-top: 0.5rem;
    margin-top: 0.25rem;
  }

  .dato-col {
    display: flex;
    flex-direction: column;
  }

  .lbl {
    font-size: 0.7rem;
    color: #64748b;
    text-transform: uppercase;
  }

  .val {
    font-size: 0.85rem;
  }

  .btn-ver-mobile {
    width: 100%;
    margin-top: 0.25rem;
    background: #eff6ff;
    color: #2563eb;
    border: none;
    padding: 0.45rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.82rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
  }
}
</style>