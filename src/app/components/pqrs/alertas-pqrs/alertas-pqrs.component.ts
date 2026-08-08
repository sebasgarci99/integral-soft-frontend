import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PqrsPropiedadesService } from '../../../services/pqrs/pqrs-propiedades.service';
import { PqrsAlertasService } from '../../../services/pqrs/pqrs-alertas.service';
import { PropiedadHorizontal, AlertaConfigPqrs } from '../../../interfaces/pqrs';

@Component({
    selector: 'app-alertas-pqrs',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
        InputTextModule, DropdownModule, CheckboxModule, ToastModule
    ],
    templateUrl: './alertas-pqrs.component.html',
    styleUrls: ['./alertas-pqrs.component.css'],
    providers: [MessageService]
})
export class AlertasPqrsComponent implements OnInit {

    propiedades: PropiedadHorizontal[] = [];
    propiedadSeleccionada: PropiedadHorizontal | null = null;
    alertas: AlertaConfigPqrs[] = [];

    displayDialog = false;
    isEdit = false;
    formData: Partial<AlertaConfigPqrs> = {
        condicion: { tipo: 'RADICADO_SIN_CATEGORIZAR' },
        tipo_alerta: 'ROJA',
        dias_umbral: 15
    };

    cargando = false;
    guardando = false;

    tiposCondicion = [
        { label: 'Radicado sin categorizar', value: 'RADICADO_SIN_CATEGORIZAR' },
        { label: 'Tiene avances', value: 'CON_AVANCES' },
        { label: 'Días sin movimiento', value: 'DIAS_SIN_MOVIMIENTO' }
    ];

    tiposAlerta = [
        { label: 'Roja', value: 'ROJA' },
        { label: 'Amarilla', value: 'AMARILLA' },
        { label: 'Verde', value: 'VERDE' }
    ];

    constructor(
        private propiedadesService: PqrsPropiedadesService,
        private alertasService: PqrsAlertasService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.cargarPropiedades();
    }

    async cargarPropiedades() {
        this.cargando = true;
        (await this.propiedadesService.getPropiedadesHorizontales()).subscribe({
            next: (res) => {
                this.cargando = false;
                if (res.state === 'OK') {
                    this.propiedades = res.body || [];
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cargar propiedades.' });
                }
            },
            error: () => {
                this.cargando = false;
                this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
            }
        });
    }

    async onPropiedadChange() {
        if (!this.propiedadSeleccionada) {
            this.alertas = [];
            return;
        }
        await this.cargarAlertas();
    }

    async cargarAlertas() {
        if (!this.propiedadSeleccionada) return;
        this.cargando = true;
        (await this.alertasService.listarAlertasPorPropiedad(this.propiedadSeleccionada.id_propiedad_horizontal)).subscribe({
            next: (res) => {
                this.cargando = false;
                if (res.state === 'OK') {
                    this.alertas = res.body || [];
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cargar alertas.' });
                }
            },
            error: () => {
                this.cargando = false;
                this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
            }
        });
    }

    async inicializarAlertasPorDefecto() {
        if (!this.propiedadSeleccionada) return;
        (await this.alertasService.inicializarAlertasPorDefecto(this.propiedadSeleccionada.id_propiedad_horizontal)).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.alertas = res.body || [];
                    this.messageService.add({ severity: 'success', summary: 'Alertas por defecto creadas.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al inicializar alertas.' });
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
            }
        });
    }

    abrirFormulario() {
        this.isEdit = false;
        this.formData = {
            id_propiedad_horizontal: this.propiedadSeleccionada?.id_propiedad_horizontal,
            condicion: { tipo: 'RADICADO_SIN_CATEGORIZAR' },
            tipo_alerta: 'ROJA',
            dias_umbral: 15,
            orden: 0
        };
        this.displayDialog = true;
    }

    editarAlerta(alerta: AlertaConfigPqrs) {
        this.isEdit = true;
        this.formData = { ...alerta };
        this.displayDialog = true;
    }

    async guardar() {
        if (!this.propiedadSeleccionada || !this.formData.nombre_condicion || !this.formData.tipo_alerta) {
            this.messageService.add({ severity: 'warn', summary: 'Complete los campos obligatorios.' });
            return;
        }

        const payload = {
            ...this.formData,
            id_propiedad_horizontal: this.propiedadSeleccionada.id_propiedad_horizontal
        };

        this.guardando = true;
        (await this.alertasService.guardarAlerta(payload)).subscribe({
            next: (res) => {
                this.guardando = false;
                if (res.state === 'OK') {
                    this.displayDialog = false;
                    this.cargarAlertas();
                    this.messageService.add({ severity: 'success', summary: this.isEdit ? 'Alerta actualizada.' : 'Alerta creada.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al guardar alerta.' });
                }
            },
            error: () => {
                this.guardando = false;
                this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
            }
        });
    }

    async inactivarAlerta(alerta: AlertaConfigPqrs) {
        (await this.alertasService.inactivarAlerta(alerta.id_alerta_config)).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.cargarAlertas();
                    this.messageService.add({ severity: 'success', summary: 'Estado actualizado.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cambiar estado.' });
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
            }
        });
    }

    onTipoCondicionChange() {
        const tipo = this.formData.condicion?.tipo;
        if (tipo !== 'DIAS_SIN_MOVIMIENTO') {
            this.formData.dias_umbral = undefined;
        } else if (!this.formData.dias_umbral) {
            this.formData.dias_umbral = 15;
        }
    }

    getLabelTipoCondicion(tipo?: string): string {
        const c = this.tiposCondicion.find(x => x.value === tipo);
        return c ? c.label : tipo || '';
    }

    getClaseBadge(tipoAlerta?: string): string {
        if (tipoAlerta === 'ROJA') return 'badge bg-danger';
        if (tipoAlerta === 'AMARILLA') return 'badge bg-warning text-dark';
        if (tipoAlerta === 'VERDE') return 'badge bg-success';
        return 'badge bg-light text-dark';
    }
}
