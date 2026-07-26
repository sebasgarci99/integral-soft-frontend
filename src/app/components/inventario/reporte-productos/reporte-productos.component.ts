import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { InventarioService } from '../../../services/inventario/inventario.service';
import { Producto, Grupo, Categoria, ApiResponse } from '../../../interfaces/inventario';

@Component({
    selector: 'app-reporte-productos',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, DropdownModule, InputTextModule],
    templateUrl: './reporte-productos.component.html',
    styleUrls: ['./reporte-productos.component.css'],
    providers: [MessageService]
})
export class ReporteProductosComponent implements OnInit {

    productos: Producto[] = [];
    grupos: Grupo[] = [];
    categorias: Categoria[] = [];
    filteredCategorias: Categoria[] = [];

    selectedGrupo: Grupo | null = null;
    selectedCategoria: Categoria | null = null;
    filtroEstado: string = 'TODOS';
    textoBusqueda: string = '';

    totalProductos: number = 0;
    totalStock: number = 0;
    productosStockBajo: number = 0;
    productosProximosVencer: number = 0;

    opcionesEstado = [
        { label: 'Todos', value: 'TODOS' },
        { label: 'Con Stock Bajo', value: 'STOCK_BAJO' },
        { label: 'Próximos a Vencer', value: 'PROXIMO_VENCER' },
        { label: 'Sin Stock', value: 'SIN_STOCK' }
    ];

    constructor(
        private inventarioService: InventarioService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.cargarDatos();
    }

    async cargarDatos() {
        await this.cargarGrupos();
        await this.cargarReporte();
    }

    async cargarGrupos() {
        (await this.inventarioService.getGrupos()).subscribe({
            next: (res: ApiResponse<Grupo[]>) => {
                if (res.state === 'OK') {
                    this.grupos = (res.body || []).filter(g => g.estado === 'A');
                }
            }
        });
    }

    async onGrupoChange() {
        this.selectedCategoria = null;
        this.categorias = [];
        if (this.selectedGrupo) {
            (await this.inventarioService.getCategorias(this.selectedGrupo.id_grupo_producto)).subscribe({
                next: (res: ApiResponse<Categoria[]>) => {
                    if (res.state === 'OK') {
                        this.categorias = (res.body || []).filter(c => c.estado === 'A');
                    }
                }
            });
        }
        this.cargarReporte();
    }

    async cargarReporte() {
        const filtros: Record<string, unknown> = {};
        if (this.selectedGrupo) filtros['id_grupo'] = this.selectedGrupo.id_grupo_producto;
        if (this.selectedCategoria) filtros['id_categoria'] = this.selectedCategoria.id_categoria_producto;

        (await this.inventarioService.getStockConsolidado(filtros)).subscribe({
            next: (res: ApiResponse<Producto[]>) => {
                if (res.state === 'OK') {
                    this.productos = (res.body || []).map(p => ({
                        ...p,
                        cantidad_total: p.cantidad_total || 0,
                        stock_bajo: p.stock_bajo || false,
                        color_semaforo: p.color_semaforo || undefined
                    }));
                    this.calcularResumen();
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error al cargar reporte' });
            }
        });
    }

    calcularResumen() {
        const filtrados = this.getProductosFiltrados();
        this.totalProductos = filtrados.length;
        this.totalStock = filtrados.reduce((sum, p) => sum + (p.cantidad_total || 0), 0);
        this.productosStockBajo = filtrados.filter(p => p.stock_bajo).length;
        this.productosProximosVencer = filtrados.filter(p => p.color_semaforo === 'ROJO' || p.color_semaforo === 'NARANJA').length;
    }

    getProductosFiltrados(): Producto[] {
        let resultado = this.productos;

        if (this.filtroEstado === 'STOCK_BAJO') {
            resultado = resultado.filter(p => p.stock_bajo);
        } else if (this.filtroEstado === 'PROXIMO_VENCER') {
            resultado = resultado.filter(p => p.color_semaforo === 'ROJO' || p.color_semaforo === 'NARANJA');
        } else if (this.filtroEstado === 'SIN_STOCK') {
            resultado = resultado.filter(p => (p.cantidad_total || 0) === 0);
        }

        if (this.textoBusqueda) {
            const busqueda = this.textoBusqueda.toLowerCase();
            resultado = resultado.filter(p =>
                (p.codigo || '').toLowerCase().includes(busqueda) ||
                (p.nombre || '').toLowerCase().includes(busqueda) ||
                (p.Categoria?.nombre || '').toLowerCase().includes(busqueda) ||
                (p.Categoria?.Grupo?.nombre || '').toLowerCase().includes(busqueda)
            );
        }

        return resultado;
    }

    getColorClass(color: string | null | undefined): string {
        if (!color) return '';
        const map: Record<string, string> = {
            'ROJO': 'semaforo-rojo', 'AMARILLO': 'semaforo-amarillo',
            'NARANJA': 'semaforo-naranja', 'VERDE': 'semaforo-verde', 'GRIS': 'semaforo-gris'
        };
        return map[color] || '';
    }

    limpiarFiltros() {
        this.selectedGrupo = null;
        this.selectedCategoria = null;
        this.filtroEstado = 'TODOS';
        this.textoBusqueda = '';
        this.cargarReporte();
    }

    imprimir() {
        window.print();
    }
}
