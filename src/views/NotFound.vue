<template>
  <div class="not-found-container">
    <div class="not-found-card">
      <!-- Ilustración de error 404 -->
      <div class="code-badge">404</div>
      
      <h1 class="not-found-title">Página no encontrada</h1>
      <p class="not-found-description">
        Lo sentimos, la sección a la que intentas acceder no existe, ha sido movida o no tienes permisos para verla.
      </p>

      <!-- Botones de Acción -->
      <div class="actions">
        <button @click="irAtras" class="btn btn-secondary">
          <Icon icon="mdi:arrow-left" class="btn-icon" />
          <span>Volver atrás</span>
        </button>

        <router-link to="/dashboard" class="btn btn-primary">
          <Icon icon="mdi:home-outline" class="btn-icon" />
          <span>Ir al Dashboard</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const router = useRouter()

const irAtras = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.not-found-container {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: #f8fafc;
}

.not-found-card {
  max-width: 480px;
  width: 100%;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  padding: 2.5rem 2rem;
  text-align: center;
}

.code-badge {
  display: inline-block;
  font-size: 3.5rem;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.25rem 1.25rem;
  border-radius: 9999px;
  margin-bottom: 1.25rem;
  line-height: 1.2;
}

.not-found-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.75rem 0;
}

.not-found-description {
  font-size: 0.925rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 2rem 0;
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.btn-icon {
  font-size: 1.15rem;
}

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #ffffff;
  color: #334155;
  border-color: #cbd5e1;
}

.btn-secondary:hover {
  background-color: #f1f5f9;
  border-color: #94a3b8;
}

/* RESPONSIVE */
@media (max-width: 480px) {
  .not-found-card {
    padding: 1.75rem 1.25rem;
  }

  .code-badge {
    font-size: 2.75rem;
  }

  .actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>