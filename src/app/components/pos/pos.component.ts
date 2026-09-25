import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PosService } from '../../services/pos/pos.service';
import { InventarioService } from '../../services/inventario/inventario.service';
import { ClienteService } from '../../services/cliente/cliente.service';
import { Producto, Sede, Grupo, Categoria } from '../../interfaces/inventario';
import { Cliente } from '../../interfaces/cliente';
import { ItemCarrito, MetodoPago, PagoVenta, PosConfiguracion, ResultadoVenta } from '../../interfaces/pos';
import { EscanerQrComponent } from '../shared/escaner-qr/escaner-qr.component';

@Component({
    selector: 'app-pos',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule,
              InputTextModule, InputNumberModule, DropdownModule, ToastModule, ConfirmDialogModule,
              TagModule, TooltipModule, EscanerQrComponent],
    templateUrl: './pos.component.html',
    styleUrls: ['./pos.component.css'],
    providers: [MessageService, ConfirmationService]
})
export class PosComponent implements OnInit {

    @ViewChild('barcodeInput') barcodeInput?: ElementRef<HTMLInputElement>;
    @ViewChild('modalBusquedaInput') modalBusquedaInput?: ElementRef<HTMLInputElement>;

    sedes: Sede[] = [];
    idSede: number | null = null;

    clientes: Cliente[] = [];
    clienteSeleccionado: Cliente | null = null;

    config: PosConfiguracion | null = null;

    codigoBarras = '';
    carrito: ItemCarrito[] = [];
    descuentoGlobal = 0;

    // Búsqueda dinámica
    displayBuscador = false;
    textoBusqueda = '';
    grupos: Grupo[] = [];
    categorias: Categoria[] = [];
    filtroGrupo: number | null = null;
    filtroCategoria: number | null = null;
    productosBusqueda: Producto[] = [];
    cargandoProductos = false;

    // Pagos
    metodos: { label: string; value: MetodoPago; icono: string }[] = [
        { label: 'Efectivo', value: 'EFECTIVO', icono: 'fa fa-money-bill-wave' },
        { label: 'Tarjeta', value: 'TARJETA', icono: 'fa fa-credit-card' },
        { label: 'Transferencia', value: 'TRANSFERENCIA', icono: 'fa fa-building-columns' }
    ];
    metodoSeleccionado: MetodoPago = 'EFECTIVO';
    montoPago: number | null = null;
    refPago = '';
    pagos: PagoVenta[] = [];

    loading = false;
    resultado: ResultadoVenta | null = null;
    displayResultado = false;

    // Loaders de acciones post-venta
    generandoTicket = false;
    generandoPdf = false;
    enviandoCorreo = false;
    enviandoWhatsapp = false;

    // Escáner QR con cámara
    displayEscaner = false;

    // Selector de lote
    displayLote = false;
    productoLote: Producto | null = null;
    lotesDisponibles: { lote: string | null; fecha_vencimiento: string | null; cantidad: number; dias_vencimiento: number | null; color_semaforo: string | null }[] = [];
    loteElegido: { lote: string | null; fecha_vencimiento: string | null; cantidad: number } | null = null;
    cantidadLote = 1;
    cargandoLotes = false;

