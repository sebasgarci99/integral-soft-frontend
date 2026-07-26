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
import { TabViewModule } from 'primeng/tabview';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InventarioService } from '../../../services/inventario/inventario.service';
import { Grupo, Categoria, UnidadMedida, TipoMovimiento, Semaforo } from '../../../interfaces/inventario';

@Component({
    selector: 'app-config-inventario',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
              InputTextModule, InputTextarea, ToastModule, ConfirmDialogModule,
              DropdownModule, TabViewModule],
    templateUrl: './configuracion.component.html',
    styleUrls: ['./configuracion.component.css'],
    providers: [MessageService, ConfirmationService]
})
export class ConfiguracionComponent implements OnInit {

    activeTab: number = 0;

    grupos: Grupo[] = [];
    categorias: Categoria[] = [];
    unidades: UnidadMedida[] = [];
    tiposMovimiento: TipoMovimiento[] = [];
    semaforos: Semaforo[] = [];

    displayDialog: boolean = false;
    dialogType: string = '';
    isEdit: boolean = false;
    formData: any = {};

    constructor(
        private inventarioService: InventarioService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.cargarTodos();
    }

    async cargarTodos() {
        await Promise.all([
            this.cargarGrupos(),
            this.cargarCategorias(),
            this.cargarUnidades(),
            this.cargarTiposMovimiento(),
            this.cargarSemaforos()
        ]);
    }

    async cargarGrupos() {
        (await this.inventarioService.getGrupos()).subscribe({
            next: (res) => { if (res.state === 'OK') this.grupos = res.body || []; }
        });
    }

    async cargarCategorias() {
        (await this.inventarioService.getCategorias()).subscribe({
            next: (res) => { if (res.state === 'OK') this.categorias = res.body || []; }
        });
    }

    async cargarUnidades() {
        (await this.inventarioService.getUnidadesMedida()).subscribe({
            next: (res) => { if (res.state === 'OK') this.unidades = res.body || []; }
        });
    }

    async cargarTiposMovimiento() {
        (await this.inventarioService.getTiposMovimiento()).subscribe({
            next: (res) => { if (res.state === 'OK') this.tiposMovimiento = res.body || []; }
        });
    }

    async cargarSemaforos() {
        (await this.inventarioService.getSemaforos()).subscribe({
            next: (res) => { if (res.state === 'OK') this.semaforos = res.body || []; }
        });
    }

    abrirDialog(type: string) {
        this.dialogType = type;
        this.isEdit = false;
        this.formData = {};
        if (type === 'semaforo') {
            this.formData = { color: 'ROJO', orden: 1 };
        }
        if (type === 'tipo_movimiento') {
            this.formData = { signo: 1 };
        }
        this.displayDialog = true;
    }

    editar(item: any, type: string) {
        this.dialogType = type;
        this.isEdit = true;
        this.formData = { ...item };
        this.displayDialog = true;
    }

    eliminar(item: any, type: string) {
        const nombres: Record<string, string> = {
            'grupo': 'grupo', 'categoria': 'categoría',
            'unidad': 'unidad de medida', 'tipo_movimiento': 'tipo de movimiento', 'semaforo': 'configuración de semáforo'
        };
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: `Inactivar ${nombres[type]}`,
            message: `¿Estás seguro de inactivar este registro?`,
            acceptLabel: 'Sí', rejectLabel: 'No',
            accept: async () => {
                let observable;
                switch (type) {
                    case 'grupo': observable = await this.inventarioService.inactivarGrupo(item.id_grupo_producto); break;
                    case 'categoria': observable = await this.inventarioService.inactivarCategoria(item.id_categoria_producto); break;
                    case 'unidad': observable = await this.inventarioService.inactivarUnidadMedida(item.id_unidad_medida); break;
                    case 'tipo_movimiento': observable = await this.inventarioService.inactivarTipoMovimiento(item.id_tipo_movimiento); break;
                    case 'semaforo': observable = await this.inventarioService.inactivarSemaforo(item.id_config_semaforo); break;
                }
                if (observable) {
                    observable.subscribe({
                        next: () => {
                            this.cargarTodos();
                            this.messageService.add({ severity: 'success', summary: 'Registro inactivado.' });
                        }
                    });
                }
            }
        });
    }

    async guardar() {
        let observable: any;
        const type = this.dialogType;

        switch (type) {
            case 'grupo':
                observable = this.isEdit
                    ? await this.inventarioService.actualizarGrupo(this.formData)
                    : await this.inventarioService.crearGrupo(this.formData);
                break;
            case 'categoria':
                observable = this.isEdit
                    ? await this.inventarioService.actualizarCategoria(this.formData)
                    : await this.inventarioService.crearCategoria(this.formData);
                break;
            case 'unidad':
                observable = this.isEdit
                    ? await this.inventarioService.actualizarUnidadMedida(this.formData)
                    : await this.inventarioService.crearUnidadMedida(this.formData);
                break;
            case 'tipo_movimiento':
                observable = this.isEdit
                    ? await this.inventarioService.actualizarTipoMovimiento(this.formData)
                    : await this.inventarioService.crearTipoMovimiento(this.formData);
                break;
            case 'semaforo':
                observable = this.isEdit
                    ? await this.inventarioService.actualizarSemaforo(this.formData)
                    : await this.inventarioService.crearSemaforo(this.formData);
                break;
        }

        if (observable) {
            observable.subscribe({
                next: (res: any) => {
                    if (res.state === 'OK') {
                        this.cargarTodos();
                        this.displayDialog = false;
                        this.messageService.add({ severity: 'success', summary: 'Guardado exitosamente.' });
                    } else {
                        this.messageService.add({ severity: 'error', summary: res.msg });
                    }
                }
            });
        }
    }

    getNombreGrupo(id: number): string {
        return this.grupos.find(g => g.id_grupo_producto === id)?.nombre || '';
    }
}
