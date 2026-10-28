import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, Subscription, debounceTime, defer, distinctUntilChanged, firstValueFrom, from, map, merge, of, switchMap } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import Swal from 'sweetalert2';
import { SgSstService } from '../../../services/sg-sst/sg-sst.service';
import { SgSstPermissionsService } from '../../../services/sg-sst/sg-sst-permissions.service';
import {
    SgSstBitacora,
    SgSstBitacoraEvento,
    SgSstSolicitudReapertura,
    SgSstEvidencia,
    SgSstInstancia,
    SgSstTarea
} from '../../../interfaces/sg-sst';
import { procesarImagenEvidencia } from '../../../utils/image-compress.util';

interface GrupoTareas {
    fecha: string;
    etiqueta: string;
    tareas: SgSstTarea[];
    esHoy: boolean;
}

interface FormActividadRapida {
    titulo: string;
    descripcion: string;
    fecha: Date | null;
    hora: Date | null;
    duracion: number;
    periodicidad: string;
}

@Component({
    selector: 'app-sgsst-bitacora',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DialogModule,
        CalendarModule,
        DropdownModule,
        InputNumberModule,
        InputTextModule,
        InputTextarea,
        ButtonModule
    ],
    templateUrl: './bitacora.component.html',
    styleUrl: './bitacora.component.css'
})
export class SgSstBitacoraComponent implements OnInit, OnChanges, OnDestroy {

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
    idRol = 0;
    eventos: SgSstBitacoraEvento[] = [];
    solicitudPendiente: SgSstSolicitudReapertura | null = null;
    modalHistorialVisible = false;
    procesandoReapertura = false;

    gruposExpandidos: Record<string, boolean> = {};
    modalActividadVisible = false;
    guardandoActividad = false;
    formActividad: FormActividadRapida = this.formularioActividadVacio();

    readonly opcionesPeriodicidad = [
        { label: 'Única', value: 'unica' },
        { label: 'Diaria', value: 'diaria' },
        { label: 'Semanal', value: 'semanal' },
        { label: 'Quincenal', value: 'quincenal' },
        { label: 'Mensual', value: 'mensual' }
    ];

    cargando = false;
    guardando = false;
    cerrando = false;
    compilando = false;
    subiendoEvidencia = false;

    private readonly marcadorAutoInicio = '--- RESUMEN AUTOMÁTICO SG-SST ---';
    private readonly marcadorAutoFin = '--- FIN RESUMEN AUTOMÁTICO ---';

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

