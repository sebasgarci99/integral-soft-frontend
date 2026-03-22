import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from "../sidebar/sidebar.component";

import { CuentasCobroService } from '../../services/cuentas-cobro/cuentas-cobro.service';
import { ClienteService } from '../../services/cliente/cliente.service';
import { CuentaCobro, Cliente } from '../../interfaces/cuenta-cobro';
import { ConfirmationService, MessageService } from 'primeng/api';

import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { HttpClientModule } from '@angular/common/http';
import { PaginatorModule } from 'primeng/paginator';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { InputTextarea } from 'primeng/inputtextarea';
import { RadioButtonModule } from 'primeng/radiobutton';

@Component({
    selector: 'app-cuentas-cobro',
    standalone: true,
    imports: [
        SidebarComponent,
        CommonModule,
        FormsModule,
        HttpClientModule,
        TableModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        ToastModule,
        ConfirmDialogModule,
        PaginatorModule,
        FloatLabelModule,
        DropdownModule,
        InputNumberModule,
        CalendarModule,
        InputTextarea,
        RadioButtonModule
    ],
    templateUrl: './cuentas-cobro.component.html',
    styleUrl: './cuentas-cobro.component.css',
    providers: [MessageService, ConfirmationService]
})
export class CuentasCobroComponent implements OnInit {
    cuentasCobro: CuentaCobro[] = [];
    clientes: Cliente[] = [];
    displayDialog: boolean = false;

    formData: any = {
        fecha_emision: null,
        id_cliente: null,
        descripcion_servicio: '',
        valor_cobrar: null,
        configurar_periodicidad: false,
        periodicidad: 'mensual',
        dia_del_mes: 1,
        hora_ejecucion: null
    };

    opcionesPeriodicidad = [
        { label: 'Diaria', value: 'diaria' },
        { label: 'Semanal', value: 'semanal' },
        { label: 'Quincenal', value: 'quincenal' },
        { label: 'Mensual', value: 'mensual' }
    ];

    constructor(
        private cuentasCobroService: CuentasCobroService,
        private clienteService: ClienteService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.cargarCuentasCobro();
        this.cargarClientes();
    }

    cargarCuentasCobro() {
        this.cuentasCobroService.obtenerCuentasCobro().subscribe({
            next: (data) => {
                this.cuentasCobro = data;
            },
            error: (err) => {
                console.error('Error al cargar cuentas de cobro:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cuentas de cobro.' });
            }
        });
    }

    cargarClientes() {
        this.clienteService.obtenerDatosClientes().subscribe({
            next: (data) => {
                this.clientes = data;
            },
            error: (err) => {
                console.error('Error al cargar clientes:', err);
            }
        });
    }

    abrirFormulario() {
        this.formData = {
            fecha_emision: null,
            id_cliente: null,
            descripcion_servicio: '',
            valor_cobrar: null,
            configurar_periodicidad: false,
            periodicidad: 'mensual',
            dia_del_mes: 1,
            hora_ejecucion: null
        };
        this.displayDialog = true;
    }

    cerrarDialogo() {
        this.displayDialog = false;
    }

    crearCuentaCobro() {
        if (!this.validarFormulario()) {
            return;
        }

        let dataToSend: any = {
            id_cliente: this.formData.id_cliente,
            descripcion_servicio: this.formData.descripcion_servicio,
            valor_cobrar: this.formData.valor_cobrar,
            fecha_emision: this.formatearFechaEnvio(this.formData.fecha_emision),
            configurar_periodicidad: this.formData.configurar_periodicidad
        };

        if (this.formData.configurar_periodicidad) {
            dataToSend.periodicidad = this.formData.periodicidad;
            dataToSend.dia_del_mes = this.formData.dia_del_mes;
            dataToSend.hora_ejecucion = this.formData.hora_ejecucion ? this.formData.hora_ejecucion.getHours() : 8;
        }

        this.cuentasCobroService.crearCuentaCobro(dataToSend).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta de cobro creada correctamente.' });
                    this.cargarCuentasCobro();
                    this.cerrarDialogo();
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un problema: ' + res.body });
                }
            },
            error: (err) => {
                console.error('Error al crear cuenta de cobro:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la cuenta de cobro.' });
            }
        });
    }

    validarFormulario(): boolean {
        if (!this.formData.id_cliente) {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Debe seleccionar un cliente.' });
            return false;
        }
        if (!this.formData.descripcion_servicio || this.formData.descripcion_servicio.trim() === '') {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'La descripción del servicio es requerida.' });
            return false;
        }
        if (!this.formData.valor_cobrar || this.formData.valor_cobrar <= 0) {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'El valor a cobrar debe ser mayor a 0.' });
            return false;
        }
        if (!this.formData.fecha_emision) {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'La fecha de emisión es requerida.' });
            return false;
        }
        return true;
    }

    formatearFechaEnvio(date: any): string {
        if (!date) return '';
        if (date instanceof Date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return date;
    }

    inactivarCuentaCobro(id: number) {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Inactivar cuenta de cobro',
            message: '¿Estás seguro de inactivar esta cuenta de cobro?',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.cuentasCobroService.inactivarCuentaCobro(id).subscribe({
                    next: (res) => {
                        if (res.state === 'OK') {
                            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta de cobro inactivada.' });
                            this.cargarCuentasCobro();
                        } else {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un problema: ' + res.body });
                        }
                    },
                    error: (err) => {
                        console.error('Error al inactivar cuenta de cobro:', err);
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo inactivar la cuenta de cobro.' });
                    }
                });
            }
        });
    }

    generarPdf(id: number) {
        this.cuentasCobroService.generarPdf(id);
    }

    formatearValor(valor: string | number): string {
        const num = typeof valor === 'string' ? parseFloat(valor) : valor;
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP'
        }).format(num);
    }

    formatearFecha(fecha: string): string {
        if (!fecha) return '';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-CO');
    }

    formatearPeriodicidad(periodicidad: any): string {
        if (!periodicidad) return 'Sin periodicidad';
        return periodicidad.periodicidad ? periodicidad.periodicidad.charAt(0).toUpperCase() + periodicidad.periodicidad.slice(1) : 'Sin periodicidad';
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    onValorInput(event: any) {
        const value = event.target.value.replace(/[^0-9]/g, '');
        if (value) {
            this.formData.valor_cobrar = parseInt(value, 10);
        } else {
            this.formData.valor_cobrar = null;
        }
    }

    formatearValorInput(value: number | null): string {
        if (!value) return '';
        return this.formatCurrency(value);
    }
}
