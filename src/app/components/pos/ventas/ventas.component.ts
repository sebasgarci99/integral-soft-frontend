import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PosService } from '../../../services/pos/pos.service';
import { InventarioService } from '../../../services/inventario/inventario.service';
import { Sede } from '../../../interfaces/inventario';
import { Venta } from '../../../interfaces/pos';

@Component({
    selector: 'app-ventas-pos',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
              DropdownModule, CalendarModule, ToastModule, ConfirmDialogModule, TagModule, TooltipModule],
    templateUrl: './ventas.component.html',
    styleUrls: ['./ventas.component.css'],
    providers: [MessageService, ConfirmationService]
})
export class VentasComponent implements OnInit {

    ventas: Venta[] = [];
    sedes: Sede[] = [];

    fechaDesde: Date | null = null;
    fechaHasta: Date | null = null;
    idSede: number | null = null;
    numero = '';

    resumen = { cantidad_ventas: 0, total_ventas: 0 };
    loading = false;

    constructor(
        private posService: PosService,
        private inventarioService: InventarioService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) {}

    ngOnInit(): void {
        const hoy = new Date();
        this.fechaDesde = hoy;
        this.fechaHasta = hoy;
        this.cargarSedes();
        this.cargar();
    }

    async cargarSedes() {
        (await this.inventarioService.getSedes()).subscribe({
            next: (res) => { if (res.state === 'OK') this.sedes = res.body || []; }
        });
    }

    private formatoFecha(d: Date): string {
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${mes}-${dia}`;
    }

    async cargar() {
        this.loading = true;
        const filtros: Record<string, unknown> = {};
        if (this.fechaDesde) filtros['fecha_desde'] = this.formatoFecha(this.fechaDesde);
        if (this.fechaHasta) filtros['fecha_hasta'] = this.formatoFecha(this.fechaHasta);
        if (this.idSede) filtros['id_sede'] = this.idSede;
        if (this.numero) filtros['numero_factura'] = this.numero;

        (await this.posService.getVentas(filtros)).subscribe({
            next: (res) => {
                this.loading = false;
                if (res.state === 'OK') {
                    this.ventas = res.body || [];
                    this.resumen = {
                        cantidad_ventas: this.ventas.filter(v => v.estado === 'A').length,
                        total_ventas: this.ventas.filter(v => v.estado === 'A')
                            .reduce((acc, v) => acc + (parseFloat(String(v.total)) || 0), 0)
                    };
                }
            },
            error: () => {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Error al cargar las ventas.' });
            }
        });
    }

    limpiarFiltros() {
        const hoy = new Date();
        this.fechaDesde = hoy;
        this.fechaHasta = hoy;
        this.idSede = null;
        this.numero = '';
        this.cargar();
    }

    imprimir(venta: Venta, formato: 'A4' | 'TICKET') {
        this.posService.generarFacturaHtml(venta.id_venta, formato).then(obs$ => {
            obs$.subscribe({
                next: (res) => {
                    if (res.state === 'OK' && res.body?.html) {
                        const ventana = window.open('', '_blank');
                        if (!ventana) return;
                        ventana.document.write(res.body.html);
                        ventana.document.close();
                        setTimeout(() => ventana.print(), 500);
                    }
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'No se pudo generar la factura.' })
            });
        });
    }

    enviarCorreo(venta: Venta) {
        this.posService.enviarFacturaCorreo(venta.id_venta).then(obs$ => {
            obs$.subscribe({
                next: (res) => {
                    if (res.state === 'OK') {
                        this.messageService.add({ severity: 'success', summary: `Factura enviada a ${res.body?.correo}.` });
                    } else {
                        this.messageService.add({ severity: 'error', summary: res.msg || 'No se pudo enviar la factura.' });
                    }
                },
                error: (err) => this.messageService.add({ severity: 'error', summary: err.error?.msg || 'No se pudo enviar la factura.' })
            });
        });
    }

    enviarWhatsapp(venta: Venta) {
        this.posService.obtenerEnlaceWhatsapp(venta.id_venta).then(obs$ => {
            obs$.subscribe({
                next: (res) => {
                    if (res.state === 'OK' && res.body?.whatsapp_url) {
                        window.open(res.body.whatsapp_url, '_blank');
                    } else {
                        this.messageService.add({ severity: 'error', summary: res.msg || 'No se pudo generar el enlace.' });
                    }
                },
                error: (err) => this.messageService.add({ severity: 'error', summary: err.error?.msg || 'No se pudo generar el enlace.' })
            });
        });
    }

    anular(venta: Venta) {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Anular venta',
            message: `¿Estás seguro de anular la venta "${venta.numero_factura}"? Se revertirá el stock.`,
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                (await this.posService.anularVenta(venta.id_venta)).subscribe({
                    next: (res) => {
                        if (res.state === 'OK') {
                            this.cargar();
                            this.messageService.add({ severity: 'success', summary: 'Venta anulada correctamente.' });
                        } else {
                            this.messageService.add({ severity: 'error', summary: res.msg || 'No se pudo anular la venta.' });
                        }
                    },
                    error: (err) => this.messageService.add({ severity: 'error', summary: err.error?.msg || 'No se pudo anular la venta.' })
                });
            }
        });
    }

    formatoMoneda(valor: number): string {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(valor || 0);
    }
}
