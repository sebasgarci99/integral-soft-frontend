import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PqrsPropiedadesService } from '../../../services/pqrs/pqrs-propiedades.service';
import { PqrsSolicitudesService } from '../../../services/pqrs/pqrs-solicitudes.service';
import { PropiedadHorizontal, SolicitudPqrs, CategoriaPqrs, EstadoPqr, AvancePqrs, ArchivoPqrs, TipoPqr } from '../../../interfaces/pqrs';
import { comprimirImagen } from '../../../utils/image-compress.util';
import { parsearEml, base64AFile, calcularPesoBase64 } from '../../../utils/eml-parser.util';

interface SolicitudConBandera extends SolicitudPqrs {
    bandera?: 'ROJA' | 'VERDE' | 'AMARILLA' | null;
    dias_transcurridos?: number;
    tiene_avances?: boolean;
}

@Component({
    selector: 'app-seguimiento-pqrs',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
        InputTextModule, InputTextarea, DropdownModule, CheckboxModule, ToastModule
    ],
    templateUrl: './seguimiento-pqrs.component.html',
    styleUrls: ['./seguimiento-pqrs.component.css'],
    providers: [MessageService]
})
export class SeguimientoPqrsComponent implements OnInit {

    propiedades: PropiedadHorizontal[] = [];
    propiedadSeleccionada: PropiedadHorizontal | null = null;
    categorias: CategoriaPqrs[] = [];

    solicitudes: SolicitudConBandera[] = [];
    solicitudSeleccionada: SolicitudConBandera | null = null;

    displayDetalle = false;
    vistaDetalle: 'radicado' | 'seguimiento' = 'radicado';
    mostrarFormAvance = false;
    mostrarFormFinalizar = false;

    formCategoria: { id_categoria?: number } = {};
    formAvance: { descripcion: string; avanza_a_finalizacion: boolean; archivos: any[] } = { descripcion: '', avanza_a_finalizacion: false, archivos: [] };
    formFinalizar: { resumen_finalizacion: string; archivos: any[] } = { resumen_finalizacion: '', archivos: [] };

    notificarCategoria = false;
    notificarAvance = false;
    notificarFinalizar = false;
    correoCategoria = '';

    guardando = false;

    displayNueva = false;
    guardandoNueva = false;
    cargandoEml = false;
    origenNueva: 'WEB' | 'CORREO' = 'WEB';
    mensajeEml = '';
    nuevaForm = this.formNuevaInicial();
    nuevaArchivos: { archivo_base64: string; nombre_original: string; mime_type: string; tipo_archivo: string }[] = [];

    tiposPqr = [
        { label: 'Petición', value: 'PETICION' },
        { label: 'Queja', value: 'QUEJA' },
        { label: 'Reclamo', value: 'RECLAMO' },
        { label: 'Sugerencia', value: 'SUGERENCIA' }
    ];

    pasos: { key: EstadoPqr; label: string }[] = [
        { key: 'RADICADO', label: 'Radicación' },
        { key: 'CATEGORIZADO', label: 'Categoría' },
        { key: 'EN_AVANCE', label: 'Avances' },
        { key: 'FINALIZADO', label: 'Finalización' }
    ];

    constructor(
        private propiedadesService: PqrsPropiedadesService,
        private solicitudesService: PqrsSolicitudesService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.cargarPropiedades();
    }

