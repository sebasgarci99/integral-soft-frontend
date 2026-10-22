import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, Subscription, debounceTime, defer, distinctUntilChanged, firstValueFrom, from, map, merge, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import { SgSstService } from '../../../services/sg-sst/sg-sst.service';
import {
    SgSstBitacora,
    SgSstEvidencia,
    SgSstInstancia,
    SgSstTarea
} from '../../../interfaces/sg-sst';
import { procesarImagenEvidencia } from '../../../utils/image-compress.util';

@Component({
    selector: 'app-sgsst-bitacora',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './bitacora.component.html',
    styleUrl: './bitacora.component.css'
})
export class SgSstBitacoraComponent implements OnChanges, OnDestroy {

    @Input() fecha = '';
    @Input() idCliente: number | null = null;
    @Input() idTipoGrupo: number | null = null;
    @Input() nombreGrupo = '';
    @Output() fechaChange = new EventEmitter<string>();
    @Output() datosActualizados = new EventEmitter<void>();
    @Output() guardadoSilencioso = new EventEmitter<{ fecha: string; tieneResumen: boolean; estado: string }>();

    bitacora: SgSstBitacora | null = null;
    evidencias: SgSstEvidencia[] = [];
    tareas: SgSstTarea[] = [];
    instancias: SgSstInstancia[] = [];
    resumen = '';
    nuevaTarea = '';

    cargando = false;
    guardando = false;
    cerrando = false;
    compilando = false;
    subiendoEvidencia = false;

    estadoGuardado: 'idle' | 'guardando' | 'guardado' | 'error' = 'idle';
    ultimaVezGuardado: Date | null = null;
    imagenAmpliada: string | null = null;

    kpis = {
        planificadas: 0,
        ejecutadas: 0,
        cumplimiento: 0,
        horasCampo: 0,
        tareasTotal: 0,
        tareasCompletadas: 0
    };

    private cambiosResumen = new Subject<string>();
    private flushResumen = new Subject<void>();
    private autosaveSub?: Subscription;
    private resumenListo = false;
    private ultimoTextoGuardado = '';

