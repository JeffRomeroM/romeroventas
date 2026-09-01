<template>
  <div class="auth-card">
    <div class="auth-header">
      <Icon icon="mdi:store-plus-outline" class="auth-icon" />
      <h2>Crear Negocio</h2>
      <p>Registra tu cuenta para empezar a vender</p>
    </div>

    <div v-if="errorMessage" class="alert error">
      <Icon icon="mdi:alert-circle-outline" />
      <span>{{ errorMessage }}</span>
    </div>

    <div v-if="successMessage" class="alert success">
      <Icon icon="mdi:check-circle-outline" />
      <span>{{ successMessage }}</span>
    </div>

    <form @submit.prevent="handleRegister" class="auth-form">
      <div class="form-group">
        <label for="reg-username">Nombre del Propietario</label>
        <div class="input-wrapper">
          <Icon icon="mdi:account-outline" class="input-icon" />
          <input
            id="reg-username"
            v-model="form.username"
            type="text"
            placeholder="Ej. Juan Pérez"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="reg-negocio">Nombre del Negocio</label>
        <div class="input-wrapper">
          <Icon icon="mdi:store-outline" class="input-icon" />
          <input
            id="reg-negocio"
            v-model="form.nombreNegocio"
            type="text"
            placeholder="Ej. Abarrotes San José"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="reg-email">Correo Electrónico</label>
        <div class="input-wrapper">
          <Icon icon="mdi:email-outline" class="input-icon" />
          <input
            id="reg-email"
            v-model="form.email"
            type="email"
            placeholder="correo@ejemplo.com"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="reg-password">Contraseña</label>
        <div class="input-wrapper">
          <Icon icon="mdi:lock-outline" class="input-icon" />
          <input
            id="reg-password"
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            required
            minlength="6"
          />
        </div>
      </div>

      <button type="submit" class="btn-submit" :disabled="loading">
        <Icon v-if="loading" icon="mdi:loading" class="spin-icon" />
        <span>{{ loading ? 'Registrando...' : 'Crear Cuenta' }}</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../supabase/supabase'

const emit = defineEmits(['registered'])

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive({
  username: '',
  nombreNegocio: '',
  email: '',
  password: ''
})

const handleRegister = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // 1. Registro en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password
    })

    if (authError) throw authError

    const user = authData?.user
    if (!user) throw new Error('No se pudo completar el registro del usuario.')

    // 2. Insertar perfil del usuario (Tabla perfiles: id, nombre)
    const { error: profileError } = await supabase
      .from('perfiles')
      .upsert({
        id: user.id,
        nombre: form.username
      })

    if (profileError) {
      console.error('Error en tabla perfiles:', profileError)
      throw new Error('Error al guardar el nombre de usuario.')
    }

    // 3. Insertar negocio según tu esquema exacto (user_id, nombre_negocio, propietario_id)
    const { data: negocioData, error: negocioError } = await supabase
      .from('negocios')
      .insert({
        user_id: user.id,
        propietario_id: user.id,
        nombre_negocio: form.nombreNegocio,
        moneda: 'C$'
      })
      .select()
      .single()

    if (negocioError) {
      console.error('Error en tabla negocios:', negocioError)
      throw new Error(`Error al crear el negocio: ${negocioError.message}`)
    }

    // 4. Guardar identificadores en el almacenamiento local
    if (negocioData?.id) {
      localStorage.setItem('negocio_activo_id', negocioData.id)
    }

    successMessage.value = '¡Cuenta y negocio creados con éxito! Redirigiendo...'
    setTimeout(() => {
      emit('registered', user)
    }, 1500)

  } catch (err) {
    errorMessage.value = err.message || 'Ocurrió un error al registrar.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-card {
  background-color: var(--card-bg, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  padding: 2.25rem 2rem;
  width: 100%;
  max-width: 440px;
  box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
}

.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.auth-icon {
  font-size: 2.75rem;
  color: var(--primary-color, #2563eb);
  margin-bottom: 0.5rem;
}

.auth-header h2 {
  font-size: 1.4rem;
  color: var(--text-main, #0f172a);
  margin-bottom: 0.25rem;
  font-weight: 700;
}

.auth-header p {
  font-size: 0.875rem;
  color: var(--text-muted, #64748b);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main, #0f172a);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.85rem;
  font-size: 1.25rem;
  color: var(--text-muted, #64748b);
  pointer-events: none;
}

.input-wrapper input {
  width: 100%;
  padding: 0.75rem 0.85rem 0.75rem 2.6rem;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius, 8px);
  font-size: 0.95rem;
  outline: none;
  background-color: #ffffff;
  transition: var(--transition, all 0.2s ease);
}

.input-wrapper input:focus {
  border-color: var(--primary-color, #2563eb);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.btn-submit {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--primary-color, #2563eb);
  color: #ffffff;
  padding: 0.8rem;
  border: none;
  border-radius: var(--radius, 8px);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: var(--transition, all 0.2s ease);
}

.btn-submit:hover {
  background-color: var(--primary-hover, #1d4ed8);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.85rem;
  border-radius: var(--radius, 8px);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.alert.error {
  background-color: var(--error-bg, #fef2f2);
  color: var(--error-color, #dc2626);
  border: 1px solid var(--error-border, #fecaca);
}

.alert.success {
  background-color: var(--success-bg, #f0fdf4);
  color: var(--success-color, #16a34a);
  border: 1px solid var(--success-border, #bbf7d0);
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 1.5rem 1.25rem;
    box-shadow: none;
    border: none;
    background: transparent;
  }
}
</style>