import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { AccordionModule } from 'primeng/accordion';
import { BadgeModule } from 'primeng/badge';
import { ConfirmationService, MessageService } from 'primeng/api';
import { firstValueFrom, forkJoin } from 'rxjs';
import QRCode from 'qrcode';
import { InventarioService } from '../../../services/inventario/inventario.service';
import { PosService } from '../../../services/pos/pos.service';
import { Producto, Grupo, Categoria, UnidadMedida } from '../../../interfaces/inventario';
import { parseDateSinTimezone, formatDateLocal } from '../../../utils/fecha.util';

@Component({
    selector: 'app-productos-inv',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
              InputTextModule, InputNumberModule, InputTextarea, ToastModule, ConfirmDialogModule,
              DropdownModule, CheckboxModule, AccordionModule, BadgeModule],
    templateUrl: './productos.component.html',
    styleUrls: ['./productos.component.css'],
    providers: [MessageService, ConfirmationService]
})
export class ProductosComponent implements OnInit {

    productos: Producto[] = [];
    grupos: Grupo[] = [];
    categorias: Categoria[] = [];
    unidades: UnidadMedida[] = [];
    displayDialog: boolean = false;
    isEdit: boolean = false;

    formData: any = {};

    selectedGrupo: Grupo | null = null;
    selectedCategoria: Categoria | null = null;

    loadingGuardar: boolean = false;
    loadingEliminar: boolean = false;

    perfilesNormativos = [
        { label: 'Otro / No aplica', value: 'OTRO' },
        { label: 'Medicamento', value: 'MEDICAMENTO' },
        { label: 'Dispositivo médico', value: 'DISPOSITIVO_MEDICO' },
        { label: 'Reactivo in vitro', value: 'REACTIVO' }
    ];

    @ViewChild('tablaProductos') tablaProductos?: Table;

    private nombreNegocioCache: string | null = null;

    constructor(
        private inventarioService: InventarioService,
        private posService: PosService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.cargarDatosIniciales();
    }

    async cargarDatosIniciales() {
        try {
            const [grupos$, categorias$, unidades$] = await Promise.all([
                this.inventarioService.getGrupos(),
                this.inventarioService.getCategorias(),
                this.inventarioService.getUnidadesMedida()
            ]);

            forkJoin([grupos$, categorias$, unidades$]).subscribe({
                next: ([resGrupos, resCategorias, resUnidades]) => {
                    if (resGrupos.state === 'OK') {
                        this.grupos = resGrupos.body || [];
                    }

                    if (resCategorias.state === 'OK') {
                        this.categorias = resCategorias.body || [];
                    }

                    if (resUnidades.state === 'OK') {
                        this.unidades = resUnidades.body || [];
                    }
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
                }
            });
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
        }
    }

    aplicarFiltroGlobal(event: Event) {
        const valor = (event.target as HTMLInputElement).value;
        if (this.tablaProductos) {
            this.tablaProductos.filterGlobal(valor, 'contains');
        }
    }

