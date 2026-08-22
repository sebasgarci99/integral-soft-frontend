import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { AccordionModule } from 'primeng/accordion';
import { BadgeModule } from 'primeng/badge';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InventarioService } from '../../../services/inventario/inventario.service';
import { Movimiento, TipoMovimiento, Producto, Sede, Stock } from '../../../interfaces/inventario';
import { Subject, debounceTime, distinctUntilChanged, switchMap, forkJoin } from 'rxjs';
import { parseDateSinTimezone, formatDateLocal } from '../../../utils/fecha.util';

@Component({
    selector: 'app-movimientos-inv',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
              InputTextModule, InputTextarea, ToastModule, ConfirmDialogModule,
              DropdownModule, CalendarModule, AutoCompleteModule, AccordionModule, BadgeModule,
              ProgressSpinnerModule],
    templateUrl: './movimientos.component.html',
    styleUrls: ['./movimientos.component.css'],
    providers: [MessageService, ConfirmationService]
})
export class MovimientosComponent implements OnInit {

    movimientos: Movimiento[] = [];
    tiposMovimiento: TipoMovimiento[] = [];
    productos: Producto[] = [];
    sedes: Sede[] = [];
    displayDialog: boolean = false;
    displayDetalle: boolean = false;
    movimientoSeleccionado: Movimiento | null = null;

    formData: any = {};
    detalleItems: any[] = [];
    activeAccordionIndex: number | number[] = 0;

    productosFiltrados: Producto[] = [];
    buscandoProductos: boolean = false;
    private busquedaProductos$ = new Subject<string>();

    fechaDesde: Date | null = null;
    fechaHasta: Date | null = null;

    loadingGuardar: boolean = false;
    loadingAnular: boolean = false;

