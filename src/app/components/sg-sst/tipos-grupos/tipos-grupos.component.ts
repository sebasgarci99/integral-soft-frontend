import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { SgSstService } from '../../../services/sg-sst/sg-sst.service';
import { SgSstGrupo } from '../../../interfaces/sg-sst';

@Component({
    selector: 'app-sgsst-tipos-grupos',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tipos-grupos.component.html',
    styleUrl: './tipos-grupos.component.css'
})
export class SgSstTiposGruposComponent implements OnChanges {

    @Input() idCliente: number | null = null;
    @Output() gruposCambiados = new EventEmitter<void>();

    grupos: SgSstGrupo[] = [];
    cargando = false;
    guardando = false;
    modalVisible = false;
    edicion = false;
    form: Partial<SgSstGrupo> = this.formularioVacio();

    busqueda = '';
    filtroEstado: 'todos' | 'activos' | 'inactivos' = 'todos';
    busquedaIcono = '';

    readonly coloresRapidos = [
        '#0f766e', '#0284c7', '#7c3aed', '#db2777',
        '#ea580c', '#ca8a04', '#16a34a', '#475569'
    ];

    readonly iconos = [
        { clase: 'fa fa-layer-group', nombre: 'Grupos' },
        { clase: 'fa fa-shield-halved', nombre: 'Seguridad' },
        { clase: 'fa fa-helmet-safety', nombre: 'Casco' },
        { clase: 'fa fa-screwdriver-wrench', nombre: 'Herramientas' },
        { clase: 'fa fa-fire-extinguisher', nombre: 'Extintor' },
        { clase: 'fa fa-triangle-exclamation', nombre: 'Riesgo' },
        { clase: 'fa fa-heart-pulse', nombre: 'Salud' },
        { clase: 'fa fa-briefcase-medical', nombre: 'Botiquín' },
        { clase: 'fa fa-building', nombre: 'Edificio' },
        { clase: 'fa fa-industry', nombre: 'Industria' },
        { clase: 'fa fa-users', nombre: 'Personas' },
        { clase: 'fa fa-user-shield', nombre: 'Responsable' },
        { clase: 'fa fa-clipboard-check', nombre: 'Inspección' },
        { clase: 'fa fa-list-check', nombre: 'Checklist' },
        { clase: 'fa fa-broom', nombre: 'Aseo' },
        { clase: 'fa fa-droplet', nombre: 'Agua' },
        { clase: 'fa fa-bolt', nombre: 'Eléctrico' },
        { clase: 'fa fa-truck', nombre: 'Transporte' },
        { clase: 'fa fa-boxes-stacked', nombre: 'Almacén' },
        { clase: 'fa fa-leaf', nombre: 'Ambiental' },
        { clase: 'fa fa-temperature-high', nombre: 'Temperatura' },
        { clase: 'fa fa-radiation', nombre: 'Radiación' }
    ];

