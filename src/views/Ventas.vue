<template>
  <div class="modulo-global">
    <div class="tabs-navigation">
    

      <button 
        :class="['tab-btn', { active: pestanaActiva === 'creditos' }]" 
        @click="pestanaActiva = 'creditos'"
      >
        <Icon icon="mdi:account-cash-outline" />
        <span>Control de Créditos y Saldos</span>
      </button>

      <button 
        :class="['tab-btn', { active: pestanaActiva === 'historico' }]" 
        @click="pestanaActiva = 'historico'"
      >
        <Icon icon="mdi:history" />
        <span>Reporte Precios Históricos</span>
      </button>
      <button 
        :class="['tab-btn', { active: pestanaActiva === 'facturas' }]" 
        @click="pestanaActiva = 'facturas'"
      >
        <Icon icon="mdi:file-document" />
        <span>Facturas</span>
      </button>


      <button 
        :class="['tab-btn', { active: pestanaActiva === 'anulaciones' }]" 
        @click="pestanaActiva = 'anulaciones'"
      >
        <Icon icon="mdi:cancel" />
        <span>Historial de Anulaciones</span>
      </button>
    </div>

    <div class="tab-contenido">
      <ResumenCreditosCliente v-if="pestanaActiva === 'creditos'" />
      <ReportePreciosHistoricos v-if="pestanaActiva === 'historico'" />
      <ListaFacturas v-if="pestanaActiva === 'facturas'" />
      <HistorialAnulaciones v-if="pestanaActiva === 'anulaciones'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import FacturacionVentas from '../components/ventas/FacturacionVentas.vue'
import ResumenCreditosCliente from '../components/ventas/ResumenCreditosCliente.vue'
import ReportePreciosHistoricos from '../components/ventas/ReportePreciosHistoricos.vue'
import ListaFacturas from '../components/ventas/ListaFacturas.vue'
import HistorialAnulaciones from '../components/ventas/HistorialAnulaciones.vue'

const pestanaActiva = ref('creditos')
</script>

<style scoped>
/* ==========================================================================
   ESTILOS GENERALES Y LAYOUT
   ========================================================================== */
.modulo-global,
.ventas-container,
.facturacion-container {
  padding: 1.5rem;
  max-width: 1280px;
  margin: 0 auto;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  color: #1e293b;
}

/* Header de Módulos y Secciones */
.vista-header,
.header-seccion,
.reporte-header,
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.subtitulo,
.desc {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.2rem;
}

.margin-top {
  margin-top: 2rem;
}

/* ==========================================================================
   PESTAÑAS DE NAVEGACIÓN (TABS)
   ========================================================================== */
.tabs-navigation {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1.5rem;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.75rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s ease;
}

.tab-btn:hover:not(.active) {
  color: #334155;
  background-color: #f8fafc;
  border-radius: 6px 6px 0 0;
}

.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

/* ==========================================================================
   CARDS Y TARJETAS DE SALDOS
   ========================================================================== */
.seccion,
.card-reporte,
.tabla-card,
.panel-productos,
.panel-factura {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

/* Grid de Saldos por Cliente */
.saldos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1rem;
  margin-top: 0.75rem;
}

.card-cliente,
.saldo-card {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 1rem;
  transition: transform 0.15s ease;
}

.card-cliente:hover,
.saldo-card:hover {
  border-color: #94a3b8;
}

