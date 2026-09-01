# 🛒 RomeroPOS - Sistema Punto de Venta (PWA)

Una aplicación web progresiva (PWA) moderna para la gestión de inventario, facturación e impresión térmica de tickets, diseñada para optimizar las operaciones de comercio local.

![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4fc08d?style=flat&logo=vuedotjs)
![Vite](https://img.shields.io/badge/Vite-6.x-646cff?style=flat&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=flat&logo=supabase)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat&logo=pwa)

---

## 🚀 Características Principales

* **Terminal Punto de Venta (POS):** Interfaz ágil para registro de ventas en tiempo real.
* **Impresión Térmica Directa:** Compatible con impresoras de tickets de 58 mm y 80 mm (layout optimizado CSS media print).
* **Gestión de Inventario y Categorías:** Control total sobre productos, precios y agrupaciones.
* **Gestión de Clientes y Egresos:** Registro detallado de cuentas por cobrar y gastos operativos.
* **Modo Progresivo (PWA):** Instalable en dispositivos móviles y de escritorio para acceso rápido.
* **Seguridad y Perfiles:** Control de acceso mediante verificación de clave para secciones administrativas y políticas RLS en base de datos.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** Vue 3 (Composition API `<script setup>`), Vue Router.
* **Build Tool:** Vite.
* **Estilos:** CSS3 Puro (Diseño Adaptativo / Responsive Design).
* **Backend & Database:** Supabase (Autenticación, PostgreSQL, RLS).
* **Iconos:** Iconify (`@iconify/vue`).
* **PWA:** `vite-plugin-pwa`.

---

## 📦 Instalación y Configuración Local

### Requisitos Previos
* **Node.js:** `v18.0.0` o superior.
* **npm:** `v9.0.0` o superior.

### 1. Clonar el repositorio
```bash
git clone [https://github.com/JeffRomeroM/romeroventas.git](https://github.com/JeffRomeroM/romeroventas.git)
cd romeroventas