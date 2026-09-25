import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import QRCode from 'qrcode';
import { PqrsPropiedadesService } from '../../../services/pqrs/pqrs-propiedades.service';
import { MenuService } from '../../../services/menu/menu.service';
import { PropiedadHorizontal, CategoriaPqrs } from '../../../interfaces/pqrs';
import { enviroment } from '../../../../enviroments/enviroment';
import { getGoogleMapsEmbedUrl } from '../../../utils/google-maps.util';

@Component({
    selector: 'app-propiedades-horizontales',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
        InputTextModule, InputTextarea, CheckboxModule, ToastModule, ConfirmDialogModule, TooltipModule
    ],
    templateUrl: './propiedades-horizontales.component.html',
    styleUrls: ['./propiedades-horizontales.component.css'],
    providers: [MessageService, ConfirmationService]
})
export class PropiedadesHorizontalesComponent implements OnInit {

    propiedades: PropiedadHorizontal[] = [];
    loadingGuardar = false;
    loadingEliminar = false;
    renovandoCodigo = false;
    displayDialog = false;
    displayQrDialog = false;
    displayCategoriasDialog = false;
    isEdit = false;

    formData: Partial<PropiedadHorizontal> = {};
    propiedadSeleccionada: PropiedadHorizontal | null = null;

    qrDataUrl = '';
    qrUrl = '';
    qrDecoradoDataUrl = '';
    logoEmpresaUrl: string | null = null;

    private readonly QR_BASE_WIDTH = 420;
    private readonly QR_BASE_HEIGHT = 620;
    private readonly QR_BASE_QR_WIDTH = 300;
    private readonly QR_MARGIN = 2;
    private readonly QR_ERROR_LEVEL = 'H' as const;
    readonly QR_HD_ESCALA = 5;

    getGoogleMapsEmbedUrl = getGoogleMapsEmbedUrl;


