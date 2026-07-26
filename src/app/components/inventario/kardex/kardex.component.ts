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

    constructor(
        private inventarioService: InventarioService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.cargarProductos();
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

    formatDate(date: Date): string {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    async buscarKardex() {
        if (!this.selectedProducto) {
            this.messageService.add({ severity: 'warn', summary: 'Seleccione un producto' });
            return;
        }

        const fechaInicio = this.fechaDesde ? this.formatDate(this.fechaDesde) : undefined;
        const fechaFin = this.fechaHasta ? this.formatDate(this.fechaHasta) : undefined;

        (await this.inventarioService.getKardexProducto(
            this.selectedProducto.id_producto,
            undefined,
            fechaInicio,
            fechaFin
        )).subscribe({
            next: (res) => {
                if (res.state === 'OK' && res.body) {
                    this.kardexData = res.body;
                    this.movimientos = res.body.movimientos || [];
                } else {
                    this.kardexData = null;
                    this.movimientos = [];
                    this.messageService.add({ severity: 'info', summary: 'No se encontraron movimientos' });
                }
            }
        });
    }

    getSigno(tipo: string): string {
        const entradas = ['ENT', 'DEV', 'TRA_E', 'AJU'];
        return entradas.includes(tipo) ? 'entrada' : 'salida';
    }
}
