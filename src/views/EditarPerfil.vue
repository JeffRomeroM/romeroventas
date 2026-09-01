<template>
  <div class="perfil-container">
    <div class="card-perfil">
      <!-- Encabezado -->
      <div class="card-header">
        <h2>Configuración del Perfil y Negocio</h2>
        <p class="subtitulo">Actualiza tu nombre de usuario y la información comercial de tu negocio.</p>
      </div>

      <!-- Estado de Carga -->
      <div v-if="cargando" class="estado-cargando">
        <Icon icon="mdi:loading" class="spin" />
        <span>Cargando información...</span>
      </div>

      <!-- Formulario -->
      <form v-else @submit.prevent="guardarCambios" class="form-body">
        
        <!-- SECCIÓN 1: PERFIL DE USUARIO -->
        <div class="seccion-form">
          <h3 class="seccion-titulo">Información Personal</h3>
          <div class="grid-form">
            <div class="form-group col-full">
              <label>Nombre Completo / Usuario</label>
              <div class="input-icon-box">
                <Icon icon="mdi:account-outline" class="input-icon" />
                <input 
                  v-model="perfil.nombre" 
                  type="text" 
                  required
                  placeholder="Ej. Jeffrin Romero"
                />
              </div>
            </div>
          </div>
        </div>

        <hr class="divisor" />

        <!-- SECCIÓN 2: DATOS DEL NEGOCIO -->
        <div class="seccion-form">
          <h3 class="seccion-titulo">Detalles del Negocio</h3>
          <div class="grid-form">
            <!-- Nombre del Negocio -->
            <div class="form-group col-full">
              <label>Nombre Comercial del Negocio</label>
              <div class="input-icon-box">
                <Icon icon="mdi:storefront-outline" class="input-icon" />
                <input 
                  v-model="negocio.nombre_negocio" 
                  type="text" 
                  required
                  placeholder="Ej. Comercial Romero"
                />
              </div>
            </div>

            <!-- Moneda
            <div class="form-group">
              <label>Símbolo / Tipo de Moneda</label>
              <div class="input-icon-box">
                <Icon icon="mdi:currency-usd" class="input-icon" />
                <input 
                  v-model="negocio.moneda" 
                  type="text" 
                  placeholder="Ej. C$ o USD"
                />
              </div>
            </div> -->

            <!-- Teléfono -->
            <div class="form-group">
              <label>Teléfono de Contacto</label>
              <div class="input-icon-box">
                <Icon icon="mdi:phone-outline" class="input-icon" />
                <input 
                  v-model="negocio.telefono" 
                  type="text" 
                  placeholder="Ej. +505 8888 8888"
                />
              </div>
            </div>

            <!-- Dirección -->
            <div class="form-group col-full">
              <label>Dirección del Establecimiento</label>
              <div class="input-icon-box">
                <Icon icon="mdi:map-marker-outline" class="input-icon icon-top" />
                <textarea 
                  v-model="negocio.direccion" 
                  rows="2"
                  placeholder="Ej. De la iglesia central, 2 cuadras al sur..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Alerta de Notificación -->
        <div v-if="mensaje.texto" class="alerta-box" :class="mensaje.tipo">
          <Icon :icon="mensaje.tipo === 'error' ? 'mdi:alert-circle-outline' : 'mdi:check-circle-outline'" />
          <span>{{ mensaje.texto }}</span>
        </div>

        <!-- Botón de Guardar -->
        <div class="form-actions">
          <button type="submit" :disabled="guardando" class="btn-guardar">
            <Icon v-if="guardando" icon="mdi:loading" class="spin" />
            <Icon v-else icon="mdi:content-save-outline" />
            <span>{{ guardando ? 'Guardando...' : 'Guardar Cambios' }}</span>
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../supabase/supabase.js'

const cargando = ref(true)
const guardando = ref(false)

const perfil = ref({
  nombre: ''
})

const negocio = ref({
  id: null,
  nombre_negocio: '',
  moneda: 'C$',
  direccion: '',
  telefono: ''
})

const mensaje = ref({ texto: '', tipo: 'exito' })

