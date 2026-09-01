<template>
  <main class="auth-viewport">
    <div class="auth-card">
      <div class="auth-header">
        <img src="/logo.png" alt="Logo" class="auth-icon" />
        <h2>Iniciar Sesión</h2>
        <p>Ingresa tus credenciales para acceder al sistema</p>
      </div>

      <div v-if="errorMessage" class="alert error">
        <Icon icon="mdi:alert-circle-outline" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="login-email">Correo Electrónico</label>
          <div class="input-wrapper">
            <Icon icon="mdi:email-outline" class="input-icon" />
            <input
              id="login-email"
              v-model="form.email"
              type="email"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="login-password">Contraseña</label>
          <div class="input-wrapper">
            <Icon icon="mdi:lock-outline" class="input-icon" />
            <input
              id="login-password"
              v-model="form.password"
              :type="mostrarPassword ? 'text' : 'password'"
              placeholder="••••••••"
              required
              class="input-con-toggle"
            />
            <button
              type="button"
              class="btn-toggle-password"
              @click="mostrarPassword = !mostrarPassword"
              :title="mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              tabindex="-1"
            >
              <Icon :icon="mostrarPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" />
            </button>
          </div>
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          <Icon v-if="loading" icon="mdi:loading" class="spin-icon" />
          <span>{{ loading ? 'Entrando...' : 'Acceder' }}</span>
        </button>
      </form>

      <div class="auth-footer">
        <p>¿No tienes una cuenta aún? <router-link to="/register">Crear Negocio</router-link></p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { supabase } from '../supabase/supabase'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const mostrarPassword = ref(false)

const form = reactive({
  email: '',
  password: ''
})

// Traduce los errores técnicos de Supabase/red a mensajes claros
// para el usuario, sin exponer el mensaje crudo en inglés.
function obtenerMensajeError(err) {
  // Errores de conexión: fetch falla antes de llegar a Supabase
  // (sin internet, servidor caído, CORS, DNS, etc.)
  const esErrorDeRed =
    err instanceof TypeError ||
    err?.message?.toLowerCase().includes('failed to fetch') ||
    err?.message?.toLowerCase().includes('network') ||
    (typeof navigator !== 'undefined' && navigator.onLine === false)

  if (esErrorDeRed) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet e intenta de nuevo.'
  }

  const mensaje = err?.message || ''

  if (mensaje.includes('Invalid login credentials')) {
    return 'Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.'
  }
  if (mensaje.includes('Email not confirmed')) {
    return 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.'
  }
  if (mensaje.includes('Too many requests') || mensaje.includes('rate limit')) {
    return 'Demasiados intentos seguidos. Espera unos minutos antes de volver a intentar.'
  }
  if (mensaje.includes('User not found')) {
    return 'No existe una cuenta con ese correo. Verifica el correo o crea un negocio nuevo.'
  }

  return 'Ocurrió un error inesperado al iniciar sesión. Intenta de nuevo en unos momentos.'
}

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    })

    if (error) throw error

    // Redirección directa al Dashboard al iniciar sesión
    router.push('/pos')
  } catch (err) {
    errorMessage.value = obtenerMensajeError(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-viewport {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
  padding: 1.5rem;
  background-color: var(--bg-color, #f8fafc);
  box-sizing: border-box;
}

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
  width: 60px;
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

/* Espacio extra a la derecha para el botón de mostrar/ocultar */
.input-wrapper input.input-con-toggle {
  padding-right: 2.6rem;
}

.btn-toggle-password {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  font-size: 1.15rem;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.15rem;
}

.btn-toggle-password:hover {
  color: var(--primary-color, #2563eb);
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

.auth-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-muted, #64748b);
}

.auth-footer a {
  color: var(--primary-color, #2563eb);
  font-weight: 600;
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

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .auth-viewport {
    padding: 1rem 0.5rem;
    align-items: flex-start;
    padding-top: 2rem;
  }
  .auth-card {
    padding: 1.5rem 1.25rem;
    box-shadow: none;
    border: none;
    background: transparent;
  }
}
</style>