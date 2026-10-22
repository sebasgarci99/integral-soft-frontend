import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { SgSstService } from '../../../services/sg-sst/sg-sst.service';
import { SgSstInstancia } from '../../../interfaces/sg-sst';
import { procesarImagenEvidencia } from '../../../utils/image-compress.util';

interface DiaCalendario {
    fecha: string;
    dia: number;
    esMesActual: boolean;
    esHoy: boolean;
    esSeleccionado: boolean;
    instancias: SgSstInstancia[];
}

interface EvidenciaLocal {
    dataUrl: string;
    base64: string;
    tipo: string;
    descripcion: string;
}

@Component({
    selector: 'app-sgsst-programador',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './programador.component.html',
    styleUrl: './programador.component.css'
})
export class SgSstProgramadorComponent implements OnInit, OnChanges {

    @Input() fecha = '';
    @Input() idCliente: number | null = null;
    @Input() idTipoGrupo: number | null = null;
    @Output() datosActualizados = new EventEmitter<void>();
    @Output() fechaChange = new EventEmitter<string>();

    readonly horas: number[] = Array.from({ length: 17 }, (_, i) => i + 6);

    mesActual: Date = new Date();
    diasCalendario: DiaCalendario[] = [];
    instanciasMes: SgSstInstancia[] = [];
    fechaSeleccionada = '';
    cargando = false;

    modalVisible = false;
    guardando = false;
    form = this.formularioVacio();

    detalleVisible = false;
    instanciaDetalle: SgSstInstancia | null = null;
    observaciones = '';
    evidencias: EvidenciaLocal[] = [];
    guardandoEjecucion = false;

    constructor(private sgSstService: SgSstService) {}