    constructor(
        private sgSstService: SgSstService,
        private permisos: SgSstPermissionsService
    ) {
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

    async ngOnInit(): Promise<void> {
        this.idRol = await this.permisos.cargar();
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

    get esReabierta(): boolean {
        return this.bitacora?.estado === 'reabierta';
    }

    get puedeEditar(): boolean {
        return !this.esCerrada;
    }

    get puedeReabrirBitacora(): boolean {
        return this.permisos.puedeReabrirBitacora;
    }

    get puedeSolicitarReapertura(): boolean {
        return this.permisos.puedeSolicitarReapertura;
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
        if (this.esCerrada) return 'Cerrada';
        if (this.esReabierta) return 'Reabierta';
        return 'En borrador';
    }

    get proximaActividad(): SgSstInstancia | null {
        return this.instancias.find(i => i.estado !== 'completada') || null;
    }

    get gruposTareas(): GrupoTareas[] {
        const mapa = new Map<string, SgSstTarea[]>();
        this.tareas.forEach(tarea => {
            const fecha = tarea.fecha || this.fecha;
            const lista = mapa.get(fecha) || [];
            lista.push(tarea);
            mapa.set(fecha, lista);
        });

        return Array.from(mapa.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([fecha, tareas]) => ({
                fecha,
                etiqueta: this.etiquetaFecha(fecha),
                tareas,
                esHoy: fecha === this.fecha
            }));
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
                this.eventos = res.body.eventos || [];
                this.solicitudPendiente = res.body.solicitud_pendiente || null;
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
                const bloque = `${this.marcadorAutoInicio}\n${res.body.texto.trim()}\n${this.marcadorAutoFin}`;
                const inicio = this.resumen.indexOf(this.marcadorAutoInicio);
                const fin = this.resumen.indexOf(this.marcadorAutoFin);

                if (inicio >= 0 && fin > inicio) {
                    const antes = this.resumen.slice(0, inicio).trim();
                    const despues = this.resumen.slice(fin + this.marcadorAutoFin.length).trim();
                    this.resumen = [antes, bloque, despues].filter(Boolean).join('\n\n');
                } else {
                    this.resumen = this.resumen.trim()
                        ? `${this.resumen.trimEnd()}\n\n${bloque}`
                        : bloque;
                }

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
                this.solicitudPendiente = null;
                await this.cargarHistorial();
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

    async reabrirBitacora(): Promise<void> {
        if (!this.puedeReabrirBitacora || !this.bitacora?.id_bitacora || !this.idCliente || !this.idTipoGrupo) return;
        const resultado = await Swal.fire({
            title: 'Reabrir bitácora',
            text: 'Indica el motivo por el cual se reabre esta bitácora.',
            input: 'textarea',
            inputPlaceholder: 'Motivo de la reapertura (mínimo 10 caracteres)',
            inputValidator: (value) => !value || value.trim().length < 10
                ? 'El motivo debe tener al menos 10 caracteres.'
                : null,
            showCancelButton: true,
            confirmButtonText: 'Sí, reabrir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0f766e'
        });
        if (!resultado.isConfirmed) return;

        this.procesandoReapertura = true;
        try {
            const observable = await this.sgSstService.reabrirBitacora(
                this.idCliente, this.idTipoGrupo, this.bitacora.id_bitacora, String(resultado.value || '').trim()
            );
            const res = await firstValueFrom(observable);
            if (res.state === 'OK') {
                await this.cargar();
                this.datosActualizados.emit();
                Swal.fire('Bitácora reabierta', 'La bitácora volvió a estar editable.', 'success');
            } else {
                Swal.fire('Atención', res.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo reabrir la bitácora.', 'error');
        } finally {
            this.procesandoReapertura = false;
        }
    }

    async solicitarReapertura(): Promise<void> {
        if (!this.puedeSolicitarReapertura || !this.bitacora?.id_bitacora || !this.idCliente || !this.idTipoGrupo) return;
        const resultado = await Swal.fire({
            title: 'Solicitar reapertura',
            text: 'Un administrador revisará tu solicitud.',
            input: 'textarea',
            inputPlaceholder: 'Motivo de la reapertura (mínimo 10 caracteres)',
            inputValidator: (value) => !value || value.trim().length < 10
                ? 'El motivo debe tener al menos 10 caracteres.'
                : null,
            showCancelButton: true,
            confirmButtonText: 'Enviar solicitud',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0d8aa6'
        });
        if (!resultado.isConfirmed) return;

        this.procesandoReapertura = true;
        try {
            const observable = await this.sgSstService.solicitarReapertura(
                this.idCliente, this.idTipoGrupo, this.bitacora.id_bitacora, String(resultado.value || '').trim()
            );
            const res = await firstValueFrom(observable);
            if (res.state === 'OK') {
                this.solicitudPendiente = res.body;
                await this.cargarHistorial();
                Swal.fire('Solicitud enviada', 'El administrador recibirá la solicitud en sus notificaciones.', 'success');
            } else {
                Swal.fire('Atención', res.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo enviar la solicitud.', 'error');
        } finally {
            this.procesandoReapertura = false;
        }
    }

    async cargarHistorial(): Promise<void> {
        if (!this.bitacora?.id_bitacora || !this.idCliente || !this.idTipoGrupo) {
            this.eventos = [];
            return;
        }
        try {
            const observable = await this.sgSstService.getEventosBitacora(
                this.idCliente, this.idTipoGrupo, this.bitacora.id_bitacora
            );
            const res = await firstValueFrom(observable);
            this.eventos = res.state === 'OK' ? (res.body || []) : [];
        } catch {
            this.eventos = [];
        }
    }

    abrirHistorial(): void {
        this.cargarHistorial();
        this.modalHistorialVisible = true;
    }

    cerrarHistorial(): void {
        this.modalHistorialVisible = false;
    }

    formatearAccion(accion: string): string {
        const etiquetas: Record<string, string> = {
            creacion: 'Creación',
            edicion: 'Edición',
            cierre: 'Cierre',
            cierre_final: 'Cierre después de reapertura',
            reapertura: 'Reapertura',
            solicitud_reapertura: 'Solicitud de reapertura',
            rechazo_reapertura: 'Rechazo de reapertura'
        };
        return etiquetas[accion] || accion;
    }

    formatearFechaEvento(fecha: string): string {
        if (!fecha) return '';
        return new Date(fecha).toLocaleString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
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
        const esPdf = file.type === 'application/pdf';
        if (esPdf && file.size > 5 * 1024 * 1024) {
            Swal.fire('Archivo muy grande', 'El PDF supera el límite de 5 MB.', 'warning');
            return;
        }

        this.subiendoEvidencia = true;
        try {
            const idBitacora = await this.asegurarBitacora();
            if (!idBitacora) return;

            if (esPdf) {
                const base64 = await this.leerArchivoBase64(file);
                const observable = await this.sgSstService.subirEvidencia(this.idCliente, this.idTipoGrupo, {
                    id_bitacora: idBitacora,
                    archivo_base64: base64,
                    nombre_original: file.name,
                    mime_type: 'application/pdf',
                    descripcion: ''
                });
                const res = await firstValueFrom(observable);
                if (res.state === 'OK' && res.body) {
                    this.evidencias.push(res.body);
                    this.datosActualizados.emit();
                } else {
                    Swal.fire('Atención', res.msg, 'warning');
                }
                return;
            }

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
            Swal.fire('Error', 'No se pudo procesar el archivo.', 'error');
        } finally {
            this.subiendoEvidencia = false;
        }
    }

    esPdf(evidencia: SgSstEvidencia): boolean {
        return evidencia.mime_type === 'application/pdf';
    }

    async verEvidencia(evidencia: SgSstEvidencia): Promise<void> {
        let base64 = evidencia.archivo_base64 || '';
        const mime = evidencia.mime_type || 'image/jpeg';

        if (!base64) {
            if (!evidencia.id_evidencia || !this.bitacora?.id_bitacora || !this.idCliente || !this.idTipoGrupo) return;
            const observable = await this.sgSstService.getEvidencias(
                this.idCliente, this.idTipoGrupo, this.bitacora.id_bitacora
            );
            const res = await firstValueFrom(observable);
            if (res.state === 'OK' && res.body) {
                const encontrada = res.body.find(e => e.id_evidencia === evidencia.id_evidencia);
                base64 = encontrada?.archivo_base64 || '';
            }
        }

        if (!base64) return;

        if (mime === 'application/pdf') {
            const binario = atob(base64);
            const bytes = new Uint8Array(binario.length);
            for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 60000);
            return;
        }

        this.imagenAmpliada = `data:${mime};base64,${base64}`;
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
    etiquetaFecha(fecha: string): string {
        if (!fecha) return '';
        if (fecha === this.fecha) return 'Hoy';
        const hoy = this.formatearISO(new Date());
        if (fecha === hoy) return 'Hoy';
        const diff = this.diferenciaDias(fecha, hoy);
        if (diff === 1) return 'Ayer';
        if (diff > 1 && diff <= 6) return `Hace ${diff} días`;

        const date = this.parseFecha(fecha);
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const anio = date.getFullYear() !== new Date().getFullYear() ? ` ${date.getFullYear()}` : '';
        return `${date.getDate()} De ${meses[date.getMonth()]}${anio}`;
    }

    toggleGrupo(fecha: string): void {
        this.gruposExpandidos[fecha] = !this.esGrupoExpandido(fecha);
    }

    esGrupoExpandido(fecha: string): boolean {
        if (this.gruposExpandidos[fecha] === undefined) {
            return fecha === this.fecha;
        }
        return this.gruposExpandidos[fecha];
    }

    abrirModalActividad(): void {
        this.formActividad = this.formularioActividadVacio();
        this.modalActividadVisible = true;
    }

    cerrarModalActividad(): void {
        this.modalActividadVisible = false;
    }

    async programarActividad(): Promise<void> {
        if (!this.idCliente || !this.idTipoGrupo || this.guardandoActividad) return;
        if (!this.formActividad.titulo.trim()) {
            Swal.fire('Datos incompletos', 'El título de la actividad es obligatorio.', 'warning');
            return;
        }
        if (!this.formActividad.fecha || !this.formActividad.hora) {
            Swal.fire('Datos incompletos', 'Selecciona la fecha y la hora de la actividad.', 'warning');
            return;
        }

        const fechaISO = this.formatearISO(this.formActividad.fecha);
        const hora = `${String(this.formActividad.hora.getHours()).padStart(2, '0')}:${String(this.formActividad.hora.getMinutes()).padStart(2, '0')}`;

        this.guardandoActividad = true;
        try {
            const observable = await this.sgSstService.crearActividad(this.idCliente, this.idTipoGrupo, {
                titulo: this.formActividad.titulo.trim(),
                descripcion: this.formActividad.descripcion || null,
                fecha_inicio: fechaISO,
                fecha_fin: this.formActividad.periodicidad === 'unica' ? fechaISO : null,
                tipo_periodicidad: this.formActividad.periodicidad,
                hora_default: hora,
                duracion_minutos: this.formActividad.duracion || 60
            });
            const res = await firstValueFrom(observable);
            if (res.state === 'OK') {
                this.cerrarModalActividad();
                await this.guardarCompleta();
                await this.cargar();
                this.datosActualizados.emit();
                Swal.fire('Listo', 'Actividad programada correctamente.', 'success');
            } else {
                Swal.fire('Atención', res.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo programar la actividad.', 'error');
        } finally {
            this.guardandoActividad = false;
        }
    }

    private formularioActividadVacio(): FormActividadRapida {
        const fecha = this.fecha ? this.parseFecha(this.fecha) : new Date();
        const hora = new Date(fecha);
        hora.setHours(9, 0, 0, 0);
        return {
            titulo: '',
            descripcion: '',
            fecha,
            hora,
            duracion: 60,
            periodicidad: 'unica'
        };
    }

    private leerArchivoBase64(archivo: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const lector = new FileReader();
            lector.onload = () => {
                const resultado = String(lector.result || '');
                resolve(resultado.includes('base64,') ? resultado.split('base64,')[1] : resultado);
            };
            lector.onerror = () => reject(new Error('No se pudo leer el archivo'));
            lector.readAsDataURL(archivo);
        });
    }

    private diferenciaDias(desde: string, hasta: string): number {
        const a = this.parseFecha(desde).getTime();
        const b = this.parseFecha(hasta).getTime();
        return Math.round((b - a) / 86400000);
    }

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
        this.eventos = [];
        this.solicitudPendiente = null;
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
