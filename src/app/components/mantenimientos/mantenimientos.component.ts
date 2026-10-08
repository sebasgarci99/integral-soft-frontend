import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { MantenimientosService } from '../../services/mantenimientos/mantenimientos.service';
import { BitacoraDiaria, BitacoraEvidencia, BitacoraNovedad } from '../../interfaces/gestion-ph';
import { procesarImagenEvidencia } from '../../utils/image-compress.util';
import { getGoogleMapsEmbedUrl } from '../../utils/google-maps.util';

interface TipoMantenimiento {
    value: string;
    label: string;
    icono: string;
    color: string;
}

interface DiaAgenda {
    fecha: string;
    dia: number;
    esMesActual: boolean;
    esHoy: boolean;
    esSeleccionado: boolean;
    agendados: number;
}

@Component({
    selector: 'app-mantenimientos',
    standalone: true,
    imports: [CommonModule, FormsModule, CalendarModule],
    templateUrl: './mantenimientos.component.html',
    styleUrl: './mantenimientos.component.css'
})
export class MantenimientosComponent implements OnInit {

    tiposMantenimiento: TipoMantenimiento[] = [
        { value: 'preventivo', label: 'Preventivo', icono: 'fa-shield-halved', color: '#0d9488' },
        { value: 'correctivo', label: 'Correctivo', icono: 'fa-screwdriver-wrench', color: '#dc2626' },
        { value: 'predictivo', label: 'Predictivo', icono: 'fa-chart-line', color: '#0284c7' },
        { value: 'limpieza', label: 'Limpieza', icono: 'fa-broom', color: '#7c3aed' },
        { value: 'otro', label: 'Otro', icono: 'fa-ellipsis', color: '#64748b' }
    ];

    fecha: string = this.obtenerFechaHoy();
    fechaDate: Date = this.parseISO(this.fecha);

    bitacora: BitacoraDiaria | null = null;
    equipo = '';
    tipoMantenimiento = 'preventivo';
    descripcion = '';
    ubicacion = '';

    novedades: BitacoraNovedad[] = [];
    evidencias: BitacoraEvidencia[] = [];
    mantenimientosMes: BitacoraDiaria[] = [];

    mesAgenda: Date = new Date();
    diasAgenda: DiaAgenda[] = [];
    diasSemana = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

    cargando = false;
    guardando = false;
    subiendoEvidencia = false;

    imagenAmpliada: string | null = null;

    getGoogleMapsEmbedUrl = getGoogleMapsEmbedUrl;

    constructor(
        private mantenimientosService: MantenimientosService,
        private sanitizer: DomSanitizer
    ) {}

