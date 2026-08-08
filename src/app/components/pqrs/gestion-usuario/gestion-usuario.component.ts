import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import Swal from 'sweetalert2';
import { PqrsPublicoService } from '../../../services/pqrs/pqrs-publico.service';
import { PropiedadHorizontal, SolicitudPqrs, TipoPqr, EstadoPqr } from '../../../interfaces/pqrs';
import { enviroment } from '../../../../enviroments/enviroment';
import { getGoogleMapsEmbedUrl } from '../../../utils/google-maps.util';

interface ArchivoForm {
    base64: string;
    nombre: string;
    mimeType: string;
    tipo_archivo: 'FOTO1' | 'FOTO2';
}

@Component({
    selector: 'app-gestion-usuario',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, InputTextarea, DropdownModule, ToastModule],
    templateUrl: './gestion-usuario.component.html',
    styleUrls: ['./gestion-usuario.component.css'],
    providers: [MessageService]
})
export class GestionUsuarioComponent implements OnInit {

    codigoAcceso = '';
    propiedad: Partial<PropiedadHorizontal> | null = null;
    cargando = true;
    codigoValido = false;
    codigoInvalido = false;

    vista: 'inicio' | 'registrar' | 'seguimiento' | 'confirmacion' = 'inicio';

    documentoInicial = '';
    puedeCrear = false;
    validandoLimite = false;

    formData: any = {
        tipo_pqr: 'PETICION'
    };
    archivos: ArchivoForm[] = [];
    enviando = false;
    codigoRadicadoGenerado = '';

    consulta: { codigo_radicado: string; documento: string } = { codigo_radicado: '', documento: '' };
    consultando = false;
    resultados: SolicitudPqrs[] = [];

    tiposPqr = [
        { label: 'Petición', value: 'PETICION' },
        { label: 'Queja', value: 'QUEJA' },
        { label: 'Reclamo', value: 'RECLAMO' },
        { label: 'Sugerencia', value: 'SUGERENCIA' }
    ];

    getGoogleMapsEmbedUrl = getGoogleMapsEmbedUrl;