    async cargarProductos() {
        const filtros: Record<string, unknown> = {};
        if (this.selectedGrupo) filtros['id_grupo'] = this.selectedGrupo.id_grupo_producto;
        if (this.selectedCategoria) filtros['id_categoria'] = this.selectedCategoria.id_categoria_producto;

        (await this.inventarioService.getProductos(filtros)).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.productos = res.body || [];
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cargar los productos.' });
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error de conexión. Intente nuevamente.' });
            }
        });
    }

    async cargarGrupos() {
        (await this.inventarioService.getGrupos()).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.grupos = res.body || [];
                }
            }
        });
    }

    async cargarCategorias(idGrupo?: number) {
        (await this.inventarioService.getCategorias(idGrupo)).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.categorias = res.body || [];
                }
            }
        });
    }

    async cargarUnidades() {
        (await this.inventarioService.getUnidadesMedida()).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.unidades = res.body || [];
                }
            }
        });
    }

    seleccionarGrupo(grupo: Grupo) {
        if (this.selectedGrupo && this.selectedGrupo.id_grupo_producto === grupo.id_grupo_producto) {
            this.selectedGrupo = null;
            this.selectedCategoria = null;
            this.categorias = [];
            this.productos = [];
            return;
        }
        this.selectedGrupo = grupo;
        this.selectedCategoria = null;
        this.cargarCategorias(grupo.id_grupo_producto);
        this.cargarProductos();
    }

    obtenerClaseGradiente(index: number): string {
        return `grupo-gradient-${(index % 8) + 1}`;
    }

    onCategoriaChange() {
        this.cargarProductos();
    }

    limpiarFiltros() {
        this.selectedGrupo = null;
        this.selectedCategoria = null;
        this.categorias = [];
        this.productos = [];
    }

    async abrirFormulario() {
        this.isEdit = false;
        this.formData = {
            id_grupo_producto: this.selectedGrupo?.id_grupo_producto,
            perfil_normativo: 'OTRO',
            maneja_lote: false,
            maneja_vencimiento: false,
            stock_minimo: 0,
            stock_maximo: 0,
            precio_compra: 0,
            precio_venta: 0,
            aplica_iva: false,
            porcentaje_iva: 0,
            precio_incluye_iva: true
        };
        await this.cargarCategorias(this.selectedGrupo?.id_grupo_producto);
        this.displayDialog = true;
    }

    async editarProducto(producto: Producto) {
        this.isEdit = true;
        this.formData = {
            ...producto,
            id_grupo_producto: producto.Categoria?.Grupo?.id_grupo_producto
        };
        await this.cargarCategorias(producto.Categoria?.Grupo?.id_grupo_producto);
        this.onPerfilNormativoChange();
        this.displayDialog = true;
    }

    borrarProducto(producto: Producto) {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Inactivar producto',
            message: `¿Estás seguro de inactivar "${producto.nombre}"?`,
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                this.loadingEliminar = true;
                (await this.inventarioService.inactivarProducto(producto.id_producto)).subscribe({
                    next: (res) => {
                        this.loadingEliminar = false;
                        if (res.state === 'OK') {
                            this.cargarProductos();
                            this.messageService.add({ severity: 'success', summary: 'Producto inactivado.' });
                        } else {
                            this.messageService.add({ severity: 'error', summary: res.msg || 'Error al inactivar el producto.' });
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

    async guardar() {
        if (!this.formData.codigo || !this.formData.nombre || !this.formData.id_categoria_producto || !this.formData.id_unidad_medida) {
            this.messageService.add({ severity: 'warn', summary: 'Campos requeridos: Código, Nombre, Categoría y Unidad de Medida' });
            return;
        }

        const erroresPerfil = this.validarCamposPorPerfil();
        if (erroresPerfil) {
            this.messageService.add({ severity: 'warn', summary: erroresPerfil });
            return;
        }

        await this.guardarDefinitivo();
    }

    private validarCamposPorPerfil(): string | null {
        const perfil = this.formData.perfil_normativo;
        if (!perfil || perfil === 'OTRO') return null;

        const camposVacios: string[] = [];

        if (perfil === 'MEDICAMENTO') {
            if (!this.formData.principio_activo?.trim()) camposVacios.push('principio activo');
            if (!this.formData.forma_farmaceutica?.trim()) camposVacios.push('forma farmacéutica');
            if (!this.formData.concentracion?.trim()) camposVacios.push('concentración');
            if (!this.formData.presentacion_comercial?.trim()) camposVacios.push('presentación comercial');
            if (!this.formData.registro_sanitario_invima?.trim()) camposVacios.push('registro sanitario vigente o permiso expedido por el Invima');
        } else if (perfil === 'DISPOSITIVO_MEDICO') {
            if (!this.formData.marca?.trim()) camposVacios.push('marca del dispositivo');
            if (!this.formData.presentacion_comercial?.trim()) camposVacios.push('presentación comercial');
            if (!this.formData.registro_sanitario_invima?.trim()) camposVacios.push('registro sanitario vigente o permiso de comercialización expedido por el Invima');
            if (!this.formData.clasificacion_riesgo?.trim()) camposVacios.push('clasificación por riesgo');
        } else if (perfil === 'REACTIVO') {
            if (!this.formData.marca?.trim()) camposVacios.push('marca');
            if (!this.formData.presentacion_comercial?.trim()) camposVacios.push('presentación comercial');
            if (!this.formData.registro_sanitario_invima?.trim()) camposVacios.push('registro sanitario vigente o permiso de comercialización expedido por el Invima');
            if (!this.formData.clasificacion_riesgo?.trim()) camposVacios.push('clasificación del riesgo sanitario');
        }

        if (camposVacios.length > 0) {
            return `Para el perfil ${this.obtenerEtiquetaPerfil(perfil)}, los siguientes campos son obligatorios: ${camposVacios.join(', ')}`;
        }

        return null;
    }

    private async guardarDefinitivo() {
        this.loadingGuardar = true;
        if (this.isEdit) {
            (await this.inventarioService.actualizarProducto(this.formData)).subscribe({
                next: (res) => {
                    this.loadingGuardar = false;
                    if (res.state === 'OK') {
                        this.cargarProductos();
                        this.displayDialog = false;
                        this.messageService.add({ severity: 'success', summary: 'Producto actualizado correctamente.' });
                    } else {
                        this.messageService.add({ severity: 'error', summary: res.msg || 'Error al actualizar el producto.' });
                    }
                },
                error: (err) => {
                    this.loadingGuardar = false;
                    const msg = err.error?.msg || err.error?.message || 'Error de conexión. Intente nuevamente.';
                    this.messageService.add({ severity: 'error', summary: msg });
                }
            });
        } else {
            (await this.inventarioService.crearProducto(this.formData)).subscribe({
                next: (res) => {
                    this.loadingGuardar = false;
                    if (res.state === 'OK') {
                        this.cargarProductos();
                        this.displayDialog = false;
                        this.messageService.add({ severity: 'success', summary: 'Producto creado correctamente.' });
                    } else {
                        this.messageService.add({ severity: 'error', summary: res.msg || 'Error al crear el producto.' });
                    }
                },
                error: (err) => {
                    this.loadingGuardar = false;
                    const msg = err.error?.msg || err.error?.message || 'Error de conexión. Intente nuevamente.';
                    this.messageService.add({ severity: 'error', summary: msg });
                }
            });
        }
    }

    esPerfilMedicamento(): boolean {
        return this.formData.perfil_normativo === 'MEDICAMENTO';
    }

    esPerfilDispositivo(): boolean {
        return this.formData.perfil_normativo === 'DISPOSITIVO_MEDICO';
    }

    esPerfilReactivo(): boolean {
        return this.formData.perfil_normativo === 'REACTIVO';
    }

    esPerfilNormativo(): boolean {
        return this.esPerfilMedicamento() || this.esPerfilDispositivo() || this.esPerfilReactivo();
    }

    obtenerEtiquetaPerfil(perfil: string): string {
        const p = this.perfilesNormativos.find(x => x.value === perfil);
        return p ? p.label : 'Otro / No aplica';
    }

    onPerfilNormativoChange(): void {
        if (this.esPerfilNormativo()) {
            this.formData.maneja_lote = true;
            this.formData.maneja_vencimiento = true;
        } else {
            this.formData.maneja_lote = false;
            this.formData.maneja_vencimiento = false;
        }
    }

    // ---------------- Código QR ----------------

    private formatoMoneda(valor: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 2
        }).format(valor || 0);
    }

    private async obtenerNombreNegocio(): Promise<string> {
        if (this.nombreNegocioCache !== null) return this.nombreNegocioCache;
        try {
            const res: any = await firstValueFrom(await this.posService.getConfiguracion());
            this.nombreNegocioCache = res?.body?.nombre_negocio || 'Mi negocio';
        } catch {
            this.nombreNegocioCache = 'Mi negocio';
        }
        return this.nombreNegocioCache || 'Mi negocio';
    }

    async imprimirQr(producto: Producto) {
        try {
            const codigo = (producto.codigo_barras && String(producto.codigo_barras).trim())
                ? String(producto.codigo_barras)
                : String(producto.codigo);

            const [qrDataUrl, negocio] = await Promise.all([
                QRCode.toDataURL(codigo, { margin: 1, width: 360, errorCorrectionLevel: 'M' }),
                this.obtenerNombreNegocio()
            ]);

            const precio = this.formatoMoneda(parseFloat(String(producto.precio_venta ?? 0)) || 0);
            const html = this.generarHtmlEtiqueta(qrDataUrl, negocio, producto.nombre, codigo, precio);

            const ventana = window.open('', '_blank');
            if (!ventana) return;
            ventana.document.write(html);
            ventana.document.close();
            setTimeout(() => ventana.print(), 400);
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'No se pudo generar el código QR.' });
        }
    }

    private generarHtmlEtiqueta(qr: string, negocio: string, nombre: string, codigo: string, precio: string): string {
        const esc = (v: string) => String(v ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Etiqueta ${esc(codigo)}</title>
<style>
    @page { size: auto; margin: 8mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; }
    .etiqueta {
        width: 62mm; padding: 4mm; border: 1px dashed #cbd5e1; border-radius: 4mm;
        text-align: center; margin: 0;
    }
    .negocio { font-size: 9pt; font-weight: 700; color: #0d8aa6; text-transform: uppercase; letter-spacing: .03em; margin-bottom: 2mm; }
    .qr { width: 42mm; height: 42mm; margin: 0 auto; display: block; }
    .nombre { font-size: 10pt; font-weight: 600; color: #1e293b; margin-top: 2mm; line-height: 1.2; }
    .codigo { font-size: 8.5pt; color: #475569; margin-top: 1mm; word-break: break-all; }
    .precio { font-size: 13pt; font-weight: 800; color: #005f99; margin-top: 1.5mm; }
</style>
</head>
<body>
    <div class="etiqueta">
        <div class="negocio">${esc(negocio)}</div>
        <img class="qr" src="${qr}" alt="QR" />
        <div class="nombre">${esc(nombre)}</div>
        <div class="codigo">${esc(codigo)}</div>
        <div class="precio">${esc(precio)}</div>
    </div>
</body>
</html>`;
    }
}
