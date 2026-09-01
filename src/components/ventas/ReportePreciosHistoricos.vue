<template>
  <div class="componente-reporte">
    <div class="card-reporte">
      <div class="reporte-header">
        <div>
          <h3>Historial de Precios y Ganancias por Venta</h3>
          <p class="desc">
            Los precios congelados garantizan que el historial y las utilidades pasadas no cambien cuando modifiques los precios del catálogo.
          </p>
        </div>
        <button class="btn-refrescar" @click="cargarReporte">
          <Icon icon="mdi:refresh" :class="{ 'spin': cargando }" />
        </button>
      </div>

      <div v-if="cargando" class="cargando-box">
        <Icon icon="mdi:loading" class="spin" /> Cuestionando registros históricos...
      </div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Cliente</th>
              <th>Cant.</th>
              <th class="col-destacada">Precio Vendido</th>
              <th class="col-destacada">Costo Vendido</th>
              <th>Precio Catálogo Actual</th>
              <th>Ganancia Real (Congelada)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in registros" :key="index">
              <td>{{ formatFecha(item.fecha) }}</td>
              <td class="font-medium">{{ item.producto_nombre || 'Producto Eliminado' }}</td>
              <td>{{ item.cliente_nombre || 'Cliente General' }}</td>
              <td class="text-center">{{ item.cantidad }}</td>
              
              <!-- PRECIOS CONGELADOS AL MOMENTO DE VENTA -->
              <td class="col-destacada text-blue">
                C$ {{ formatMonto(item.precio_venta_historico) }}
              </td>
              <td class="col-destacada text-muted">
                C$ {{ formatMonto(item.precio_costo_historico) }}
              </td>

              <!-- PRECIO ACTUAL EN EL CATÁLOGO -->
              <td>
                <span :class="{'diferencia-precio': item.precio_venta_actual !== item.precio_venta_historico}">
                  C$ {{ formatMonto(item.precio_venta_actual) }}
                </span>
              </td>

              <!-- GANANCIA REAL -->
              <td class="text-success font-bold">
                C$ {{ formatMonto(item.ganancia_real_historica) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../../supabase/supabase.js'

const registros = ref([])
const cargando = ref(true)

const formatMonto = (v) => Number(v || 0).toFixed(2)
const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-NI') : '-'

const cargarReporte = async () => {
  cargando.value = true
  try {
    // 0. OBTENER EL USUARIO AUTENTICADO
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No hay una sesión activa.')

    // 1. CARGA DEL REPORTE HISTÓRICO FILTRADO POR USUARIO
    const { data, error } = await supabase
      .from('vista_reporte_ventas_historico')
      .select('*')
      .eq('user_id', user.id) // <--- Filtro por usuario
      .order('fecha', { ascending: false })

    if (error) throw error
    registros.value = data || []
  } catch (e) {
    console.error('Error al cargar reporte histórico:', e.message)
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarReporte()
})
</script>

<style scoped>
.card-reporte { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; }
.reporte-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
.desc { font-size: 0.8rem; color: #64748b; margin-top: 0.2rem; }

.table-wrapper { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.83rem; text-align: left; }
th, td { padding: 0.65rem; border-bottom: 1px solid #f1f5f9; }
th { background: #f8fafc; color: #475569; }

.col-destacada { background: #f0f9ff; }
.text-blue { color: #0284c7; font-weight: 600; }
.text-muted { color: #64748b; }
.text-success { color: #16a34a; }
.font-bold { font-weight: 700; }
.font-medium { font-weight: 500; }

.diferencia-precio { color: #d97706; font-weight: 600; }

.btn-refrescar { background: none; border: 1px solid #cbd5e1; padding: 0.4rem; border-radius: 6px; cursor: pointer; }
.cargando-box { padding: 2rem; text-align: center; color: #64748b; font-size: 0.9rem; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>