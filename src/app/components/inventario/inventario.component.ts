import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InventarioService } from '../../services/inventario/inventario.service';
import { StockBajo, Stock, ApiResponse } from '../../interfaces/inventario';

@Component({
    selector: 'app-inventario',
    standalone: true,
    imports: [CommonModule, RouterModule, TableModule, ButtonModule, ToastModule, ConfirmDialogModule],
    templateUrl: './inventario.component.html',
    styleUrls: ['./inventario.component.css'],
    providers: [MessageService, ConfirmationService]
})
export class InventarioComponent implements OnInit {

    totalProductos: number = 0;
    alertasStockBajo: StockBajo[] = [];
    productosProximosVencer: Stock[] = [];
    movimientosRecientes: any[] = [];

    constructor(
        private inventarioService: InventarioService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.cargarDashboard();
    }

    async cargarDashboard() {
        await this.cargarProductos();
        await this.cargarStockBajo();
        await this.cargarProximosVencer();
    }

    async cargarProductos() {
        (await this.inventarioService.getProductos()).subscribe({
            next: (res: ApiResponse<any[]>) => {
                if (res.state === 'OK') {
                    this.totalProductos = res.body?.length || 0;
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error al cargar productos' });
            }
        });
    }

    async cargarStockBajo() {
        (await this.inventarioService.getProductosStockBajo()).subscribe({
            next: (res: ApiResponse<StockBajo[]>) => {
                if (res.state === 'OK') {
                    this.alertasStockBajo = res.body || [];
                }
            }
        });
    }

    async cargarProximosVencer() {
        (await this.inventarioService.getProductosProximosVencer(undefined, 90)).subscribe({
            next: (res: ApiResponse<Stock[]>) => {
                if (res.state === 'OK') {
                    this.productosProximosVencer = res.body || [];
                }
            }
        });
    }

    getColorClass(color: string | null | undefined): string {
        if (!color) return '';
        const map: Record<string, string> = {
            'ROJO': 'semaforo-rojo',
            'AMARILLO': 'semaforo-amarillo',
            'NARANJA': 'semaforo-naranja',
            'VERDE': 'semaforo-verde',
            'GRIS': 'semaforo-gris'
        };
        return map[color] || '';
    }
}
