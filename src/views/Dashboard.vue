<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div>
        <h2>Panel de Control General y Financiero</h2>
        <p class="subtitulo">Balance operacional, ventas, egresos y utilidad neta real</p>
      </div>

      <!-- FILTROS DE FECHA -->
      <div class="filtros-box">
        <select v-model="filtroMes" @change="cargarDashboard" class="select-filtro">
          <option value="todos">Todos los meses</option>
          <option v-for="(mes, i) in mesesNombres" :key="i" :value="i">{{ mes }}</option>
        </select>

        <select v-model="filtroAnio" @change="cargarDashboard" class="select-filtro">
          <option v-for="anio in listaAnios" :key="anio" :value="anio">{{ anio }}</option>
        </select>

        <button class="btn-refrescar" @click="cargarDashboard" :disabled="cargando">
          <Icon icon="mdi:refresh" :class="{ 'spin': cargando }" />
        </button>
      </div>
    </div>

    <!-- TARJETAS METRICAS KPI PRINCIPALES -->
    <div class="kpi-grid">
      <!-- VENTAS TOTALES -->
      <div class="kpi-card border-blue">
        <p class="kpi-label">Ventas Totales</p>
        <h3 class="kpi-value text-blue">C$ {{ formatMonto(kpis.ingresos) }}</h3>
        <span class="kpi-subtext">{{ kpis.totalFacturas }} facturas registradas</span>
      </div>

      <!-- EGRESOS -->
      <div class="kpi-card border-red">
        <p class="kpi-label">Egresos / Gastos Operativos</p>
        <h3 class="kpi-value text-red">C$ {{ formatMonto(kpis.egresos) }}</h3>
      </div>

      <!-- GANANCIA BRUTA REAL -->
      <div class="kpi-card" :class="kpis.gananciaBruta < 0 ? 'border-danger' : 'border-emerald'">
        <p class="kpi-label">Ganancia Bruta Real</p>
        <h3 class="kpi-value" :class="kpis.gananciaBruta < 0 ? 'text-danger' : 'text-emerald'">
          C$ {{ formatMonto(kpis.gananciaBruta) }}
        </h3>
      </div>

      <!-- GANANCIA NETA LIMPIA -->
      <div class="kpi-card" :class="kpis.gananciaNeta < 0 ? 'border-danger' : 'border-purple'">
        <p class="kpi-label">Ganancia Neta Limpia</p>
        <h3 class="kpi-value" :class="kpis.gananciaNeta < 0 ? 'text-danger' : 'text-purple'">
          C$ {{ formatMonto(kpis.gananciaNeta) }}
        </h3>
      </div>
    </div>

    <!-- TARJETAS SECUNDARIAS (CRÉDITOS Y STOCK) -->
    <div class="subkpi-grid">
      <div class="subkpi-card">
        <Icon icon="mdi:account-clock" class="icon-orange" />
        <div>
          <p class="subkpi-title">Por Cobrar: <strong class="text-orange">C$ {{ formatMonto(kpis.creditoPendiente) }}</strong></p>
          <small>{{ kpis.clientesDeudores }} clientes con saldo activo</small>
        </div>
      </div>
      <div class="subkpi-card">
        <Icon icon="mdi:package-variant-closed-alert" class="icon-purple" />
        <div>
          <p class="subkpi-title">Stock Bajo: <strong class="text-purple">{{ kpis.productosBajoStock }} productos</strong></p>
          <small>Requieren reabastecimiento urgente</small>
        </div>
      </div>
    </div>

    <!-- GRÁFICO DE CHART.JS -->
    <div class="panel-card chart-section">
      <h4>Balance Mensual (Ventas vs Egresos vs Ganancia Bruta Real)</h4>
      <div class="chart-container" v-if="!cargando">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
      <div v-else class="cargando-box">Cargando datos del gráfico...</div>
    </div>

    <!-- TABLAS DE DETALLE INFERIOR -->
    <div class="dashboard-grid">
      <!-- Top Productos -->
      <div class="panel-card">
        <h4>Top 5 Productos Más Vendidos</h4>
        
        <!-- Tabla Desktop -->
        <table class="tabla-resumen desktop-only">
          <thead>
            <tr>
              <th>Producto</th>
              <th class="text-center">Cant.</th>
              <th class="text-right">Total Vendido</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, index) in topProductos" :key="index">
              <td class="font-medium">{{ p.nombre }}</td>
              <td class="text-center font-bold">{{ p.cantidad }}</td>
              <td class="text-right text-emerald font-bold">C$ {{ formatMonto(p.total) }}</td>
            </tr>
            <tr v-if="topProductos.length === 0">
              <td colspan="3" class="text-center empty-state">Sin ventas en este periodo</td>
            </tr>
          </tbody>
        </table>

        <!-- Lista Tarjetas Móvil -->
        <div class="mobile-only list-mobile">
          <div v-for="(p, index) in topProductos" :key="`tp-${index}`" class="card-item-mobile">
            <div class="card-item-header">
              <span class="font-medium">{{ p.nombre }}</span>
              <span class="badge-cant">Cant: {{ p.cantidad }}</span>
            </div>
            <div class="card-item-footer">
              <span class="lbl-sm">Total Vendido</span>
              <span class="text-emerald font-bold">C$ {{ formatMonto(p.total) }}</span>
            </div>
          </div>
          <div v-if="topProductos.length === 0" class="empty-state text-center">
            Sin ventas en este periodo
          </div>
        </div>
      </div>

      <!-- Últimas Facturas -->
      <div class="panel-card">
        <h4>Últimas Facturas</h4>

        <!-- Tabla Desktop -->
        <table class="tabla-resumen desktop-only">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Tipo</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in ultimasFacturas" :key="f.id">
              <td>
                <div class="cliente-info">
                  <span class="font-medium">{{ f.clientes?.nombre || 'Cliente General' }}</span>
                  <small class="fecha-sub">{{ new Date(f.created_at).toLocaleDateString() }}</small>
                </div>
              </td>
              <td>
                <span :class="['badge-pago', f.tipo_pago?.toLowerCase().includes('cr') ? 'badge-credito' : 'badge-efectivo']">
                  {{ f.tipo_pago }}
                </span>
              </td>
              <td class="text-right font-bold">C$ {{ formatMonto(f.total) }}</td>
            </tr>
            <tr v-if="ultimasFacturas.length === 0">
              <td colspan="3" class="text-center empty-state">Sin transacciones recientes</td>
            </tr>
          </tbody>
        </table>

        <!-- Lista Tarjetas Móvil -->
        <div class="mobile-only list-mobile">
          <div v-for="f in ultimasFacturas" :key="`uf-${f.id}`" class="card-item-mobile">
            <div class="card-item-header">
              <div>
                <span class="font-medium">{{ f.clientes?.nombre || 'Cliente General' }}</span>
                <span class="fecha-sub block">{{ new Date(f.created_at).toLocaleDateString() }}</span>
              </div>
              <span :class="['badge-pago', f.tipo_pago?.toLowerCase().includes('cr') ? 'badge-credito' : 'badge-efectivo']">
                {{ f.tipo_pago }}
              </span>
            </div>
            <div class="card-item-footer">
              <span class="lbl-sm">Monto Total</span>
              <span class="font-bold text-dark">C$ {{ formatMonto(f.total) }}</span>
            </div>
          </div>
          <div v-if="ultimasFacturas.length === 0" class="empty-state text-center">
            Sin transacciones recientes
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../supabase/supabase.js'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const cargando = ref(true)
const filtroMes = ref('todos')
const filtroAnio = ref(new Date().getFullYear())
const listaAnios = ref([2024, 2025, 2026, 2027])

