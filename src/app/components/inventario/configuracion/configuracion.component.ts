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
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { InventarioService } from '../../../services/inventario/inventario.service';
import { Grupo, Categoria, UnidadMedida, TipoMovimiento, Semaforo } from '../../../interfaces/inventario';
import { parseDateSinTimezone, formatDateLocal } from '../../../utils/fecha.util';

interface IconoOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-config-inventario',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
              InputTextModule, InputTextarea, ToastModule, ConfirmDialogModule,
              DropdownModule, Tabs, TabList, Tab, TabPanels, TabPanel],
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

    loadingGuardar: boolean = false;
    loadingEliminar: boolean = false;

    displayDialog: boolean = false;
    dialogType: string = '';
    isEdit: boolean = false;
    formData: any = {};

    iconos: IconoOption[] = [
        { label: 'Cubo / Caja', value: 'fa fa-cube' },
        { label: 'Caja abierta', value: 'fa fa-box-open' },
        { label: 'Caja cerrada', value: 'fa fa-box' },
        { label: 'Canasta de compras', value: 'fa fa-shopping-basket' },
        { label: 'Carrito de compras', value: 'fa fa-shopping-cart' },
        { label: 'Etiqueta', value: 'fa fa-tag' },
        { label: 'Etiquetas', value: 'fa fa-tags' },
        { label: 'Uso general', value: 'fa fa-cubes' },
        { label: 'Laptop / Tecnología', value: 'fa fa-laptop' },
        { label: 'Móvil', value: 'fa fa-mobile-alt' },
        { label: 'Herramientas', value: 'fa fa-tools' },
        { label: 'Coche / Automotriz', value: 'fa fa-car' },
        { label: 'Bicicleta', value: 'fa fa-bicycle' },
        { label: 'Camión / Envíos', value: 'fa fa-truck' },
        { label: 'Avión', value: 'fa fa-plane' },
        { label: 'Utensilios / Restaurante', value: 'fa fa-utensils' },
        { label: 'Mug / Bebidas', value: 'fa fa-coffee' },
        { label: 'Vino / Licores', value: 'fa fa-wine-glass' },
        { label: 'Píldoras / Farmacia', value: 'fa fa-pills' },
        { label: 'Médico', value: 'fa fa-stethoscope' },
        { label: 'Corazón', value: 'fa fa-heart' },
        { label: 'Ropa / Camiseta', value: 'fa fa-tshirt' },
        { label: 'Zapato', value: 'fa fa-shoe-prints' },
        { label: 'Libro', value: 'fa fa-book' },
        { label: 'Papel', value: 'fa fa-file-alt' },
        { label: 'Lápiz / Papelería', value: 'fa fa-pencil-alt' },
        { label: 'Hogar', value: 'fa fa-home' },
        { label: 'Silla / Muebles', value: 'fa fa-chair' },
        { label: 'Lámpara', value: 'fa fa-lightbulb' },
        { label: 'Enchufe / Eléctrico', value: 'fa fa-plug' },
        { label: 'Jardín / Planta', value: 'fa fa-leaf' },
        { label: 'Pintura', value: 'fa fa-paint-roller' },
        { label: 'Deportes / Pelota', value: 'fa fa-futbol' },
        { label: 'Música', value: 'fa fa-music' },
        { label: 'Juguetes', value: 'fa fa-gamepad' },
        { label: 'Mascotas', value: 'fa fa-paw' },
        { label: 'Limpieza', value: 'fa fa-broom' },
        { label: 'Químico', value: 'fa fa-flask' },
        { label: 'Construcción', value: 'fa fa-hard-hat' },
        { label: 'Seguridad', value: 'fa fa-shield-alt' },
        { label: 'Regalo', value: 'fa fa-gift' }
    ];

    constructor(
        private inventarioService: InventarioService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.cargarTodos();
    }

    async cargarTodos() {
        try {
            const [grupos$, categorias$, unidades$, tiposMovimiento$, semaforos$] = await Promise.all([
                this.inventarioService.getGrupos(),
                this.inventarioService.getCategorias(),
                this.inventarioService.getUnidadesMedida(),
                this.inventarioService.getTiposMovimiento(),
                this.inventarioService.getSemaforos()
            ]);

            forkJoin([grupos$, categorias$, unidades$, tiposMovimiento$, semaforos$]).subscribe({
                next: ([resGrupos, resCategorias, resUnidades, resTipos, resSemaforos]) => {
                    if (resGrupos.state === 'OK') {
                        this.grupos = resGrupos.body || [];
                    } else {
                        this.messageService.add({ severity: 'error', summary: resGrupos.msg || 'Error al cargar los grupos.' });
                    }

                    if (resCategorias.state === 'OK') {
                        this.categorias = resCategorias.body || [];
                    } else {
                        this.messageService.add({ severity: 'error', summary: resCategorias.msg || 'Error al cargar las categorías.' });
                    }

                    if (resUnidades.state === 'OK') {
                        this.unidades = resUnidades.body || [];
                    } else {
                        this.messageService.add({ severity: 'error', summary: resUnidades.msg || 'Error al cargar las unidades de medida.' });
                    }

                    if (resTipos.state === 'OK') {
                        this.tiposMovimiento = resTipos.body || [];
                    } else {
                        this.messageService.add({ severity: 'error', summary: resTipos.msg || 'Error al cargar los tipos de movimiento.' });
                    }

                    if (resSemaforos.state === 'OK') {
                        this.semaforos = resSemaforos.body || [];
                    } else {
                        this.messageService.add({ severity: 'error', summary: resSemaforos.msg || 'Error al cargar las configuraciones de semáforo.' });
                    }
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
                }
            });
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
        }
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
                this.loadingEliminar = true;
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
                        next: (res: any) => {
                            this.loadingEliminar = false;
                            if (res.state === 'OK') {
                                this.cargarTodos();
                                this.messageService.add({ severity: 'success', summary: 'Registro inactivado.' });
                            } else {
                                this.messageService.add({ severity: 'error', summary: res.msg || 'Error al inactivar el registro.' });
                            }
                        },
                        error: () => {
                            this.loadingEliminar = false;
                            this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
                        }
                    });
                }
            }
        });
    }

    async guardar() {
        this.loadingGuardar = true;
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
                    this.loadingGuardar = false;
                    if (res.state === 'OK') {
                        this.cargarTodos();
                        this.displayDialog = false;
                        this.messageService.add({ severity: 'success', summary: 'Guardado exitosamente.' });
                    } else {
                        this.messageService.add({ severity: 'error', summary: res.msg || 'Error al guardar el registro.' });
                    }
                },
                error: () => {
                    this.loadingGuardar = false;
                    this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
                }
            });
        } else {
            this.loadingGuardar = false;
        }
    }

    getNombreGrupo(id: number): string {
        return this.grupos.find(g => g.id_grupo_producto === id)?.nombre || '';
    }
}
