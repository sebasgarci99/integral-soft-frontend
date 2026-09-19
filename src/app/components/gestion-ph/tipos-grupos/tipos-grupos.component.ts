import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { TiposGrupoService } from '../../../services/tipos-grupo/tipos-grupo.service';
import { TipoGrupo } from '../../../interfaces/gestion-ph';
import { resolverColorGrupo } from '../../../utils/grupo-color.util';

@Component({
    selector: 'app-tipos-grupos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tipos-grupos.component.html',
    styleUrl: './tipos-grupos.component.css'
})
export class TiposGruposComponent implements OnInit {

    @Output() gruposCambiados = new EventEmitter<void>();

    todosLosGrupos: TipoGrupo[] = [];
    grupos: TipoGrupo[] = [];
    cargando = false;
    guardando = false;
    modalVisible = false;
    incluirInactivos = false;

    readonly paleta: string[] = [
        '#10b981', '#0ea5e9', '#a855f7', '#f59e0b', '#0d9488', '#f43f5e', '#64748b', '#3b82f6'
    ];

    readonly iconos: string[] = [
        'fa-solid fa-shield-halved',
        'fa-solid fa-screwdriver-wrench',
        'fa-solid fa-briefcase',
        'fa-solid fa-envelope-open-text',
        'fa-solid fa-people-roof',
        'fa-solid fa-tree-city',
        'fa-solid fa-bolt',
        'fa-solid fa-list-check'
    ];

    form: {
        id_tipo_grupo?: number;
        codigo: string;
        nombre: string;
        color: string;
        icono: string;
        descripcion: string;
        prioridad: number;
        estado: 'A' | 'I';
    } = this.formularioVacio();

    constructor(private tiposGrupoService: TiposGrupoService) {}

    ngOnInit(): void {
        this.cargarGrupos();
    }

    private formularioVacio() {
        return {
            id_tipo_grupo: undefined as number | undefined,
            codigo: '',
            nombre: '',
            color: '#0d9488',
            icono: 'fa-solid fa-list-check',
            descripcion: '',
            prioridad: 3,
            estado: 'A' as 'A' | 'I'
        };
    }

    /** Filtro en cliente: garantiza que la tabla reaccione al instante al checkbox. */
    private aplicarFiltro(): void {
        this.grupos = this.incluirInactivos
            ? [...this.todosLosGrupos]
            : this.todosLosGrupos.filter(g => g.estado !== 'I');
    }

    cambiarIncluirInactivos(valor: boolean): void {
        this.incluirInactivos = valor;
        this.aplicarFiltro();
    }

    async cargarGrupos(): Promise<void> {
        this.cargando = true;
        try {
            // Siempre se traen todos (activos e inactivos) y el filtro se aplica en cliente.
            const respuesta = await this.tiposGrupoService.getTiposGrupo(true);
            respuesta.subscribe({
                next: (res) => {
                    if (res.state === 'OK') {
                        this.todosLosGrupos = res.body || [];
                        this.aplicarFiltro();
                    }
                    this.cargando = false;
                },
                error: () => {
                    this.cargando = false;
                    Swal.fire('Error', 'No se pudieron cargar los grupos.', 'error');
                }
            });
        } catch {
            this.cargando = false;
        }
    }

    get tituloModal(): string {
        return this.form.id_tipo_grupo ? 'Editar Grupo' : 'Crear Nuevo Grupo';
    }

    get totalActivos(): number {
        return this.todosLosGrupos.filter(g => g.estado !== 'I').length;
    }

    get totalInactivos(): number {
        return this.todosLosGrupos.filter(g => g.estado === 'I').length;
    }

    abrirCrear(): void {
        this.form = this.formularioVacio();
        this.modalVisible = true;
    }

    abrirEditar(grupo: TipoGrupo): void {
        this.form = {
            id_tipo_grupo: grupo.id_tipo_grupo,
            codigo: grupo.codigo,
            nombre: grupo.nombre,
            color: grupo.color || '#0d9488',
            icono: grupo.icono || 'fa-solid fa-list-check',
            descripcion: grupo.descripcion || '',
            prioridad: grupo.prioridad ?? 3,
            estado: (grupo.estado as 'A' | 'I') || 'A'
        };
        this.modalVisible = true;
    }

    cerrarModal(): void {
        this.modalVisible = false;
    }

    seleccionarColor(color: string): void {
        this.form.color = color;
    }

    seleccionarIcono(icono: string): void {
        this.form.icono = icono;
    }

    async guardar(): Promise<void> {
        if (!this.form.codigo.trim() || !this.form.nombre.trim()) {
            Swal.fire('Datos incompletos', 'El código y el nombre son obligatorios.', 'warning');
            return;
        }
        if (this.guardando) return;

        this.guardando = true;
        try {
            const respuesta = this.form.id_tipo_grupo
                ? await this.tiposGrupoService.actualizarTipoGrupo({
                    id_tipo_grupo: this.form.id_tipo_grupo,
                    codigo: this.form.codigo,
                    nombre: this.form.nombre,
                    color: this.form.color,
                    icono: this.form.icono,
                    descripcion: this.form.descripcion,
                    prioridad: this.form.prioridad,
                    estado: this.form.estado
                })
                : await this.tiposGrupoService.crearTipoGrupo({
                    codigo: this.form.codigo,
                    nombre: this.form.nombre,
                    color: this.form.color,
                    icono: this.form.icono,
                    descripcion: this.form.descripcion,
                    prioridad: this.form.prioridad
                });

            respuesta.subscribe({
                next: (res) => {
                    this.guardando = false;
                    if (res.state === 'OK') {
                        this.modalVisible = false;
                        this.cargarGrupos();
                        this.gruposCambiados.emit();
                        Swal.fire('Listo', res.msg, 'success');
                    } else {
                        Swal.fire('Atención', res.msg, 'warning');
                    }
                },
                error: () => {
                    this.guardando = false;
                    Swal.fire('Error', 'No se pudo guardar el grupo.', 'error');
                }
            });
        } catch {
            this.guardando = false;
        }
    }

    async inactivar(grupo: TipoGrupo): Promise<void> {
        const confirmacion = await Swal.fire({
            title: '¿Inactivar grupo?',
            text: `El grupo ${grupo.codigo} - ${grupo.nombre} dejará de estar disponible.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, inactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0d9488'
        });
        if (!confirmacion.isConfirmed || !grupo.id_tipo_grupo) return;

        const respuesta = await this.tiposGrupoService.inactivarTipoGrupo(grupo.id_tipo_grupo);
        respuesta.subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.cargarGrupos();
                    this.gruposCambiados.emit();
                    Swal.fire('Listo', res.msg, 'success');
                } else {
                    Swal.fire('Atención', res.msg, 'warning');
                }
            },
            error: () => Swal.fire('Error', 'No se pudo inactivar el grupo.', 'error')
        });
    }

    colorTexto(color?: string | null): string {
        return resolverColorGrupo(color);
    }
}
