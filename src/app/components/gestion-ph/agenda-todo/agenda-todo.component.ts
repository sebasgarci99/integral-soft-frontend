import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { ActividadesService } from '../../../services/actividades/actividades.service';
import { GestionPhService } from '../../../services/gestion-ph/gestion-ph.service';
import { AgendaTodo } from '../../../interfaces/gestion-ph';
import { resolverColorGrupo } from '../../../utils/grupo-color.util';
import { EvidenciaUploaderComponent } from '../evidencia-uploader/evidencia-uploader.component';

interface DiaSemana {
    fecha: string;
    etiqueta: string;
    numero: number;
    esHoy: boolean;
    esSeleccionado: boolean;
}

const ESTADOS: Record<string, { etiqueta: string; color: string }> = {
    programada: { etiqueta: 'Programada', color: '#0d9488' },
    iniciada: { etiqueta: 'Iniciada', color: '#f59e0b' },
    completada: { etiqueta: 'Completada', color: '#22c55e' },
    cancelada: { etiqueta: 'Cancelada', color: '#94a3b8' }
};

@Component({
    selector: 'app-agenda-todo',
    standalone: true,
    imports: [CommonModule, FormsModule, EvidenciaUploaderComponent],
    templateUrl: './agenda-todo.component.html',
    styleUrl: './agenda-todo.component.css'
})
export class AgendaTodoComponent implements OnChanges {

    @Input() fecha: string = '';
    @Input() idTipoGrupo: number | null = null;
    @Output() fechaChange = new EventEmitter<string>();

    horas: number[] = this.construirFranjaHoras();

    diasSemana: DiaSemana[] = [];
    instanciasSemana: any[] = [];
    tareas: AgendaTodo[] = [];
    nuevaTarea = '';
    cargandoSemana = false;
    cargandoTareas = false;
    guardandoTarea = false;

    detalleVisible = false;
    instanciaDetalle: any = null;
    procesando = false;
    observacionesFinalizar = '';
    evidencias: any[] = [];

