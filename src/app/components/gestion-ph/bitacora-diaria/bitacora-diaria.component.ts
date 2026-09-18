import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { GestionPhService } from '../../../services/gestion-ph/gestion-ph.service';
import { ActividadesService } from '../../../services/actividades/actividades.service';
import { AgendaTodo, BitacoraDiaria, BitacoraEvidencia, BitacoraNovedad } from '../../../interfaces/gestion-ph';
import { procesarImagenEvidencia } from '../../../utils/image-compress.util';

@Component({
    selector: 'app-bitacora-diaria',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './bitacora-diaria.component.html',
    styleUrl: './bitacora-diaria.component.css'
})
export class BitacoraDiariaComponent implements OnInit, OnChanges {

    @Input() fecha: string = '';
    @Input() idTipoGrupo: number | null = null;
    @Input() nombreGrupo: string = 'TODOS LOS GRUPOS';
    @Output() fechaChange = new EventEmitter<string>();

    bitacora: BitacoraDiaria | null = null;
    novedades: BitacoraNovedad[] = [];
    evidencias: BitacoraEvidencia[] = [];
    evidenciasActividades: any[] = [];
    tareas: AgendaTodo[] = [];
    instanciasDia: any[] = [];
    resumen = '';

    kpis = {
        planificadas: 0,
        actividadesCompletadas: 0,
        cumplimiento: 0,
        horasCampo: 0,
        novedades: 0,
        todoTotal: 0,
        todoCompletadas: 0,
        todoCumplimiento: 0
    };

    cargando = false;
    guardando = false;
    cerrando = false;
    subiendoEvidencia = false;
    compilando = false;

    imagenAmpliada: string | null = null;

    constructor(
        private gestionPhService: GestionPhService,
        private actividadesService: ActividadesService
    ) {}

