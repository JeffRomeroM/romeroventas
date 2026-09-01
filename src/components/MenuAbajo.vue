<template>
  

  <nav class="navigation-bar">
    

    <div class="nav-links">
      <RouterLink to="/pos" class="nav-item">
        <Icon icon="mdi:store-outline" class="nav-icon" />
        <span class="label">POS</span>
      </RouterLink>
     
      <RouterLink to="/ventas" class="nav-item">
        <Icon icon="mdi:cart-outline" class="nav-icon" />
        <span class="label">Ventas</span>
      </RouterLink>
      

      <RouterLink to="/inventario" class="nav-item">
        <Icon icon="mdi:package-variant" class="nav-icon" />
        <span class="label">Inventario</span>
      </RouterLink>

      <RouterLink to="/clientes" class="nav-item">
        <Icon icon="mdi:account-group" class="nav-icon" />
        <span class="label">Clientes</span>
      </RouterLink>

    

  

      

      
    </div>
  </nav>

</template>

<script setup>
import { Icon } from '@iconify/vue'


</script>

<style scoped>
/* --- CONFIGURACIÓN BASE --- */
.navigation-bar {
  --nav-width: 70px;
  --primary: #2563eb;
  --bg-card: #ffffff;
  
  display: flex;
  flex-direction: column;
  width: var(--nav-width);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: var(--bg-card);
  box-shadow: 2px 0 15px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  padding: 1.5rem 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Badge de Notificación */
.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge {
  position: absolute;
  top: -4px;
  right: -6px;
  background: #e74c3c;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 5px;
  border-radius: 10px;
  border: 2px solid white;
}

/* --- POPOVER STYLE --- */
.more-button { position: relative; cursor: pointer; }

.more-popover {
  position: absolute;
  bottom: 80px;
  right: 10px;
  width: 220px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  z-index: 2000;
  padding: 15px 0;
  text-align: left;
}

.popover-title {
  padding: 0 20px 10px 20px;
  font-size: 14px;
  font-weight: 700;
  color: #333;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 10px;
}

.pop-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  text-decoration: none;
  color: #475569;
  transition: background 0.2s;
}

.pop-item:active { background: #f8fafc; }

.pop-icon { color: var(--primary); font-size: 22px; }

.overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 900;
  background: rgba(0,0,0,0.05);
}

/* Animación */
.pop-enter-active, .pop-leave-active { transition: all 0.2s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(10px) scale(0.95); }

/* --- LOS DEMÁS ESTILOS SE MANTIENEN --- */
.mobile-header {
  display: none;
  transition: transform 0.3s ease-in-out, opacity 0.3s ease;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.logo-desktop { width: 45px; height: auto; }

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  align-items: center;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #94a3b8;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  transition: all 0.2s ease;
  position: relative;
}

.nav-icon { font-size: 26px; }

.label {
  position: absolute;
  left: 70px;
  background: #1e293b;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(-10px);
  pointer-events: none;
  transition: all 0.2s ease;
}

.nav-item:hover .label { opacity: 1; transform: translateX(0); }
.nav-item:hover { color: var(--primary); background: rgba(46, 204, 113, 0.08); }
.router-link-active { color: var(--primary); background: rgba(46, 204, 113, 0.12); }

/* --- ocultamos en pc --- */
@media (min-width:768px) {
    .navigation-bar
    {
        display: none;
    }
}

@media (max-width: 768px) {
  .navigation-bar {
    flex-direction: row;
    width: 100%;
    height: 45px; /* Aumentado un poco para mejor tacto */
    top: auto;
    bottom: 0;
    padding: 0;
    justify-content: center;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
    border-top: 1px solid #f1f5f9;
  }
  
  .mobile-header {
    display: flex;
    align-items: center;
    gap: 10px;
    position: fixed;
    top: 0;
    left: 0;
    width: 30%;
    height: 60px;
    background: transparent; /* Cambiado a sólido para el logo */
    padding: 0 1.5rem;
    z-index: 1100;
  }

  .header-hidden { transform: translateY(-100%); opacity: 0; }
  .logo-mobile { 
    width: 52px;
  }
  .nav-links { flex-direction: row; width: 100%; justify-content: space-around; gap: 0; }
  .nav-item { width: 25%; height: 100%; border-radius: 0; }
  .nav-icon { font-size: 24px; margin-bottom: 2px; }
  .label {
    position: static;
    opacity: 1;
    transform: none;
    background: none;
    color: inherit;
    font-size: 10px;
    padding: 0;
    font-weight: 700;
  }
  .logo-container { display: none; }
}
</style>