    constructor(
        private actividadesService: ActividadesService,
        private gestionPhService: GestionPhService
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['fecha'] || changes['idTipoGrupo']) {
            this.cargarSemana();
            this.cargarTareas();
        }
    }

    get tituloSemana(): string {
        if (this.diasSemana.length === 0) return '';
        const primero = this.diasSemana[0];
        const ultimo = this.diasSemana[this.diasSemana.length - 1];
        return `Semana del ${this.fechaLegible(primero.fecha)} al ${this.fechaLegible(ultimo.fecha)}`;
    }

    get pendientes(): number {
        return this.tareas.filter(t => !t.completada).length;
    }

    async cargarSemana(): Promise<void> {
        if (!this.fecha) return;

        const { inicio, fin } = this.rangoSemana(this.fecha);
        this.diasSemana = this.construirDias(inicio, fin);

        this.cargandoSemana = true;
        try {
            const respuesta = await this.actividadesService.getActividadesCalendario(inicio, fin, true, this.idTipoGrupo);
            respuesta.subscribe({
                next: (res) => {
                    this.instanciasSemana = res.state === 'OK' ? (res.body || []) : [];
                    this.cargandoSemana = false;
                },
                error: () => {
                    this.instanciasSemana = [];
                    this.cargandoSemana = false;
                }
            });
        } catch {
            this.cargandoSemana = false;
        }
    }

    async cargarTareas(): Promise<void> {
        if (!this.fecha) return;
        this.cargandoTareas = true;
        try {
            const respuesta = await this.gestionPhService.getTareas(this.fecha, this.idTipoGrupo);
            respuesta.subscribe({
                next: (res) => {
                    this.tareas = res.state === 'OK' ? (res.body || []) : [];
                    this.cargandoTareas = false;
                },
                error: () => {
                    this.tareas = [];
                    this.cargandoTareas = false;
                }
            });
        } catch {
            this.cargandoTareas = false;
        }
    }

    get horaActual(): Date {
        return new Date();
    }

    instanciasDelDia(fecha: string): any[] {
        return this.instanciasSemana.filter(i => i.fecha === fecha);
    }

    eventosEnHora(dia: DiaSemana, hora: number): any[] {
        return this.instanciasSemana.filter(i =>
            i.fecha === dia.fecha && Number((i.hora_inicio || '00:00').split(':')[0]) === hora
        );
    }

    totalDia(dia: DiaSemana): number {
        return this.instanciasSemana.filter(i => i.fecha === dia.fecha).length;
    }

    colorGrupo(instancia: any): string {
        return resolverColorGrupo(instancia?.actividad?.tipoGrupo?.color);
    }

    seleccionarDia(fecha: string): void {
        this.fechaChange.emit(fecha);
    }

    semanaAnterior(): void {
        this.fechaChange.emit(this.sumarDias(this.fecha, -7));
    }

    semanaSiguiente(): void {
        this.fechaChange.emit(this.sumarDias(this.fecha, 7));
    }

    irHoy(): void {
        this.fechaChange.emit(this.obtenerFechaHoy());
    }

    // ============ DETALLE / EJECUCIÓN DE ACTIVIDADES ============
    estadoInfo(estado: string) {
        return ESTADOS[estado] || ESTADOS['programada'];
    }

    abrirDetalle(instancia: any, event?: Event): void {
        if (event) event.stopPropagation();
        this.instanciaDetalle = instancia;
        this.observacionesFinalizar = '';
        this.evidencias = [];
        this.detalleVisible = true;
    }

    cerrarDetalle(): void {
        this.detalleVisible = false;
        this.instanciaDetalle = null;
    }

    async iniciarDesdeDetalle(): Promise<void> {
        if (!this.instanciaDetalle) return;
        await this.ejecutarInicio(this.instanciaDetalle);
        this.cerrarDetalle();
    }

    async iniciarRapido(instancia: any, event: Event): Promise<void> {
        event.stopPropagation();
        if (!instancia || instancia.estado !== 'programada') return;
        await this.ejecutarInicio(instancia);
    }

    private async ejecutarInicio(instancia: any): Promise<void> {
        try {
            const respuesta = await this.actividadesService.iniciarActividad(instancia.id_instancia);
            const res = await firstValueFrom(respuesta);
            if (res.state === 'OK') {
                await this.cargarSemana();
            } else {
                Swal.fire('Atención', res.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo iniciar la actividad.', 'error');
        }
    }

    async finalizarActividad(): Promise<void> {
        if (!this.instanciaDetalle) return;
        if (!this.observacionesFinalizar.trim() && this.evidencias.length === 0) {
            Swal.fire('Atención', 'Ingresa observaciones o adjunta al menos una evidencia.', 'warning');
            return;
        }
        if (this.procesando) return;

        this.procesando = true;
        try {
            const respuesta = await this.actividadesService.finalizarActividad(
                this.instanciaDetalle.id_instancia,
                this.observacionesFinalizar,
                this.evidencias,
                []
            );
            const res = await firstValueFrom(respuesta);
            if (res.state === 'OK') {
                this.cerrarDetalle();
                await this.cargarSemana();
                Swal.fire('Listo', 'Actividad finalizada.', 'success');
            } else {
                Swal.fire('Atención', res.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo finalizar la actividad.', 'error');
        } finally {
            this.procesando = false;
        }
    }

    async agregarTarea(): Promise<void> {
        const titulo = this.nuevaTarea.trim();
        if (!titulo || this.guardandoTarea) return;

        this.guardandoTarea = true;
        try {
            const respuesta = await this.gestionPhService.crearTarea(titulo, this.fecha, this.idTipoGrupo);
            respuesta.subscribe({
                next: (res) => {
                    this.guardandoTarea = false;
                    if (res.state === 'OK' && res.body) {
                        this.tareas = [res.body, ...this.tareas];
                        this.nuevaTarea = '';
                    } else {
                        Swal.fire('Atención', res.msg, 'warning');
                    }
                },
                error: () => {
                    this.guardandoTarea = false;
                    Swal.fire('Error', 'No se pudo crear la tarea.', 'error');
                }
            });
        } catch {
            this.guardandoTarea = false;
        }
    }

    async toggleTarea(tarea: AgendaTodo): Promise<void> {
        if (!tarea.id_tarea) return;
        const nuevoEstado = !tarea.completada;
        tarea.completada = nuevoEstado;
        const respuesta = await this.gestionPhService.toggleTarea(tarea.id_tarea, nuevoEstado);
        respuesta.subscribe({
            next: () => { /* actualización optimista */ },
            error: () => {
                tarea.completada = !nuevoEstado;
                Swal.fire('Error', 'No se pudo actualizar la tarea.', 'error');
            }
        });
    }

    async eliminarTarea(tarea: AgendaTodo): Promise<void> {
        if (!tarea.id_tarea) return;
        const confirmacion = await Swal.fire({
            title: '¿Eliminar tarea?',
            text: tarea.titulo,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626'
        });
        if (!confirmacion.isConfirmed) return;

        const respuesta = await this.gestionPhService.eliminarTarea(tarea.id_tarea);
        respuesta.subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.tareas = this.tareas.filter(t => t.id_tarea !== tarea.id_tarea);
                }
            },
            error: () => Swal.fire('Error', 'No se pudo eliminar la tarea.', 'error')
        });
    }

    private rangoSemana(fecha: string): { inicio: string; fin: string } {
        const date = this.parseFecha(fecha);
        const dia = date.getDay();
        const offset = dia === 0 ? -6 : 1 - dia;
        const inicio = new Date(date);
        inicio.setDate(date.getDate() + offset);
        const fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 6);
        return { inicio: this.formatearISO(inicio), fin: this.formatearISO(fin) };
    }

    private construirDias(inicio: string, fin: string): DiaSemana[] {
        const dias: DiaSemana[] = [];
        const etiquetas = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
        const hoy = this.obtenerFechaHoy();
        const cursor = this.parseFecha(inicio);
        const limite = this.parseFecha(fin);

        for (let i = 0; i < 7 && cursor <= limite; i++) {
            const iso = this.formatearISO(cursor);
            dias.push({
                fecha: iso,
                etiqueta: etiquetas[i],
                numero: cursor.getDate(),
                esHoy: iso === hoy,
                esSeleccionado: iso === this.fecha
            });
            cursor.setDate(cursor.getDate() + 1);
        }
        return dias;
    }

    private parseFecha(fecha: string): Date {
        const [anio, mes, dia] = fecha.split('-').map(Number);
        return new Date(anio, mes - 1, dia);
    }

    private formatearISO(date: Date): string {
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const dia = String(date.getDate()).padStart(2, '0');
        return `${date.getFullYear()}-${mes}-${dia}`;
    }

    private sumarDias(fecha: string, dias: number): string {
        const date = this.parseFecha(fecha);
        date.setDate(date.getDate() + dias);
        return this.formatearISO(date);
    }

    /** Franja de 8 horas: una hora antes de la hora actual (acotada al día). */
    private construirFranjaHoras(): number[] {
        const actual = new Date().getHours();
        const inicio = Math.min(Math.max(actual - 1, 5), 15);
        return Array.from({ length: 8 }, (_, i) => inicio + i);
    }

    private obtenerFechaHoy(): string {
        return this.formatearISO(new Date());
    }

    private fechaLegible(fecha: string): string {
        return this.parseFecha(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    }

    formatearHora(hora?: string | null): string {
        if (!hora) return '';
        const [h, m] = hora.split(':').map(Number);
        const sufijo = h >= 12 ? 'PM' : 'AM';
        const hora12 = h % 12 === 0 ? 12 : h % 12;
        return `${hora12}:${String(m || 0).padStart(2, '0')} ${sufijo}`;
    }
}