    async cargarPropiedades() {
        (await this.propiedadesService.getPropiedadesHorizontales()).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.propiedades = res.body || [];
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cargar propiedades.' });
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
            }
        });
    }

    async onPropiedadChange() {
        if (!this.propiedadSeleccionada) {
            this.solicitudes = [];
            this.categorias = [];
            return;
        }
        await this.cargarCatalogosPorPropiedad();
    }

    private async cargarCatalogosPorPropiedad(): Promise<void> {
        if (!this.propiedadSeleccionada) return;
        const [obsCategorias, obsSolicitudes] = await Promise.all([
            this.propiedadesService.getCategoriasPorPropiedad(this.propiedadSeleccionada.id_propiedad_horizontal),
            this.solicitudesService.listarSolicitudesPorPropiedad(this.propiedadSeleccionada.id_propiedad_horizontal)
        ]);
        forkJoin([obsCategorias, obsSolicitudes]).subscribe({
            next: ([resCategorias, resSolicitudes]) => {
                if (resCategorias.state === 'OK') {
                    this.categorias = resCategorias.body || [];
                }
                if (resSolicitudes.state === 'OK') {
                    this.solicitudes = resSolicitudes.body || [];
                } else {
                    this.messageService.add({ severity: 'error', summary: resSolicitudes.msg || 'Error al cargar solicitudes.' });
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
            }
        });
    }

    async cargarSolicitudes() {
        if (!this.propiedadSeleccionada) return;
        (await this.solicitudesService.listarSolicitudesPorPropiedad(this.propiedadSeleccionada.id_propiedad_horizontal)).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.solicitudes = res.body || [];
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cargar solicitudes.' });
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
            }
        });
    }

    verDetalle(solicitud: SolicitudConBandera) {
        this.solicitudSeleccionada = solicitud;
        this.vistaDetalle = 'radicado';
        this.mostrarFormAvance = false;
        this.mostrarFormFinalizar = false;
        this.formCategoria = { id_categoria: solicitud.id_categoria };
        this.formAvance = { descripcion: '', avanza_a_finalizacion: false, archivos: [] };
        this.formFinalizar = { resumen_finalizacion: '', archivos: [] };
        this.notificarCategoria = false;
        this.notificarAvance = false;
        this.notificarFinalizar = false;
        this.correoCategoria = '';
        this.displayDetalle = true;
        this.cargarDetalle(solicitud.id_solicitud_pqrs);
    }

    private async cargarDetalle(id_solicitud_pqrs: number) {
        (await this.solicitudesService.obtenerDetalleSolicitud(id_solicitud_pqrs)).subscribe({
            next: (res) => {
                if (res.state === 'OK' && res.body) {
                    this.solicitudSeleccionada = {
                        ...(this.solicitudSeleccionada as SolicitudConBandera),
                        ...res.body
                    };
                    this.formCategoria = { id_categoria: res.body.id_categoria };
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'No se pudo cargar el detalle de la solicitud.' });
            }
        });
    }

    private formNuevaInicial() {
        return {
            tipo_pqr: 'PETICION' as TipoPqr,
            nombre_solicitante: '',
            email_solicitante: '',
            documento_solicitante: '',
            piso: '',
            ubicacion: '',
            pretensiones: '',
            observaciones: ''
        };
    }

    abrirNuevaSolicitud() {
        this.nuevaForm = this.formNuevaInicial();
        this.nuevaArchivos = [];
        this.origenNueva = 'WEB';
        this.mensajeEml = '';
        this.displayNueva = true;
    }

    get categoriaRequiereCorreo(): boolean {
        const cat = this.categorias.find(c => c.id_categoria_pqrs === this.formCategoria.id_categoria);
        return cat?.requiere_correo === true;
    }

    private pesoNuevaSolicitud(): number {
        return this.nuevaArchivos.reduce((acc, a) => acc + calcularPesoBase64(a.archivo_base64), 0);
    }

    private limiteNuevaSolicitud(): number {
        return 4 * 1024 * 1024;
    }

    async onFileNueva(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        const file = input.files[0];
        try {
            let base64: string;
            let mime = file.type || 'application/octet-stream';
            if (mime.startsWith('image/')) {
                const dataUrl = await comprimirImagen(file, 0.7, 1200);
                base64 = dataUrl.split(',')[1];
                mime = 'image/jpeg';
            } else {
                base64 = await this.leerArchivoBase64(file);
            }
            this.nuevaArchivos.push({
                archivo_base64: base64,
                nombre_original: file.name,
                mime_type: mime,
                tipo_archivo: 'DOCUMENTO'
            });
            input.value = '';
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error al procesar el archivo.' });
        }
    }

    private leerArchivoBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.includes(',') ? result.split(',')[1] : result);
            };
            reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
            reader.readAsDataURL(file);
        });
    }

    eliminarArchivoNueva(index: number) {
        this.nuevaArchivos.splice(index, 1);
    }

    async onEmlSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        const file = input.files[0];
        this.cargandoEml = true;
        this.mensajeEml = '';
        try {
            const datos = (await parsearEml(file)).datos;

            this.nuevaForm.nombre_solicitante = datos.nombre_solicitante || this.nuevaForm.nombre_solicitante;
            this.nuevaForm.email_solicitante = datos.email_solicitante || this.nuevaForm.email_solicitante;
            this.nuevaForm.tipo_pqr = datos.tipo_pqr;
            this.nuevaForm.pretensiones = datos.asunto || this.nuevaForm.pretensiones;
            this.nuevaForm.observaciones = datos.cuerpo || this.nuevaForm.observaciones;
            this.origenNueva = 'CORREO';

            const adjuntos: { archivo_base64: string; nombre_original: string; mime_type: string; tipo_archivo: string }[] = [];
            for (const adj of datos.adjuntos) {
                if (adj.mime_type.startsWith('image/')) {
                    try {
                        const imgFile = base64AFile(adj.archivo_base64, adj.nombre_original, adj.mime_type);
                        const dataUrl = await comprimirImagen(imgFile, 0.7, 1200);
                        adjuntos.push({
                            archivo_base64: dataUrl.split(',')[1],
                            nombre_original: adj.nombre_original,
                            mime_type: 'image/jpeg',
                            tipo_archivo: 'DOCUMENTO'
                        });
                    } catch {
                        adjuntos.push({
                            archivo_base64: adj.archivo_base64,
                            nombre_original: adj.nombre_original,
                            mime_type: adj.mime_type,
                            tipo_archivo: 'DOCUMENTO'
                        });
                    }
                } else {
                    adjuntos.push({
                        archivo_base64: adj.archivo_base64,
                        nombre_original: adj.nombre_original,
                        mime_type: adj.mime_type,
                        tipo_archivo: 'DOCUMENTO'
                    });
                }
            }

            const pesoEml = calcularPesoBase64(datos.eml_base64);
            const pesoAdjuntos = adjuntos.reduce((acc, a) => acc + calcularPesoBase64(a.archivo_base64), 0);

            if (pesoEml + pesoAdjuntos > this.limiteNuevaSolicitud()) {
                this.nuevaArchivos = [];
                this.mensajeEml = 'No se pueden cargar todos los documentos porque superan la capacidad de 4 MB. La información del correo se autocompletó; cargue los adjuntos manualmente desde el formulario.';
                this.messageService.add({ severity: 'warn', summary: 'Adjuntos demasiado grandes', detail: 'Cargue los adjuntos manualmente.' });
            } else {
                this.nuevaArchivos = [
                    {
                        archivo_base64: datos.eml_base64,
                        nombre_original: datos.eml_nombre,
                        mime_type: 'message/rfc822',
                        tipo_archivo: 'DOCUMENTO'
                    },
                    ...adjuntos
                ];
                this.mensajeEml = `Información cargada desde el correo${datos.asunto ? ': ' + datos.asunto : ''}. Revise y complete los datos obligatorios.`;
            }
            input.value = '';
        } catch {
            this.messageService.add({ severity: 'error', summary: 'No se pudo leer el archivo .eml.' });
        } finally {
            this.cargandoEml = false;
        }
    }

    async guardarNuevaSolicitud() {
        if (!this.propiedadSeleccionada) return;
        const f = this.nuevaForm;
        if (!f.nombre_solicitante || !f.email_solicitante || !f.documento_solicitante || !f.tipo_pqr) {
            this.messageService.add({ severity: 'warn', summary: 'Complete nombre, correo, documento y tipo.' });
            return;
        }
        if (this.pesoNuevaSolicitud() > this.limiteNuevaSolicitud()) {
            this.messageService.add({ severity: 'error', summary: 'Los adjuntos superan 4 MB. Retire algunos e intente de nuevo.' });
            return;
        }
        this.guardandoNueva = true;
        const payload = {
            id_propiedad_horizontal: this.propiedadSeleccionada.id_propiedad_horizontal,
            ...f,
            archivos: this.nuevaArchivos,
            origen: this.origenNueva
        };
        (await this.solicitudesService.crearSolicitudInterna(payload)).subscribe({
            next: (res) => {
                this.guardandoNueva = false;
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: `Solicitud radicada: ${res.body?.codigo_radicado || ''}` });
                    this.displayNueva = false;
                    this.cargarSolicitudes();
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al radicar la solicitud.' });
                }
            },
            error: (err) => {
                this.guardandoNueva = false;
                if (err?.status === 413) {
                    this.messageService.add({ severity: 'error', summary: 'Los adjuntos superan el límite de 4 MB.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
                }
            }
        });
    }

    getLabelTipoPqr(tipo?: string): string {
        const t = this.tiposPqr.find(x => x.value === tipo);
        return t ? t.label : tipo || '';
    }

    getIndexPaso(estado: EstadoPqr): number {
        return this.pasos.findIndex(p => p.key === estado);
    }

    getClaseBandera(bandera?: string): string {
        if (bandera === 'ROJA') return 'badge bg-danger';
        if (bandera === 'VERDE') return 'badge bg-success';
        if (bandera === 'AMARILLA') return 'badge bg-warning text-dark';
        return 'badge bg-light text-dark';
    }

    getLabelBandera(bandera?: string): string {
        if (bandera === 'ROJA') return 'Requiere atención';
        if (bandera === 'VERDE') return 'Con avance';
        if (bandera === 'AMARILLA') return 'Pendiente';
        return '';
    }

    getNombreUsuario(usuario?: { nombre?: string; apellido?: string; usuario?: string } | null): string {
        if (!usuario) return '—';
        const nombre = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
        return nombre || usuario.usuario || '—';
    }

    getAccionLabel(accion?: string): string {
        switch (accion) {
            case 'CREACION': return 'Creación';
            case 'CATEGORIZACION': return 'Categorización';
            case 'AVANCE': return 'Avance';
            case 'FINALIZACION': return 'Finalización';
            case 'REENVIO_CORREO': return 'Reenvío a correo';
            default: return accion || '';
        }
    }

    async guardarCategoria() {
        if (!this.solicitudSeleccionada || !this.formCategoria.id_categoria) return;
        if (this.categoriaRequiereCorreo && !this.correoCategoria) {
            this.messageService.add({ severity: 'warn', summary: 'Ingrese el correo al que se reenviará la solicitud.' });
            return;
        }
        this.guardando = true;
        (await this.solicitudesService.categorizarSolicitud(
            this.solicitudSeleccionada.id_solicitud_pqrs,
            this.formCategoria.id_categoria,
            this.notificarCategoria,
            this.categoriaRequiereCorreo ? this.correoCategoria : undefined
        )).subscribe({
            next: (res) => {
                this.guardando = false;
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Categoría asignada correctamente.' });
                    this.cargarSolicitudes();
                    this.displayDetalle = false;
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al categorizar.' });
                }
            },
            error: () => {
                this.guardando = false;
                this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
            }
        });
    }

    async guardarAvance() {
        if (!this.solicitudSeleccionada || !this.formAvance.descripcion) {
            this.messageService.add({ severity: 'warn', summary: 'La descripción del avance es obligatoria.' });
            return;
        }
        this.guardando = true;
        (await this.solicitudesService.registrarAvance(
            this.solicitudSeleccionada.id_solicitud_pqrs,
            this.formAvance.descripcion,
            this.formAvance.avanza_a_finalizacion,
            this.formAvance.archivos,
            this.notificarAvance
        )).subscribe({
            next: (res) => {
                this.guardando = false;
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Avance registrado correctamente.' });
                    this.cargarSolicitudes();
                    this.displayDetalle = false;
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al registrar avance.' });
                }
            },
            error: () => {
                this.guardando = false;
                this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
            }
        });
    }

    async finalizarSolicitud() {
        if (!this.solicitudSeleccionada || !this.formFinalizar.resumen_finalizacion) {
            this.messageService.add({ severity: 'warn', summary: 'El resumen de finalización es obligatorio.' });
            return;
        }
        this.guardando = true;
        (await this.solicitudesService.finalizarSolicitud(
            this.solicitudSeleccionada.id_solicitud_pqrs,
            this.formFinalizar.resumen_finalizacion,
            this.formFinalizar.archivos,
            this.notificarFinalizar
        )).subscribe({
            next: (res) => {
                this.guardando = false;
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Solicitud finalizada correctamente.' });
                    this.cargarSolicitudes();
                    this.displayDetalle = false;
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al finalizar.' });
                }
            },
            error: () => {
                this.guardando = false;
                this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
            }
        });
    }

    async onFileSelected(event: Event, destino: 'avance' | 'finalizar') {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        try {
            const base64 = await comprimirImagen(file, 0.7, 1200);
            const archivo = {
                archivo_base64: base64.split(',')[1],
                nombre_original: file.name,
                mime_type: file.type,
                tipo_archivo: 'DOCUMENTO'
            };
            if (destino === 'avance') {
                this.formAvance.archivos.push(archivo);
            } else {
                this.formFinalizar.archivos.push(archivo);
            }
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error al procesar la imagen.' });
        }
    }

    eliminarArchivo(index: number, destino: 'avance' | 'finalizar') {
        if (destino === 'avance') {
            this.formAvance.archivos.splice(index, 1);
        } else {
            this.formFinalizar.archivos.splice(index, 1);
        }
    }

    getPreviewUrl(archivo: ArchivoPqrs | any): string {
        if (archivo.archivo_base64 && !archivo.archivo_base64.startsWith('data:')) {
            return `data:${archivo.mime_type};base64,${archivo.archivo_base64}`;
        }
        return archivo.archivo_base64;
    }

    esImagen(mimeType?: string): boolean {
        return (mimeType || '').startsWith('image/');
    }
}
