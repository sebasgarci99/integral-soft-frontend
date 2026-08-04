import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { MessageService } from 'primeng/api';
import { InventarioService } from '../../../services/inventario/inventario.service';
import { Producto, KardexRow, KardexResponse } from '../../../interfaces/inventario';
import { parseDateSinTimezone, formatDateLocal } from '../../../utils/fecha.util';

@Component({
    selector: 'app-kardex',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
              ToastModule, FloatLabelModule, DropdownModule, CalendarModule],
    templateUrl: './kardex.component.html',
    styleUrls: ['./kardex.component.css'],
    providers: [MessageService]
})
export class KardexComponent implements OnInit {

    productos: Producto[] = [];
    selectedProducto: Producto | null = null;
    fechaDesde: Date | null = null;
    fechaHasta: Date | null = null;

    kardexData: KardexResponse | null = null;
    movimientos: KardexRow[] = [];

    loadingProductos: boolean = false;
    loadingKardex: boolean = false;

    constructor(
        private inventarioService: InventarioService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.cargarProductos();
    }

    async cargarProductos() {
        this.loadingProductos = true;
        (await this.inventarioService.getProductos()).subscribe({
            next: (res) => {
                this.loadingProductos = false;
                if (res.state === 'OK') {
                    this.productos = res.body || [];
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cargar los productos.' });
                }
            },
            error: () => {
                this.loadingProductos = false;
                this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
            }
        });
    }

    async buscarKardex() {
        if (!this.selectedProducto) {
            this.messageService.add({ severity: 'warn', summary: 'Seleccione un producto' });
            return;
        }

        this.loadingKardex = true;
        const fechaInicio = this.fechaDesde ? formatDateLocal(this.fechaDesde) ?? undefined : undefined;
        const fechaFin = this.fechaHasta ? formatDateLocal(this.fechaHasta) ?? undefined : undefined;

        (await this.inventarioService.getKardexProducto(
            this.selectedProducto.id_producto,
            undefined,
            fechaInicio,
            fechaFin
        )).subscribe({
            next: (res) => {
                this.loadingKardex = false;
                if (res.state === 'OK' && res.body) {
                    this.kardexData = res.body;
                    this.movimientos = res.body.movimientos || [];
                } else {
                    this.kardexData = null;
                    this.movimientos = [];
                    this.messageService.add({ severity: 'info', summary: res.msg || 'No se encontraron movimientos' });
                }
            },
            error: () => {
                this.loadingKardex = false;
                this.kardexData = null;
                this.movimientos = [];
                this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
            }
        });
    }

    getSigno(tipo: string): string {
        const entradas = ['ENT', 'DEV', 'TRA_E', 'AJU'];
        return entradas.includes(tipo) ? 'entrada' : 'salida';
    }
}
