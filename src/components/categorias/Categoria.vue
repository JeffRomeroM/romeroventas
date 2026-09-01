<template>
  <div>
    <!-- Botón activador para abrir el modal -->
    <button type="button" class="btn-secundario" @click="abrirModal">
      <Icon icon="mdi:tag-outline" />
      <span>Categorías</span>
    </button>

    <!-- Modal de Gestión de Categorías -->
    <transition name="fade">
      <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Gestión de Categorías</h3>
            <button type="button" class="btn-close" @click="cerrarModal" aria-label="Cerrar modal">
              <Icon icon="mdi:close" />
            </button>
          </div>

          <div class="modal-body">
            <!-- Formulario (Crear / Editar) -->
            <form @submit.prevent="guardarCategoria" class="cat-form">
              <div class="form-group">
                <label>{{ editandoId ? 'Editar Categoría' : 'Nueva Categoría' }} *</label>
                <div class="cat-input-group">
                  <input 
                    v-model="catNombre" 
                    type="text" 
                    required 
                    placeholder="Ej. Repuestos, Aceites..." 
                  />
                  <div class="form-actions">
                    <button type="submit" class="btn-primario" :disabled="guardando">
                      <Icon v-if="guardando" icon="mdi:loading" class="spin" />
                      <span>{{ editandoId ? 'Actualizar' : 'Agregar' }}</span>
                    </button>
                    <button v-if="editandoId" type="button" class="btn-secundario-cancel" @click="cancelarEdicion">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <hr class="divider" />

            <!-- Listado de Categorías -->
            <div class="cat-list-container">
              <p class="cat-list-title">Categorías Registradas ({{ categorias.length }})</p>
              
              <div v-if="cargando" class="cat-empty">
                <Icon icon="mdi:loading" class="spin" /> Cargando categorías...
              </div>

              <div v-else-if="categorias.length === 0" class="cat-empty">
                No hay categorías registradas.
              </div>

              <ul v-else class="cat-list">
                <li v-for="cat in categorias" :key="cat.id" class="cat-item">
                  <span class="cat-nombre">{{ cat.nombre }}</span>
                  <div class="acciones">
                    <button type="button" class="btn-icon" @click="prepararEdicion(cat)" title="Editar" aria-label="Editar">
                      <Icon icon="mdi:pencil-outline" />
                    </button>
                    <button type="button" class="btn-icon danger" @click="eliminarCategoria(cat.id)" title="Eliminar" aria-label="Eliminar">
                      <Icon icon="mdi:trash-can-outline" />
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../../supabase/supabase.js' 

const emit = defineEmits(['actualizado'])

const modalAbierto = ref(false)
const cargando = ref(false)
const guardando = ref(false)
const categorias = ref([])
const catNombre = ref('')
const editandoId = ref(null)

const cargarCategorias = async () => {
  cargando.value = true
  try {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id
    if (!userId) return

    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('user_id', userId)
      .order('nombre', { ascending: true })

    if (error) throw error
    categorias.value = data || []
  } catch (err) {
    console.error('Error al obtener categorías:', err.message)
  } finally {
    cargando.value = false
  }
}

const abrirModal = () => {
  cancelarEdicion()
  cargarCategorias()
  modalAbierto.value = true
}

const cerrarModal = () => {
  modalAbierto.value = false
  cancelarEdicion()
}

const prepararEdicion = (cat) => {
  editandoId.value = cat.id
  catNombre.value = cat.nombre
}

const cancelarEdicion = () => {
  editandoId.value = null
  catNombre.value = ''
}

const guardarCategoria = async () => {
  if (!catNombre.value.trim()) return
  guardando.value = true

  try {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id

    if (!userId) {
      alert('Sesión no válida.')
      return
    }

    if (editandoId.value) {
      const { error } = await supabase
        .from('categorias')
        .update({ nombre: catNombre.value.trim() })
        .eq('id', editandoId.value)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('categorias')
        .insert([{ nombre: catNombre.value.trim(), user_id: userId }])

      if (error) throw error
    }

    cancelarEdicion()
    await cargarCategorias()
    emit('actualizado')
  } catch (err) {
    alert('Error al guardar categoría: ' + err.message)
  } finally {
    guardando.value = false
  }
}

const eliminarCategoria = async (id) => {
  if (!confirm('¿Eliminar esta categoría? Los productos asociados quedarán sin categoría.')) return
  try {
    const { error } = await supabase.from('categorias').delete().eq('id', id)
    if (error) throw error
    await cargarCategorias()
    emit('actualizado')
  } catch (err) {
    alert('Error al eliminar categoría: ' + err.message)
  }
}
</script>

<style scoped>
.btn-secundario {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-secundario:hover {
  background: #e2e8f0;
}

.btn-secundario-cancel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 0.85rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-secundario-cancel:hover {
  background: #e2e8f0;
}

.btn-primario {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  padding: 0.5rem 0.85rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-primario:hover {
  background: #1d4ed8;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
}

.modal-card {
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.3rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.btn-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
}

.cat-input-group {
  display: flex;
  gap: 0.5rem;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}

.cat-input-group input {
  flex: 1;
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.88rem;
  outline: none;
}

.cat-input-group input:focus {
  border-color: #2563eb;
}

.divider {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 1.25rem 0;
  flex-shrink: 0;
}

.cat-list-container {
  max-height: 240px;
  overflow-y: auto;
}

.cat-list-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.cat-empty {
  font-size: 0.85rem;
  color: #94a3b8;
  text-align: center;
  padding: 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.cat-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.cat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  gap: 0.5rem;
}

.cat-nombre {
  font-size: 0.88rem;
  font-weight: 600;
  color: #334155;
  word-break: break-word;
}

.acciones {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #64748b;
  padding: 0.4rem;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-icon.danger:hover {
  background: #fef2f2;
  color: #dc2626;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsivo para móviles pequeños */
@media (max-width: 480px) {
  .cat-input-group {
    flex-direction: column;
  }

  .form-actions {
    width: 100%;
  }

  .form-actions .btn-primario,
  .form-actions .btn-secundario-cancel {
    flex: 1;
    padding: 0.65rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .modal-header {
    padding: 0.85rem 1rem;
  }
}
</style>