    getSafeMapsUrl(url?: string | null): SafeResourceUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(getGoogleMapsEmbedUrl(url) || '');
    }

    categorias: CategoriaPqrs[] = [];
    categoriaForm: Partial<CategoriaPqrs> = {};
    isEditCategoria = false;
    guardandoCategoria = false;
    inactivandoCategoria = false;

    @ViewChild('tablaPropiedades') tablaPropiedades?: Table;

    constructor(
        private pqrsService: PqrsPropiedadesService,
        private menuService: MenuService,
        private messageService: MessageService,
        private confirmService: ConfirmationService,
        private sanitizer: DomSanitizer
    ) {}

    ngOnInit(): void {
        this.cargarPropiedades();
        this.menuService.datosUsuario$.subscribe(data => {
            if (data?.blob_foto_perfil) {
                this.logoEmpresaUrl = 'data:image/png;base64,' + data.blob_foto_perfil;
            }
        });
    }

    async cargarPropiedades() {
        (await this.pqrsService.getPropiedadesHorizontales()).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.propiedades = res.body || [];
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cargar propiedades.' });
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
            }
        });
    }

    aplicarFiltroGlobal(event: Event) {
        const valor = (event.target as HTMLInputElement).value;
        if (this.tablaPropiedades) {
            this.tablaPropiedades.filterGlobal(valor, 'contains');
        }
    }

    abrirFormulario() {
        this.isEdit = false;
        this.formData = {};
        this.displayDialog = true;
    }

    editarPropiedad(propiedad: PropiedadHorizontal) {
        this.isEdit = true;
        this.formData = { ...propiedad };
        this.displayDialog = true;
    }

    async guardar() {
        if (!this.formData.nombre || !this.formData.direccion || !this.formData.email_pqrs) {
            this.messageService.add({ severity: 'warn', summary: 'Nombre, dirección y email de PQRS son obligatorios.' });
            return;
        }

        this.loadingGuardar = true;

        const request = this.isEdit
            ? this.pqrsService.actualizarPropiedadHorizontal(this.formData)
            : this.pqrsService.crearPropiedadHorizontal(this.formData);

        (await request).subscribe({
            next: (res) => {
                this.loadingGuardar = false;
                if (res.state === 'OK') {
                    this.displayDialog = false;
                    this.cargarPropiedades();
                    this.messageService.add({ severity: 'success', summary: this.isEdit ? 'Propiedad actualizada.' : 'Propiedad creada.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al guardar.' });
                }
            },
            error: () => {
                this.loadingGuardar = false;
                this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
            }
        });
    }

    inactivarPropiedad(propiedad: PropiedadHorizontal) {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Cambiar estado',
            message: `¿Estás seguro de cambiar el estado de "${propiedad.nombre}"?`,
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                this.loadingEliminar = true;
                (await this.pqrsService.inactivarPropiedadHorizontal(propiedad.id_propiedad_horizontal)).subscribe({
                    next: (res) => {
                        this.loadingEliminar = false;
                        if (res.state === 'OK') {
                            this.cargarPropiedades();
                            this.messageService.add({ severity: 'success', summary: 'Estado actualizado.' });
                        } else {
                            this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cambiar estado.' });
                        }
                    },
                    error: () => {
                        this.loadingEliminar = false;
                        this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
                    }
                });
            }
        });
    }

    async mostrarQr(propiedad: PropiedadHorizontal) {
        this.propiedadSeleccionada = propiedad;
        this.qrUrl = `${enviroment.pqrsLandingUrl}?k=${propiedad.codigo_acceso}`;
        try {
            this.qrDataUrl = await QRCode.toDataURL(this.qrUrl, {
                width: this.QR_BASE_QR_WIDTH,
                margin: this.QR_MARGIN,
                errorCorrectionLevel: this.QR_ERROR_LEVEL,
                color: { dark: '#1a5f7a', light: '#ffffff' }
            });
            this.qrDecoradoDataUrl = await this.generarQrDecorado(this.qrDataUrl, 1);
        } catch (error) {
            this.qrDataUrl = '';
            this.qrDecoradoDataUrl = '';
            this.messageService.add({ severity: 'error', summary: 'Error al generar el QR.' });
        }
        this.displayQrDialog = true;
    }

    descargarQr(escala = 1) {
        if (escala === 1 && this.qrDecoradoDataUrl) {
            this.dispararDescarga(this.qrDecoradoDataUrl, escala);
            return;
        }
        this.generarYDescargarHd();
    }

    private async generarYDescargarHd() {
        if (!this.propiedadSeleccionada) return;
        try {
            const qrDataUrl = await QRCode.toDataURL(this.qrUrl, {
                width: this.QR_BASE_QR_WIDTH * this.QR_HD_ESCALA,
                margin: this.QR_MARGIN,
                errorCorrectionLevel: this.QR_ERROR_LEVEL,
                color: { dark: '#1a5f7a', light: '#ffffff' }
            });
            const hdUrl = await this.generarQrDecorado(qrDataUrl, this.QR_HD_ESCALA);
            this.dispararDescarga(hdUrl, this.QR_HD_ESCALA);
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error al generar el QR en alta resolución.' });
        }
    }

    private dispararDescarga(url: string, escala: number) {
        const link = document.createElement('a');
        link.href = url;
        const sufijo = escala > 1 ? `-hd-x${escala}` : '';
        link.download = `qr-pqrs-${this.propiedadSeleccionada?.nombre || 'propiedad'}${sufijo}.png`;
        link.click();
    }

    private async generarQrDecorado(qrDataUrl: string, escala = 1): Promise<string> {
        const baseWidth = this.QR_BASE_WIDTH;
        const baseHeight = this.QR_BASE_HEIGHT;
        const width = baseWidth * escala;
        const height = baseHeight * escala;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return qrDataUrl;

        ctx.scale(escala, escala);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, baseWidth, baseHeight);

        const headerHeight = 90;
        ctx.fillStyle = '#3da1b8';
        ctx.fillRect(0, 0, baseWidth, headerHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Segoe UI, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Integral-soft.com.co', baseWidth / 2, 55);

        const logoProyecto = await this.cargarImagen('logo_impresion2.png').catch(() => null);
        if (logoProyecto) {
            ctx.drawImage(logoProyecto, 20, 20, 48, 48);
        }

        if (this.logoEmpresaUrl) {
            const logoEmpresa = await this.cargarImagen(this.logoEmpresaUrl).catch(() => null);
            if (logoEmpresa) {
                ctx.drawImage(logoEmpresa, baseWidth - 68, 20, 48, 48);
            }
        }

        const qrSize = this.QR_BASE_QR_WIDTH;
        const qrX = (baseWidth - qrSize) / 2;
        const qrY = 125;

        const qrImg = await this.cargarImagen(qrDataUrl);
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        ctx.strokeStyle = '#3da1b8';
        ctx.lineWidth = 4;
        ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

        ctx.fillStyle = '#1a5f7a';
        ctx.font = 'bold 26px Segoe UI, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PQRS', baseWidth / 2, qrY + qrSize + 40);

        ctx.fillStyle = '#334155';
        ctx.font = '16px Segoe UI, Arial, sans-serif';
        ctx.fillText('Escanea para registrar o consultar', baseWidth / 2, qrY + qrSize + 70);

        if (this.propiedadSeleccionada) {
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Segoe UI, Arial, sans-serif';
            this.dibujarTextoAjustado(ctx, this.propiedadSeleccionada.nombre, baseWidth / 2, qrY + qrSize + 100, baseWidth - 40, 14);
        }

        ctx.fillStyle = '#dbeafe';
        ctx.fillRect(0, baseHeight - 60, baseWidth, 60);
        ctx.fillStyle = '#1e293b';
        ctx.font = '13px Segoe UI, Arial, sans-serif';
        ctx.fillText('Powered by Integral-Soft | Soluciones Integrales de Software', baseWidth / 2, baseHeight - 25);

        return canvas.toDataURL('image/png');
    }

    private dibujarTextoAjustado(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, maxWidth: number, fontSize: number): void {
        let contenido = texto || '';
        let actual = fontSize;
        ctx.font = `${actual}px Segoe UI, Arial, sans-serif`;
        while (ctx.measureText(contenido).width > maxWidth && actual > 9) {
            actual -= 1;
            ctx.font = `${actual}px Segoe UI, Arial, sans-serif`;
        }
        while (ctx.measureText(contenido).width > maxWidth && contenido.length > 3) {
            contenido = contenido.slice(0, -1);
        }
        if (contenido !== texto) {
            contenido = contenido.slice(0, -1) + '…';
        }
        ctx.fillText(contenido, x, y);
    }

    private cargarImagen(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    async renovarCodigo(propiedad: PropiedadHorizontal) {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Renovar código QR',
            message: `Al renovar el código, el QR anterior dejará de funcionar. ¿Continuar?`,
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                this.renovandoCodigo = true;
                (await this.pqrsService.renovarCodigoAcceso(propiedad.id_propiedad_horizontal)).subscribe({
                    next: (res) => {
                        this.renovandoCodigo = false;
                        if (res.state === 'OK') {
                            this.cargarPropiedades();
                            this.messageService.add({ severity: 'success', summary: 'Código renovado correctamente.' });
                        } else {
                            this.messageService.add({ severity: 'error', summary: res.msg || 'Error al renovar código.' });
                        }
                    },
                    error: () => {
                        this.renovandoCodigo = false;
                        this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
                    }
                });
            }
        });
    }

    async abrirCategorias(propiedad: PropiedadHorizontal) {
        this.propiedadSeleccionada = propiedad;
        this.categoriaForm = { requiere_correo: false };
        this.isEditCategoria = false;
        await this.cargarCategorias();
        this.displayCategoriasDialog = true;
    }

    async cargarCategorias() {
        if (!this.propiedadSeleccionada) return;
        (await this.pqrsService.getCategoriasPorPropiedad(this.propiedadSeleccionada.id_propiedad_horizontal)).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.categorias = res.body || [];
                }
            }
        });
    }

    editarCategoria(categoria: CategoriaPqrs) {
        this.isEditCategoria = true;
        this.categoriaForm = { ...categoria };
    }

    async guardarCategoria() {
        if (!this.propiedadSeleccionada) return;
        if (!this.categoriaForm.nombre) {
            this.messageService.add({ severity: 'warn', summary: 'El nombre de la categoría es obligatorio.' });
            return;
        }

        const payload = {
            ...this.categoriaForm,
            id_propiedad_horizontal: this.propiedadSeleccionada.id_propiedad_horizontal
        };

        const request = this.isEditCategoria
            ? this.pqrsService.actualizarCategoria(payload)
            : this.pqrsService.crearCategoria(payload);

        this.guardandoCategoria = true;
        (await request).subscribe({
            next: (res) => {
                this.guardandoCategoria = false;
                if (res.state === 'OK') {
                    this.categoriaForm = { requiere_correo: false };
                    this.isEditCategoria = false;
                    this.cargarCategorias();
                    this.messageService.add({ severity: 'success', summary: this.isEditCategoria ? 'Categoría actualizada.' : 'Categoría creada.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al guardar categoría.' });
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
            }
        });
    }

    async inactivarCategoria(categoria: CategoriaPqrs) {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Cambiar estado',
            message: `¿Estás seguro de cambiar el estado de "${categoria.nombre}"?`,
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                this.inactivandoCategoria = true;
                (await this.pqrsService.inactivarCategoria(categoria.id_categoria_pqrs)).subscribe({
                    next: (res) => {
                        this.inactivandoCategoria = false;
                        if (res.state === 'OK') {
                            this.cargarCategorias();
                            this.messageService.add({ severity: 'success', summary: 'Estado actualizado.' });
                        } else {
                            this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cambiar estado.' });
                        }
                    },
                    error: () => {
                        this.inactivandoCategoria = false;
                        this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
                    }
                });
            }
        });
    }
}
