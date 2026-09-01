<template>
  <div class="modulo-creditos">
    <!-- TARJETAS CONSOLIDADAS POR CLIENTE -->
    <div class="seccion">
      <div class="header-seccion">
        <h3>Saldos Consolidados por Cliente</h3>
        <button class="btn-refrescar" @click="cargarSaldos" :disabled="cargando">
          <Icon icon="mdi:refresh" :class="{ 'spin': cargando }" />
        </button>
      </div>

      <div v-if="cargando" class="estado-cargando">
        <Icon icon="mdi:loading" class="spin" /> Cargando estados de cuenta...
      </div>

      <div v-else-if="saldosCliente.length === 0" class="empty-box">
        No hay clientes con saldos pendientes a crédito.
      </div>

      <div v-else class="saldos-grid">
        <div v-for="c in saldosCliente" :key="c.cliente_id" class="card-cliente">
          <div class="card-top">
            <span class="cliente-nombre">{{ c.cliente_nombre }}</span>
            <span :class="['tag-estado', c.saldo_pendiente > 0 ? 'deuda' : 'al-dia']">
              {{ c.saldo_pendiente > 0 ? 'Con Pendiente' : 'Al Día' }}
            </span>
          </div>

          <div class="linea-resumen">
            <div class="dato-col">
              <span class="lbl">Crédito Total</span>
              <span class="val">C$ {{ formatMonto(c.credito_total) }}</span>
            </div>
            <div class="dato-col">
              <span class="lbl">Pagado</span>
              <span class="val text-success">C$ {{ formatMonto(c.pagado) }}</span>
            </div>
            <div class="dato-col destacado">
              <span class="lbl">Saldo</span>
              <span class="val text-danger">C$ {{ formatMonto(c.saldo_pendiente) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DETALLE DE FACTURAS Y ABONOS -->
    <div class="seccion margin-top">
      <h3>Facturas a Crédito</h3>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Total Factura</th>
              <th>Abonado</th>
              <th>Saldo Factura</th>
              <th>Estado</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in facturasCredito" :key="f.venta_id">
              <td>{{ formatFecha(f.fecha) }}</td>
              <td>{{ f.cliente_nombre }}</td>
              <td>C$ {{ formatMonto(f.total_venta) }}</td>
              <td class="text-success">C$ {{ formatMonto(f.total_abonado) }}</td>
              <td class="text-danger font-bold">C$ {{ formatMonto(f.saldo_factura) }}</td>
              <td>
                <span :class="['badge-pago', f.estado_pago?.toLowerCase()]">
                  {{ f.estado_pago }}
                </span>
              </td>
              <td class="text-center">
                <div class="acciones-box">
                  <button 
                    v-if="f.saldo_factura > 0" 
                    class="btn-abono" 
                    @click="abrirModalAbono(f, 'parcial')"
                    title="Abonar monto específico"
                  >
                    <Icon icon="mdi:cash-plus" /> Abonar
                  </button>

                  <button 
                    v-if="f.saldo_factura > 0" 
                    class="btn-liquidar" 
                    @click="abrirModalAbono(f, 'total')"
                    title="Liquidar la totalidad de la deuda"
                  >
                    <Icon icon="mdi:check-all" /> Liquidar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL PARA REGISTRAR ABONO / LIQUIDACIÓN -->
    <div v-if="modalAbono.abierto" class="modal-overlay" @click.self="cerrarModalAbono">
      <div class="modal-box">
        <h3>{{ modalAbono.tipoAccion === 'total' ? 'Liquidar Factura Completa' : 'Registrar Abono' }}</h3>
        <p class="sub-modal">Cliente: <strong>{{ modalAbono.factura?.cliente_nombre }}</strong></p>
        <p class="sub-modal">Saldo Actual: <strong class="text-danger">C$ {{ formatMonto(modalAbono.factura?.saldo_factura) }}</strong></p>

        <form @submit.prevent="guardarAbono" class="form-modal">
          <div class="campo">
            <label>Monto a Registrar (C$)</label>
            <input 
              v-model.number="formAbono.monto" 
              type="number" 
              step="0.01" 
              :max="modalAbono.factura?.saldo_factura" 
              min="0.01" 
              :readonly="modalAbono.tipoAccion === 'total'"
              required 
            />
          </div>

          <div class="campo">
            <label>Método de Pago</label>
            <select v-model="formAbono.metodo_pago">
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>

          <div class="campo">
            <label>Observación</label>
            <input v-model="formAbono.observacion" type="text" placeholder="Ej. Pago parcial / Liquidación" />
          </div>

          <div class="modal-acciones">
            <button type="button" class="btn-cancelar" @click="cerrarModalAbono">Cancelar</button>
            <button type="submit" class="btn-guardar" :disabled="guardandoAbono">
              {{ guardandoAbono ? 'Procesando...' : 'Confirmar Registro' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../../supabase/supabase.js'

const saldosCliente = ref([])
const facturasCredito = ref([])
const cargando = ref(true)
const guardandoAbono = ref(false)

const modalAbono = ref({ abierto: false, factura: null, tipoAccion: 'parcial' })
const formAbono = ref({ monto: 0, metodo_pago: 'Efectivo', observacion: '' })

const formatMonto = (num) => Number(num || 0).toFixed(2)

const formatFecha = (f) => {
  if (!f) return '-'
  const [fechaBase] = f.split('T')
  const [year, month, day] = fechaBase.split('-')
  return `${day}/${month}/${year}`
}

const cargarSaldos = async () => {
  cargando.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Sesión no encontrada.')

    // Traemos los saldos agregados y las facturas pendientes
    const [resSaldos, resFacturas] = await Promise.all([
      supabase
        .from('vista_resumen_creditos_cliente')
        .select('*')
        .eq('user_id', user.id),
      supabase
        .from('vista_estado_ventas_credito')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha', { ascending: false })
    ])

    if (resSaldos.error) throw resSaldos.error
    if (resFacturas.error) throw resFacturas.error

    saldosCliente.value = resSaldos.data || []
    
    // CORRECCIÓN: Nos aseguramos de mapear explícitamente los valores numéricos
    // e inferir 'Pendiente' si el saldo_factura es mayor a 0.
    facturasCredito.value = (resFacturas.data || []).map(f => {
      const saldo = Number(f.saldo_factura || 0)
      return {
        ...f,
        saldo_factura: saldo,
        total_venta: Number(f.total_venta || 0),
        total_abonado: Number(f.total_abonado || 0),
        // Si tiene saldo pendiente, forzamos la visualización como Pendiente en la tabla
        estado_pago: saldo > 0 ? (f.estado_pago || 'Pendiente') : 'Pagada'
      }
    })

  } catch (e) {
    console.error('Error al cargar datos de crédito:', e.message)
  } finally {
    cargando.value = false
  }
}

const abrirModalAbono = (factura, tipo = 'parcial') => {
  const saldoPendiente = Number(factura.saldo_factura || 0)
  
  if (saldoPendiente <= 0) {
    alert('Esta factura ya no tiene saldo pendiente.')
    return
  }

  modalAbono.value = { abierto: true, factura, tipoAccion: tipo }
  formAbono.value = { 
    monto: tipo === 'total' ? saldoPendiente : 0, 
    metodo_pago: 'Efectivo', 
    observacion: tipo === 'total' ? 'Cancelación total de factura' : '' 
  }
}

const cerrarModalAbono = () => {
  modalAbono.value = { abierto: false, factura: null, tipoAccion: 'parcial' }
}

const guardarAbono = async () => {
  const montoAbono = Number(formAbono.value.monto || 0)
  const saldoActual = Number(modalAbono.value.factura?.saldo_factura || 0)

  if (montoAbono <= 0) {
    alert('Ingresa un monto válido mayor a 0.')
    return
  }

  // Tolerancia de centavos para evitar discrepancias por punto flotante
  if ((montoAbono - saldoActual) > 0.01) {
    alert(`El abono (C$ ${montoAbono.toFixed(2)}) no puede exceder el saldo pendiente (C$ ${saldoActual.toFixed(2)}).`)
    return
  }

  guardandoAbono.value = true

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Sesión de usuario no válida.')

    // 1. Insertar el abono en la tabla pagos_credito
    const { error: errPago } = await supabase.from('pagos_credito').insert([{
      user_id: user.id,
      venta_id: modalAbono.value.factura.venta_id,
      monto: montoAbono,
      metodo_pago: formAbono.value.metodo_pago,
      observacion: formAbono.value.observacion
    }])

    if (errPago) throw errPago

    // 2. Calcular la diferencia restante de forma segura
    const saldoRestante = Number((saldoActual - montoAbono).toFixed(2))

    // Solo actualizamos la tabla ventas a 'Pagada' si la deuda realmente queda saldada (<= 0)
    if (saldoRestante <= 0) {
      const { error: errVenta } = await supabase
        .from('ventas')
        .update({ estado_pago: 'Pagada' })
        .eq('id', modalAbono.value.factura.venta_id)

      if (errVenta) throw errVenta
    }

    cerrarModalAbono()
    await cargarSaldos()
  } catch (e) {
    alert('Error procesando la transacción: ' + e.message)
  } finally {
    guardandoAbono.value = false
  }
}

onMounted(() => {
  cargarSaldos()
})
</script>

<style scoped>
.seccion { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; }
.margin-top { margin-top: 1.5rem; }
.header-seccion { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }

.saldos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
.card-cliente { border: 1px solid #cbd5e1; border-radius: 8px; padding: 1rem; background: #fafafa; }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.cliente-nombre { font-weight: 700; color: #1e293b; }

.tag-estado { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600; }
.tag-estado.deuda { background: #fee2e2; color: #991b1b; }
.tag-estado.al-dia { background: #dcfce7; color: #166534; }

.linea-resumen { display: flex; justify-content: space-between; font-size: 0.85rem; border-top: 1px dashed #cbd5e1; padding-top: 0.5rem; }
.dato-col { display: flex; flex-direction: column; }
.lbl { font-size: 0.72rem; color: #64748b; }
.val { font-weight: 600; }
.destacado { border-left: 2px solid #e2e8f0; padding-left: 0.5rem; }

.text-success { color: #16a34a; }
.text-danger { color: #dc2626; }
.font-bold { font-weight: 700; }

.table-container { overflow-x: auto; margin-top: 0.75rem; }
table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
th, td { padding: 0.65rem; border-bottom: 1px solid #f1f5f9; text-align: left; }
th { background: #f8fafc; color: #475569; }

.badge-pago { font-size: 0.7rem; padding: 0.2rem 0.4rem; border-radius: 4px; font-weight: 600; text-transform: capitalize; }
.badge-pago.pagada { background: #dcfce7; color: #15803d; }
.badge-pago.pendiente { background: #fef3c7; color: #b45309; }

.acciones-box { display: flex; gap: 0.35rem; justify-content: center; }

.btn-abono { background: #2563eb; color: white; border: none; padding: 0.35rem 0.65rem; border-radius: 5px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.78rem; font-weight: 600; }
.btn-abono:hover { background: #1d4ed8; }

.btn-liquidar { background: #16a34a; color: white; border: none; padding: 0.35rem 0.65rem; border-radius: 5px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.78rem; font-weight: 600; }
.btn-liquidar:hover { background: #15803d; }

.btn-refrescar { background: none; border: 1px solid #cbd5e1; padding: 0.4rem; border-radius: 6px; cursor: pointer; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-box { background: #fff; padding: 1.5rem; border-radius: 10px; width: 100%; max-width: 400px; }
.sub-modal { font-size: 0.85rem; color: #475569; margin-bottom: 0.3rem; }
.form-modal { display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1rem; }
.campo { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.82rem; }
.campo input, .campo select { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; }
.campo input[readonly] { background: #f1f5f9; color: #64748b; cursor: not-allowed; }

.modal-acciones { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem; }
.btn-cancelar { background: #e2e8f0; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
.btn-guardar { background: #2563eb; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>