const notificar = (texto, tipo = 'exito') => {
  mensaje.value = { texto, tipo }
  setTimeout(() => { mensaje.value.texto = '' }, 4000)
}

const cargarDatos = async () => {
  cargando.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado.')

    // 1. Cargar Perfil
    const { data: dataPerfil, error: errPerfil } = await supabase
      .from('perfiles')
      .select('nombre')
      .eq('id', user.id)
      .maybeSingle()

    if (errPerfil) throw errPerfil
    if (dataPerfil) {
      perfil.value.nombre = dataPerfil.nombre || ''
    }

    // 2. Cargar Negocio
    const { data: dataNegocio, error: errNegocio } = await supabase
      .from('negocios')
      .select('id, nombre_negocio, moneda, direccion, telefono')
      .eq('user_id', user.id)
      .maybeSingle()

    if (errNegocio) throw errNegocio
    if (dataNegocio) {
      negocio.value = { ...dataNegocio }
    }

  } catch (err) {
    notificar(err.message, 'error')
  } finally {
    cargando.value = false
  }
}

const guardarCambios = async () => {
  guardando.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Sesión expirada.')

    // Upsert Perfil
    const { error: errPerfil } = await supabase
      .from('perfiles')
      .upsert({
        id: user.id,
        nombre: perfil.value.nombre
      })

    if (errPerfil) throw errPerfil

    // Upsert Negocio
    const payloadNegocio = {
      user_id: user.id,
      nombre_negocio: negocio.value.nombre_negocio,
      moneda: negocio.value.moneda,
      direccion: negocio.value.direccion,
      telefono: negocio.value.telefono,
      propietario_id: user.id
    }

    if (negocio.value.id) {
      payloadNegocio.id = negocio.value.id
    }

    const { data: dataNeg, error: errNegocio } = await supabase
      .from('negocios')
      .upsert(payloadNegocio)
      .select('id')
      .single()

    if (errNegocio) throw errNegocio
    if (dataNeg) negocio.value.id = dataNeg.id

    notificar('Información actualizada correctamente', 'exito')
  } catch (err) {
    notificar(err.message, 'error')
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
/* ESTRUCTURA Y ARCHITECTURA BASE */
.perfil-container {
  max-width: 768px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.card-perfil {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* ENCABEZADO */
.card-header {
  padding: 1.25rem 1.5rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.subtitulo {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  color: #64748b;
}

/* FORMULARIO Y SECCIONES */
.form-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.seccion-titulo {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 1rem;
}

.divisor {
  border: 0;
  height: 1px;
  background: #e2e8f0;
  margin: 0;
}

/* GRID RESPONSIVO */
.grid-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.col-full {
  grid-column: span 2;
}

/* CAMPOS E INPUTS */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.input-icon-box {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.75rem;
  font-size: 1.2rem;
  color: #94a3b8;
  pointer-events: none;
}

.input-icon.icon-top {
  top: 0.65rem;
}

.input-icon-box input,
.input-icon-box textarea {
  width: 100%;
  padding: 0.55rem 0.75rem 0.55rem 2.4rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
  background-color: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.input-icon-box textarea {
  resize: none;
}

.input-icon-box input:focus,
.input-icon-box textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

/* ESTADOS DE CARGA Y ALERTAS */
.estado-cargando {
  padding: 3rem 1.5rem;
  text-align: center;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spin {
  animation: girar 1s linear infinite;
  font-size: 1.25rem;
}

@keyframes girar {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.alerta-box {
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid transparent;
}

.alerta-box.exito {
  background-color: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}

.alerta-box.error {
  background-color: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

/* BOTONES Y ACCIONES */
.form-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-guardar {
  background-color: #2563eb;
  color: #ffffff;
  border: none;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
  width: auto;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-guardar:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}

/* MEDIA QUERIES (RESPONSIVE) */
@media (max-width: 640px) {
  .perfil-container {
    padding: 0.75rem 0.5rem;
  }

  .form-body {
    padding: 1rem;
    gap: 1.25rem;
  }

  .grid-form {
    grid-template-columns: 1fr;
  }

  .col-full {
    grid-column: span 1;
  }

  .btn-guardar {
    width: 100%;
  }
}
</style>