const mesesNombres = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const kpis = ref({
  ingresos: 0,
  egresos: 0,
  gananciaBruta: 0,
  gananciaNeta: 0,
  totalFacturas: 0,
  creditoPendiente: 0,
  clientesDeudores: 0,
  productosBajoStock: 0
})

const topProductos = ref([])
const ultimasFacturas = ref([])
const datosMensuales = ref(Array(12).fill(0).map(() => ({ ingresos: 0, egresos: 0, gananciaBruta: 0 })))

const formatMonto = (v) => Number(v || 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const chartData = computed(() => {
  const labels = filtroMes.value === 'todos' ? mesesNombres : [mesesNombres[filtroMes.value]]
  const indexArray = filtroMes.value === 'todos' ? Array.from({ length: 12 }, (_, i) => i) : [Number(filtroMes.value)]

  return {
    labels,
    datasets: [
      { label: 'Ventas Totales (C$)', backgroundColor: '#3b82f6', data: indexArray.map(i => datosMensuales.value[i].ingresos) },
      { label: 'Egresos (C$)', backgroundColor: '#ef4444', data: indexArray.map(i => datosMensuales.value[i].egresos) },
      { label: 'Ganancia Bruta Real (C$)', backgroundColor: '#10b981', data: indexArray.map(i => datosMensuales.value[i].gananciaBruta) }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' } }
}

const cargarDashboard = async () => {
  cargando.value = true
  datosMensuales.value = Array(12).fill(0).map(() => ({ ingresos: 0, egresos: 0, gananciaBruta: 0 }))

  try {
    const anioActual = Number(filtroAnio.value)
    const fechaInicio = `${anioActual}-01-01T00:00:00`
    const fechaFin = `${anioActual}-12-31T23:59:59`

    // 1. Cargar Detalle de Ventas
    const { data: detalles, error: errorVentas } = await supabase
      .from('detalle_venta')
      .select('cantidad, precio_unitario, precio_costo, productos(nombre, costo), ventas!inner(created_at, estado, id, total, tipo_pago, clientes(nombre))')
      .neq('ventas.estado', 'Anulada')
      .gte('ventas.created_at', fechaInicio)
      .lte('ventas.created_at', fechaFin)

    if (errorVentas) throw errorVentas

    const conteoProductos = {}
    const facturasSet = new Map()

    if (detalles) {
      detalles.forEach(d => {
        if (!d.ventas) return

        const fecha = new Date(d.ventas.created_at)
        const mes = fecha.getMonth()
        const vId = d.ventas.id

        if (filtroMes.value === 'todos' || Number(filtroMes.value) === mes) {
          if (!facturasSet.has(vId)) {
            facturasSet.set(vId, d.ventas)
          }
        }

        const cant = Number(d.cantidad || 0)
        const precioVenta = Number(d.precio_unitario || 0)
        const costoUnidad = Number(d.precio_costo ?? d.productos?.costo ?? 0)

        const totalVentaItem = precioVenta * cant
        const gananciaBrutaItem = (precioVenta - costoUnidad) * cant

        datosMensuales.value[mes].ingresos += totalVentaItem
        datosMensuales.value[mes].gananciaBruta += gananciaBrutaItem

        if (filtroMes.value === 'todos' || Number(filtroMes.value) === mes) {
          const nombreP = d.productos?.nombre || 'Producto General'
          if (!conteoProductos[nombreP]) conteoProductos[nombreP] = { cantidad: 0, total: 0 }
          conteoProductos[nombreP].cantidad += cant
          conteoProductos[nombreP].total += totalVentaItem
        }
      })
    }

    const listaFacturas = Array.from(facturasSet.values())
    kpis.value.totalFacturas = listaFacturas.length
    ultimasFacturas.value = listaFacturas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

    // 2. Cargar Egresos/Gastos
    const { data: egresosData } = await supabase
      .from('egresos')
      .select('monto, fecha')
      .gte('fecha', `${anioActual}-01-01`)
      .lte('fecha', `${anioActual}-12-31`)

    if (egresosData) {
      egresosData.forEach(e => {
        const fecha = new Date(e.fecha)
        const mes = fecha.getMonth()
        datosMensuales.value[mes].egresos += Number(e.monto || 0)
      })
    }

    // 3. Cuentas por cobrar y stock bajo
    const { data: creditos } = await supabase.from('vista_resumen_creditos_cliente').select('saldo_pendiente')
    if (creditos) {
      kpis.value.creditoPendiente = creditos.reduce((s, c) => s + Number(c.saldo_pendiente || 0), 0)
      kpis.value.clientesDeudores = creditos.filter(c => Number(c.saldo_pendiente) > 0).length
    }

    const { data: productos } = await supabase.from('productos').select('stock_actual, stock_minimo')
    if (productos) {
      kpis.value.productosBajoStock = productos.filter(p => Number(p.stock_actual) <= Number(p.stock_minimo)).length
    }

    // 4. Totales consolidadores de KPIs
    let totalIngresos = 0
    let totalEgresos = 0
    let totalGanancia = 0

    if (filtroMes.value === 'todos') {
      datosMensuales.value.forEach(d => {
        totalIngresos += d.ingresos
        totalEgresos += d.egresos
        totalGanancia += d.gananciaBruta
      })
    } else {
      const idx = Number(filtroMes.value)
      const d = datosMensuales.value[idx]
      totalIngresos = d.ingresos
      totalEgresos = d.egresos
      totalGanancia = d.gananciaBruta
    }

    kpis.value.ingresos = totalIngresos
    kpis.value.egresos = totalEgresos
    kpis.value.gananciaBruta = totalGanancia
    kpis.value.gananciaNeta = totalGanancia - totalEgresos

    topProductos.value = Object.entries(conteoProductos)
      .map(([nombre, stat]) => ({ nombre, ...stat }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5)

  } catch (e) {
    console.error('Error cargando el dashboard:', e.message)
  } finally {
    cargando.value = false
  }
}

onMounted(() => { cargarDashboard() })
</script>

<style scoped>
.dashboard-container { padding: 1.25rem; max-width: 1280px; margin: 0 auto; font-family: system-ui, sans-serif; }
.dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.subtitulo { color: #64748b; font-size: 0.85rem; margin-top: 0.2rem; }

.filtros-box { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
.select-filtro { padding: 0.45rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; font-size: 0.85rem; outline: none; }
.btn-refrescar { background: #fff; border: 1px solid #cbd5e1; padding: 0.45rem 0.65rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

/* BORDES DE TARJETAS */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.kpi-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem; }
.kpi-label { font-size: 0.78rem; color: #64748b; margin: 0; }
.kpi-value { font-size: 1.3rem; font-weight: 700; margin: 0.2rem 0; }
.kpi-subtext { font-size: 0.7rem; color: #94a3b8; }

.border-blue { border-left: 5px solid #3b82f6; }
.border-red { border-left: 5px solid #ef4444; }
.border-emerald { border-left: 5px solid #10b981; }
.border-purple { border-left: 5px solid #a855f7; }

/* VALORES NEGATIVOS */
.border-danger { border-left: 5px solid #dc2626 !important; background-color: #fef2f2; }
.text-danger { color: #dc2626 !important; font-weight: 800; }

.text-blue { color: #2563eb; }
.text-red { color: #ef4444; }
.text-emerald { color: #10b981; }
.text-purple { color: #a855f7; }
.text-orange { color: #ea580c; }
.text-dark { color: #0f172a; }

/* SUB KPIS */
.subkpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.subkpi-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.85rem 1rem; display: flex; align-items: center; gap: 0.75rem; }
.subkpi-card .icon-orange { font-size: 1.8rem; color: #ea580c; flex-shrink: 0; }
.subkpi-card .icon-purple { font-size: 1.8rem; color: #9333ea; flex-shrink: 0; }
.subkpi-title { margin: 0; font-size: 0.88rem; color: #334155; }
.subkpi-card small { font-size: 0.75rem; color: #64748b; }

/* PANEL Y TABLAS */
.panel-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; margin-bottom: 1.5rem; }
.panel-card h4 { margin: 0 0 0.5rem 0; font-size: 0.98rem; color: #0f172a; }
.chart-container { height: 320px; position: relative; }
.dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; }

.tabla-resumen { width: 100%; border-collapse: collapse; font-size: 0.83rem; margin-top: 0.75rem; }
.tabla-resumen th { background: #f8fafc; padding: 0.5rem; border-bottom: 1px solid #e2e8f0; text-align: left; color: #64748b; }
.tabla-resumen td { padding: 0.6rem 0.5rem; border-bottom: 1px solid #f1f5f9; }

.cliente-info { display: flex; flex-direction: column; }
.fecha-sub { font-size: 0.7rem; color: #94a3b8; }
.badge-pago { padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 600; font-size: 0.72rem; display: inline-block; }
.badge-efectivo { background: #f0fdf4; color: #16a34a; }
.badge-credito { background: #fff7ed; color: #ea580c; }

.cargando-box, .empty-state { padding: 2rem; text-align: center; color: #94a3b8; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.text-right { text-align: right; }
.text-center { text-align: center; }
.font-bold { font-weight: 700; }
.font-medium { font-weight: 500; }
.block { display: block; }

/* Control Responsivo */
.desktop-only { display: table; }
.mobile-only { display: none; }

/* ==========================================================================
   ADAPTACIONES MÓVILES
   ========================================================================== */
@media (max-width: 640px) {
  .desktop-only { display: none; }
  .mobile-only { display: flex; }

  .dashboard-container { padding: 0.75rem; }
  .panel-card { padding: 0.85rem; }

  .filtros-box {
    width: 100%;
    justify-content: space-between;
  }

  .select-filtro {
    flex: 1;
  }

  .kpi-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }

  .kpi-card {
    padding: 0.75rem;
  }

  .kpi-value {
    font-size: 1.05rem;
  }

  .chart-container {
    height: 240px;
  }

  .subkpi-grid {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  /* Listas móviles tipo tarjeta */
  .list-mobile {
    flex-direction: column;
    gap: 0.6rem;
    margin-top: 0.75rem;
  }

  .card-item-mobile {
    border: 1px solid #f1f5f9;
    border-radius: 8px;
    padding: 0.65rem 0.75rem;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .card-item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    font-size: 0.82rem;
  }

  .card-item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px dashed #e2e8f0;
    padding-top: 0.35rem;
    font-size: 0.8rem;
  }

  .badge-cant {
    background: #e2e8f0;
    color: #334155;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .lbl-sm {
    font-size: 0.7rem;
    color: #64748b;
    text-transform: uppercase;
  }
}
</style>