    constructor(
        private inventarioService: InventarioService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) {
        this.busquedaProductos$.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(async (texto) => {
                this.buscandoProductos = true;
                return (await this.inventarioService.buscarProductos(texto)).toPromise();
            })
        ).subscribe({
            next: (res) => {
                this.buscandoProductos = false;
                this.productosFiltrados = res?.body || [];
            },
            error: () => {
                this.buscandoProductos = false;
                this.productosFiltrados = [];
            }
        });
    }

    ngOnInit(): void {
        this.cargarDatos();
    }

    async cargarDatos() {
        try {
            const [tipos$, productos$, sedes$] = await Promise.all([
                this.inventarioService.getTiposMovimiento(),
                this.inventarioService.getProductos(),
                this.inventarioService.getSedes()
            ]);

            forkJoin([tipos$, productos$, sedes$]).subscribe({
                next: ([resTipos, resProductos, resSedes]) => {
                    if (resTipos.state === 'OK') {
                        this.tiposMovimiento = resTipos.body || [];
                    }

                    if (resProductos.state === 'OK') {
                        this.productos = resProductos.body || [];
                    }

                    if (resSedes.state === 'OK') {
                        this.sedes = resSedes.body || [];
                    }

                    this.cargarMovimientos();
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
                }
            });
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
        }
    }

    async cargarMovimientos() {
        const filtros: Record<string, unknown> = {};
        if (this.fechaDesde) filtros['fecha_inicio'] = formatDateLocal(this.fechaDesde);
        if (this.fechaHasta) filtros['fecha_fin'] = formatDateLocal(this.fechaHasta);

        (await this.inventarioService.getMovimientos(filtros)).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.movimientos = res.body || [];
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error al cargar los movimientos. Intente nuevamente.' });
            }
        });
    }

    async cargarTiposMovimiento() {
        (await this.inventarioService.getTiposMovimiento()).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.tiposMovimiento = res.body || [];
                }
            }
        });
    }

    async cargarProductos() {
        (await this.inventarioService.getProductos()).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.productos = res.body || [];
                }
            }
        });
    }

    async cargarSedes() {
        (await this.inventarioService.getSedes()).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.sedes = res.body || [];
                }
            }
        });
    }

    abrirFormulario() {
        this.formData = {
            fecha_movimiento: new Date(),
            detalle: []
        };
        this.detalleItems = [this.crearDetalleVacio()];
        this.activeAccordionIndex = 0;
        this.displayDialog = true;
    }

    crearDetalleVacio() {
        return {
            id_producto: null,
            cantidad: 1,
            costo_unitario: null,
            lote: '',
            fecha_vencimiento: null,
            productoSeleccionado: null,
            lotesDisponibles: [],
            cargandoLotes: false,
            nombreBusqueda: ''
        };
    }

    agregarDetalle() {
        this.detalleItems.push(this.crearDetalleVacio());
    }

    eliminarDetalle(index: number) {
        this.detalleItems.splice(index, 1);
        if (this.detalleItems.length === 0) {
            this.detalleItems.push(this.crearDetalleVacio());
        }
    }

    onTipoMovimientoChange() {
        this.detalleItems.forEach((item) => {
            item.lotesDisponibles = [];
            item.lote = '';
            item.fecha_vencimiento = null;
            item.loteSeleccionado = null;
        });
    }

    onSedeChange() {
        this.detalleItems.forEach((item) => {
            item.lotesDisponibles = [];
            item.lote = '';
            item.fecha_vencimiento = null;
            item.loteSeleccionado = null;
        });
    }

    buscarProducto(event: any) {
        const texto = event.query?.trim() || '';
        if (texto.length >= 3) {
            this.busquedaProductos$.next(texto);
        } else {
            this.productosFiltrados = [];
        }
    }

    async onProductoSeleccionado(item: any, index: number) {
        item.id_producto = item.productoSeleccionado?.id_producto || null;
        item.lote = '';
        item.fecha_vencimiento = null;
        item.lotesDisponibles = [];
        item.loteSeleccionado = null;

        if (item.id_producto) {
            await this.cargarLotes(item, index);
        }
    }

    async cargarLotes(item: any, index: number) {
        if (!item.id_producto || !this.formData.id_sede) {
            return;
        }
        if (!this.esSalidaOTransferencia()) {
            return;
        }
        if (!item.productoSeleccionado?.maneja_lote) {
            return;
        }

        item.cargandoLotes = true;
        (await this.inventarioService.getLotesPorProductoYSede(item.id_producto, this.formData.id_sede)).subscribe({
            next: (res) => {
                item.cargandoLotes = false;
                if (res.state === 'OK') {
                    item.lotesDisponibles = (res.body || []).map((l: any) => ({
                        ...l,
                        fecha_vencimiento: parseDateSinTimezone(l.fecha_vencimiento),
                        labelLote: `${l.lote || 'Sin lote'} — ${l.fecha_vencimiento || 'Sin venc.'} (${l.cantidad} disponibles)`
                    }));
                    if (item.lotesDisponibles.length === 1) {
                        this.seleccionarLote(item, item.lotesDisponibles[0]);
                    }
                } else {
                    this.messageService.add({ severity: 'warn', summary: res.msg || 'No se pudieron cargar los lotes disponibles.' });
                }
            },
            error: () => {
                item.cargandoLotes = false;
                item.lotesDisponibles = [];
                this.messageService.add({ severity: 'error', summary: 'Error al cargar lotes disponibles. Intente nuevamente.' });
            }
        });
    }

    seleccionarLote(item: any, lote: any) {
        item.lote = lote?.lote || '';
        item.fecha_vencimiento = lote ? parseDateSinTimezone(lote.fecha_vencimiento) : null;
        item.loteSeleccionado = lote;
    }

    esSalidaOTransferencia(): boolean {
        const tipo = this.tiposMovimiento.find(t => t.id_tipo_movimiento === this.formData.id_tipo_movimiento);
        return tipo?.signo === -1;
    }

    esTransferencia(): boolean {
        const tipo = this.tiposMovimiento.find(t => t.id_tipo_movimiento === this.formData.id_tipo_movimiento);
        return tipo?.codigo === 'TRA';
    }

    obtenerTipoMovimiento(): TipoMovimiento | undefined {
        return this.tiposMovimiento.find(t => t.id_tipo_movimiento === this.formData.id_tipo_movimiento);
    }

    obtenerBadgeClaseTipo(): string {
        const tipo = this.obtenerTipoMovimiento();
        if (!tipo) return 'badge-secondary';
        if (tipo.codigo === 'TRA') return 'badge-transferencia';
        return tipo.signo === 1 ? 'badge-entrada' : 'badge-salida';
    }

    obtenerNombreTipoMovimiento(): string {
        return this.obtenerTipoMovimiento()?.nombre || '—';
    }

    obtenerNombreTipoMovimientoLista(row: Movimiento): string {
        const codigo = row.TipoMovimiento?.codigo;
        const nombre = row.TipoMovimiento?.nombre;
        if (!codigo || codigo === '1' || codigo === '-1' || /^-?\d+$/.test(codigo)) {
            return nombre || 'Movimiento';
        }
        return codigo;
    }

    obtenerSedeNombre(idSede?: number): string {
        if (!idSede) return '—';
        return this.sedes.find(s => s.id_sede === idSede)?.nombre || '—';
    }

    obtenerTotalUnidades(): number {
        return this.detalleItems.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0);
    }

    obtenerTotalProductos(): number {
        return this.detalleItems.filter((item) => item.id_producto).length;
    }

    itemTieneError(item: any): string | null {
        if (!item.id_producto) return 'Selecciona un producto';
        if (!item.cantidad || Number(item.cantidad) <= 0) return 'Cantidad debe ser mayor a 0';
        if (item.productoSeleccionado?.maneja_lote && !item.lote) return 'El producto requiere lote';
        if (item.productoSeleccionado?.maneja_vencimiento && !item.fecha_vencimiento) return 'El producto requiere fecha de vencimiento';
        if (this.esSalidaOTransferencia() && item.productoSeleccionado?.maneja_lote && item.loteSeleccionado) {
            if (Number(item.cantidad) > Number(item.loteSeleccionado.cantidad)) {
                return `Cantidad supera el disponible (${item.loteSeleccionado.cantidad})`;
            }
        }
        return null;
    }

    formularioTieneErrores(): string | null {
        if (!this.formData.id_tipo_movimiento) return 'Selecciona el tipo de movimiento';
        if (!this.formData.id_sede) return 'Selecciona la sede';
        if (!this.formData.fecha_movimiento) return 'Selecciona la fecha';
        if (this.esTransferencia() && !this.formData.id_sede_destino) return 'Selecciona la sede destino';
        if (this.detalleItems.length === 0) return 'Agrega al menos un producto';
        for (const item of this.detalleItems) {
            const error = this.itemTieneError(item);
            if (error) return error;
        }
        return null;
    }

    async guardar() {
        const error = this.formularioTieneErrores();
        if (error) {
            this.messageService.add({ severity: 'warn', summary: error });
            return;
        }

        this.loadingGuardar = true;

        const body: any = {
            id_tipo_movimiento: this.formData.id_tipo_movimiento,
            id_sede: this.formData.id_sede,
            id_sede_destino: this.esTransferencia() ? this.formData.id_sede_destino : null,
            fecha_movimiento: formatDateLocal(this.formData.fecha_movimiento),
            observacion: this.formData.observacion || null,
            documento_referencia: this.formData.documento_referencia || null,
            detalle: this.detalleItems.map(d => ({
                id_producto: d.id_producto,
                cantidad: d.cantidad,
                costo_unitario: d.costo_unitario || null,
                lote: d.lote || null,
                fecha_vencimiento: formatDateLocal(d.fecha_vencimiento)
            }))
        };

        (await this.inventarioService.crearMovimiento(body)).subscribe({
            next: (res) => {
                this.loadingGuardar = false;
                if (res.state === 'OK') {
                    this.cargarMovimientos();
                    this.displayDialog = false;
                    this.messageService.add({ severity: 'success', summary: `Movimiento ${res.body?.numero_documento} registrado.` });
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al registrar el movimiento.' });
                }
            },
            error: () => {
                this.loadingGuardar = false;
                this.messageService.add({ severity: 'error', summary: 'Error de conexión al registrar el movimiento. Intente nuevamente.' });
            }
        });
    }

    verDetalle(movimiento: Movimiento) {
        this.movimientoSeleccionado = movimiento;
        this.displayDetalle = true;
    }

    anularMovimiento(movimiento: Movimiento) {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Anular movimiento',
            message: `¿Estás seguro de anular el movimiento ${movimiento.numero_documento}? Se revertirá el stock.`,
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                this.loadingAnular = true;
                (await this.inventarioService.anularMovimiento(movimiento.id_movimiento)).subscribe({
                    next: (res) => {
                        this.loadingAnular = false;
                        if (res.state === 'OK') {
                            this.cargarMovimientos();
                            this.messageService.add({ severity: 'success', summary: 'Movimiento anulado.' });
                        } else {
                            this.messageService.add({ severity: 'error', summary: res.msg || 'Error al anular el movimiento.' });
                        }
                    },
                    error: () => {
                        this.loadingAnular = false;
                        this.messageService.add({ severity: 'error', summary: 'Error de conexión al anular el movimiento. Intente nuevamente.' });
                    }
                });
            }
        });
    }

    filtrarPorFechas() {
        this.cargarMovimientos();
    }

    formatearFecha(valor: string | Date | null | undefined): string {
        if (!valor) return '—';
        const fecha = parseDateSinTimezone(valor);
        if (!fecha) return '—';
        return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
}
