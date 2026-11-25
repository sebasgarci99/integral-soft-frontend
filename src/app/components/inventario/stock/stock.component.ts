import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { InventarioService } from '../../../services/inventario/inventario.service';
import { Stock, Sede } from '../../../interfaces/inventario';
import { parseDateSinTimezone, formatDateLocal } from '../../../utils/fecha.util';

@Component({
    selector: 'app-stock-inv',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, FloatLabelModule, DropdownModule, InputTextModule],
    templateUrl: './stock.component.html',
    styleUrls: ['./stock.component.css'],
    providers: [MessageService]
})
export class StockComponent implements OnInit {

    stocks: Stock[] = [];
    sedes: Sede[] = [];
    selectedSede: Sede | null = null;
    vistaConsolidada: boolean = false;

    constructor(
        private inventarioService: InventarioService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.cargarStock();
        this.cargarSedes();
    }

    async cargarSedes() {
        (await this.inventarioService.getSedes()).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.sedes = res.body || [];
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error al cargar las sedes.' });
            }
        });
    }

    async cargarStock() {
        const filtros: Record<string, unknown> = {};
        if (this.selectedSede) filtros['id_sede'] = this.selectedSede.id_sede;

        (await this.inventarioService.getStockPorSede(filtros)).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.stocks = res.body || [];
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cargar el stock.' });
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
            }
        });
    }

    onSedeChange() {
        this.cargarStock();
    }

    get totalRegistros(): number {
        return this.stocks.length;
    }

    get totalProductos(): number {
        return new Set(this.stocks.map(s => s.id_producto)).size;
    }

    get totalUnidades(): number {
        return this.stocks.reduce((sum, s) => sum + Number(s.cantidad || 0), 0);
    }

    get registrosStockBajo(): number {
        return this.stocks.filter(s => s.stock_bajo).length;
    }

    estadoVencimiento(row: Stock): { texto: string; clase: string } {
        const dias = row.dias_vencimiento;

        if (dias === null || dias === undefined) {
            return { texto: 'Sin vencimiento', clase: 'inv-estado-neutro' };
        }
        if (dias <= 0) {
            return { texto: 'Vencido', clase: 'inv-estado-vencido' };
        }
        if (dias <= 30) {
            return { texto: 'Por vencer', clase: 'inv-estado-critico' };
        }
        if (dias <= 90) {
            return { texto: 'Próximo', clase: 'inv-estado-alerta' };
        }
        return { texto: 'Vigente', clase: 'inv-estado-ok' };
    }

    formatearFecha(valor: string | Date | null | undefined): string {
        if (!valor) return '—';
        const fecha = parseDateSinTimezone(valor);
        if (!fecha) return '—';
        return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
}
