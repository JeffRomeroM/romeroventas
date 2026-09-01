<template>
  <div class="facturacion-container">
    <div class="grid-pos">

      <!-- CATÁLOGO DE PRODUCTOS -->
      <div class="panel-card flex-column panel-catalogo">
        <div class="panel-header">
          <div>
            <h3>Catálogo de Productos</h3>
            <p class="subtitulo">Selecciona productos para añadirlos a la factura</p>
          </div>
          <div class="buscador-box">
            <Icon icon="mdi:magnify" class="search-icon" />
            <input 
              v-model="busquedaProducto" 
              type="text" 
              placeholder="Buscar por Nombre, SKU o Descripción..." 
              class="input-search"
            />
            <button v-if="busquedaProducto" class="btn-clear-search" @click="busquedaProducto = ''">
              <Icon icon="mdi:close-circle" />
            </button>
          </div>
        </div>

        <div v-if="cargandoProductos" class="estado-cargando">
          <Icon icon="mdi:loading" class="spin" /> Cargando productos...
        </div>

        <div v-else-if="productosFiltrados.length === 0" class="estado-mensaje">
          <Icon icon="mdi:package-variant-remove" class="icon-empty" />
          <p>No se encontraron productos coincidentes.</p>
        </div>

        <div v-else class="productos-grid">
          <div 
            v-for="p in productosFiltrados" 
            :key="p.id" 
            class="card-producto"
            :class="{ 'sin-stock': Number(p.stock_actual) <= 0 }"
            @click="agregarAlCarrito(p)"
          >
            <div class="prod-top">
              <span class="prod-sku">{{ p.sku || 'SIN SKU' }}</span>
              <span class="badge-stock" :class="{ 'low-stock': p.stock_actual <= 5 && p.stock_actual > 0 }">
                Stock: {{ p.stock_actual }}
              </span>
            </div>
            <div class="prod-mid">
              <span class="prod-nombre">{{ p.nombre }}</span>
              <p class="prod-desc" v-if="p.descripcion">{{ p.descripcion }}</p>
            </div>
            <div class="prod-bottom">
              <span class="prod-precio">C$ {{ formatMonto(p.precio_venta) }}</span>
              <button class="btn-add" :disabled="Number(p.stock_actual) <= 0">
                <Icon icon="mdi:plus" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- FACTURA / CLIENTE / PAGO -->
      <div class="panel-card flex-column pos-factura">
        <div class="panel-header border-bottom pb-2">
          <div>
            <h3>Nueva Venta</h3>
            <p class="subtitulo">Detalle y cobro de la transacción</p>
          </div>
          <button v-if="carrito.length > 0" class="btn-vaciar-carrera" @click="vaciarCarrito">
            <Icon icon="mdi:trash-can-outline" />
            <span>Vaciar</span>
          </button>
        </div>

        <!-- SELECCIÓN DE CLIENTE -->
        <div class="seccion-cliente">
          <label class="lbl-section">Cliente <span v-if="tipoPago === 'Credito'" class="req-asterisk">* Obligatorio para Crédito</span></label>
          <div class="cliente-selector-container">
            <div class="input-cliente-box">
              <Icon icon="mdi:account-search-outline" class="icon-left" />
              <input 
                type="text" 
                v-model="busquedaCliente" 
                placeholder="Buscar por nombre, teléfono..."
                @focus="mostrarDropdownCliente = true"
                class="input-cliente"
                :class="{ 'border-danger': tipoPago === 'Credito' && !clienteId }"
              />
              <button v-if="clienteId" class="btn-deselect" @click="deseleccionarCliente">
                <Icon icon="mdi:close" />
              </button>
            </div>

            <div v-if="mostrarDropdownCliente && clientesFiltrados.length > 0" class="dropdown-clientes">
              <div 
                v-for="c in clientesFiltrados" 
                :key="c.id" 
                class="cliente-item-option"
                @click="seleccionarCliente(c)"
              >
                <div class="c-main-info">
                  <span class="c-nombre">{{ c.nombre }}</span>
                  <span class="c-detalles font-sm">
                    <Icon icon="mdi:phone-outline" class="inline-icon" /> {{ c.telefono || 'Sin tel.' }} 
                    <span class="separator">|</span> 
                    <Icon icon="mdi:map-marker-outline" class="inline-icon" /> {{ c.direccion || 'Sin dir.' }}
                  </span>
                </div>
                <div class="c-limite">Límite: C$ {{ formatMonto(c.limite_credito) }}</div>
              </div>
            </div>
          </div>

          <div v-if="clienteSeleccionado" class="card-cliente-detalles">
            <div class="cliente-header-info">
              <Icon icon="mdi:account-check" class="icon-active" />
              <div class="c-info-wrap">
                <span class="c-title">{{ clienteSeleccionado.nombre }}</span>
                <span class="c-sub-info">
                  {{ clienteSeleccionado.telefono ? 'Tel: ' + clienteSeleccionado.telefono : '' }} 
                  {{ clienteSeleccionado.direccion ? ' | Dir: ' + clienteSeleccionado.direccion : '' }}
                </span>
              </div>
            </div>
            <div class="grid-cliente-metricas">
              <div class="metric">
                <span class="m-label">Límite</span>
                <span class="m-val">C$ {{ formatMonto(clienteSeleccionado.limite_credito) }}</span>
              </div>
              <div class="metric">
                <span class="m-label">
                  Deuda
                  <button type="button" class="btn-refresh-deuda" title="Actualizar saldo" @click="calcularSaldoCliente">
                    <Icon icon="mdi:refresh" />
                  </button>
                </span>
                <span class="m-val text-danger">C$ {{ formatMonto(saldoDeudaCliente) }}</span>
              </div>
              <div class="metric">
                <span class="m-label">Disponible</span>
                <span class="m-val" :class="creditoDisponible < totalVenta ? 'text-danger' : 'text-success'">
                  C$ {{ formatMonto(creditoDisponible) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- MÉTODOS DE PAGO -->
        <div class="seccion-pago">
          <label class="lbl-section">Método de Pago</label>
          <div class="grid-metodos-pago">
            <button 
              type="button" 
              class="btn-pago-card" 
              :class="{ 'active': tipoPago === 'Efectivo' }" 
              @click="tipoPago = 'Efectivo'"
            >
              <Icon icon="mdi:cash" class="pago-icon" />
              <span>Efectivo</span>
            </button>

            <button 
              type="button" 
              class="btn-pago-card" 
              :class="{ 'active': tipoPago === 'Transferencia' }" 
              @click="tipoPago = 'Transferencia'"
            >
              <Icon icon="mdi:bank-transfer" class="pago-icon" />
              <span>Transferencia</span>
            </button>

            <button 
              type="button" 
              class="btn-pago-card" 
              :class="{ 'active': tipoPago === 'Credito' }" 
              @click="tipoPago = 'Credito'"
            >
              <Icon icon="mdi:credit-card-clock-outline" class="pago-icon" />
              <span>Crédito</span>
            </button>
          </div>

          <div v-if="tipoPago === 'Credito'" class="alerta-box">
            <div v-if="!clienteId" class="alerta-danger">
              <Icon icon="mdi:alert-circle-outline" /> Selecciona un cliente registrado.
            </div>
            <div v-else-if="creditoDisponible < totalVenta" class="alerta-danger">
              <Icon icon="mdi:alert-circle-outline" /> Límite excedido (Disp: C$ {{ formatMonto(creditoDisponible) }}).
            </div>
          </div>
        </div>

        <!-- TABLA Y VISTA RESPONSIVE DEL CARRITO -->
        <div class="carrito-body flex-1">
          <div v-if="carrito.length === 0" class="carrito-vacio">
            <Icon icon="mdi:cart-outline" class="icon-vacio" />
            <p>Añade productos para generar la factura</p>
          </div>

          <template v-else>
            <!-- VISTA ESCRITORIO / TABLET (TABLA) -->
            <table class="tabla-carrito vista-escritorio">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="text-center">Cant.</th>
                  <th class="text-right">Precio</th>
                  <th class="text-right">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in carrito" :key="item.producto_id">
                  <td class="col-nombre">
                    <span class="p-title">{{ item.nombre }}</span>
                  </td>
                  <td class="col-cant text-center">
                    <div class="control-cantidad">
                      <button class="btn-step" @click="decrementarCantidad(item, idx)">
                        <Icon icon="mdi:minus" />
                      </button>
                      <span class="cant-val">{{ item.cantidad }}</span>
                      <button class="btn-step" @click="incrementarCantidad(item)">
                        <Icon icon="mdi:plus" />
                      </button>
                    </div>
                  </td>
                  <td class="text-right col-precio">
                    <div class="precio-editable-wrap">
                      <span class="precio-prefijo">C$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        class="input-precio-editable"
                        :class="{ 'precio-modificado': item.precio_unitario !== item.precio_original }"
                        v-model.number="item.precio_unitario"
                        @focus="$event.target.select()"
                      />
                      <button
                        v-if="item.precio_unitario !== item.precio_original"
                        class="btn-reset-precio"
                        title="Restablecer precio original"
                        @click="restablecerPrecio(item)"
                      >
                        <Icon icon="mdi:restore" />
                      </button>
                    </div>
                  </td>
                  <td class="text-right font-bold">C$ {{ formatMonto(item.cantidad * item.precio_unitario) }}</td>
                  <td class="text-center">
                    <button class="btn-eliminar" @click="removerDelCarrito(idx)">
                      <Icon icon="mdi:close" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- VISTA MÓVIL (TARJETAS DESGLOSADAS) -->
            <div class="carrito-cards-movil vista-movil">
              <div v-for="(item, idx) in carrito" :key="'movil-' + item.producto_id" class="card-item-carrito">
                <div class="item-head-movil">
                  <span class="item-nombre-movil">{{ item.nombre }}</span>
                  <button class="btn-eliminar" @click="removerDelCarrito(idx)">
                    <Icon icon="mdi:close" />
                  </button>
                </div>
                
                <div class="item-body-movil">
                  <div class="control-cantidad">
                    <button class="btn-step" @click="decrementarCantidad(item, idx)">
                      <Icon icon="mdi:minus" />
                    </button>
                    <span class="cant-val">{{ item.cantidad }}</span>
                    <button class="btn-step" @click="incrementarCantidad(item)">
                      <Icon icon="mdi:plus" />
                    </button>
                  </div>

                  <div class="precio-editable-wrap">
                    <span class="precio-prefijo">C$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      class="input-precio-editable"
                      :class="{ 'precio-modificado': item.precio_unitario !== item.precio_original }"
                      v-model.number="item.precio_unitario"
                      @focus="$event.target.select()"
                    />
                    <button
                      v-if="item.precio_unitario !== item.precio_original"
                      class="btn-reset-precio"
                      title="Restablecer precio original"
                      @click="restablecerPrecio(item)"
                    >
                      <Icon icon="mdi:restore" />
                    </button>
                  </div>

                  <div class="subtotal-movil">
                    C$ {{ formatMonto(item.cantidad * item.precio_unitario) }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- TOTALES Y COBRO -->
        <div class="carrito-footer">
          <div class="linea-total">
            <span>Total a Pagar</span>
            <span class="monto-total">C$ {{ formatMonto(totalVenta) }}</span>
          </div>

          <button 
            class="btn-facturar" 
            :disabled="botonProcesarDeshabilitado"
            @click="procesarVenta"
          >
            <Icon v-if="guardandoVenta" icon="mdi:loading" class="spin" />
            <Icon v-else icon="mdi:check-circle-outline" />
            <span>{{ guardandoVenta ? 'Procesando...' : 'Completar y Cobrar' }}</span>
          </button>
        </div>

      </div>
    </div>

    <!-- MODAL DE COMPROBANTE -->
    <div v-if="modalFacturaVisible" class="modal-overlay">
      <div class="modal-card modal-ticket-card">
        <div class="modal-header">
          <h3>Comprobante de Venta</h3>
          <button class="btn-close" @click="cerrarModalFactura">✕</button>
        </div>

        <div id="seccion-ticket" class="ticket-wrapper">
          <div class="ticket-header">
            <h4>{{ datosNegocio.nombre_negocio }}</h4>
            <p v-if="datosNegocio.direccion">{{ datosNegocio.direccion }}</p>
            <p v-if="datosNegocio.telefono">Cel/WhatsApp: {{ datosNegocio.telefono }}</p>
            <p>Factura N°: #{{ ultimaFactura?.id }}</p>
            <p>Fecha: {{ new Date(ultimaFactura?.created_at).toLocaleString() }}</p>
            <hr />
            <p><strong>Cliente:</strong> {{ clienteSeleccionado?.nombre || 'Cliente General' }}</p>
            <p v-if="clienteSeleccionado?.telefono"><strong>Teléfono:</strong> {{ clienteSeleccionado.telefono }}</p>
            <p><strong>Método de Pago:</strong> {{ ultimaFactura?.tipo_pago }}</p>
          </div>

          <hr />

          <table class="ticket-tabla">
            <thead>
              <tr>
                <th>Cant.</th>
                <th>Desc.</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in copiaCarritoFacturado" :key="item.producto_id">
                <td>{{ item.cantidad }}</td>
                <td>{{ item.nombre }}</td>
                <td class="text-right">C$ {{ formatMonto(item.cantidad * item.precio_unitario) }}</td>
              </tr>
            </tbody>
          </table>

          <hr />

          <div class="ticket-total">
            <span>TOTAL:</span>
            <span>C$ {{ formatMonto(ultimaFactura?.total) }}</span>
          </div>
          
          <div class="ticket-footer">
            <p>¡Gracias por su compra!</p>
          </div>
        </div>

        <div class="modal-actions-grid">
          <button class="btn-secundario" @click="imprimirTicket">
            <Icon icon="mdi:printer" /> Imprimir
          </button>
          <button class="btn-primary" @click="descargarPDF">
            <Icon icon="mdi:file-pdf-box" /> PDF
          </button>
          <button class="btn-whatsapp" @click="compartirWhatsApp">
            <Icon icon="mdi:whatsapp" /> WhatsApp
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DE NOTIFICACIONES -->
    <div v-if="modalMensaje.visible" class="modal-overlay">
      <div class="modal-card modal-alerta">
        <div class="modal-header">
          <div class="modal-title-box" :class="modalMensaje.tipo">
            <Icon :icon="modalMensaje.tipo === 'error' ? 'mdi:alert-circle' : 'mdi:check-circle'" class="m-icon" />
            <h3>{{ modalMensaje.titulo }}</h3>
          </div>
        </div>
        <div class="modal-body font-size-sm">
          <p>{{ modalMensaje.contenido }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="modalMensaje.visible = false">Entendido</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { supabase } from '../../supabase/supabase.js'
import html2pdf from 'html2pdf.js'

// ESTADO GENERAL
const datosNegocio = ref({
  nombre_negocio: 'Mi Negocio',
  telefono: '',
  direccion: ''
})

const productos = ref([])
const clientes = ref([])
const carrito = ref([])
const copiaCarritoFacturado = ref([])

const busquedaProducto = ref('')
const busquedaCliente = ref('')
const mostrarDropdownCliente = ref(false)

const tipoPago = ref('Efectivo')
const clienteId = ref('')
const saldoDeudaCliente = ref(0)

const cargandoProductos = ref(true)
const guardandoVenta = ref(false)

const modalFacturaVisible = ref(false)
const ultimaFactura = ref(null)

const modalMensaje = ref({
  visible: false,
  titulo: '',
  contenido: '',
  tipo: 'error'
})

// AUXILIARES
const mostrarNotificacion = (titulo, contenido, tipo = 'error') => {
  modalMensaje.value = { visible: true, titulo, contenido, tipo }
}

const formatMonto = (num) => Number(num || 0).toFixed(2)

// COMPUTADAS
const clienteSeleccionado = computed(() => {
  return clientes.value.find(c => c.id === clienteId.value) || null
})

const clientesFiltrados = computed(() => {
  const q = busquedaCliente.value.toLowerCase().trim()
  if (!q) return clientes.value
  return clientes.value.filter(c => 
    c.nombre.toLowerCase().includes(q) ||
    (c.telefono && c.telefono.toLowerCase().includes(q)) ||
    (c.direccion && c.direccion.toLowerCase().includes(q))
  )
})

const creditoDisponible = computed(() => {
  if (!clienteSeleccionado.value) return 0
  const limite = Number(clienteSeleccionado.value.limite_credito || 0)
  return limite - saldoDeudaCliente.value
})

const productosFiltrados = computed(() => {
  const q = busquedaProducto.value.toLowerCase().trim()
  if (!q) return productos.value
  return productos.value.filter(p => 
    p.nombre.toLowerCase().includes(q) ||
    (p.sku && p.sku.toLowerCase().includes(q)) ||
    (p.descripcion && p.descripcion.toLowerCase().includes(q))
  )
})

const totalVenta = computed(() => {
  return carrito.value.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0)
})

const botonProcesarDeshabilitado = computed(() => {
  if (carrito.value.length === 0 || guardandoVenta.value) return true
  if (tipoPago.value === 'Credito') {
    if (!clienteId.value) return true
    if (creditoDisponible.value < totalVenta.value) return true
  }
  return false
})

// CARGA DE DATOS
const cargarDatosIniciales = async () => {
  cargandoProductos.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Sesión no válida o expirada.')

    const { data: dataNegocio } = await supabase
      .from('negocios')
      .select('nombre_negocio, telefono, direccion')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (dataNegocio) {
      datosNegocio.value = {
        nombre_negocio: dataNegocio.nombre_negocio || 'Mi Negocio',
        telefono: dataNegocio.telefono || '',
        direccion: dataNegocio.direccion || ''
      }
    }

    const { data: dataProd, error: errProd } = await supabase
      .from('productos')
      .select('id, nombre, sku, descripcion, precio_venta, costo, stock_actual')
      .eq('user_id', user.id)
      .order('nombre', { ascending: true })

    if (errProd) throw errProd
    productos.value = dataProd || []

    const { data: dataCli, error: errCli } = await supabase
      .from('clientes')
      .select('id, nombre, telefono, direccion, limite_credito')
      .eq('user_id', user.id)
      .order('nombre', { ascending: true })

    if (errCli) throw errCli
    clientes.value = dataCli || []

  } catch (err) {
    mostrarNotificacion('Error de Carga', err.message)
  } finally {
    cargandoProductos.value = false
  }
}

const seleccionarCliente = (cliente) => {
  clienteId.value = cliente.id
  busquedaCliente.value = cliente.nombre
  mostrarDropdownCliente.value = false
  calcularSaldoCliente()
}

const deseleccionarCliente = () => {
  clienteId.value = ''
  busquedaCliente.value = ''
  saldoDeudaCliente.value = 0
}

const calcularSaldoCliente = async () => {
  if (!clienteId.value) return
  try {
    const { data, error } = await supabase
      .from('vista_resumen_creditos_cliente')
      .select('saldo_pendiente')
      .eq('cliente_id', clienteId.value)
      .maybeSingle()

    if (error) throw error
    saldoDeudaCliente.value = data ? Number(data.saldo_pendiente || 0) : 0
  } catch (err) {
    mostrarNotificacion('Error al calcular saldo', err.message)
  }
}

// CARRITO
const agregarAlCarrito = (prod) => {
  const stockDispo = Number(prod.stock_actual || 0)
  if (stockDispo <= 0) return

  const existe = carrito.value.find(item => item.producto_id === prod.id)
  if (existe) {
    if (existe.cantidad + 1 > stockDispo) return
    existe.cantidad++
  } else {
    const precioOriginal = Number(prod.precio_venta || 0)
    carrito.value.push({
      producto_id: prod.id,
      nombre: prod.nombre,
      precio_unitario: precioOriginal,
      precio_original: precioOriginal,
      precio_costo: Number(prod.costo || 0),
      cantidad: 1,
      stock_disponible: stockDispo
    })
  }
}

const restablecerPrecio = (item) => { item.precio_unitario = item.precio_original }
const incrementarCantidad = (item) => { if (item.cantidad < item.stock_disponible) item.cantidad++ }
const decrementarCantidad = (item, index) => {
  if (item.cantidad > 1) item.cantidad--
  else removerDelCarrito(index)
}
const removerDelCarrito = (index) => carrito.value.splice(index, 1)
const vaciarCarrito = () => { carrito.value = [] }

// PROCESAMIENTO
const procesarVenta = async () => {
  if (botonProcesarDeshabilitado.value) return
  guardandoVenta.value = true

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Sesión de usuario no encontrada.')

    const esCredito = tipoPago.value === 'Credito' || tipoPago.value === 'Crédito'
    const estadoPagoInicial = esCredito ? 'Pendiente' : 'Pagada'

    const { data: venta, error: errVenta } = await supabase
      .from('ventas')
      .insert([{
        user_id: user.id,
        cliente_id: clienteId.value || null,
        tipo_pago: tipoPago.value,
        total: totalVenta.value,
        estado: 'Completada',
        estado_pago: estadoPagoInicial
      }])
      .select()
      .single()

    if (errVenta) throw errVenta

    const detallePayload = carrito.value.map(item => ({
      venta_id: venta.id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      precio_costo: Number(item.precio_costo || 0)
    }))

    const { error: errDetalle } = await supabase.from('detalle_venta').insert(detallePayload)
    if (errDetalle) throw errDetalle

    for (const item of carrito.value) {
      await supabase
        .from('productos')
        .update({ stock_actual: item.stock_disponible - item.cantidad })
        .eq('id', item.producto_id)
    }

    ultimaFactura.value = venta
    copiaCarritoFacturado.value = [...carrito.value]
    modalFacturaVisible.value = true

    vaciarCarrito()
    await cargarDatosIniciales()
    if (clienteId.value) await calcularSaldoCliente()

  } catch (err) {
    mostrarNotificacion('Error al procesar la venta', err.message)
  } finally {
    guardandoVenta.value = false
  }
}

// RECURSOS Y EXPORTACIÓN
const compartirWhatsApp = () => {
  const clienteNombre = clienteSeleccionado.value ? clienteSeleccionado.value.nombre : 'Cliente General'
  let mensaje = `*${datosNegocio.value.nombre_negocio}*\n`
  if (datosNegocio.value.direccion) mensaje += `${datosNegocio.value.direccion}\n`
  if (datosNegocio.value.telefono) mensaje += `Cel: ${datosNegocio.value.telefono}\n`
  mensaje += `------------------------------------\n`
  mensaje += `*COMPROBANTE DE COMPRA*\n`
  mensaje += `Factura N°: #${ultimaFactura.value?.id}\n`
  mensaje += `Cliente: ${clienteNombre}\n`
  mensaje += `Método de Pago: ${ultimaFactura.value?.tipo_pago}\n`
  mensaje += `------------------------------------\n`
  
  copiaCarritoFacturado.value.forEach(item => {
    mensaje += `${item.cantidad}x ${item.nombre} - C$ ${formatMonto(item.cantidad * item.precio_unitario)}\n`
  })
  
  mensaje += `------------------------------------\n`
  mensaje += `*TOTAL A PAGAR: C$ ${formatMonto(ultimaFactura.value?.total)}*\n\n`
  mensaje += `¡Gracias por su preferencia!`

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`
  window.open(url, '_blank')
}

const imprimirTicket = () => window.print()

const descargarPDF = () => {
  const element = document.getElementById('seccion-ticket')
  const opt = {
    margin: 5,
    filename: `Factura_${ultimaFactura.value?.id}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' }
  }
  html2pdf().set(opt).from(element).save()
}