    constructor(private sgSstService: SgSstService) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['idCliente']) {
            this.cargar();
        }
    }

    get gruposFiltrados(): SgSstGrupo[] {
        const texto = this.busqueda.trim().toLowerCase();
        return this.grupos.filter(grupo => {
            const coincideEstado = this.filtroEstado === 'todos'
                || (this.filtroEstado === 'activos' && grupo.estado === 'A')
                || (this.filtroEstado === 'inactivos' && grupo.estado === 'I');
            const coincideTexto = !texto
                || grupo.codigo?.toLowerCase().includes(texto)
                || grupo.nombre?.toLowerCase().includes(texto)
                || grupo.descripcion?.toLowerCase().includes(texto);
            return coincideEstado && coincideTexto;
        });
    }

    get iconosFiltrados(): { clase: string; nombre: string }[] {
        const texto = this.busquedaIcono.trim().toLowerCase();
        if (!texto) return this.iconos;
        return this.iconos.filter(icono => icono.nombre.toLowerCase().includes(texto));
    }

    get nombreIconoActual(): string {
        const encontrado = this.iconos.find(icono => icono.clase === this.form.icono);
        return encontrado?.nombre || 'Personalizado';
    }

    seleccionarIcono(icono: string): void {
        this.form.icono = icono;
    }

    seleccionarColor(color: string): void {
        this.form.color = color;
    }

    fondoIcono(color?: string | null): string {
        const valor = color || '#0f766e';
        return /^#[0-9a-f]{6}$/i.test(valor) ? `${valor}1f` : '#f1f5f9';
    }

    limpiarFiltros(): void {
        this.busqueda = '';
        this.filtroEstado = 'todos';
    }

    async cargar(): Promise<void> {
        if (!this.idCliente) {
            this.grupos = [];
            return;
        }
        this.cargando = true;
        try {
            const observable = await this.sgSstService.getGrupos(this.idCliente, true);
            const res = await firstValueFrom(observable);
            this.grupos = res.state === 'OK' ? (res.body || []) : [];
        } catch {
            this.grupos = [];
        } finally {
            this.cargando = false;
        }
    }

    abrirCrear(): void {
        this.edicion = false;
        this.busquedaIcono = '';
        this.form = this.formularioVacio();
        this.modalVisible = true;
    }

    abrirEditar(grupo: SgSstGrupo): void {
        this.edicion = true;
        this.busquedaIcono = '';
        this.form = { ...grupo };
        this.modalVisible = true;
    }

    cerrarModal(): void {
        this.modalVisible = false;
    }

    async guardar(): Promise<void> {
        if (!this.idCliente) return;
        const codigo = String(this.form.codigo || '').trim();
        const nombre = String(this.form.nombre || '').trim();
        if (!codigo || !nombre) {
            Swal.fire('Datos incompletos', 'El código y el nombre son obligatorios.', 'warning');
            return;
        }
        if (this.guardando) return;

        this.guardando = true;
        try {
            const payload: Partial<SgSstGrupo> = {
                codigo,
                nombre,
                color: this.form.color || null,
                icono: this.form.icono || null,
                descripcion: this.form.descripcion || null,
                prioridad: this.form.prioridad ?? 3
            };

            const observable = this.edicion && this.form.id_tipo_grupo
                ? await this.sgSstService.actualizarGrupo(this.idCliente, { ...payload, id_tipo_grupo: this.form.id_tipo_grupo })
                : await this.sgSstService.crearGrupo(this.idCliente, payload);
            const res = await firstValueFrom(observable);

            if (res.state === 'OK') {
                this.modalVisible = false;
                await this.cargar();
                this.gruposCambiados.emit();
                Swal.fire('Listo', this.edicion ? 'Grupo actualizado.' : 'Grupo creado.', 'success');
            } else {
                Swal.fire('Atención', res.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo guardar el grupo.', 'error');
        } finally {
            this.guardando = false;
        }
    }

    async inactivar(grupo: SgSstGrupo): Promise<void> {
        if (!this.idCliente || !grupo.id_tipo_grupo) return;
        const confirmacion = await Swal.fire({
            title: '¿Inactivar grupo?',
            text: `${grupo.codigo} - ${grupo.nombre}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, inactivar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626'
        });
        if (!confirmacion.isConfirmed) return;

        try {
            const observable = await this.sgSstService.inactivarGrupo(this.idCliente, grupo.id_tipo_grupo);
            const res = await firstValueFrom(observable);
            if (res.state === 'OK') {
                await this.cargar();
                this.gruposCambiados.emit();
            } else {
                Swal.fire('Atención', res.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo inactivar el grupo.', 'error');
        }
    }

    private formularioVacio(): Partial<SgSstGrupo> {
        return {
            codigo: '',
            nombre: '',
            color: '#0f766e',
            icono: 'fa fa-layer-group',
            descripcion: '',
            prioridad: 3,
            estado: 'A'
        };
    }
}
