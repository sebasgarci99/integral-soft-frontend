import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { PropiedadHorizontal, SolicitudPqrs, CategoriaPqrs, EstadoPqr, AvancePqrs, ArchivoPqrs } from '../../../interfaces/pqrs';

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

    cargandoPropiedades = false;
    cargandoSolicitudes = false;
    displayDetalle = false;
    vistaDetalle: 'detalle' | 'categoria' | 'avance' | 'finalizar' = 'detalle';

    formCategoria: { id_categoria?: number } = {};
    formAvance: { descripcion: string; avanza_a_finalizacion: boolean; archivos: any[] } = { descripcion: '', avanza_a_finalizacion: false, archivos: [] };
    formFinalizar: { resumen_finalizacion: string; archivos: any[] } = { resumen_finalizacion: '', archivos: [] };

    notificarCategoria = false;
    notificarAvance = false;
    notificarFinalizar = false;

    guardando = false;

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
        this.cargandoPropiedades = true;
        (await this.propiedadesService.getPropiedadesHorizontales()).subscribe({
            next: (res) => {
                this.cargandoPropiedades = false;
                if (res.state === 'OK') {
                    this.propiedades = res.body || [];
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cargar propiedades.' });
                }
            },
            error: () => {
                this.cargandoPropiedades = false;
                this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
            }
        });
    }

    async onPropiedadChange() {
        if (!this.propiedadSeleccionada) {
            this.solicitudes = [];
            return;
        }
        await this.cargarCategorias();
        await this.cargarSolicitudes();
    }

    async cargarCategorias() {
        if (!this.propiedadSeleccionada) return;
        (await this.propiedadesService.getCategoriasPorPropiedad(this.propiedadSeleccionada.id_propiedad_horizontal)).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.categorias = res.body || [];
                }
            }
        });
    }

    async cargarSolicitudes() {
        if (!this.propiedadSeleccionada) return;
        this.cargandoSolicitudes = true;
        (await this.solicitudesService.listarSolicitudesPorPropiedad(this.propiedadSeleccionada.id_propiedad_horizontal)).subscribe({
            next: (res) => {
                this.cargandoSolicitudes = false;
                if (res.state === 'OK') {
                    this.solicitudes = res.body || [];
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cargar solicitudes.' });
                }
            },
            error: () => {
                this.cargandoSolicitudes = false;
                this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
            }
        });
    }

    verDetalle(solicitud: SolicitudConBandera) {
        this.solicitudSeleccionada = solicitud;
        this.vistaDetalle = 'detalle';
        this.formCategoria = { id_categoria: solicitud.id_categoria };
        this.formAvance = { descripcion: '', avanza_a_finalizacion: false, archivos: [] };
        this.formFinalizar = { resumen_finalizacion: '', archivos: [] };
        this.notificarCategoria = false;
        this.notificarAvance = false;
        this.notificarFinalizar = false;
        this.displayDetalle = true;
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

    async guardarCategoria() {
        if (!this.solicitudSeleccionada || !this.formCategoria.id_categoria) return;
        this.guardando = true;
        (await this.solicitudesService.categorizarSolicitud(
            this.solicitudSeleccionada.id_solicitud_pqrs,
            this.formCategoria.id_categoria,
            this.notificarCategoria
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
            const base64 = await this.comprimirImagen(file, 0.7, 1200);
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

    private comprimirImagen(file: File, calidad: number, maxWidth: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const scale = Math.min(1, maxWidth / img.width);
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject('No se pudo crear contexto');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', calidad));
                };
                img.onerror = reject;
                img.src = event.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
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