    getSafeMapsUrl(url?: string | null): SafeResourceUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(getGoogleMapsEmbedUrl(url) || '');
    }

    ngOnInit(): void {
        this.setFecha(this.fecha);
    }

    get fechaLarga(): string {
        const date = new Date(`${this.fecha}T00:00:00`);
        return date.toLocaleDateString('es-CO', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    get nombreMesAgenda(): string {
        return this.mesAgenda.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    }

    get tituloMantenimiento(): string {
        return this.bitacora?.id_bitacora ? 'Editar Mantenimiento' : 'Registrar Mantenimiento';
    }

    get tipoActual(): TipoMantenimiento | undefined {
        return this.tiposMantenimiento.find(t => t.value === this.tipoMantenimiento);
    }

    seleccionarTipo(tipo: TipoMantenimiento): void {
        this.tipoMantenimiento = tipo.value;
    }

    async cargar(): Promise<void> {
        if (!this.fecha) return;
        this.cargando = true;
        try {
            const respuesta = await this.mantenimientosService.getMantenimiento(this.fecha);
            const res = await firstValueFrom(respuesta);
            if (res.state === 'OK' && res.body) {
                this.bitacora = res.body.bitacora || null;
                this.novedades = res.body.novedades || [];
                this.evidencias = res.body.evidencias || [];
                this.equipo = this.bitacora?.equipo || '';
                this.tipoMantenimiento = this.bitacora?.tipo_mantenimiento || 'preventivo';
                this.descripcion = this.bitacora?.resumen || '';
                this.ubicacion = this.bitacora?.ubicacion || '';
            } else {
                this.limpiar();
            }
        } catch {
            Swal.fire('Error', 'No se pudo cargar la bitácora de mantenimiento.', 'error');
        } finally {
            this.cargando = false;
        }
    }

    private limpiar(): void {
        this.bitacora = null;
        this.novedades = [];
        this.evidencias = [];
        this.equipo = '';
        this.tipoMantenimiento = 'preventivo';
        this.descripcion = '';
        this.ubicacion = '';
    }

    private async cargarAgenda(): Promise<void> {
        const anio = this.mesAgenda.getFullYear();
        const mes = this.mesAgenda.getMonth();
        const inicio = this.formatearISO(new Date(anio, mes, 1));
        const fin = this.formatearISO(new Date(anio, mes + 1, 0));
        try {
            const respuesta = await this.mantenimientosService.listarMantenimientos(inicio, fin);
            const res = await firstValueFrom(respuesta);
            this.mantenimientosMes = res.state === 'OK' ? (res.body || []) : [];
        } catch {
            this.mantenimientosMes = [];
        }
        this.construirCalendario();
    }

    // ============ CALENDARIO DE AGENDA ============
    private construirCalendario(): void {
        const anio = this.mesAgenda.getFullYear();
        const mes = this.mesAgenda.getMonth();
        const primerDia = new Date(anio, mes, 1);
        const ultimoDia = new Date(anio, mes + 1, 0);
        const offset = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;
        const hoy = this.formatearISO(new Date());

        const dias: DiaAgenda[] = [];
        for (let i = offset; i > 0; i--) {
            dias.push(this.crearDiaAgenda(new Date(anio, mes, 1 - i), false, hoy));
        }
        for (let d = 1; d <= ultimoDia.getDate(); d++) {
            dias.push(this.crearDiaAgenda(new Date(anio, mes, d), true, hoy));
        }
        while (dias.length % 7 !== 0) {
            const ultimo = dias[dias.length - 1];
            const siguiente = this.parseISO(ultimo.fecha);
            siguiente.setDate(siguiente.getDate() + 1);
            dias.push(this.crearDiaAgenda(siguiente, false, hoy));
        }
        this.diasAgenda = dias;
    }

    private crearDiaAgenda(fecha: Date, esMesActual: boolean, hoy: string): DiaAgenda {
        const iso = this.formatearISO(fecha);
        return {
            fecha: iso,
            dia: fecha.getDate(),
            esMesActual,
            esHoy: iso === hoy,
            esSeleccionado: iso === this.fecha,
            agendados: this.mantenimientosMes.filter(m => m.fecha === iso).length
        };
    }

    mesAnterior(): void {
        this.mesAgenda = new Date(this.mesAgenda.getFullYear(), this.mesAgenda.getMonth() - 1, 1);
        this.cargarAgenda();
    }

    mesSiguiente(): void {
        this.mesAgenda = new Date(this.mesAgenda.getFullYear(), this.mesAgenda.getMonth() + 1, 1);
        this.cargarAgenda();
    }

    seleccionarDiaAgenda(dia: DiaAgenda): void {
        this.setFecha(dia.fecha);
    }

    private async asegurarMantenimiento(): Promise<number | null> {
        const respuesta = await this.mantenimientosService.guardarMantenimiento({
            id_bitacora: this.bitacora?.id_bitacora,
            fecha: this.fecha,
            equipo: this.equipo,
            tipo_mantenimiento: this.tipoMantenimiento as BitacoraDiaria['tipo_mantenimiento'],
            descripcion: this.descripcion,
            ubicacion: this.ubicacion
        });
        const res = await firstValueFrom(respuesta);
        if (res.state === 'OK' && res.body) {
            this.bitacora = res.body;
            return res.body.id_bitacora ?? null;
        }
        return null;
    }

    async guardar(): Promise<void> {
        if (this.guardando) return;
        if (!this.equipo.trim() && !this.descripcion.trim()) {
            Swal.fire('Atención', 'Ingresa el equipo/activo o la descripción del trabajo.', 'warning');
            return;
        }
        this.guardando = true;
        try {
            const idBitacora = await this.asegurarMantenimiento();
            if (idBitacora) {
                Swal.fire('Guardado', 'El mantenimiento se guardó correctamente.', 'success');
                await this.cargarAgenda();
            } else {
                Swal.fire('Atención', 'No se pudo guardar el mantenimiento.', 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo guardar el mantenimiento.', 'error');
        } finally {
            this.guardando = false;
        }
    }

    async agendar(): Promise<void> {
        if (this.guardando) return;
        if (this.bitacora?.id_bitacora) {
            Swal.fire('Ya agendado', `El ${this.fechaLarga} ya tiene un mantenimiento agendado.`, 'info');
            return;
        }
        this.guardando = true;
        try {
            const idBitacora = await this.asegurarMantenimiento();
            if (idBitacora) {
                Swal.fire('Agendado', `Mantenimiento agendado para el ${this.fechaLarga}.`, 'success');
                await this.cargarAgenda();
            } else {
                Swal.fire('Atención', 'No se pudo agendar el mantenimiento.', 'warning');
            }
        } catch {
            Swal.fire('Error', 'No se pudo agendar el mantenimiento.', 'error');
        } finally {
            this.guardando = false;
        }
    }

    // ============ NOVEDADES ============
    async agregarNovedad(): Promise<void> {
        const idBitacora = await this.asegurarMantenimiento();
        if (!idBitacora) {
            Swal.fire('Atención', 'No se pudo preparar el mantenimiento.', 'warning');
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
        const idBitacora = await this.asegurarMantenimiento();
        if (!idBitacora) return;

        novedad.id_bitacora = idBitacora;
        const respuesta = await this.mantenimientosService.guardarNovedad({
            id_novedad: novedad.id_novedad,
            id_bitacora: idBitacora,
            descripcion,
            estado: novedad.estado || 'pendiente'
        });
        const res = await firstValueFrom(respuesta);
        if (res.state === 'OK' && res.body) {
            this.novedades[index] = res.body;
        }
    }

    async cambiarEstadoNovedad(novedad: BitacoraNovedad, index: number): Promise<void> {
        novedad.estado = novedad.estado === 'atendido' ? 'pendiente' : 'atendido';
        await this.guardarNovedad(novedad, index);
    }

    async eliminarNovedad(novedad: BitacoraNovedad, index: number): Promise<void> {
        if (!novedad.id_novedad) {
            this.novedades.splice(index, 1);
            return;
        }
        const respuesta = await this.mantenimientosService.eliminarNovedad(novedad.id_novedad);
        const res = await firstValueFrom(respuesta);
        if (res.state === 'OK') {
            this.novedades.splice(index, 1);
        }
    }

    // ============ EVIDENCIAS ============
    async onEvidenciaSeleccionada(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        if (this.evidencias.length >= 3) {
            Swal.fire('Límite alcanzado', 'Solo se permiten 3 evidencias por mantenimiento.', 'info');
            input.value = '';
            return;
        }

        const file = input.files[0];
        input.value = '';
        this.subiendoEvidencia = true;
        try {
            const procesada = await procesarImagenEvidencia(file, { maxWidth: 1600, calidad: 0.6 });
            const idBitacora = await this.asegurarMantenimiento();
            if (!idBitacora) {
                this.subiendoEvidencia = false;
                return;
            }

            const respuesta = await this.mantenimientosService.subirEvidencia({
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

        const respuesta = await this.mantenimientosService.getEvidencias(this.bitacora.id_bitacora);
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
        const respuesta = await this.mantenimientosService.eliminarEvidencia(evidencia.id_evidencia);
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

    // ============ AGENDA ============
    async irAMantenimiento(item: BitacoraDiaria): Promise<void> {
        if (item.fecha && item.fecha !== this.fecha) {
            this.setFecha(item.fecha);
        }
    }

    labelTipo(tipo?: string | null): string {
        const encontrado = this.tiposMantenimiento.find(t => t.value === tipo);
        return encontrado ? encontrado.label : 'Otro';
    }

    // ============ NAVEGACIÓN DE FECHA ============
    async cambiarFecha(dias: number): Promise<void> {
        const date = new Date(`${this.fecha}T00:00:00`);
        date.setDate(date.getDate() + dias);
        this.setFecha(this.formatearISO(date));
    }

    async onFechaDate(date: Date | null): Promise<void> {
        if (date) {
            this.setFecha(this.formatearISO(date));
        }
    }

    private setFecha(fecha: string): void {
        this.fecha = fecha;
        this.fechaDate = this.parseISO(fecha);
        const [anio, mes] = fecha.split('-').map(Number);
        this.mesAgenda = new Date(anio, mes - 1, 1);
        this.cargar();
        this.cargarAgenda();
    }

    private parseISO(fecha: string): Date {
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

    formatearPeso(bytes?: number | null): string {
        if (!bytes) return '';
        return `${(bytes / 1024).toFixed(0)} KB`;
    }
}
