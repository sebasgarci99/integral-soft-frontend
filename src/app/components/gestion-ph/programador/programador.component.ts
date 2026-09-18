import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { ActividadesService } from '../../../services/actividades/actividades.service';
import { TiposGrupoService } from '../../../services/tipos-grupo/tipos-grupo.service';
import { TipoGrupo } from '../../../interfaces/gestion-ph';
import { resolverColorGrupo } from '../../../utils/grupo-color.util';
import { EvidenciaUploaderComponent } from '../evidencia-uploader/evidencia-uploader.component';

interface DiaCalendario {
    fecha: string;
    dia: number;
    esMesActual: boolean;
    esHoy: boolean;
    esSeleccionado: boolean;
    instancias: any[];
}

const ESTADOS: Record<string, { etiqueta: string; color: string }> = {
    programada: { etiqueta: 'Programada', color: '#0d9488' },
    iniciada: { etiqueta: 'Iniciada', color: '#f59e0b' },
    completada: { etiqueta: 'Completada', color: '#22c55e' },
    cancelada: { etiqueta: 'Cancelada', color: '#94a3b8' }
};

@Component({
    selector: 'app-programador',
    standalone: true,
    imports: [CommonModule, FormsModule, EvidenciaUploaderComponent],
    templateUrl: './programador.component.html',
    styleUrl: './programador.component.css'
})
export class ProgramadorComponent implements OnInit, OnChanges {

    @Input() fecha: string = '';
    @Input() idTipoGrupo: number | null = null;

    readonly horas: number[] = Array.from({ length: 18 }, (_, i) => i + 5);

    mesActual: Date = new Date();
    diasCalendario: DiaCalendario[] = [];
    instanciasMes: any[] = [];
    fechaSeleccionada: string = '';
    cargando = false;

    grupos: TipoGrupo[] = [];

    modalVisible = false;
    guardando = false;
    form: any = this.formularioVacio();

    detalleVisible = false;
    instanciaDetalle: any = null;
    finalizando = false;
    observacionesFinalizar = '';
    evidencias: any[] = [];

    constructor(
        private actividadesService: ActividadesService,
        private tiposGrupoService: TiposGrupoService
    ) {}

