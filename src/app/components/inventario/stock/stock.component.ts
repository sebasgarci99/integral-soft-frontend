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
        this.sedes = [
            { id_sede: 1, nombre: 'Sede Principal' }
        ];
    }

    async cargarStock() {
        const filtros: Record<string, unknown> = {};
        if (this.selectedSede) filtros['id_sede'] = this.selectedSede.id_sede;

        (await this.inventarioService.getStockPorSede(filtros)).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.stocks = res.body || [];
                }
            }
        });
    }

    onSedeChange() {
        this.cargarStock();
    }

    getColorClass(color: string | null | undefined): string {
        if (!color) return '';
        const map: Record<string, string> = {
            'ROJO': 'semaforo-rojo', 'AMARILLO': 'semaforo-amarillo',
            'NARANJA': 'semaforo-naranja', 'VERDE': 'semaforo-verde', 'GRIS': 'semaforo-gris'
        };
        return map[color] || '';
    }
}
