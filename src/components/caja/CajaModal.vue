<template>
  <transition name="fade">
    <div v-if="mostrar" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-card">
        
        <!-- HEADER -->
        <div class="modal-header">
          <div class="titulo-con-icono">
            <Icon icon="mdi:cash-register" class="header-icon" />
            <h3>Gestión y Arqueo de Caja</h3>
          </div>
          <button type="button" class="btn-cerrar" @click="cerrarModal">
            <Icon icon="mdi:close" />
          </button>
        </div>

        <!-- CARGANDO -->
        <div v-if="cargando" class="estado-cargando">
          <Icon icon="mdi:loading" class="spin" />
          <p>Consultando estado de caja...</p>
        </div>

        <div v-else class="modal-body">
          
          <!-- ALERTA DE ERROR DE VALIDACIÓN -->
          <div v-if="errorValidacion" class="alerta-error">
            <Icon icon="mdi:alert-circle-outline" class="error-icon" />
            <span>{{ errorValidacion }}</span>
          </div>

          <!-- ESTADO 1: APERTURA DE CAJA -->
          <div v-if="!cajaActiva" class="seccion-caja">
            <div class="alerta-info">
              <Icon icon="mdi:information-outline" class="info-icon" />
              <span>No hay un turno de caja abierto. Ingresa el fondo base para iniciar.</span>
            </div>

            <form @submit.prevent="mantenimientoCaja">
              <div class="form-group">
                <label>Fondo Inicial (C$/Efectivo Base)</label>
                <div class="input-prefix">
                  <span>C$</span>
                  <input
                    v-model.trim="montoInput"
                    type="text"
                    inputmode="decimal"
                    placeholder="0.00"
                    @input="errorValidacion = ''"
                  />
                </div>
                <small class="help-text">Ingresa el dinero disponible para cambio.</small>
              </div>

              <button type="submit" class="btn-primary" :disabled="procesando">
                <Icon v-if="!procesando" icon="mdi:lock-open-outline" />
                <Icon v-else icon="mdi:loading" class="spin" />
                <span>{{ procesando ? 'Abriendo...' : 'Abrir Caja' }}</span>
              </button>
            </form>
          </div>

          <!-- ESTADO 2: CAJA ABIERTA / CIERRE Y ARQUEO -->
          <div v-else class="seccion-caja">
            <div class="badge-estado abierta">
              <Icon icon="mdi:circle" class="dot-green" />
              <span>Caja Abierta desde: {{ formatearFecha(cajaActiva.fecha_apertura) }}</span>
            </div>

            <!-- RESUMEN EN TIEMPO REAL -->
            <div class="resumen-grid">
              <div class="resumen-item">
                <span class="lbl">Fondo Inicial</span>
                <span class="val">C$ {{ formatMonto(cajaActiva.monto_inicial) }}</span>
              </div>
              <div class="resumen-item">
                <span class="lbl">Ventas Efectivo</span>
                <span class="val positivo">+ C$ {{ formatMonto(totalesVentas.efectivo) }}</span>
              </div>
              <div class="resumen-item total-esperado">
                <span class="lbl">Efectivo Esperado</span>
                <span class="val">C$ {{ formatMonto(efectivoEsperadoEnGaveta) }}</span>
              </div>
            </div>

            <!-- OTROS MÉTODOS DE PAGO (INFORMATIVO) -->
            <div class="metodos-adicionales" v-if="totalesVentas.transferencia > 0 || totalesVentas.credito > 0">
              <div class="m-item" v-if="totalesVentas.transferencia > 0">
                <span>Transferencias:</span>
                <strong>C$ {{ formatMonto(totalesVentas.transferencia) }}</strong>
              </div>
              <div class="m-item" v-if="totalesVentas.credito > 0">
                <span>Ventas Crédito:</span>
                <strong>C$ {{ formatMonto(totalesVentas.credito) }}</strong>
              </div>
            </div>

            <hr class="divider" />

            <!-- CONTEO FÍSICO PARA ARQUEO -->
            <h4 class="subtitulo-cierre">Conteo Físico para Arqueo</h4>
            
            <form @submit.prevent="mantenimientoCaja">
              <div class="form-group">
                <label>Dinero Físico Real en Gaveta</label>
                <div class="input-prefix">
                  <span>C$</span>
                  <input
                    v-model.trim="montoInput"
                    type="text"
                    inputmode="decimal"
                    placeholder="0.00"
                    @input="errorValidacion = ''"
                  />
                </div>
                <small class="help-text">Debes ingresar el dinero contado físicamente.</small>
              </div>

              <!-- PREVISUALIZACIÓN DE DIFERENCIA -->
              <div v-if="montoInput !== '' && montoInput !== null" class="arqueo-preview" :class="claseDiferencia">
                <div class="diferencia-linea">
                  <span>Diferencia:</span>
                  <strong>
                    {{ calculoDiferencia > 0 ? '+' : '' }}C$ {{ formatMonto(calculoDiferencia) }}
                  </strong>
                </div>
                <span class="diferencia-texto">{{ mensajeDiferencia }}</span>
              </div>

              <button type="submit" class="btn-danger" :disabled="procesando">
                <Icon v-if="!procesando" icon="mdi:lock-outline" />
                <Icon v-else icon="mdi:loading" class="spin" />
                <span>{{ procesando ? 'Procesando Cierre...' : 'Confirmar Cierre y Arqueo' }}</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../../supabase/supabase.js'