    ngOnInit(): void {
        this.fechaSeleccionada = this.fecha || this.obtenerFechaHoy();
        this.mesActual = new Date(this.parseFecha(this.fechaSeleccionada).getFullYear(), this.parseFecha(this.fechaSeleccionada).getMonth(), 1);
        this.cargarGrupos();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['idTipoGrupo']) {
            this.cargarMes();
        }
        if (changes['fecha'] && !changes['fecha'].firstChange && this.fecha) {
            this.fechaSeleccionada = this.fecha;
            this.mesActual = new Date(this.parseFecha(this.fecha).getFullYear(), this.parseFecha(this.fecha).getMonth(), 1);
            this.cargarMes();
        }
    }

    get nombreMes(): string {
        return this.mesActual.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    }

    get tituloDia(): string {
        return this.parseFecha(this.fechaSeleccionada).toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    get horaActual(): Date {
        return new Date();
    }

    get esHoySeleccionado(): boolean {
        return this.fechaSeleccionada === this.obtenerFechaHoy();
    }

    get leyenda(): { etiqueta: string; color: string }[] {
        return [
            ESTADOS['programada'],
            ESTADOS['iniciada'],
            ESTADOS['completada'],
            ESTADOS['cancelada']
        ];
    }

    async cargarGrupos(): Promise<void> {
        const respuesta = await this.tiposGrupoService.getTiposGrupo();
        respuesta.subscribe({
            next: (res) => {
                if (res.state === 'OK') this.grupos = res.body || [];
            },
            error: () => { this.grupos = []; }
        });
    }

    async cargarMes(): Promise<void> {
        const inicio = this.formatearISO(new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), 1));
        const fin = this.formatearISO(new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0));

        this.cargando = true;
        try {
            const respuesta = await this.actividadesService.getActividadesCalendario(inicio, fin, true, this.idTipoGrupo);
            respuesta.subscribe({
                next: (res) => {
                    this.instanciasMes = res.state === 'OK' ? (res.body || []) : [];
                    this.construirCalendario();
                    this.cargando = false;
                },
                error: () => {
                    this.instanciasMes = [];
                    this.construirCalendario();
                    this.cargando = false;
                }
            });
        } catch {
            this.cargando = false;
        }
    }

    mesAnterior(): void {
        this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
        this.cargarMes();
    }

    mesSiguiente(): void {
        this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
        this.cargarMes();
    }

    seleccionarDia(dia: DiaCalendario): void {
        if (!dia.esMesActual) return;
        this.fechaSeleccionada = dia.fecha;
        this.construirCalendario();
    }

    instanciasDelDia(): any[] {
        return this.instanciasMes.filter(i => i.fecha === this.fechaSeleccionada);
    }

    instanciasPorHora(hora: number): any[] {
        return this.instanciasDelDia().filter(i => {
            const h = Number((i.hora_inicio || '00:00').split(':')[0]);
            return h === hora;
        });
    }

    estadoInfo(estado: string) {
        return ESTADOS[estado] || ESTADOS['programada'];
    }

    colorGrupo(instancia: any): string {
        return resolverColorGrupo(instancia?.actividad?.tipoGrupo?.color);
    }

    formatearHora(hora?: string | null): string {
        if (!hora) return '';
        const [h, m] = hora.split(':').map(Number);
        const sufijo = h >= 12 ? 'PM' : 'AM';
        const hora12 = h % 12 === 0 ? 12 : h % 12;
        return `${hora12}:${String(m || 0).padStart(2, '0')} ${sufijo}`;
    }

    // ============ CREAR ACTIVIDAD ============
    abrirModalCrear(): void {
        this.form = this.formularioVacio();
        this.form.fecha_inicio = this.fechaSeleccionada;
        this.form.id_tipo_grupo = this.idTipoGrupo || (this.grupos[0]?.id_tipo_grupo ?? null);
        this.modalVisible = true;
    }

    /** Abre el modal de creación con la hora de la franja seleccionada. */
    abrirModalCrearEnHora(hora: number): void {
        this.abrirModalCrear();
        this.form.hora_default = `${String(hora).padStart(2, '0')}:00`;
    }

    cerrarModal(): void {
        this.modalVisible = false;
    }

    async crearActividad(): Promise<void> {
        if (!this.form.titulo.trim()) {
            Swal.fire('Datos incompletos', 'El título de la actividad es obligatorio.', 'warning');
            return;
        }
        if (!this.form.id_tipo_grupo) {
            Swal.fire('Datos incompletos', ' Selecciona un grupo de trabajo.', 'warning');
            return;
        }
        if (this.guardando) return;

        const esUnica = this.form.tipo_periodicidad === 'unica';
        const payload = {
            titulo: this.form.titulo.trim(),
            descripcion: this.form.descripcion || null,
            id_tipo_grupo: this.form.id_tipo_grupo,
            fecha_inicio: this.form.fecha_inicio,
            fecha_fin: esUnica ? this.form.fecha_inicio : (this.form.fecha_fin || null),
            tipo_periodicidad: esUnica ? 'diaria' : this.form.tipo_periodicidad,
            dias_semana: null,
            cada_n_dias: null,
            intervalo_semanas: 1,
            hora_default: this.form.hora_default || '09:00',
            duracion_minutos: this.form.duracion_minutos || 60,
            tipos_actividad: [],
            invitados: []
        };

        this.guardando = true;
        try {
            const respuesta = await this.actividadesService.crearActividad(payload);
            respuesta.subscribe({
                next: (res) => {
                    this.guardando = false;
                    if (res.state === 'OK') {
                        this.modalVisible = false;
                        this.cargarMes();
                        Swal.fire('Listo', `Actividad programada (${res.body?.instancias_generadas ?? 0} instancias).`, 'success');
                    } else {
                        Swal.fire('Atención', res.msg, 'warning');
                    }
                },
                error: () => {
                    this.guardando = false;
                    Swal.fire('Error', 'No se pudo crear la actividad.', 'error');
                }
            });
        } catch {
            this.guardando = false;
        }
    }

    // ============ DETALLE / EJECUCIÓN ============
    abrirDetalle(instancia: any): void {
        this.instanciaDetalle = instancia;
        this.observacionesFinalizar = '';
        this.evidencias = [];
        this.detalleVisible = true;
    }

    cerrarDetalle(): void {
        this.detalleVisible = false;
        this.instanciaDetalle = null;
    }

    async iniciarActividad(): Promise<void> {
        if (!this.instanciaDetalle) return;
        await this.iniciarInstancia(this.instanciaDetalle);
        this.cerrarDetalle();
    }

    /** Acción rápida desde el cronograma: inicia sin abrir el detalle. */
    async iniciarRapido(instancia: any, event: Event): Promise<void> {
        event.stopPropagation();
        if (!instancia || instancia.estado !== 'programada') return;
        await this.iniciarInstancia(instancia);
    }

    /** Acción rápida desde el cronograma: abre el detalle para observaciones/evidencias. */
    finalizarRapido(instancia: any, event: Event): void {
        event.stopPropagation();
        this.abrirDetalle(instancia);
    }

    private async iniciarInstancia(instancia: any): Promise<void> {
        try {
            const respuesta = await this.actividadesService.iniciarActividad(instancia.id_instancia);
            const res = await firstValueFrom(respuesta);
            if (res.state === 'OK') {
                this.cargarMes();
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
        if (this.finalizando) return;

        this.finalizando = true;
        try {
            const respuesta = await this.actividadesService.finalizarActividad(
                this.instanciaDetalle.id_instancia,
                this.observacionesFinalizar,
                this.evidencias,
                []
            );
            respuesta.subscribe({
                next: (res) => {
                    this.finalizando = false;
                    if (res.state === 'OK') {
                        this.cerrarDetalle();
                        this.cargarMes();
                        Swal.fire('Listo', 'Actividad finalizada.', 'success');
                    } else {
                        Swal.fire('Atención', res.msg, 'warning');
                    }
                },
                error: () => {
                    this.finalizando = false;
                    Swal.fire('Error', 'No se pudo finalizar la actividad.', 'error');
                }
            });
        } catch {
            this.finalizando = false;
        }
    }

    // ============ UTILIDADES ============
    private construirCalendario(): void {
        const anio = this.mesActual.getFullYear();
        const mes = this.mesActual.getMonth();
        const primerDia = new Date(anio, mes, 1);
        const ultimoDia = new Date(anio, mes + 1, 0);
        const offset = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;
        const hoy = this.obtenerFechaHoy();

        const dias: DiaCalendario[] = [];

        for (let i = offset; i > 0; i--) {
            const fecha = new Date(anio, mes, 1 - i);
            dias.push(this.crearDia(fecha, false, hoy));
        }
        for (let d = 1; d <= ultimoDia.getDate(); d++) {
            dias.push(this.crearDia(new Date(anio, mes, d), true, hoy));
        }
        while (dias.length % 7 !== 0) {
            const ultimo = dias[dias.length - 1];
            const siguiente = this.parseFecha(ultimo.fecha);
            siguiente.setDate(siguiente.getDate() + 1);
            dias.push(this.crearDia(siguiente, false, hoy));
        }

        this.diasCalendario = dias;
    }

    private crearDia(fecha: Date, esMesActual: boolean, hoy: string): DiaCalendario {
        const iso = this.formatearISO(fecha);
        return {
            fecha: iso,
            dia: fecha.getDate(),
            esMesActual,
            esHoy: iso === hoy,
            esSeleccionado: iso === this.fechaSeleccionada,
            instancias: this.instanciasMes.filter(i => i.fecha === iso)
        };
    }

    private formularioVacio() {
        return {
            titulo: '',
            descripcion: '',
            id_tipo_grupo: null as number | null,
            fecha_inicio: this.obtenerFechaHoy(),
            fecha_fin: '',
            tipo_periodicidad: 'unica',
            hora_default: '09:00',
            duracion_minutos: 60
        };
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

    private obtenerFechaHoy(): string {
        return this.formatearISO(new Date());
    }
}
