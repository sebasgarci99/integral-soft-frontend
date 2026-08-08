import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
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
        InputTextModule, InputTextarea, ToastModule, ConfirmDialogModule, TooltipModule
    ],
    templateUrl: './propiedades-horizontales.component.html',
    styleUrls: ['./propiedades-horizontales.component.css'],
    providers: [MessageService, ConfirmationService]
})
export class PropiedadesHorizontalesComponent implements OnInit {

    propiedades: PropiedadHorizontal[] = [];
    loadingPropiedades = false;
    loadingGuardar = false;
    loadingEliminar = false;
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
    private readonly QR_BASE_QR_WIDTH = 260;
    private readonly QR_HD_ESCALA = 3;

    getGoogleMapsEmbedUrl = getGoogleMapsEmbedUrl;


    getSafeMapsUrl(url?: string | null): SafeResourceUrl {
        return this.sanitizer.bypassSecurityTrustResourceUrl(getGoogleMapsEmbedUrl(url) || '');
    }

    categorias: CategoriaPqrs[] = [];
    categoriaForm: Partial<CategoriaPqrs> = {};
    isEditCategoria = false;

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
        this.loadingPropiedades = true;
        (await this.pqrsService.getPropiedadesHorizontales()).subscribe({
            next: (res) => {
                this.loadingPropiedades = false;
                if (res.state === 'OK') {
                    this.propiedades = res.body || [];
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cargar propiedades.' });
                }
            },
            error: () => {
                this.loadingPropiedades = false;
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
            this.qrDataUrl = await QRCode.toDataURL(this.qrUrl, { width: this.QR_BASE_QR_WIDTH, margin: 1, color: { dark: '#1a5f7a', light: '#ffffff' } });
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
                margin: 1,
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

        const qrImg = await this.cargarImagen(qrDataUrl);
        ctx.drawImage(qrImg, (baseWidth - 260) / 2, 130, 260, 260);

        ctx.strokeStyle = '#3da1b8';
        ctx.lineWidth = 4;
        ctx.strokeRect((baseWidth - 260) / 2 - 10, 120, 280, 280);

        ctx.fillStyle = '#1a5f7a';
        ctx.font = 'bold 26px Segoe UI, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PQRS', baseWidth / 2, 450);

        ctx.fillStyle = '#334155';
        ctx.font = '16px Segoe UI, Arial, sans-serif';
        ctx.fillText('Escanea para registrar o consultar', baseWidth / 2, 480);

        if (this.propiedadSeleccionada) {
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Segoe UI, Arial, sans-serif';
            ctx.fillText(this.propiedadSeleccionada.nombre, baseWidth / 2, 515);
        }

        ctx.fillStyle = '#dbeafe';
        ctx.fillRect(0, baseHeight - 60, baseWidth, 60);
        ctx.fillStyle = '#1e293b';
        ctx.font = '13px Segoe UI, Arial, sans-serif';
        ctx.fillText('Powered by Integral-Soft | Soluciones Integrales de Software', baseWidth / 2, baseHeight - 25);

        return canvas.toDataURL('image/png');
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
                (await this.pqrsService.renovarCodigoAcceso(propiedad.id_propiedad_horizontal)).subscribe({
                    next: (res) => {
                        if (res.state === 'OK') {
                            this.cargarPropiedades();
                            this.messageService.add({ severity: 'success', summary: 'Código renovado correctamente.' });
                        } else {
                            this.messageService.add({ severity: 'error', summary: res.msg || 'Error al renovar código.' });
                        }
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
                    }
                });
            }
        });
    }

    async abrirCategorias(propiedad: PropiedadHorizontal) {
        this.propiedadSeleccionada = propiedad;
        this.categoriaForm = {};
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

        (await request).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.categoriaForm = {};
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
                (await this.pqrsService.inactivarCategoria(categoria.id_categoria_pqrs)).subscribe({
                    next: (res) => {
                        if (res.state === 'OK') {
                            this.cargarCategorias();
                            this.messageService.add({ severity: 'success', summary: 'Estado actualizado.' });
                        } else {
                            this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cambiar estado.' });
                        }
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
                    }
                });
            }
        });
    }
}