    constructor(private sgSstService: SgSstService) {
        this.autosaveSub = merge(
            this.cambiosResumen.pipe(debounceTime(1500), distinctUntilChanged()),
            this.flushResumen.pipe(map(() => this.resumen))
        ).pipe(
            switchMap(texto => this.guardarParcial(texto))
        ).subscribe({
            next: (res) => {
                if (res.state === 'OK' && res.body) {
                    if (this.bitacora) {
                        this.bitacora.id_bitacora = res.body.id_bitacora;
                    } else {
                        this.bitacora = {
                            id_bitacora: res.body.id_bitacora,
                            fecha: this.fecha,
                            id_cliente: this.idCliente,
                            id_tipo_grupo: this.idTipoGrupo,
                            resumen: res.body.resumen,
                            planificadas: 0,
                            cumplimiento: 0,
                            horas_campo: 0,
                            total_novedades: 0,
                            estado: 'borrador'
                        };
                    }
                    this.ultimoTextoGuardado = res.body.resumen;
                    this.estadoGuardado = 'guardado';
                    this.ultimaVezGuardado = new Date();
                    this.guardadoSilencioso.emit({
                        fecha: this.fecha,
                        tieneResumen: String(res.body.resumen || '').trim().length > 0,
                        estado: res.body.estado
                    });
                } else {
                    this.estadoGuardado = 'error';
                }
            },
            error: () => {
                this.estadoGuardado = 'error';
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['fecha'] || changes['idCliente'] || changes['idTipoGrupo']) {
            this.cargar();
        }
    }

    ngOnDestroy(): void {
        if (this.resumenListo && this.resumen !== this.ultimoTextoGuardado && !this.esCerrada) {
            this.guardarResumenAhora();
        }
        this.autosaveSub?.unsubscribe();
    }

    get fechaLarga(): string {
        return this.parseFecha(this.fecha).toLocaleDateString('es-CO', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    get esCerrada(): boolean {
        return this.bitacora?.estado === 'cerrada';
    }

    get etiquetaGuardado(): string {
        switch (this.estadoGuardado) {
            case 'guardando': return '';
            case 'guardado': return `Guardado ${this.ultimaVezGuardado?.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) || ''}`;
            case 'error': return 'Error al guardar, se reintentará al escribir';
            default: return 'Autoguardado activo';
        }
    }

    get estadoBitacora(): string {
        if (!this.bitacora) return 'Sin iniciar';
        return this.esCerrada ? 'Cerrada' : 'En borrador';
    }

    get proximaActividad(): SgSstInstancia | null {
        return this.instancias.find(i => i.estado !== 'completada') || null;
    }

    async cargar(): Promise<void> {
        if (!this.idCliente || !this.idTipoGrupo || !this.fecha) return;
        this.cargando = true;
        this.resumenListo = false;
        try {
            const observable = await this.sgSstService.getBitacora(this.idCliente, this.idTipoGrupo, this.fecha);
            const res = await firstValueFrom(observable);
            if (res.state === 'OK' && res.body) {
                this.bitacora = res.body.bitacora;
                this.evidencias = res.body.evidencias || [];
                this.tareas = res.body.tareas || [];
                this.instancias = res.body.instancias || [];
                this.resumen = this.bitacora?.resumen || '';
                this.ultimoTextoGuardado = this.resumen;
            } else {
                this.limpiar();
            }
            this.calcularKpis();
            this.estadoGuardado = 'idle';
        } catch {
            this.limpiar();
            Swal.fire('Error', 'No se pudo cargar la bitácora.', 'error');
        } finally {
            this.cargando = false;
            this.resumenListo = true;
        }
    }

    onResumenChange(valor: string): void {
        this.resumen = valor;
        if (!this.resumenListo || this.esCerrada) return;
        this.estadoGuardado = 'guardando';
        this.cambiosResumen.next(valor);
    }

    flush(): void {
        if (!this.resumenListo || this.esCerrada) return;
        this.flushResumen.next();
    }

    async guardarBorrador(): Promise<void> {
        if (this.guardando || this.esCerrada) return;
        this.guardando = true;
        try {
            const res = await this.guardarCompleta();
            if (res) {
                Swal.fire('Guardado', 'La bitácora quedó en borrador.', 'success');
            }
        } catch {
            Swal.fire('Error', 'No se pudo guardar la bitácora.', 'error');
        } finally {
            this.guardando = false;
        }
    }

    async compilarResumen(): Promise<void> {
        if (this.compilando || this.esCerrada || !this.idCliente || !this.idTipoGrupo) return;
        this.compilando = true;
        try {
            const observable = await this.sgSstService.generarResumen(
                this.idCliente, this.idTipoGrupo, this.fecha
            );
            const res = await firstValueFrom(observable);
            if (res.state === 'OK' && res.body) {
                this.resumen = res.body.texto;
                this.kpis.planificadas = res.body.planificadas;
                this.kpis.cumplimiento = Math.round(res.body.cumplimiento);
                this.kpis.horasCampo = res.body.horas_campo;
                this.kpis.tareasCompletadas = res.body.tareas_completadas;
                this.kpis.tareasTotal = res.body.tareas_completadas + res.body.tareas_pendientes;
                this.estadoGuardado = 'guardando';
                this.cambiosResumen.next(this.resumen);
            } else {
                Swal.fire('Atención', res.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo compilar el resumen.', 'error');
        } finally {
            this.compilando = false;
        }
    }

    async cerrarBitacora(): Promise<void> {
        if (this.cerrando || this.esCerrada) return;
        if (this.tareas.some(t => !t.id_tarea)) {
            Swal.fire('Atención', 'Guarda las tareas pendientes antes de cerrar.', 'warning');
            return;
        }

        const confirmacion = await Swal.fire({
            title: '¿Cerrar la bitácora?',
            text: 'Una vez cerrada no podrá editarse.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, cerrar bitácora',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0f766e'
        });
        if (!confirmacion.isConfirmed) return;

        this.cerrando = true;
        try {
            const guardada = await this.guardarCompleta();
            if (!guardada?.id_bitacora || !this.idCliente || !this.idTipoGrupo) return;

            const observable = await this.sgSstService.cerrarBitacora(
                this.idCliente, this.idTipoGrupo, guardada.id_bitacora
            );
            const res = await firstValueFrom(observable);
            if (res.state === 'OK') {
                this.bitacora = res.body;
                this.datosActualizados.emit();
                Swal.fire('Bitácora cerrada', 'La jornada quedó cerrada.', 'success');
            } else {
                Swal.fire('Atención', res.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo cerrar la bitácora.', 'error');
        } finally {
            this.cerrando = false;
        }
    }

    // ============ Evidencias ============
    async onEvidenciaSeleccionada(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        if (this.evidencias.length >= 3) {
            Swal.fire('Límite alcanzado', 'Solo se permiten 3 evidencias por bitácora.', 'info');
            input.value = '';
            return;
        }
        if (!this.idCliente || !this.idTipoGrupo) return;

        const file = input.files[0];
        input.value = '';
        this.subiendoEvidencia = true;
        try {
            const idBitacora = await this.asegurarBitacora();
            if (!idBitacora) return;

            const procesada = await procesarImagenEvidencia(file, { maxWidth: 1600, calidad: 0.6 });
            const observable = await this.sgSstService.subirEvidencia(this.idCliente, this.idTipoGrupo, {
                id_bitacora: idBitacora,
                archivo_base64: procesada.base64,
                thumb_base64: procesada.thumbBase64,
                nombre_original: file.name,
                mime_type: procesada.mimeType,
                descripcion: ''
            });
            const res = await firstValueFrom(observable);
            if (res.state === 'OK' && res.body) {
                this.evidencias.push(res.body);
                this.datosActualizados.emit();
            } else {
                Swal.fire('Atención', res.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo procesar la imagen.', 'error');
        } finally {
            this.subiendoEvidencia = false;
        }
    }

    async verEvidencia(evidencia: SgSstEvidencia): Promise<void> {
        if (evidencia.archivo_base64) {
            this.imagenAmpliada = `data:${evidencia.mime_type || 'image/jpeg'};base64,${evidencia.archivo_base64}`;
            return;
        }
        if (!evidencia.id_evidencia || !this.bitacora?.id_bitacora || !this.idCliente || !this.idTipoGrupo) return;

        const observable = await this.sgSstService.getEvidencias(
            this.idCliente, this.idTipoGrupo, this.bitacora.id_bitacora
        );
        const res = await firstValueFrom(observable);
        if (res.state === 'OK' && res.body) {
            const encontrada = res.body.find(e => e.id_evidencia === evidencia.id_evidencia);
            if (encontrada?.archivo_base64) {
                this.imagenAmpliada = `data:${encontrada.mime_type || 'image/jpeg'};base64,${encontrada.archivo_base64}`;
            }
        }
    }

    cerrarImagen(): void {
        this.imagenAmpliada = null;
    }

    async eliminarEvidencia(evidencia: SgSstEvidencia, index: number): Promise<void> {
        if (!evidencia.id_evidencia || !this.idCliente || !this.idTipoGrupo) return;
        const observable = await this.sgSstService.eliminarEvidencia(
            this.idCliente, this.idTipoGrupo, evidencia.id_evidencia
        );
        const res = await firstValueFrom(observable);
        if (res.state === 'OK') {
            this.evidencias.splice(index, 1);
            this.datosActualizados.emit();
        }
    }

    miniatura(evidencia: SgSstEvidencia): string {
        return evidencia.thumb_base64
            ? `data:${evidencia.mime_type || 'image/jpeg'};base64,${evidencia.thumb_base64}`
            : '';
    }

    formatearPeso(bytes?: number | null): string {
        if (!bytes) return '';
        return `${(bytes / 1024).toFixed(0)} KB`;
    }

    // ============ To-Do ============
    async agregarTarea(): Promise<void> {
        const titulo = this.nuevaTarea.trim();
        if (!titulo || !this.idCliente || !this.idTipoGrupo) return;
        try {
            const observable = await this.sgSstService.crearTarea(
                this.idCliente, this.idTipoGrupo, titulo, this.fecha
            );
            const res = await firstValueFrom(observable);
            if (res.state === 'OK' && res.body) {
                this.tareas = [res.body, ...this.tareas];
                this.nuevaTarea = '';
                this.calcularKpis();
                this.datosActualizados.emit();
            }
        } catch {
            Swal.fire('Error', 'No se pudo crear la tarea.', 'error');
        }
    }

    async toggleTarea(tarea: SgSstTarea): Promise<void> {
        if (!tarea.id_tarea || !this.idCliente || !this.idTipoGrupo) return;
        const nuevo = !tarea.completada;
        tarea.completada = nuevo;
        try {
            const observable = await this.sgSstService.toggleTarea(
                this.idCliente, this.idTipoGrupo, tarea.id_tarea, nuevo
            );
            const res = await firstValueFrom(observable);
            if (res.state !== 'OK') {
                tarea.completada = !nuevo;
            } else {
                this.calcularKpis();
                this.datosActualizados.emit();
            }
        } catch {
            tarea.completada = !nuevo;
        }
    }

    async eliminarTarea(tarea: SgSstTarea): Promise<void> {
        if (!tarea.id_tarea || !this.idCliente || !this.idTipoGrupo) return;
        const observable = await this.sgSstService.eliminarTarea(
            this.idCliente, this.idTipoGrupo, tarea.id_tarea
        );
        const res = await firstValueFrom(observable);
        if (res.state === 'OK') {
            this.tareas = this.tareas.filter(t => t.id_tarea !== tarea.id_tarea);
            this.calcularKpis();
            this.datosActualizados.emit();
        }
    }

    // ============ Navegación ============
    cambiarFecha(dias: number): void {
        this.flush();
        const date = this.parseFecha(this.fecha);
        date.setDate(date.getDate() + dias);
        this.fechaChange.emit(this.formatearISO(date));
    }

    estadoActividad(estado: string): string {
        return estado === 'completada' ? 'Ejecutado' : 'Pendiente';
    }

    estadoActividadColor(estado: string): string {
        return estado === 'completada' ? '#22c55e' : '#f59e0b';
    }

    formatearHora(hora?: string | null): string {
        if (!hora) return '';
        const [h, m] = hora.split(':').map(Number);
        const sufijo = h >= 12 ? 'PM' : 'AM';
        const hora12 = h % 12 === 0 ? 12 : h % 12;
        return `${hora12}:${String(m || 0).padStart(2, '0')} ${sufijo}`;
    }

    // ============ Internos ============
    private guardarParcial(texto: string): Observable<any> {
        if (!this.idCliente || !this.idTipoGrupo) {
            return of({ state: 'OK', body: null });
        }
        return defer(() => from(this.sgSstService.guardarResumenParcial(
            this.idCliente as number,
            this.idTipoGrupo as number,
            this.fecha,
            texto,
            this.bitacora?.id_bitacora
        ))).pipe(switchMap(observable => observable));
    }

    private async guardarCompleta(): Promise<SgSstBitacora | null> {
        if (!this.idCliente || !this.idTipoGrupo) return null;
        const observable = await this.sgSstService.guardarBitacora(this.idCliente, this.idTipoGrupo, {
            id_bitacora: this.bitacora?.id_bitacora,
            fecha: this.fecha,
            resumen: this.resumen,
            planificadas: this.kpis.planificadas,
            cumplimiento: this.kpis.cumplimiento,
            horas_campo: this.kpis.horasCampo
        });
        const res = await firstValueFrom(observable);
        if (res.state === 'OK' && res.body) {
            this.bitacora = res.body;
            this.ultimoTextoGuardado = this.resumen;
            this.estadoGuardado = 'guardado';
            this.ultimaVezGuardado = new Date();
            this.datosActualizados.emit();
            return res.body;
        }
        return null;
    }

    private async asegurarBitacora(): Promise<number | null> {
        if (this.bitacora?.id_bitacora) return this.bitacora.id_bitacora;
        const guardada = await this.guardarCompleta();
        return guardada?.id_bitacora ?? null;
    }

    private guardarResumenAhora(): void {
        if (!this.idCliente || !this.idTipoGrupo) return;
        this.sgSstService.guardarResumenParcial(
            this.idCliente, this.idTipoGrupo, this.fecha, this.resumen, this.bitacora?.id_bitacora
        ).then(obs => obs.subscribe({
            next: (res) => {
                if (res.state === 'OK' && res.body) {
                    this.ultimoTextoGuardado = res.body.resumen;
                    this.estadoGuardado = 'guardado';
                    this.ultimaVezGuardado = new Date();
                }
            }
        })).catch(() => { this.estadoGuardado = 'error'; });
    }

    private calcularKpis(): void {
        const ejecutadas = this.instancias.filter(i => i.estado === 'completada');
        const planificadas = this.instancias.filter(i => i.estado !== 'cancelada');
        this.kpis.planificadas = planificadas.length;
        this.kpis.ejecutadas = ejecutadas.length;
        this.kpis.cumplimiento = planificadas.length > 0
            ? Math.round((ejecutadas.length / planificadas.length) * 100)
            : 0;
        const minutos = ejecutadas.reduce((acc, i) => acc + Number(i.actividad?.duracion_minutos ?? 0), 0);
        this.kpis.horasCampo = Math.round((minutos / 60) * 10) / 10;
        this.kpis.tareasTotal = this.tareas.length;
        this.kpis.tareasCompletadas = this.tareas.filter(t => t.completada).length;
    }

    private limpiar(): void {
        this.bitacora = null;
        this.evidencias = [];
        this.tareas = [];
        this.instancias = [];
        this.resumen = '';
        this.ultimoTextoGuardado = '';
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