    ngOnInit(): void {
        // La carga inicial la dispara ngOnChanges con los inputs ya enlazados.
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['fecha'] || changes['idTipoGrupo']) {
            this.cargar();
        }
    }

    get fechaLarga(): string {
        const date = new Date(`${this.fecha}T00:00:00`);
        return date.toLocaleDateString('es-CO', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    get esCerrada(): boolean {
        return this.bitacora?.estado === 'cerrada';
    }

    async cargar(): Promise<void> {
        if (!this.fecha) return;
        this.cargando = true;
        try {
            const respuesta = await this.gestionPhService.getBitacora(this.fecha, this.idTipoGrupo);
            const res = await firstValueFrom(respuesta);
            if (res.state === 'OK' && res.body) {
                this.bitacora = res.body.bitacora || null;
                this.novedades = res.body.novedades || [];
                this.evidencias = res.body.evidencias || [];
                this.tareas = res.body.tareas || [];
                this.resumen = this.bitacora?.resumen || '';
            } else {
                this.bitacora = null;
                this.novedades = [];
                this.evidencias = [];
                this.tareas = [];
                this.resumen = '';
            }
            this.kpis.novedades = this.novedades.length;
            this.calcularKpisTareas();
            await this.calcularKpisActividades();
            await this.cargarEvidenciasActividades();
        } catch {
            Swal.fire('Error', 'No se pudo cargar la bitácora.', 'error');
        } finally {
            this.cargando = false;
        }
    }

    private async calcularKpisActividades(): Promise<void> {
        try {
            const respuesta = await this.actividadesService.getActividadesCalendario(
                this.fecha, this.fecha, true, this.idTipoGrupo
            );
            const res = await firstValueFrom(respuesta);
            const instancias: any[] = res.state === 'OK' ? (res.body || []) : [];

            const noCanceladas = instancias.filter(i => i.estado !== 'cancelada');
            const completadas = instancias.filter(i => i.estado === 'completada');
            const minutos = completadas.reduce((acc, i) => acc + Number(i.actividad?.duracion_minutos ?? 0), 0);

            this.instanciasDia = [...noCanceladas].sort((a, b) =>
                String(a.hora_inicio || '').localeCompare(String(b.hora_inicio || ''))
            );
            this.kpis.planificadas = noCanceladas.length;
            this.kpis.actividadesCompletadas = completadas.length;
            this.kpis.cumplimiento = noCanceladas.length > 0
                ? Math.round((completadas.length / noCanceladas.length) * 100)
                : 0;
            this.kpis.horasCampo = Math.round((minutos / 60) * 10) / 10;
        } catch {
            this.instanciasDia = [];
            this.kpis.planificadas = 0;
            this.kpis.actividadesCompletadas = 0;
            this.kpis.cumplimiento = 0;
            this.kpis.horasCampo = 0;
        }
    }

    /** Evidencias cargadas al finalizar actividades: solo lectura, no se guardan en la bitácora. */
    private async cargarEvidenciasActividades(): Promise<void> {
        try {
            const respuesta = await this.actividadesService.getCumplimiento(undefined, this.fecha, this.fecha);
            const res = await firstValueFrom(respuesta);
            const registros: any[] = res.state === 'OK' ? (res.body || []) : [];

            const lista: any[] = [];
            registros.forEach((registro: any) => {
                if (registro.tipo_registro !== 'fin' || !Array.isArray(registro.evidencia)) return;
                const titulo = registro.instancia?.actividad?.titulo || 'Actividad';
                registro.evidencia.forEach((item: any, indice: number) => {
                    if (!item || !item.base64) return;
                    const mime = typeof item.tipo === 'string' && item.tipo.startsWith('image/')
                        ? item.tipo
                        : 'image/jpeg';
                    lista.push({
                        id_instancia: registro.id_instancia,
                        titulo,
                        descripcion: item.descripcion || registro.observaciones || '',
                        nombre: item.url || `${titulo.replace(/\s+/g, '_')}_${indice + 1}.jpg`,
                        dataUrl: `data:${mime};base64,${item.base64}`
                    });
                });
            });

            this.evidenciasActividades = lista;
        } catch {
            this.evidenciasActividades = [];
        }
    }

    verImagenActividad(evidencia: any): void {
        if (evidencia?.dataUrl) {
            this.imagenAmpliada = evidencia.dataUrl;
        }
    }

    formatearHora(hora?: string | null): string {
        if (!hora) return '';
        const [h, m] = hora.split(':').map(Number);
        const sufijo = h >= 12 ? 'PM' : 'AM';
        const hora12 = h % 12 === 0 ? 12 : h % 12;
        return `${hora12}:${String(m || 0).padStart(2, '0')} ${sufijo}`;
    }

    estadoActividadColor(estado: string): string {
        const mapa: Record<string, string> = {
            programada: '#0d9488',
            iniciada: '#f59e0b',
            completada: '#22c55e',
            cancelada: '#94a3b8'
        };
        return mapa[estado] || '#94a3b8';
    }

    estadoActividadLabel(estado: string): string {
        const mapa: Record<string, string> = {
            programada: 'Programada',
            iniciada: 'Iniciada',
            completada: 'Completada',
            cancelada: 'Cancelada'
        };
        return mapa[estado] || estado;
    }

    private calcularKpisTareas(): void {
        this.kpis.todoTotal = this.tareas.length;
        this.kpis.todoCompletadas = this.tareas.filter(t => t.completada).length;
        this.kpis.todoCumplimiento = this.kpis.todoTotal > 0
            ? Math.round((this.kpis.todoCompletadas / this.kpis.todoTotal) * 100)
            : 0;
    }

    private async asegurarBitacora(): Promise<number | null> {
        if (this.bitacora?.id_bitacora) return this.bitacora.id_bitacora;

        const respuesta = await this.gestionPhService.guardarBitacora({
            fecha: this.fecha,
            id_tipo_grupo: this.idTipoGrupo,
            resumen: this.resumen,
            planificadas: this.kpis.planificadas,
            cumplimiento: this.kpis.cumplimiento,
            horas_campo: this.kpis.horasCampo
        });
        const res = await firstValueFrom(respuesta);
        if (res.state === 'OK' && res.body) {
            this.bitacora = res.body;
            return res.body.id_bitacora ?? null;
        }
        return null;
    }

    async guardarBorrador(): Promise<void> {
        if (this.guardando) return;
        this.guardando = true;
        try {
            const respuesta = await this.gestionPhService.guardarBitacora({
                id_bitacora: this.bitacora?.id_bitacora,
                fecha: this.fecha,
                id_tipo_grupo: this.idTipoGrupo,
                resumen: this.resumen,
                planificadas: this.kpis.planificadas,
                cumplimiento: this.kpis.cumplimiento,
                horas_campo: this.kpis.horasCampo
            });
            const res = await firstValueFrom(respuesta);
            if (res.state === 'OK') {
                this.bitacora = res.body;
                Swal.fire('Guardado', 'La bitácora quedó en borrador.', 'success');
            } else {
                Swal.fire('Atención', res.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo guardar la bitácora.', 'error');
        } finally {
            this.guardando = false;
        }
    }

    async compilarResumen(): Promise<void> {
        if (this.compilando) return;
        this.compilando = true;
        try {
            const respuesta = await this.gestionPhService.generarResumenBitacora(this.fecha, this.idTipoGrupo);
            const res = await firstValueFrom(respuesta);
            if (res.state === 'OK' && res.body) {
                this.resumen = res.body.texto;
                this.kpis.planificadas = res.body.planificadas;
                this.kpis.cumplimiento = Math.round(res.body.cumplimiento);
                this.kpis.horasCampo = res.body.horas_campo;
                this.kpis.novedades = res.body.total_novedades;
                this.kpis.todoCompletadas = res.body.tareas_completadas;
                this.kpis.todoTotal = (res.body.tareas_completadas || 0) + (res.body.tareas_pendientes || 0);
                this.kpis.todoCumplimiento = this.kpis.todoTotal > 0
                    ? Math.round((this.kpis.todoCompletadas / this.kpis.todoTotal) * 100)
                    : 0;
            } else {
                Swal.fire('Atención', res.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo compilar el resumen.', 'error');
        } finally {
            this.compilando = false;
        }
    }

    // ============ NOVEDADES ============
    async agregarNovedad(): Promise<void> {
        const idBitacora = await this.asegurarBitacora();
        if (!idBitacora) {
            Swal.fire('Atención', 'No se pudo preparar la bitácora.', 'warning');
            return;
        }
        const nueva: BitacoraNovedad = { id_bitacora: idBitacora, descripcion: '', estado: 'pendiente' };
        this.novedades.push(nueva);
    }

    async guardarNovedad(novedad: BitacoraNovedad, index: number): Promise<void> {
        const descripcion = (novedad.descripcion || '').trim();
        if (!descripcion) {
            this.novedades.splice(index, 1);
            return;
        }
        const idBitacora = await this.asegurarBitacora();
        if (!idBitacora) return;

        novedad.id_bitacora = idBitacora;
        const respuesta = await this.gestionPhService.guardarNovedad({
            id_novedad: novedad.id_novedad,
            id_bitacora: idBitacora,
            descripcion,
            estado: novedad.estado || 'pendiente'
        });
        const res = await firstValueFrom(respuesta);
        if (res.state === 'OK' && res.body) {
            this.novedades[index] = res.body;
            this.kpis.novedades = this.novedades.length;
        }
    }

    async cambiarEstadoNovedad(novedad: BitacoraNovedad, index: number): Promise<void> {
        novedad.estado = novedad.estado === 'atendido' ? 'pendiente' : 'atendido';
        await this.guardarNovedad(novedad, index);
    }

    async eliminarNovedad(novedad: BitacoraNovedad, index: number): Promise<void> {
        if (!novedad.id_novedad) {
            this.novedades.splice(index, 1);
            this.kpis.novedades = this.novedades.length;
            return;
        }
        const respuesta = await this.gestionPhService.eliminarNovedad(novedad.id_novedad);
        const res = await firstValueFrom(respuesta);
        if (res.state === 'OK') {
            this.novedades.splice(index, 1);
            this.kpis.novedades = this.novedades.length;
        }
    }

    // ============ EVIDENCIAS ============
    async onEvidenciaSeleccionada(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        if (this.evidencias.length >= 3) {
            Swal.fire('Límite alcanzado', 'Solo se permiten 3 evidencias por bitácora.', 'info');
            input.value = '';
            return;
        }

        const file = input.files[0];
        input.value = '';
        this.subiendoEvidencia = true;
        try {
            const procesada = await procesarImagenEvidencia(file, { maxWidth: 1600, calidad: 0.6 });
            const idBitacora = await this.asegurarBitacora();
            if (!idBitacora) {
                this.subiendoEvidencia = false;
                return;
            }

            const respuesta = await this.gestionPhService.subirEvidencia({
                id_bitacora: idBitacora,
                archivo_base64: procesada.base64,
                thumb_base64: procesada.thumbBase64,
                nombre_original: file.name,
                mime_type: procesada.mimeType,
                descripcion: ''
            });
            const res = await firstValueFrom(respuesta);
            if (res.state === 'OK' && res.body) {
                this.evidencias.push(res.body);
            } else {
                Swal.fire('Atención', res.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo procesar la imagen.', 'error');
        } finally {
            this.subiendoEvidencia = false;
        }
    }

    async verEvidencia(evidencia: BitacoraEvidencia): Promise<void> {
        if (evidencia.archivo_base64) {
            this.imagenAmpliada = `data:${evidencia.mime_type || 'image/jpeg'};base64,${evidencia.archivo_base64}`;
            return;
        }
        if (!evidencia.id_evidencia || !this.bitacora?.id_bitacora) return;

        const respuesta = await this.gestionPhService.getEvidencias(this.bitacora.id_bitacora);
        const res = await firstValueFrom(respuesta);
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

    async eliminarEvidencia(evidencia: BitacoraEvidencia, index: number): Promise<void> {
        if (!evidencia.id_evidencia) return;
        const respuesta = await this.gestionPhService.eliminarEvidencia(evidencia.id_evidencia);
        const res = await firstValueFrom(respuesta);
        if (res.state === 'OK') {
            this.evidencias.splice(index, 1);
        }
    }

    miniatura(evidencia: BitacoraEvidencia): string {
        return evidencia.thumb_base64
            ? `data:${evidencia.mime_type || 'image/jpeg'};base64,${evidencia.thumb_base64}`
            : '';
    }

    // ============ CIERRE DE BITÁCORA ============
    async cerrarBitacora(): Promise<void> {
        if (this.cerrando) return;

        if (this.novedades.some(n => !n.id_novedad && (n.descripcion || '').trim())) {
            Swal.fire('Atención', 'Guarda las novedades pendientes antes de cerrar.', 'warning');
            return;
        }

        const confirmacion = await Swal.fire({
            title: '¿Cerrar la bitácora?',
            text: 'Una vez cerrada no podrá editarse.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, cerrar bitácora',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0d9488'
        });
        if (!confirmacion.isConfirmed) return;

        this.cerrando = true;
        try {
            const respuestaGuardar = await this.gestionPhService.guardarBitacora({
                id_bitacora: this.bitacora?.id_bitacora,
                fecha: this.fecha,
                id_tipo_grupo: this.idTipoGrupo,
                resumen: this.resumen,
                planificadas: this.kpis.planificadas,
                cumplimiento: this.kpis.cumplimiento,
                horas_campo: this.kpis.horasCampo
            });
            const resGuardar = await firstValueFrom(respuestaGuardar);
            if (resGuardar.state !== 'OK' || !resGuardar.body?.id_bitacora) {
                Swal.fire('Atención', resGuardar.msg, 'warning');
                return;
            }

            const respuestaCerrar = await this.gestionPhService.cerrarBitacora(resGuardar.body.id_bitacora);
            const resCerrar = await firstValueFrom(respuestaCerrar);
            if (resCerrar.state === 'OK') {
                this.bitacora = resCerrar.body;
                Swal.fire('Bitácora cerrada', 'La jornada quedó cerrada.', 'success');
            } else {
                Swal.fire('Atención', resCerrar.msg, 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo cerrar la bitácora.', 'error');
        } finally {
            this.cerrando = false;
        }
    }

    // ============ NAVEGACIÓN DE FECHA ============
    cambiarFecha(dias: number): void {
        const date = new Date(`${this.fecha}T00:00:00`);
        date.setDate(date.getDate() + dias);
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const dia = String(date.getDate()).padStart(2, '0');
        this.fechaChange.emit(`${date.getFullYear()}-${mes}-${dia}`);
    }

    formatearPeso(bytes?: number | null): string {
        if (!bytes) return '';
        return `${(bytes / 1024).toFixed(0)} KB`;
    }
}