.card-top,
.saldo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.cliente-nombre,
.cliente-name {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

.linea-resumen,
.saldo-detalles {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.85rem;
  padding-top: 0.4rem;
}

.dato-col,
.dato {
  display: flex;
  flex-direction: column;
  color: #475569;
}

.lbl,
.label {
  font-size: 0.72rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.val {
  font-weight: 600;
  margin-top: 0.1rem;
}

.destacado {
  border-left: 2px solid #e2e8f0;
  padding-left: 0.6rem;
}

/* ==========================================================================
   PUNTO DE VENTA (FACTURACIÓN & CATÁLOGO)
   ========================================================================== */
.grid-pos {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 1.25rem;
}

@media (max-width: 960px) {
  .grid-pos {
    grid-template-columns: 1fr;
  }
}

.buscador-box {
  position: relative;
  width: 250px;
}

.input-search {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
}

.input-search:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 0.75rem;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.card-producto {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.85rem;
  cursor: pointer;
  background: #f8fafc;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 90px;
}

.card-producto:hover:not(.sin-stock) {
  border-color: #2563eb;
  background: #eff6ff;
  transform: translateY(-2px);
}

.card-producto.sin-stock {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f1f5f9;
}

.prod-nombre {
  font-weight: 600;
  font-size: 0.88rem;
  color: #1e293b;
}

.prod-stock {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.2rem;
}

.prod-precio {
  margin-top: 0.5rem;
  font-weight: 700;
  color: #2563eb;
  font-size: 0.95rem;
}

.config-factura {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
  font-size: 0.82rem;
  font-weight: 500;
}

.campo select,
.campo input {
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  background: #fff;
}

.campo select:focus,
.campo input:focus {
  border-color: #2563eb;
}

.carrito-body {
  flex: 1;
  min-height: 250px;
  max-height: 350px;
  overflow-y: auto;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
}

.carrito-vacio,
.empty-box,
.estado-mensaje {
  text-align: center;
  color: #94a3b8;
  padding: 2.5rem 1rem;
  font-size: 0.9rem;
}

.icon-vacio,
.icon-empty {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.carrito-footer {
  border-top: 2px solid #e2e8f0;
  padding-top: 1rem;
  margin-top: 1rem;
}

.linea-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.05rem;
  font-weight: 700;
}

.monto-total {
  color: #2563eb;
  font-size: 1.35rem;
}

/* ==========================================================================
   TABLAS Y ELEMENTOS TABULARES
   ========================================================================== */
.table-wrapper,
.table-container {
  overflow-x: auto;
  width: 100%;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  text-align: left;
}

th {
  background: #f8fafc;
  color: #475569;
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  white-space: nowrap;
}

td {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid #f1f5f9;
}

tr:hover td {
  background-color: #fafafa;
}

.col-destacada {
  background: #f0f9ff;
}

.diferencia-precio {
  color: #d97706;
  font-weight: 600;
}

.tabla-carrito input[type="number"] {
  width: 50px;
  padding: 0.25rem;
  text-align: center;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
}

/* ==========================================================================
   BADGES Y ETIQUETAS DE ESTADO
   ========================================================================== */
.badge-saldo,
.badge-pago,
.tag-estado {
  font-size: 0.72rem;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  font-weight: 700;
  display: inline-block;
  text-align: center;
}

.badge-saldo {
  background: #e2e8f0;
  color: #475569;
}

.badge-saldo.pendiente,
.tag-estado.deuda {
  background: #fef2f2;
  color: #dc2626;
}

.tag-estado.al-dia,
.badge-pago.pagada,
.badge-pago.contado {
  background: #f0fdf4;
  color: #16a34a;
}

.badge-pago.credito,
.badge-pago.pendiente {
  background: #fff7ed;
  color: #ea580c;
}

/* ==========================================================================
   BOTONES
   ========================================================================== */
.btn-primario,
.btn-facturar {
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: background 0.15s ease;
}

.btn-primario:hover:not(:disabled),
.btn-facturar:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-secundario,
.btn-cancelar {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secundario:hover,
.btn-cancelar:hover {
  background: #e2e8f0;
}

.btn-abono {
  background: #16a34a;
  color: white;
  border: none;
  padding: 0.35rem 0.7rem;
  border-radius: 5px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  font-weight: 600;
}

.btn-abono:hover {
  background: #15803d;
}

.btn-icon,
.btn-refrescar,
.btn-eliminar,
.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.btn-icon {
  font-size: 1.1rem;
  color: #64748b;
  padding: 0.3rem;
}

.btn-icon:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-icon.success {
  color: #16a34a;
}

.btn-icon.danger,
.btn-eliminar {
  color: #ef4444;
}

.btn-refrescar {
  border: 1px solid #cbd5e1;
  padding: 0.45rem;
  color: #475569;
}

.btn-refrescar:hover {
  background: #f8fafc;
}

.btn-limpiar {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 0.8rem;
  cursor: pointer;
  text-decoration: underline;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed !important;
}

/* ==========================================================================
   VENTANAS MODALES
   ========================================================================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 100;
}

.modal-card,
.modal-box {
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 460px;
  padding: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-lg {
  max-width: 650px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-footer,
.modal-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.25rem;
}

/* ==========================================================================
   UTILIDADES Y ESTADOS
   ========================================================================== */
.text-success { color: #16a34a; }
.text-danger { color: #dc2626; }
.text-blue { color: #0284c7; font-weight: 600; }
.text-muted { color: #64748b; }
.text-center { text-align: center; }
.font-bold { font-weight: 700; }
.font-medium { font-weight: 500; }

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>