const props = defineProps({
  mostrar: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:mostrar', 'caja-cambiada'])

const cajaActiva = ref(null)
const totalesVentas = ref({ efectivo: 0, transferencia: 0, credito: 0 })

const cargando = ref(false)
const procesando = ref(false)
const errorValidacion = ref('')

const montoInput = ref('')

const formatMonto = (num) => Number(num || 0).toFixed(2)

watch(() => props.mostrar, (nuevoValor) => {
  if (nuevoValor && props.userId) {
    montoInput.value = ''
    errorValidacion.value = ''
    consultarEstadoCaja()
  }
})

// 1. CONSULTAR CAJA ABIERTA
const consultarEstadoCaja = async () => {
  cargando.value = true
  try {
    const { data: caja, error } = await supabase
      .from('cajas')
      .select('*')
      .eq('user_id', props.userId)
      .ilike('estado', 'Abierta')
      .order('fecha_apertura', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    cajaActiva.value = caja

    if (caja) {
      await calcularDesgloseVentas(caja.id)
    }
  } catch (err) {
    console.error('Error al consultar caja:', err.message)
  } finally {
    cargando.value = false
  }
}

// 2. CALCULAR VENTAS
const calcularDesgloseVentas = async (cajaId) => {
  try {
    const { data: ventas, error } = await supabase
      .from('ventas')
      .select('total, tipo_pago')
      .eq('caja_id', cajaId)

    if (error) throw error

    let ef = 0, tr = 0, cr = 0

    ;(ventas || []).forEach(v => {
      const monto = Number(v.total || 0)
      const tipo = (v.tipo_pago || '').toLowerCase()

      if (tipo.includes('efectivo')) ef += monto
      else if (tipo.includes('transferencia')) tr += monto
      else if (tipo.includes('credito') || tipo.includes('crédito')) cr += monto
    })

    totalesVentas.value = { efectivo: ef, transferencia: tr, credito: cr }
  } catch (err) {
    console.error('Error al calcular ventas:', err.message)
  }
}

// COMPUTADAS
const efectivoEsperadoEnGaveta = computed(() => {
  if (!cajaActiva.value) return 0
  return Number(cajaActiva.value.monto_inicial || 0) + totalesVentas.value.efectivo
})

const calculoDiferencia = computed(() => {
  const valorLimpio = String(montoInput.value || '').trim().replace(',', '.')
  if (valorLimpio === '' || isNaN(Number(valorLimpio))) return 0
  const real = Number(valorLimpio)
  return real - efectivoEsperadoEnGaveta.value
})

const claseDiferencia = computed(() => {
  const valorLimpio = String(montoInput.value || '').trim()
  if (valorLimpio === '') return ''
  const diff = Number(calculoDiferencia.value.toFixed(2))
  if (diff === 0) return 'cuadrada'
  return diff > 0 ? 'sobrante' : 'faltante'
})

const mensajeDiferencia = computed(() => {
  const diff = Number(calculoDiferencia.value.toFixed(2))
  if (diff === 0) return 'Caja perfectamente cuadrada.'
  if (diff > 0) return `Sobrante detectado: C$ ${diff.toFixed(2)}`
  return `Faltante detectado: C$ ${Math.abs(diff).toFixed(2)}`
})

// CONTROLADOR Y VALIDADOR DE SUBMIT
const mantenimientoCaja = () => {
  errorValidacion.value = ''

  // 1. Convertir a string explícito y limpiar espacios
  const valorLimpio = String(montoInput.value || '').trim()

  // 2. DETECCIÓN DE CAMPO VACÍO
  if (valorLimpio === '') {
    errorValidacion.value = 'El campo no puede estar vacío. Debes ingresar un monto.'
    return // INTERRUMPE LA EJECUCIÓN
  }

  // 3. NORMALIZAR COMAS A PUNTOS
  const valorNormalizado = valorLimpio.replace(',', '.')

  // 4. VALIDAR NÚMERO
  const num = Number(valorNormalizado)

  if (isNaN(num)) {
    errorValidacion.value = 'El valor ingresado no es un número válido.'
    return // INTERRUMPE LA EJECUCIÓN
  }

  if (num < 0) {
    errorValidacion.value = 'El monto no puede ser un número negativo.'
    return // INTERRUMPE LA EJECUCIÓN
  }

  // SI PASA TODAS LAS VALIDACIONES
  if (!cajaActiva.value) {
    procesarApertura(num)
  } else {
    procesarCierre(num)
  }
}

// PROCESAR APERTURA EN SUPABASE
const procesarApertura = async (monto) => {
  procesando.value = true
  try {
    const { data, error } = await supabase
      .from('cajas')
      .insert([
        {
          user_id: props.userId,
          monto_inicial: monto,
          estado: 'Abierta',
          fecha_apertura: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error

    cajaActiva.value = data
    montoInput.value = ''
    emit('caja-cambiada', { estado: 'Abierta', caja: data })
    cerrarModal()
  } catch (err) {
    errorValidacion.value = 'Error al abrir caja: ' + err.message
  } finally {
    procesando.value = false
  }
}

// PROCESAR CIERRE EN SUPABASE
const procesarCierre = async (monto) => {
  if (!cajaActiva.value || !cajaActiva.value.id) {
    errorValidacion.value = 'No existe una caja activa para cerrar.'
    return
  }

  const diff = Number(calculoDiferencia.value.toFixed(2))

  let confirmacion = `¿Confirmar cierre de caja con C$ ${monto.toFixed(2)}?`
  if (diff < 0) {
    confirmacion = `¡FALTANTE DETECTADO! Faltan C$ ${Math.abs(diff).toFixed(2)}. ¿Cerrar de todos modos?`
  } else if (diff > 0) {
    confirmacion = `¡SOBRANTE DETECTADO! Sobran C$ ${diff.toFixed(2)}. ¿Cerrar de todos modos?`
  }

  if (!window.confirm(confirmacion)) return

  procesando.value = true
  try {
    const { data, error } = await supabase
      .from('cajas')
      .update({
        monto_final: monto,
        estado: 'Cerrada',
        fecha_cierre: new Date().toISOString()
      })
      .eq('id', cajaActiva.value.id)
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      throw new Error('No se actualizó el registro en la base de datos. Verifica los permisos RLS en Supabase.')
    }

    cajaActiva.value = null
    montoInput.value = ''
    emit('caja-cambiada', { estado: 'Cerrada', caja: data[0] })
    cerrarModal()
  } catch (err) {
    errorValidacion.value = 'Error al cerrar caja: ' + err.message
  } finally {
    procesando.value = false
  }
}

const cerrarModal = () => {
  emit('update:mostrar', false)
}

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return ''
  return new Date(fechaStr).toLocaleString('es-NI', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: #ffffff;
  width: 100%;
  max-width: 480px;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.titulo-con-icono {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.header-icon { font-size: 1.5rem; color: #2563eb; }
.modal-header h3 { margin: 0; font-size: 1.15rem; font-weight: 700; color: #0f172a; }

.btn-cerrar {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 6px;
}
.btn-cerrar:hover { background: #f1f5f9; color: #0f172a; }

.modal-body { padding: 1.25rem; }

.estado-cargando {
  padding: 3rem 1rem;
  text-align: center;
  color: #64748b;
}

.spin {
  animation: spin 1s linear infinite;
  font-size: 1.8rem;
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.alerta-info, .alerta-error {
  display: flex;
  gap: 0.75rem;
  padding: 0.85rem;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
  align-items: center;
}

.alerta-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}

.alerta-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-weight: 600;
}

.info-icon, .error-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.badge-estado {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  margin-bottom: 1.25rem;
}
.badge-estado.abierta { background: #dcfce7; color: #166534; }
.dot-green { font-size: 0.6rem; color: #22c55e; }

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1.25rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.input-prefix {
  display: flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
}

.input-prefix span {
  padding: 0.65rem 0.85rem;
  background: #e2e8f0;
  font-weight: 700;
  color: #475569;
  font-size: 0.9rem;
}

.input-prefix input {
  border: none;
  outline: none;
  width: 100%;
  padding: 0.65rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  background: #fff;
}

.help-text { font-size: 0.75rem; color: #64748b; }

.resumen-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.85rem;
  margin-bottom: 0.5rem;
}

.resumen-item { display: flex; flex-direction: column; }
.resumen-item .lbl { font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 600; }
.resumen-item .val { font-size: 0.92rem; font-weight: 700; color: #0f172a; }
.resumen-item .val.positivo { color: #16a34a; }
.resumen-item.total-esperado .val { color: #2563eb; }

.metodos-adicionales {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0.25rem;
  font-size: 0.8rem;
  color: #475569;
}

.divider { border: none; border-top: 1px solid #e2e8f0; margin: 1rem 0; }

.subtitulo-cierre {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  color: #0f172a;
  font-weight: 700;
}

.arqueo-preview {
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.arqueo-preview.cuadrada { background: #dcfce7; border: 1px solid #86efac; color: #166534; }
.arqueo-preview.sobrante { background: #fef9c3; border: 1px solid #fde047; color: #854d0e; }
.arqueo-preview.faltante { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; }

.diferencia-linea { display: flex; justify-content: space-between; font-size: 0.9rem; }
.diferencia-texto { font-size: 0.78rem; font-weight: 500; }

.btn-primary, .btn-danger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.92rem;
  border: none;
  cursor: pointer;
}

.btn-primary { background: #2563eb; color: #fff; }
.btn-danger { background: #dc2626; color: #fff; }
.btn-primary:disabled, .btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>