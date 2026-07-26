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
import { ConfirmationService, MessageService } from 'primeng/api';
import { InventarioService } from '../../../services/inventario/inventario.service';
import { Movimiento, TipoMovimiento, Producto, Sede } from '../../../interfaces/inventario';

@Component({
    selector: 'app-movimientos-inv',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
              InputTextModule, InputTextarea, ToastModule, ConfirmDialogModule,
              DropdownModule, CalendarModule],
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

    fechaDesde: Date | null = null;
    fechaHasta: Date | null = null;

    constructor(
        private inventarioService: InventarioService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.cargarDatos();
    }

    async cargarDatos() {
        await this.cargarMovimientos();
        await this.cargarTiposMovimiento();
        await this.cargarProductos();
        await this.cargarSedes();
    }

    async cargarMovimientos() {
        const filtros: Record<string, unknown> = {};
        if (this.fechaDesde) filtros['fecha_inicio'] = this.formatDate(this.fechaDesde);
        if (this.fechaHasta) filtros['fecha_fin'] = this.formatDate(this.fechaHasta);

        (await this.inventarioService.getMovimientos(filtros)).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.movimientos = res.body || [];
                }
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

    formatDate(date: Date): string {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    abrirFormulario() {
        this.formData = {
            fecha_movimiento: new Date(),
            detalle: []
        };
        this.detalleItems = [this.crearDetalleVacio()];
        this.displayDialog = true;
    }

    crearDetalleVacio() {
        return {
            id_producto: null,
            cantidad: 1,
            costo_unitario: null,
            lote: '',
            fecha_vencimiento: null,
            productoSeleccionado: null
        };
    }

    agregarDetalle() {
        this.detalleItems.push(this.crearDetalleVacio());
    }

    eliminarDetalle(index: number) {
        this.detalleItems.splice(index, 1);
    }

    onProductoSeleccionado(item: any) {
        if (item.id_producto) {
            const prod = this.productos.find(p => p.id_producto === item.id_producto);
            item.productoSeleccionado = prod;
        }
    }

    async guardar() {
        if (!this.formData.id_tipo_movimiento || !this.formData.id_sede || !this.formData.fecha_movimiento) {
            this.messageService.add({ severity: 'warn', summary: 'Campos requeridos: Tipo de Movimiento, Sede y Fecha' });
            return;
        }

        if (this.detalleItems.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Debe agregar al menos un producto al detalle' });
            return;
        }

        const tipoSel = this.tiposMovimiento.find(t => t.id_tipo_movimiento === this.formData.id_tipo_movimiento);
        const esTransferencia = tipoSel?.codigo === 'TRA';

        if (esTransferencia && !this.formData.id_sede_destino) {
            this.messageService.add({ severity: 'warn', summary: 'Debe seleccionar sede destino para transferencias' });
            return;
        }

        const body: any = {
            id_tipo_movimiento: this.formData.id_tipo_movimiento,
            id_sede: this.formData.id_sede,
            id_sede_destino: esTransferencia ? this.formData.id_sede_destino : null,
            fecha_movimiento: this.formatDate(this.formData.fecha_movimiento),
            observacion: this.formData.observacion || null,
            documento_referencia: this.formData.documento_referencia || null,
            detalle: this.detalleItems.map(d => ({
                id_producto: d.id_producto,
                cantidad: d.cantidad,
                costo_unitario: d.costo_unitario || null,
                lote: d.lote || null,
                fecha_vencimiento: d.fecha_vencimiento ? this.formatDate(d.fecha_vencimiento) : null
            }))
        };

        (await this.inventarioService.crearMovimiento(body)).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.cargarMovimientos();
                    this.displayDialog = false;
                    this.messageService.add({ severity: 'success', summary: `Movimiento ${res.body?.numero_documento} registrado.` });
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg });
                }
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
                (await this.inventarioService.anularMovimiento(movimiento.id_movimiento)).subscribe({
                    next: (res) => {
                        if (res.state === 'OK') {
                            this.cargarMovimientos();
                            this.messageService.add({ severity: 'success', summary: 'Movimiento anulado.' });
                        } else {
                            this.messageService.add({ severity: 'error', summary: res.msg });
                        }
                    }
                });
            }
        });
    }

    filtrarPorFechas() {
        this.cargarMovimientos();
    }
}
