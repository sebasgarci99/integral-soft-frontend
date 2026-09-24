import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PosService } from '../../../services/pos/pos.service';
import { PosConfiguracion, PosResolucion } from '../../../interfaces/pos';

@Component({
    selector: 'app-configuracion-pos',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, InputNumberModule,
              DropdownModule, CheckboxModule, DialogModule, ToastModule, TagModule, ConfirmDialogModule],
    templateUrl: './configuracion-pos.component.html',
    styleUrls: ['./configuracion-pos.component.css'],
    providers: [MessageService, ConfirmationService]
})
export class ConfiguracionPosComponent implements OnInit {

    config: PosConfiguracion = {
        tipo_numeracion: 'INTERNO',
        prefijo: 'POS-',
        aplica_iva_default: false,
        porcentaje_iva_default: 19,
        precio_incluye_iva_default: true,
        dias_validez_enlace: 7
    };

    tiposNumeracion = [
        { label: 'Interno (no fiscal)', value: 'INTERNO' },
        { label: 'Resolución DIAN', value: 'DIAN' }
    ];

    resoluciones: PosResolucion[] = [];
    displayResolucion = false;
    nuevaResolucion: Partial<PosResolucion> = {};
    loading = false;
    guardandoResolucion = false;
    logoError = '';

    constructor(
        private posService: PosService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.cargar();
        this.cargarResoluciones();
    }

    async cargar() {
        (await this.posService.getConfiguracion()).subscribe({
            next: (res) => {
                if (res.state === 'OK' && res.body) {
                    this.config = { ...this.config, ...res.body };
                }
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error al cargar la configuración.' })
        });
    }

    async cargarResoluciones() {
        (await this.posService.getResoluciones()).subscribe({
            next: (res) => {
                if (res.state === 'OK') this.resoluciones = res.body || [];
            }
        });
    }

    // ---------------- Logo ----------------

    onLogoSeleccionado(event: Event) {
        const input = event.target as HTMLInputElement;
        const archivo = input.files?.[0];
        if (!archivo) return;

        this.logoError = '';

        if (!archivo.type.startsWith('image/')) {
            this.logoError = 'El archivo debe ser una imagen.';
            return;
        }
        if (archivo.size > 500 * 1024) {
            this.logoError = 'La imagen supera 500 KB. Usa una más liviana.';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            this.config.logo_base64 = reader.result as string;
            input.value = '';
        };
        reader.onerror = () => {
            this.logoError = 'No se pudo leer la imagen.';
        };
        reader.readAsDataURL(archivo);
    }

    quitarLogo() {
        this.config.logo_base64 = null;
        this.logoError = '';
    }

    // ---------------- Configuración ----------------

    async guardar() {
        this.loading = true;
        (await this.posService.actualizarConfiguracion(this.config)).subscribe({
            next: (res) => {
                this.loading = false;
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Configuración guardada.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al guardar.' });
                }
            },
            error: () => {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Error al guardar la configuración.' });
            }
        });
    }

    // ---------------- Resoluciones ----------------

    abrirNuevaResolucion() {
        this.nuevaResolucion = {
            tipo_numeracion: 'INTERNO',
            prefijo: 'POS-',
            rango_desde: 1,
            rango_hasta: 999999999
        };
        this.displayResolucion = true;
    }

    get esResolucionDian(): boolean {
        return this.nuevaResolucion.tipo_numeracion === 'DIAN';
    }

    guardarResolucion() {
        const r = this.nuevaResolucion;

        if (!r.prefijo?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'El prefijo es obligatorio.' });
            return;
        }
        if (r.rango_desde === null || r.rango_desde === undefined || r.rango_hasta === null || r.rango_hasta === undefined
            || Number(r.rango_hasta) < Number(r.rango_desde)) {
            this.messageService.add({ severity: 'warn', summary: 'El rango de numeración no es válido.' });
            return;
        }
        if (r.tipo_numeracion === 'DIAN' && !r.numero_resolucion?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Ingresa el número de resolución DIAN.' });
            return;
        }

        this.guardandoResolucion = true;
        this.posService.crearResolucion(r).then(obs$ => {
            obs$.subscribe({
                next: (res) => {
                    this.guardandoResolucion = false;
                    if (res.state === 'OK') {
                        this.displayResolucion = false;
                        this.cargarResoluciones();
                        this.messageService.add({ severity: 'success', summary: 'Resolución creada y activada.' });
                    } else {
                        this.messageService.add({ severity: 'error', summary: res.msg || 'Error al crear la resolución.' });
                    }
                },
                error: (err) => {
                    this.guardandoResolucion = false;
                    this.messageService.add({ severity: 'error', summary: err.error?.msg || 'Error al crear la resolución.' });
                }
            });
        });
    }

    activarResolucion(resolucion: PosResolucion) {
        this.posService.activarResolucion(resolucion.id_resolucion).then(obs$ => {
            obs$.subscribe({
                next: (res) => {
                    if (res.state === 'OK') {
                        this.cargarResoluciones();
                        this.messageService.add({ severity: 'success', summary: `Resolución ${resolucion.prefijo} activada.` });
                    } else {
                        this.messageService.add({ severity: 'error', summary: res.msg || 'No se pudo activar.' });
                    }
                },
                error: (err) => this.messageService.add({ severity: 'error', summary: err.error?.msg || 'No se pudo activar.' })
            });
        });
    }

    inactivarResolucion(resolucion: PosResolucion) {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Inactivar resolución',
            message: `¿Inactivar la resolución "${resolucion.prefijo}"? No se perderá el histórico.`,
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.posService.inactivarResolucion(resolucion.id_resolucion).then(obs$ => {
                    obs$.subscribe({
                        next: (res) => {
                            if (res.state === 'OK') {
                                this.cargarResoluciones();
                                this.messageService.add({ severity: 'success', summary: 'Resolución inactivada.' });
                            }
                        }
                    });
                });
            }
        });
    }

    rangoResolucion(r: PosResolucion): string {
        return `${r.prefijo}${String(r.rango_desde).padStart(6, '0')} — ${r.prefijo}${String(r.rango_hasta).padStart(6, '0')}`;
    }

    estadoSeverity(estado: string): 'success' | 'warning' | 'danger' | 'info' {
        switch (estado) {
            case 'ACTIVA': return 'success';
            case 'AGOTADA': return 'warning';
            case 'VENCIDA': return 'danger';
            default: return 'info';
        }
    }
}