    ngOnInit(): void {
        this.fechaSeleccionada = this.fecha || this.formatearISO(new Date());
        const base = this.parseFecha(this.fechaSeleccionada);
        this.mesActual = new Date(base.getFullYear(), base.getMonth(), 1);
        this.cargarMes();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['idCliente'] || changes['idTipoGrupo']) {
            this.cargarMes();
        }
        if (changes['fecha'] && !changes['fecha'].firstChange && this.fecha) {
            this.fechaSeleccionada = this.fecha;
            const base = this.parseFecha(this.fecha);
            this.mesActual = new Date(base.getFullYear(), base.getMonth(), 1);
            this.cargarMes();
        }
    }

    get nombreMes(): string {
        return this.mesActual.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    }

    get tituloDia(): string {
        return this.parseFecha(this.fechaSeleccionada).toLocaleDateString('es-CO', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    get horaActual(): Date {
        return new Date();
    }

    get esHoySeleccionado(): boolean {
        return this.fechaSeleccionada === this.formatearISO(new Date());
    }

    get instanciasDelDiaSeleccionado(): SgSstInstancia[] {
        return this.instanciasMes.filter(i => i.fecha === this.fechaSeleccionada);
    }

    async cargarMes(): Promise<void> {
        if (!this.idCliente || !this.idTipoGrupo) return;
        const inicio = this.formatearISO(new Date(this.mesActual.getFullYear(), this.mesActual.getMonth(), 1));
        const fin = this.formatearISO(new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 0));

        this.cargando = true;
        try {
            const observable = await this.sgSstService.getProgramacion(
                this.idCliente, this.idTipoGrupo, inicio, fin
            );
            const res = await firstValueFrom(observable);
            this.instanciasMes = res.state === 'OK' ? (res.body || []) : [];
        } catch {
            this.instanciasMes = [];
        } finally {
            this.cargando = false;
            this.construirCalendario();
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
        if (!dia.esMesActual) {
            this.mesActual = new Date(this.parseFecha(dia.fecha).getFullYear(), this.parseFecha(dia.fecha).getMonth(), 1);
            this.fechaSeleccionada = dia.fecha;
            this.fechaChange.emit(dia.fecha);
            this.cargarMes();
            return;
        }
        this.fechaSeleccionada = dia.fecha;
        this.fechaChange.emit(dia.fecha);
        this.construirCalendario();
    }

    instanciasPorHora(hora: number): SgSstInstancia[] {
        return this.instanciasDelDiaSeleccionado.filter(i =>
            Number((i.hora_inicio || '00:00').split(':')[0]) === hora
        );
    }

    estadoLabel(estado: string): string {
        return estado === 'completada' ? 'Ejecutado' : 'Pendiente';
    }

    estadoColor(estado: string): string {
        return estado === 'completada' ? '#22c55e' : '#f59e0b';
    }

    formatearHora(hora?: string | null): string {
        if (!hora) return '';
        const [h, m] = hora.split(':').map(Number);
        const sufijo = h >= 12 ? 'PM' : 'AM';
        const hora12 = h % 12 === 0 ? 12 : h % 12;
        return `${hora12}:${String(m || 0).padStart(2, '0')} ${sufijo}`;
    }

    abrirModalCrear(): void {
        this.form = this.formularioVacio();
        this.form.fecha_inicio = this.fechaSeleccionada;
        this.modalVisible = true;
    }

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
        if (!this.idCliente || !this.idTipoGrupo || this.guardando) return;

        const esUnica = this.form.tipo_periodicidad === 'unica';
        this.guardando = true;
        try {
            const observable = await this.sgSstService.crearActividad(this.idCliente, this.idTipoGrupo, {
                titulo: this.form.titulo.trim(),
                descripcion: this.form.descripcion || null,
                fecha_inicio: this.form.fecha_inicio,
                fecha_fin: esUnica ? this.form.fecha_inicio : (this.form.fecha_fin || null),
                tipo_periodicidad: esUnica ? 'unica' : this.form.tipo_periodicidad,
                hora_default: this.form.hora_default || '09:00',
                duracion_minutos: this.form.duracion_minutos || 60
            });
            const res = await firstValueFrom(observable);
            if (res.state === 'OK') {
                this.modalVisible = false;
                await this.cargarMes();
                this.datosActualizados.emit();
                Swal.fire('Listo', `Actividad programada (${res.body?.instancias_generadas ?? 0} instancias).`, 'success');
            } else {
                Swal.fire('Atención', res.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo crear la actividad.', 'error');
        } finally {
            this.guardando = false;
        }
    }

    abrirDetalle(instancia: SgSstInstancia): void {
        this.instanciaDetalle = instancia;
        const ultimo = instancia.registros && instancia.registros.length > 0 ? instancia.registros[0] : null;
        this.observaciones = ultimo?.observaciones || '';
        this.evidencias = (ultimo?.evidencia || [])
            .filter(e => !!e.base64)
            .map(e => ({
                base64: e.base64 as string,
                dataUrl: `data:${e.tipo || 'image/jpeg'};base64,${e.base64}`,
                tipo: e.tipo || 'image/jpeg',
                descripcion: e.descripcion || ''
            }));
        this.detalleVisible = true;
    }

    cerrarDetalle(): void {
        this.detalleVisible = false;
        this.instanciaDetalle = null;
        this.observaciones = '';
        this.evidencias = [];
    }

    async onEvidenciaSeleccionada(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        if (this.evidencias.length >= 2) {
            Swal.fire('Límite alcanzado', 'Solo se permiten 2 evidencias por actividad.', 'info');
            input.value = '';
            return;
        }
        const file = input.files[0];
        input.value = '';
        try {
            const procesada = await procesarImagenEvidencia(file, { maxWidth: 1500, calidad: 0.6 });
            this.evidencias.push({
                dataUrl: procesada.dataUrl,
                base64: procesada.base64,
                tipo: procesada.mimeType,
                descripcion: ''
            });
        } catch {
            Swal.fire('Error', 'No se pudo procesar la imagen.', 'error');
        }
    }

    eliminarEvidencia(index: number): void {
        this.evidencias.splice(index, 1);
    }

    async guardarEjecucion(): Promise<void> {
        if (!this.instanciaDetalle || !this.idCliente || !this.idTipoGrupo) return;
        if (!this.observaciones.trim() && this.evidencias.length === 0) {
            Swal.fire('Atención', 'Ingresa observaciones o adjunta al menos una evidencia.', 'warning');
            return;
        }
        if (this.guardandoEjecucion) return;

        this.guardandoEjecucion = true;
        try {
            const observable = await this.sgSstService.ejecutarActividad(this.idCliente, this.idTipoGrupo, {
                id_instancia: this.instanciaDetalle.id_instancia,
                observaciones: this.observaciones,
                evidencias: this.evidencias.map(e => ({
                    tipo: e.tipo,
                    base64: e.base64,
                    descripcion: e.descripcion
                }))
            });
            const res = await firstValueFrom(observable);
            if (res.state === 'OK') {
                this.cerrarDetalle();
                await this.cargarMes();
                this.datosActualizados.emit();
                Swal.fire('Listo', 'Actividad marcada como ejecutada.', 'success');
            } else {
                Swal.fire('Atención', res.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo guardar la ejecución.', 'error');
        } finally {
            this.guardandoEjecucion = false;
        }
    }

    private construirCalendario(): void {
        const anio = this.mesActual.getFullYear();
        const mes = this.mesActual.getMonth();
        const primerDia = new Date(anio, mes, 1);
        const ultimoDia = new Date(anio, mes + 1, 0);
        const offset = primerDia.getDay();
        const hoy = this.formatearISO(new Date());
        const dias: DiaCalendario[] = [];

        for (let i = offset; i > 0; i--) {
            dias.push(this.crearDia(new Date(anio, mes, 1 - i), false, hoy));
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
            fecha_inicio: this.formatearISO(new Date()),
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
}
