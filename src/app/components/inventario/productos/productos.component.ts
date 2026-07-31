import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InventarioService } from '../../../services/inventario/inventario.service';
import { Producto, Grupo, Categoria, UnidadMedida } from '../../../interfaces/inventario';

@Component({
    selector: 'app-productos-inv',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
              InputTextModule, InputTextarea, ToastModule, ConfirmDialogModule,
              DropdownModule, CheckboxModule],
    templateUrl: './productos.component.html',
    styleUrls: ['./productos.component.css'],
    providers: [MessageService, ConfirmationService]
})
export class ProductosComponent implements OnInit {

    productos: Producto[] = [];
    grupos: Grupo[] = [];
    categorias: Categoria[] = [];
    unidades: UnidadMedida[] = [];
    displayDialog: boolean = false;
    isEdit: boolean = false;

    formData: any = {};

    selectedGrupo: Grupo | null = null;
    selectedCategoria: Categoria | null = null;

    @ViewChild('tablaProductos') tablaProductos?: Table;

    constructor(
        private inventarioService: InventarioService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.cargarDatosIniciales();
    }

    async cargarDatosIniciales() {
        await this.cargarGrupos();
        await this.cargarCategorias();
        await this.cargarUnidades();
    }

    aplicarFiltroGlobal(event: Event) {
        const valor = (event.target as HTMLInputElement).value;
        if (this.tablaProductos) {
            this.tablaProductos.filterGlobal(valor, 'contains');
        }
    }

    async cargarProductos() {
        const filtros: Record<string, unknown> = {};
        if (this.selectedGrupo) filtros['id_grupo'] = this.selectedGrupo.id_grupo_producto;
        if (this.selectedCategoria) filtros['id_categoria'] = this.selectedCategoria.id_categoria_producto;

        (await this.inventarioService.getProductos(filtros)).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.productos = res.body || [];
                }
            }
        });
    }

    async cargarGrupos() {
        (await this.inventarioService.getGrupos()).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.grupos = res.body || [];
                }
            }
        });
    }

    async cargarCategorias(idGrupo?: number) {
        (await this.inventarioService.getCategorias(idGrupo)).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.categorias = res.body || [];
                }
            }
        });
    }

    async cargarUnidades() {
        (await this.inventarioService.getUnidadesMedida()).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.unidades = res.body || [];
                }
            }
        });
    }

    seleccionarGrupo(grupo: Grupo) {
        if (this.selectedGrupo && this.selectedGrupo.id_grupo_producto === grupo.id_grupo_producto) {
            this.selectedGrupo = null;
            this.selectedCategoria = null;
            this.categorias = [];
            this.productos = [];
            return;
        }
        this.selectedGrupo = grupo;
        this.selectedCategoria = null;
        this.cargarCategorias(grupo.id_grupo_producto);
        this.cargarProductos();
    }

    obtenerClaseGradiente(index: number): string {
        return `grupo-gradient-${(index % 8) + 1}`;
    }

    onCategoriaChange() {
        this.cargarProductos();
    }

    limpiarFiltros() {
        this.selectedGrupo = null;
        this.selectedCategoria = null;
        this.categorias = [];
        this.productos = [];
    }

    abrirFormulario() {
        this.isEdit = false;
        this.formData = {
            id_grupo_producto: this.selectedGrupo?.id_grupo_producto,
            maneja_lote: false,
            maneja_vencimiento: false,
            stock_minimo: 0,
            stock_maximo: 0
        };
        this.displayDialog = true;
    }

    editarProducto(producto: Producto) {
        this.isEdit = true;
        this.formData = {
            ...producto,
            id_grupo_producto: producto.Categoria?.Grupo?.id_grupo_producto
        };
        this.displayDialog = true;
    }

    borrarProducto(producto: Producto) {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Inactivar producto',
            message: `¿Estás seguro de inactivar "${producto.nombre}"?`,
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                (await this.inventarioService.inactivarProducto(producto.id_producto)).subscribe({
                    next: () => {
                        this.cargarProductos();
                        this.messageService.add({ severity: 'success', summary: 'Producto inactivado.' });
                    }
                });
            }
        });
    }

    async guardar() {
        if (!this.formData.codigo || !this.formData.nombre || !this.formData.id_categoria_producto || !this.formData.id_unidad_medida) {
            this.messageService.add({ severity: 'warn', summary: 'Campos requeridos: Código, Nombre, Categoría y Unidad de Medida' });
            return;
        }

        if (this.isEdit) {
            (await this.inventarioService.actualizarProducto(this.formData)).subscribe({
                next: (res) => {
                    if (res.state === 'OK') {
                        this.cargarProductos();
                        this.displayDialog = false;
                        this.messageService.add({ severity: 'success', summary: 'Producto actualizado correctamente.' });
                    } else {
                        this.messageService.add({ severity: 'error', summary: res.msg });
                    }
                }
            });
        } else {
            (await this.inventarioService.crearProducto(this.formData)).subscribe({
                next: (res) => {
                    if (res.state === 'OK') {
                        this.cargarProductos();
                        this.displayDialog = false;
                        this.messageService.add({ severity: 'success', summary: 'Producto creado correctamente.' });
                    } else {
                        this.messageService.add({ severity: 'error', summary: res.msg });
                    }
                }
            });
        }
    }
}