const cerrarModalFactura = () => {
  modalFacturaVisible.value = false
  deseleccionarCliente()
}

// CICLO DE VIDA
onMounted(() => {
  cargarDatosIniciales()
})
</script>

<style scoped>
.facturacion-container { 
  padding: 1.25rem; 
  max-width: 1400px; 
  margin: 0 auto; 
}

.grid-pos { 
  display: grid; 
  grid-template-columns: 1fr 460px; 
  gap: 1.25rem; 
}

.panel-card { 
  background: #fff; 
  border: 1px solid #e2e8f0; 
  border-radius: 14px; 
  padding: 1.25rem; 
}

.flex-column { display: flex; flex-direction: column; }
.flex-1 { flex: 1; }

.panel-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 1rem; 
  gap: 0.5rem;
}

.panel-header h3 { margin: 0; font-size: 1.1rem; color: #0f172a; font-weight: 700; }
.subtitulo { margin: 0; font-size: 0.78rem; color: #64748b; }
.req-asterisk { color: #dc2626; font-size: 0.7rem; font-weight: 600; }

.btn-vaciar-carrera {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-vaciar-carrera:hover { background: #ef4444; color: #fff; border-color: #ef4444; }

.buscador-box { position: relative; width: 300px; }
.input-search { 
  width: 100%; 
  padding: 0.55rem 2rem 0.55rem 2.2rem; 
  border: 1px solid #cbd5e1; 
  border-radius: 8px; 
  font-size: 0.85rem; 
  outline: none; 
}

.search-icon { position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
.btn-clear-search { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; }

.productos-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
  gap: 0.85rem; 
  max-height: 600px; 
  overflow-y: auto; 
}

.card-producto { 
  background: #fff; 
  border: 1px solid #e2e8f0; 
  border-radius: 10px; 
  padding: 0.85rem; 
  display: flex; 
  flex-direction: column; 
  justify-content: space-between; 
  cursor: pointer; 
}
.card-producto:hover:not(.sin-stock) { border-color: #2563eb; transform: translateY(-2px); }
.card-producto.sin-stock { opacity: 0.5; background: #f8fafc; cursor: not-allowed; }

.prod-top { display: flex; justify-content: space-between; align-items: center; }
.prod-sku { font-size: 0.68rem; font-weight: 700; color: #64748b; background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; }
.badge-stock { font-size: 0.7rem; font-weight: 600; color: #16a34a; }
.prod-nombre { font-size: 0.88rem; font-weight: 700; color: #1e293b; margin-top: 0.4rem; }
.prod-desc { font-size: 0.75rem; color: #64748b; margin: 0.2rem 0 0 0; }
.prod-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; }
.prod-precio { font-size: 1rem; font-weight: 800; color: #2563eb; }
.btn-add { background: #eff6ff; color: #2563eb; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; }

.lbl-section { font-size: 0.78rem; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 0.4rem; display: block; }
.cliente-selector-container { position: relative; margin-bottom: 0.75rem; }
.input-cliente-box { position: relative; display: flex; align-items: center; }
.input-cliente { width: 100%; padding: 0.55rem 2rem 0.55rem 2.2rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; }
.input-cliente.border-danger { border-color: #dc2626; }
.icon-left { position: absolute; left: 0.65rem; color: #94a3b8; }
.btn-deselect { position: absolute; right: 0.5rem; background: none; border: none; color: #ef4444; cursor: pointer; }

.dropdown-clientes { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-height: 220px; overflow-y: auto; z-index: 50; }
.cliente-item-option { padding: 0.65rem 0.85rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: 1px solid #f8fafc; }
.cliente-item-option:hover { background: #f0f9ff; }
.c-main-info { display: flex; flex-direction: column; }
.c-nombre { font-size: 0.85rem; font-weight: 700; color: #0f172a; }
.c-detalles { font-size: 0.73rem; color: #64748b; margin-top: 0.1rem; display: flex; align-items: center; gap: 0.2rem; }
.inline-icon { font-size: 0.85rem; color: #94a3b8; }
.separator { margin: 0 0.2rem; color: #cbd5e1; }
.c-limite { font-size: 0.75rem; font-weight: 600; color: #2563eb; white-space: nowrap; }

.card-cliente-detalles { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.65rem; margin-bottom: 0.85rem; }
.cliente-header-info { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
.c-info-wrap { display: flex; flex-direction: column; }
.c-title { font-size: 0.85rem; font-weight: 700; color: #0f172a; }
.c-sub-info { font-size: 0.72rem; color: #64748b; }

.grid-cliente-metricas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center; }
.metric { display: flex; flex-direction: column; }
.m-label { font-size: 0.68rem; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 0.2rem; }
.btn-refresh-deuda { background: none; border: none; color: #94a3b8; cursor: pointer; display: inline-flex; align-items: center; padding: 0; font-size: 0.85rem; }
.btn-refresh-deuda:hover { color: #2563eb; }
.m-val { font-size: 0.78rem; font-weight: 700; }

.grid-metodos-pago { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 0.75rem; }
.btn-pago-card { background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.6rem 0.4rem; display: flex; flex-direction: column; align-items: center; cursor: pointer; font-size: 0.78rem; font-weight: 600; color: #475569; }
.btn-pago-card.active { background: #eff6ff; border-color: #2563eb; color: #2563eb; font-weight: 700; }

.alerta-danger { color: #dc2626; font-size: 0.78rem; font-weight: 600; background: #fef2f2; padding: 0.45rem; border-radius: 6px; display: flex; align-items: center; gap: 0.3rem; margin-bottom: 0.5rem; }

.control-cantidad { display: inline-flex; align-items: center; background: #f1f5f9; border-radius: 6px; padding: 0.15rem; }
.btn-step { background: #fff; border: 1px solid #cbd5e1; color: #334155; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.75rem; }
.btn-step:hover { background: #2563eb; color: #fff; border-color: #2563eb; }
.cant-val { padding: 0 0.4rem; font-weight: 700; font-size: 0.82rem; min-width: 20px; text-align: center; }

/* Precio editable en el carrito */
.col-precio { min-width: 110px; }
.precio-editable-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.1rem 0.35rem;
}
.precio-prefijo { font-size: 0.75rem; color: #64748b; font-weight: 600; }
.input-precio-editable {
  width: 60px;
  border: none;
  background: transparent;
  text-align: right;
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
  outline: none;
  -moz-appearance: textfield;
}
.input-precio-editable::-webkit-outer-spin-button,
.input-precio-editable::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.input-precio-editable.precio-modificado { color: #d97706; }
.btn-reset-precio { background: none; border: none; color: #94a3b8; cursor: pointer; display: flex; align-items: center; padding: 0; }
.btn-reset-precio:hover { color: #2563eb; }

.btn-eliminar { background: none; border: none; color: #ef4444; cursor: pointer; padding: 0.2rem; }

.carrito-body { border: 1px solid #f1f5f9; border-radius: 8px; min-height: 180px; max-height: 280px; overflow-y: auto; }
.tabla-carrito { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.tabla-carrito th { background: #f8fafc; padding: 0.45rem; border-bottom: 1px solid #e2e8f0; }
.tabla-carrito td { padding: 0.45rem; border-bottom: 1px solid #f1f5f9; }

.carrito-vacio { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; color: #94a3b8; text-align: center; }
.icon-vacio { font-size: 2.5rem; margin-bottom: 0.5rem; }

.linea-total { display: flex; justify-content: space-between; align-items: center; font-size: 1.1rem; font-weight: 800; margin-top: 0.5rem; }
.monto-total { color: #2563eb; font-size: 1.35rem; }
.btn-facturar { width: 100%; margin-top: 0.75rem; background: #2563eb; color: #fff; border: none; padding: 0.75rem; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.btn-facturar:disabled { background: #cbd5e1; cursor: not-allowed; }

/* MODALES */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); padding: 0.75rem; }
.modal-card { background: #fff; border-radius: 12px; padding: 1.25rem; width: 100%; max-width: 380px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
.modal-alerta { max-width: 320px; text-align: center; }
.modal-title-box { display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.95rem; }
.modal-title-box.error { color: #dc2626; }
.modal-title-box.exito { color: #16a34a; }
.m-icon { font-size: 1.5rem; }

.modal-actions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-top: 1rem; }
.btn-primary { background: #2563eb; color: #fff; border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.2rem; font-size: 0.78rem; font-weight: 600; }
.btn-secundario { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 0.5rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.2rem; font-size: 0.78rem; font-weight: 600; }
.btn-whatsapp { background: #25d366; color: #fff; border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.2rem; font-size: 0.78rem; font-weight: 600; }

.ticket-wrapper { font-family: monospace; font-size: 0.8rem; background: #fff; padding: 0.5rem; }
.ticket-header { text-align: center; }
.ticket-header h4 { margin: 0; font-size: 1.1rem; }
.ticket-header p { margin: 0.15rem 0; color: #334155; }
.ticket-tabla { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
.ticket-total { display: flex; justify-content: space-between; font-weight: bold; font-size: 1rem; margin-top: 0.5rem; }
.ticket-footer { text-align: center; margin-top: 1rem; }

/* CLASES DE CONTROL DE VISIBILIDAD DE DISPOSITIVO */
.vista-movil { display: none; }
.vista-escritorio { display: table; }

/* ========================================================
   RESPONSIVE DESIGN (BREAKPOINTS)
   ======================================================== */

/* TABLETS Y PANTALLAS MEDIANAS (MAX-WIDTH: 992px) */
@media (max-width: 992px) {
  .facturacion-container {
    padding: 0.75rem;
  }

  .grid-pos {
    grid-template-columns: 1fr; /* Apilar módulos verticalmente */
  }

  .pos-factura {
    order: -1; /* Pone el panel de Nueva Venta/Factura en la parte superior */
  }

  .productos-grid {
    max-height: 420px;
  }
}

/* SMARTPHONES Y DISPOSITIVOS PEQUEÑOS (MAX-WIDTH: 640px) */
@media (max-width: 640px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .buscador-box {
    width: 100%;
    margin-top: 0.5rem;
  }

  .productos-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.5rem;
  }

  .card-producto {
    padding: 0.65rem;
  }

  .prod-nombre {
    font-size: 0.8rem;
  }

  .prod-precio {
    font-size: 0.9rem;
  }

  /* Oculta la tabla clásica en celulares */
  .vista-escritorio {
    display: none;
  }

  /* Muestra el diseño de tarjetas táctiles en móviles */
  .vista-movil {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .card-item-carrito {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .item-head-movil {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .item-nombre-movil {
    font-weight: 700;
    font-size: 0.82rem;
    color: #0f172a;
  }

  .item-body-movil {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
  }

  .subtotal-movil {
    font-weight: 800;
    font-size: 0.85rem;
    color: #2563eb;
  }

  .modal-actions-grid {
    grid-template-columns: 1fr; /* Apilar botones del modal */
  }
}
</style>

<style>
@media print {
  /* 1. Configurar el tamaño exacto del papel térmico y eliminar márgenes del navegador */
  @page {
    size: 80mm auto; /* Cambia a 58mm auto si usas impresora pequeña de 58mm */
    margin: 0;
  }

  /* 2. Ocultar absolutamente todo el contenido de la pantalla */
  body * {
    visibility: hidden !important;
    height: 0 !important;
  }

  /* 3. Hacer visible únicamente el contenedor del ticket y forzar ancho estricto */
  #seccion-ticket,
  #seccion-ticket * {
    visibility: visible !important;
    height: auto !important;
  }

  #seccion-ticket {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 72mm !important; /* Ancho imprimible seguro para rollos de 80mm */
    padding: 2mm !important;
    margin: 0 !important;
    background: #fff !important;
    color: #000 !important;
    font-family: 'Courier New', Courier, monospace !important; /* Fuente monospaciada clara para impresoras térmicas */
    font-size: 11px !important;
    line-height: 1.2 !important;
  }

  /* Ocultar modales, overlays y fondos */
  .modal-overlay,
  .modal-card,
  .facturacion-container {
    background: none !important;
    position: static !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .modal-header,
  .modal-actions-grid,
  .btn-close {
    display: none !important;
  }
}
</style>