    getSafeMapsUrl(url?: string | null): SafeResourceUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(getGoogleMapsEmbedUrl(url) || '');
    }

    pasos: { key: EstadoPqr | 'RADICADO'; label: string }[] = [
        { key: 'RADICADO', label: 'Radicación' },
        { key: 'CATEGORIZADO', label: 'Categoría' },
        { key: 'EN_AVANCE', label: 'Avances' },
        { key: 'FINALIZADO', label: 'Finalización' }
    ];

    constructor(
        private route: ActivatedRoute,
        private pqrsPublicoService: PqrsPublicoService,
        private messageService: MessageService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.codigoAcceso = params['k'] || '';
            if (this.codigoAcceso) {
                this.validarCodigo();
            } else {
                this.cargando = false;
                this.codigoInvalido = true;
            }
        });
    }

    validarCodigo() {
        this.pqrsPublicoService.validarCodigo(this.codigoAcceso).subscribe({
            next: (res) => {
                this.cargando = false;
                if (res.state === 'OK') {
                    this.propiedad = res.body;
                    this.codigoValido = true;
                } else {
                    this.codigoInvalido = true;
                }
            },
            error: () => {
                this.cargando = false;
                this.codigoInvalido = true;
            }
        });
    }

    irARegistrar() {
        this.vista = 'registrar';
        this.documentoInicial = '';
        this.puedeCrear = false;
        this.formData = { tipo_pqr: 'PETICION' };
        this.archivos = [];
    }

    irASeguimiento() {
        this.vista = 'seguimiento';
        this.resultados = [];
        this.consulta = { codigo_radicado: '', documento: '' };
    }

    volverInicio() {
        this.vista = 'inicio';
    }

    validarLimite() {
        if (!this.documentoInicial) return;
        this.validandoLimite = true;
        this.pqrsPublicoService.validarLimite(this.codigoAcceso, this.documentoInicial).subscribe({
            next: (res) => {
                this.validandoLimite = false;
                if (res.state === 'OK' && res.body.puede_crear) {
                    this.puedeCrear = true;
                    this.formData.documento_solicitante = this.documentoInicial;
                } else {
                    this.puedeCrear = false;
                    Swal.fire({
                        icon: 'warning',
                        title: 'No se pueden crear más solicitudes',
                        text: 'Ya tiene 2 PQRS pendientes. Consulte con el administrador y valide el estado de sus solicitudes.',
                        confirmButtonColor: '#3da1b8'
                    });
                }
            },
            error: () => {
                this.validandoLimite = false;
                this.messageService.add({ severity: 'error', summary: 'Error al validar el límite de solicitudes.' });
            }
        });
    }

    async onFileSelected(event: Event, tipo: 'FOTO1' | 'FOTO2') {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        try {
            const base64 = await this.comprimirImagen(file, 0.7, 1200);
            const archivo: ArchivoForm = {
                base64: base64.split(',')[1],
                nombre: file.name,
                mimeType: file.type,
                tipo_archivo: tipo
            };
            const idx = this.archivos.findIndex(a => a.tipo_archivo === tipo);
            if (idx >= 0) {
                this.archivos[idx] = archivo;
            } else {
                this.archivos.push(archivo);
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

    eliminarFoto(tipo: 'FOTO1' | 'FOTO2') {
        this.archivos = this.archivos.filter(a => a.tipo_archivo !== tipo);
    }

    obtenerFoto(tipo: 'FOTO1' | 'FOTO2'): string {
        const archivo = this.archivos.find(a => a.tipo_archivo === tipo);
        return archivo ? `data:${archivo.mimeType};base64,${archivo.base64}` : '';
    }

    async enviarSolicitud() {
        if (!this.formData.nombre_solicitante || !this.formData.email_solicitante || !this.formData.documento_solicitante || !this.formData.tipo_pqr) {
            this.messageService.add({ severity: 'warn', summary: 'Complete los campos obligatorios.' });
            return;
        }

        this.enviando = true;

        const archivosPayload = this.archivos.map(a => ({
            tipo_archivo: a.tipo_archivo,
            archivo_base64: a.base64,
            nombre_original: a.nombre,
            mime_type: a.mimeType
        }));

        const payload = {
            codigo_acceso: this.codigoAcceso,
            ...this.formData,
            archivos: archivosPayload
        };

        this.pqrsPublicoService.crearSolicitud(payload).subscribe({
            next: (res) => {
                this.enviando = false;
                if (res.state === 'OK') {
                    this.codigoRadicadoGenerado = res.body.codigo_radicado;
                    this.vista = 'confirmacion';
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al enviar la solicitud.' });
                }
            },
            error: (err) => {
                this.enviando = false;
                if (err.status === 413) {
                    this.messageService.add({ severity: 'error', summary: 'Las imágenes superan el límite permitido (2 MB). Intente con fotos más pequeñas.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error al enviar la solicitud. Intente nuevamente.' });
                }
            }
        });
    }

    consultar() {
        if (!this.consulta.codigo_radicado && !this.consulta.documento) {
            this.messageService.add({ severity: 'warn', summary: 'Ingrese el código de radicado o el número de documento.' });
            return;
        }

        this.consultando = true;
        this.pqrsPublicoService.consultarSeguimiento(
            this.codigoAcceso,
            this.consulta.codigo_radicado || undefined,
            this.consulta.documento || undefined
        ).subscribe({
            next: (res) => {
                this.consultando = false;
                if (res.state === 'OK') {
                    this.resultados = res.body || [];
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al consultar.' });
                }
            },
            error: () => {
                this.consultando = false;
                this.messageService.add({ severity: 'error', summary: 'Error al consultar el seguimiento.' });
            }
        });
    }

    getIndexPaso(estado: EstadoPqr): number {
        return this.pasos.findIndex(p => p.key === estado);
    }
}