    private debounceTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private posService: PosService,
        private inventarioService: InventarioService,
        private clienteService: ClienteService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.cargarDatos();
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent) {
        if (event.key === 'F2') {
            event.preventDefault();
            this.abrirBuscador();
        }
    }

    async cargarDatos() {
        // Cada consulta es independiente: si una falla, las demás cargan igual.

        try {
            (await this.inventarioService.getSedes()).subscribe({
                next: (res) => {
                    if (res.state === 'OK') {
                        this.sedes = res.body || [];
                        if (this.sedes.length > 0) this.idSede = this.sedes[0].id_sede;
                    }
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'No se pudieron cargar las sedes.' })
            });
        } catch { /* ignore */ }

        try {
            (await this.posService.getConfiguracion()).subscribe({
                next: (res) => { if (res.state === 'OK') this.config = res.body; }
            });
        } catch { /* ignore */ }

        try {
            (await this.clienteService.obtenerDatosClientes()).subscribe({
                next: (clientes) => { this.clientes = (clientes || []).filter(c => c.estado === 'A'); }
            });
        } catch { /* ignore */ }

        try {
            (await this.inventarioService.getGrupos()).subscribe({
                next: (res) => { if (res.state === 'OK') this.grupos = res.body || []; }
            });
        } catch { /* ignore */ }

        try {
            (await this.inventarioService.getCategorias()).subscribe({
                next: (res) => { if (res.state === 'OK') this.categorias = res.body || []; }
            });
        } catch { /* ignore */ }

        this.focusBarcode();
    }

    // ---------------- Lector de código de barras ----------------

    async onBarcode() {
        const codigo = (this.codigoBarras || '').trim();
        if (!codigo) return;

        let cantidad = 1;
        let codigoReal = codigo;
        const match = codigo.match(/^(\d+)\*(.+)$/);
        if (match) {
            cantidad = parseInt(match[1], 10) || 1;
            codigoReal = match[2].trim();
        }
        this.codigoBarras = '';

        if (!this.idSede) {
            this.messageService.add({ severity: 'warn', summary: 'Seleccione una sede antes de escanear.' });
            return;
        }

        (await this.inventarioService.getProductoPorCodigoBarras(codigoReal, this.idSede)).subscribe({
            next: (res) => {
                if (res.state === 'OK' && res.body) {
                    this.agregarAlCarrito(res.body, cantidad);
                } else {
                    this.messageService.add({ severity: 'warn', summary: res.msg || 'Producto no encontrado.' });
                }
                this.focusBarcode();
            },
            error: () => {
                this.messageService.add({ severity: 'warn', summary: 'Producto no encontrado por ese código.' });
                this.focusBarcode();
            }
        });
    }

    focusBarcode() {
        setTimeout(() => this.barcodeInput?.nativeElement?.focus(), 80);
    }

    // ---------------- Escáner QR con cámara ----------------

    abrirEscaner() {
        if (!this.idSede) {
            this.messageService.add({ severity: 'warn', summary: 'Seleccione una sede antes de escanear.' });
            return;
        }
        this.displayEscaner = true;
    }

    onEscanerDetectado(codigo: string) {
        this.displayEscaner = false;
        this.codigoBarras = codigo;
        this.onBarcode();
    }

    // ---------------- Buscador dinámico ----------------

    abrirBuscador() {
        this.displayBuscador = true;
        this.textoBusqueda = '';
        this.filtroGrupo = null;
        this.filtroCategoria = null;
        this.buscarProductos();
        setTimeout(() => this.modalBusquedaInput?.nativeElement?.focus(), 150);
    }

    onBusquedaInput() {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.buscarProductos(), 300);
    }

    async buscarProductos() {
        this.cargandoProductos = true;
        const filtros: Record<string, unknown> = {};
        if (this.textoBusqueda?.trim()) filtros['buscar'] = this.textoBusqueda.trim();
        if (this.filtroCategoria) filtros['id_categoria'] = this.filtroCategoria;
        else if (this.filtroGrupo) filtros['id_grupo'] = this.filtroGrupo;
        if (this.idSede) filtros['id_sede'] = this.idSede;

        (await this.inventarioService.getProductos(filtros)).subscribe({
            next: (res) => {
                this.cargandoProductos = false;
                this.productosBusqueda = res.state === 'OK' ? (res.body || []) : [];
            },
            error: () => {
                this.cargandoProductos = false;
                this.productosBusqueda = [];
            }
        });
    }

    get categoriasFiltradas(): Categoria[] {
        if (!this.filtroGrupo) return this.categorias;
        return this.categorias.filter(c => c.id_grupo_producto === this.filtroGrupo);
    }

    seleccionarGrupoFiltro() {
        this.filtroCategoria = null;
        this.buscarProductos();
    }

    seleccionarCategoriaFiltro() {
        this.buscarProductos();
    }

    limpiarFiltrosBusqueda() {
        this.textoBusqueda = '';
        this.filtroGrupo = null;
        this.filtroCategoria = null;
        this.buscarProductos();
    }

    agregarDesdeModal(producto: Producto) {
        const disponible = producto.cantidad_total;

        if (disponible !== undefined && disponible !== null) {
            if (disponible <= 0) {
                this.messageService.add({ severity: 'warn', summary: `"${producto.nombre}" no tiene stock disponible.` });
                return;
            }
            // Los productos con lote se validan en su propio selector
            if (!producto.maneja_lote && !producto.maneja_vencimiento
                && this.cantidadEnCarrito(producto.id_producto) >= disponible) {
                this.messageService.add({ severity: 'warn', summary: `Solo hay ${disponible} disponibles de "${producto.nombre}".` });
                return;
            }
        }

        this.agregarAlCarrito(producto, 1);
    }

    cantidadEnCarrito(id_producto: number): number {
        return this.carrito
            .filter(i => i.id_producto === id_producto)
            .reduce((acc, i) => acc + (Number(i.cantidad) || 0), 0);
    }

    subtotalProducto(producto: Producto): number {
        const precio = parseFloat(String(producto.precio_venta ?? 0)) || 0;
        return precio * this.cantidadEnCarrito(producto.id_producto);
    }

    quitarUnoProducto(producto: Producto) {
        for (let i = this.carrito.length - 1; i >= 0; i--) {
            if (this.carrito[i].id_producto === producto.id_producto) {
                const item = this.carrito[i];
                item.cantidad = (Number(item.cantidad) || 0) - 1;
                if (item.cantidad <= 0) this.carrito.splice(i, 1);
                return;
            }
        }
    }

    cerrarBuscador() {
        this.displayBuscador = false;
        this.focusBarcode();
    }

    // ---------------- Carrito ----------------

    agregarAlCarrito(producto: Producto, cantidad = 1) {
        const precio = parseFloat(String(producto.precio_venta ?? 0)) || 0;
        if (precio <= 0) {
            this.messageService.add({ severity: 'warn', summary: `"${producto.nombre}" no tiene precio de venta configurado.` });
            return;
        }

        // Productos con lote/vencimiento requieren elegir el lote
        if (producto.maneja_lote || producto.maneja_vencimiento) {
            this.abrirSelectorLote(producto, cantidad);
            return;
        }

        const existente = this.carrito.find(i => i.id_producto === producto.id_producto && !i.lote && !i.fecha_vencimiento);
        if (existente) {
            existente.cantidad += cantidad;
            return;
        }

        this.carrito.push({
            id_producto: producto.id_producto,
            codigo: producto.codigo,
            nombre: producto.nombre,
            precio_unitario: precio,
            cantidad,
            descuento_linea: 0,
            aplica_iva: !!producto.aplica_iva,
            porcentaje_iva: parseFloat(String(producto.porcentaje_iva ?? 0)) || 0,
            precio_incluye_iva: producto.precio_incluye_iva !== false,
            maneja_lote: !!producto.maneja_lote,
            maneja_vencimiento: !!producto.maneja_vencimiento,
            stock_sede: producto.stock_sede
        });
    }

    // ---------------- Selector de lote ----------------

    async abrirSelectorLote(producto: Producto, cantidad = 1) {
        if (!this.idSede) {
            this.messageService.add({ severity: 'warn', summary: 'Seleccione una sede antes de agregar productos.' });
            return;
        }

        this.productoLote = producto;
        this.cantidadLote = cantidad;
        this.loteElegido = null;
        this.lotesDisponibles = [];
        this.displayLote = true;
        this.cargandoLotes = true;

        (await this.inventarioService.getLotesPorProductoYSede(producto.id_producto, this.idSede)).subscribe({
            next: (res) => {
                this.cargandoLotes = false;
                if (res.state === 'OK') {
                    this.lotesDisponibles = res.body || [];
                    if (this.lotesDisponibles.length === 0) {
                        this.messageService.add({ severity: 'warn', summary: `"${producto.nombre}" no tiene stock disponible en esta sede.` });
                    }
                }
            },
            error: () => {
                this.cargandoLotes = false;
                this.messageService.add({ severity: 'error', summary: 'No se pudieron cargar los lotes.' });
            }
        });
    }

    seleccionarLote(lote: { lote: string | null; fecha_vencimiento: string | null; cantidad: number }) {
        this.loteElegido = lote;
        this.cantidadLote = 1;
    }

    decrementarLote() {
        this.cantidadLote = Math.max(1, (Number(this.cantidadLote) || 1) - 1);
    }

    incrementarLote() {
        const max = this.loteElegido ? this.loteElegido.cantidad : 1;
        this.cantidadLote = Math.min(max, (Number(this.cantidadLote) || 0) + 1);
    }

    confirmarLote() {
        if (!this.productoLote || !this.loteElegido) {
            this.messageService.add({ severity: 'warn', summary: 'Seleccione un lote.' });
            return;
        }

        const cantidad = Number(this.cantidadLote) || 0;
        if (cantidad <= 0) {
            this.messageService.add({ severity: 'warn', summary: 'Ingrese una cantidad válida.' });
            return;
        }
        if (cantidad > this.loteElegido.cantidad) {
            this.messageService.add({ severity: 'warn', summary: `Solo hay ${this.loteElegido.cantidad} disponibles en ese lote.` });
            return;
        }

        const producto = this.productoLote;
        const precio = parseFloat(String(producto.precio_venta ?? 0)) || 0;

        this.carrito.push({
            id_producto: producto.id_producto,
            codigo: producto.codigo,
            nombre: producto.nombre,
            precio_unitario: precio,
            cantidad,
            descuento_linea: 0,
            aplica_iva: !!producto.aplica_iva,
            porcentaje_iva: parseFloat(String(producto.porcentaje_iva ?? 0)) || 0,
            precio_incluye_iva: producto.precio_incluye_iva !== false,
            maneja_lote: !!producto.maneja_lote,
            maneja_vencimiento: !!producto.maneja_vencimiento,
            lote: this.loteElegido.lote || undefined,
            fecha_vencimiento: this.loteElegido.fecha_vencimiento || undefined,
            stock_sede: this.loteElegido.cantidad
        });

        this.displayLote = false;
        this.productoLote = null;
        this.loteElegido = null;
        this.focusBarcode();
    }

    cancelarLote() {
        this.displayLote = false;
        this.productoLote = null;
        this.loteElegido = null;
        this.focusBarcode();
    }

    cambiarCantidad(item: ItemCarrito, delta: number) {
        const nueva = (Number(item.cantidad) || 1) + delta;
        item.cantidad = nueva < 1 ? 1 : nueva;
    }

    quitarItem(index: number) {
        this.carrito.splice(index, 1);
    }

    vaciarCarrito() {
        if (this.carrito.length === 0) return;
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Vaciar venta',
            message: '¿Deseas eliminar todos los productos de la venta?',
            acceptLabel: 'Sí, vaciar',
            rejectLabel: 'No',
            accept: () => this.limpiarVenta()
        });
    }

    private calcularLinea(item: ItemCarrito) {
        const bruto = item.precio_unitario * item.cantidad;
        const neto = Math.max(bruto - (item.descuento_linea || 0), 0);
        const tasa = item.aplica_iva ? item.porcentaje_iva : 0;

        let base = neto;
        let impuesto = 0;
        let totalLinea = neto;

        if (tasa > 0) {
            if (item.precio_incluye_iva) {
                base = neto / (1 + tasa / 100);
                impuesto = neto - base;
                totalLinea = neto;
            } else {
                impuesto = neto * tasa / 100;
                totalLinea = neto + impuesto;
            }
        }
        return { base, impuesto, totalLinea };
    }

    totalLinea(item: ItemCarrito): number {
        return this.calcularLinea(item).totalLinea;
    }

    get cantidadItems(): number {
        return this.carrito.reduce((acc, i) => acc + (Number(i.cantidad) || 0), 0);
    }

    get subtotal(): number {
        return this.carrito.reduce((acc, i) => acc + this.calcularLinea(i).base, 0);
    }

    get impuestoTotal(): number {
        return this.carrito.reduce((acc, i) => acc + this.calcularLinea(i).impuesto, 0);
    }

    get total(): number {
        return Math.max(this.subtotal + this.impuestoTotal - (this.descuentoGlobal || 0), 0);
    }

    get ivaDesagregado(): { tasa: number; impuesto: number }[] {
        const mapa = new Map<number, number>();
        for (const i of this.carrito) {
            const tasa = i.aplica_iva ? i.porcentaje_iva : 0;
            if (tasa > 0) mapa.set(tasa, (mapa.get(tasa) || 0) + this.calcularLinea(i).impuesto);
        }
        return Array.from(mapa.entries()).map(([tasa, impuesto]) => ({ tasa, impuesto })).sort((a, b) => b.tasa - a.tasa);
    }

    // ---------------- Pagos ----------------

    get totalPagos(): number {
        return this.pagos.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    }

    get saldoPendiente(): number {
        return Math.max(this.total - this.totalPagos, 0);
    }

    get cambio(): number {
        return Math.max(this.totalPagos - this.total, 0);
    }

    seleccionarMetodo(metodo: MetodoPago) {
        this.metodoSeleccionado = metodo;
        this.refPago = '';
        this.montoPago = null;
    }

    sumarMonto(valor: number) {
        this.montoPago = (Number(this.montoPago) || 0) + valor;
    }

    pagoExacto() {
        this.montoPago = this.saldoPendiente;
    }

    agregarPago() {
        const valor = Number(this.montoPago) || 0;
        if (valor <= 0) {
            this.messageService.add({ severity: 'warn', summary: 'Ingrese un valor válido para el pago.' });
            return;
        }
        this.pagos.push({
            metodo_pago: this.metodoSeleccionado,
            valor,
            referencia: this.refPago || undefined
        });
        this.montoPago = null;
        this.refPago = '';
    }

    quitarPago(index: number) {
        this.pagos.splice(index, 1);
    }

    iconoMetodo(metodo: MetodoPago): string {
        return this.metodos.find(m => m.value === metodo)?.icono || 'fa fa-money-bill';
    }

    // ---------------- Venta ----------------

    cobrar() {
        if (this.carrito.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Agregue al menos un producto.' });
            return;
        }
        if (!this.idSede) {
            this.messageService.add({ severity: 'warn', summary: 'Seleccione una sede.' });
            return;
        }
        if (this.totalPagos < this.total) {
            this.messageService.add({ severity: 'warn', summary: 'El valor pagado es menor al total de la venta.' });
            return;
        }

        const items = this.carrito.map(i => ({
            id_producto: i.id_producto,
            cantidad: i.cantidad,
            descuento_linea: i.descuento_linea || 0,
            lote: i.lote || null,
            fecha_vencimiento: i.fecha_vencimiento || null
        }));

        const efectivoRecibido = this.pagos
            .filter(p => p.metodo_pago === 'EFECTIVO')
            .reduce((acc, p) => acc + Number(p.valor), 0);

        const body = {
            id_sede: this.idSede,
            id_cliente: this.clienteSeleccionado?.id_cliente || null,
            fecha_venta: this.fechaHoy(),
            observacion: null,
            descuento_global: Number(this.descuentoGlobal) || 0,
            efectivo_recibido: efectivoRecibido,
            items,
            pagos: this.pagos
        };

        this.loading = true;
        this.posService.registrarVenta(body).then(obs$ => {
            obs$.subscribe({
                next: (res) => {
                    this.loading = false;
                    if (res.state === 'OK' && res.body) {
                        this.resultado = res.body;
                        this.displayResultado = true;
                        this.messageService.add({ severity: 'success', summary: `Venta ${res.body.numero_factura} registrada.` });
                    } else {
                        this.messageService.add({ severity: 'error', summary: res.msg || 'Error al registrar la venta.' });
                    }
                },
                error: (err) => {
                    this.loading = false;
                    this.messageService.add({ severity: 'error', summary: err.error?.msg || 'Error al registrar la venta.' });
                }
            });
        });
    }

    cerrarResultado() {
        this.displayResultado = false;
        this.limpiarVenta();
    }

    limpiarVenta() {
        this.carrito = [];
        this.descuentoGlobal = 0;
        this.pagos = [];
        this.montoPago = null;
        this.refPago = '';
        this.metodoSeleccionado = 'EFECTIVO';
        this.clienteSeleccionado = null;
        this.codigoBarras = '';
        this.resultado = null;
        this.focusBarcode();
    }

    private fechaHoy(): string {
        const d = new Date();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mes}-${dia}`;
    }

    // ---------------- Envío e impresión ----------------

    imprimir(formato: 'A4' | 'TICKET') {
        if (!this.resultado || this.generandoTicket || this.generandoPdf) return;

        if (formato === 'TICKET') this.generandoTicket = true;
        else this.generandoPdf = true;

        this.posService.generarFacturaHtml(this.resultado.id_venta, formato).then(obs$ => {
            obs$.subscribe({
                next: (res) => {
                    this.generandoTicket = false;
                    this.generandoPdf = false;
                    if (res.state === 'OK' && res.body?.html) {
                        const ventana = window.open('', '_blank');
                        if (!ventana) return;
                        ventana.document.write(res.body.html);
                        ventana.document.close();
                        setTimeout(() => ventana.print(), 500);
                    }
                },
                error: () => {
                    this.generandoTicket = false;
                    this.generandoPdf = false;
                    this.messageService.add({ severity: 'error', summary: 'No se pudo generar la factura.' });
                }
            });
        });
    }

    enviarCorreo() {
        if (!this.resultado || this.enviandoCorreo) return;

        const correo = this.clienteSeleccionado?.correo_electronico;
        this.confirmService.confirm({
            icon: 'fa fa-envelope',
            header: 'Enviar factura por correo',
            message: correo
                ? `¿Enviar la factura ${this.resultado.numero_factura} a ${correo}?`
                : `¿Enviar la factura ${this.resultado.numero_factura} por correo?`,
            acceptLabel: 'Sí, enviar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.enviandoCorreo = true;
                this.posService.enviarFacturaCorreo(this.resultado!.id_venta).then(obs$ => {
                    obs$.subscribe({
                        next: (res) => {
                            this.enviandoCorreo = false;
                            if (res.state === 'OK') this.messageService.add({ severity: 'success', summary: `Factura enviada a ${res.body?.correo}.` });
                            else this.messageService.add({ severity: 'error', summary: res.msg || 'No se pudo enviar la factura.' });
                        },
                        error: (err) => {
                            this.enviandoCorreo = false;
                            this.messageService.add({ severity: 'error', summary: err.error?.msg || 'No se pudo enviar la factura.' });
                        }
                    });
                });
            }
        });
    }

    enviarWhatsapp() {
        if (!this.resultado || this.enviandoWhatsapp) return;

        const telefono = this.clienteSeleccionado?.telefono;
        this.confirmService.confirm({
            icon: 'fa-brands fa-whatsapp',
            header: 'Enviar factura por WhatsApp',
            message: telefono
                ? `¿Enviar la factura ${this.resultado.numero_factura} al ${telefono}?`
                : `¿Enviar la factura ${this.resultado.numero_factura} por WhatsApp?`,
            acceptLabel: 'Sí, enviar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.enviandoWhatsapp = true;
                this.posService.obtenerEnlaceWhatsapp(this.resultado!.id_venta).then(obs$ => {
                    obs$.subscribe({
                        next: (res) => {
                            this.enviandoWhatsapp = false;
                            if (res.state === 'OK' && res.body?.whatsapp_texto) {
                                this.abrirWhatsApp(res.body.whatsapp_texto, res.body.whatsapp_telefono);
                            } else {
                                this.messageService.add({ severity: 'error', summary: res.msg || 'No se pudo generar el enlace.' });
                            }
                        },
                        error: (err) => {
                            this.enviandoWhatsapp = false;
                            this.messageService.add({ severity: 'error', summary: err.error?.msg || 'No se pudo generar el enlace.' });
                        }
                    });
                });
            }
        });
    }

    get esAnonima(): boolean {
        return !this.clienteSeleccionado;
    }

    private abrirWhatsApp(texto: string, telefono: string) {
        const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        let url: string;
        if (!telefono) {
            url = `https://api.whatsapp.com/send?text=${texto}`;
        } else if (esMovil) {
            url = `https://wa.me/${telefono}?text=${texto}`;
        } else {
            url = `https://web.whatsapp.com/send?phone=${telefono}&text=${texto}`;
        }
        window.open(url, '_blank');
    }

    formatoMoneda(valor: number): string {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(valor || 0);
    }
}
