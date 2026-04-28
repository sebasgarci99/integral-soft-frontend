import { Component, OnInit } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { RouterModule } from '@angular/router';

import { CuentasCobroService } from '../../services/cuentas-cobro/cuentas-cobro.service';
import { ClienteService } from '../../services/cliente/cliente.service';
import { CuentaCobro, Cliente, LogTarea } from '../../interfaces/cuenta-cobro';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

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
import { TabMenuModule } from 'primeng/tabmenu';
import { Checkbox } from 'primeng/checkbox';

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
        RadioButtonModule,
        TabMenuModule,
        Checkbox,
        TooltipModule,
        RouterModule
    ],
    templateUrl: './cuentas-cobro.component.html',
    styleUrl: './cuentas-cobro.component.css',
    providers: [MessageService, ConfirmationService]
})
export class CuentasCobroComponent implements OnInit {
    cuentasCobro: CuentaCobro[] = [];
    clientes: Cliente[] = [];
    displayDialog: boolean = false;
    displayLogDialog: boolean = false;
    logTareas: LogTarea[] = [];
    selectedCuentaPeriodicidad: any = null;

    formData: any = {
        fecha_emision: new Date(),
        id_cliente: null,
        descripcion_servicio: '',
        valor_cobrar: null,
        configurar_periodicidad: false,
        periodicidad: 'mensual',
        dia_del_mes: 1,
        hora_ejecucion: null,
        aplica_archivos_adjuntos: 'N'
    };

    opcionesPeriodicidad = [
        { label: 'Diaria', value: 'diaria' },
        { label: 'Semanal', value: 'semanal' },
        { label: 'Quincenal', value: 'quincenal' },
        { label: 'Mensual', value: 'mensual' }
    ];

    opcionesSiNo = [
        { label: 'Sí', value: 'S' },
        { label: 'No', value: 'N' }
    ];

    steps = [
        { label: 'Datos de la Cuenta', command: () => this.current = 0 },
        { label: 'Periodicidad', command: () => this.current = 1 }
    ];

    current = 0;
    activeItem = this.steps[0];

    constructor(
        private cuentasCobroService: CuentasCobroService,
        private clienteService: ClienteService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) { }

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
                this.clientes = data.filter(e => e.estado == 'A');
            },
            error: (err) => {
                console.error('Error al cargar clientes:', err);
            }
        });
    }

    abrirFormulario() {
        let now = new Date();
        now.setMinutes(0);
        now.setSeconds(0);

        this.formData = {
            fecha_emision: new Date(),
            id_cliente: null,
            descripcion_servicio: '',
            valor_cobrar: null,
            configurar_periodicidad: false,
            periodicidad: 'mensual',
            dia_del_mes: 1,
            hora_ejecucion: now,
            aplica_archivos_adjuntos: 'N'
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
            configurar_periodicidad: this.formData.configurar_periodicidad,
            aplica_archivos_adjuntos: this.formData.aplica_archivos_adjuntos
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
        this.cuentasCobroService.generarDocumento(id).subscribe({
            next: (res) => {
                let response = JSON.parse(res);
                if (response.state == 'OK') {
                    const html = response.body.html;

                    const cssPrint = `
                        @page {
                            margin: 15mm;
                            size: auto;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                        }
                    `;

                    const htmlCompleto = `
                        <html>
                        <head>
                            <style>${cssPrint}</style>
                        </head>
                        <body>${html}</body>
                        </html>
                    `;

                    const ventana = window.open('', '_blank');
                    if (ventana) {
                        ventana.document.write(htmlCompleto);
                        ventana.document.close();
                        ventana.onload = () => {
                            setTimeout(() => {
                                ventana.print();
                            }, 500);
                        };
                    }
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el documento.' });
                }
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el documento.' });
            }
        });
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

    next() {
        if (this.current < this.steps.length - 1) {
            this.current++;
            this.activeItem = this.steps[this.current];
        }
    }

    prev() {
        if (this.current > 0) {
            this.current--;
            this.activeItem = this.steps[this.current];
        }
    }

    fixDiaMes() {
        if (this.formData.dia_del_mes == null) return;

        if (this.formData.dia_del_mes < 1) {
            this.formData.dia_del_mes = 1;
        }

        if (this.formData.dia_del_mes > 31) {
            this.formData.dia_del_mes = 31;
        }
    }

    verLogTareas(row: CuentaCobro) {
        if (!row?.id_cuenta_cobro) return;

        this.selectedCuentaPeriodicidad = row.info_periodicidad;
        
        this.cuentasCobroService.obtenerLogTareas(row.id_cuenta_cobro).subscribe({
            next: (data) => {
                this.logTareas = data;
                this.displayLogDialog = true;
            },
            error: (err) => {
                console.error('Error al obtener log de tareas:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo obtener el log de envíos.' });
            }
        });
    }

    formatearFechaAMPM(fecha: string): string {
        if (!fecha) return '';
        const date = new Date(fecha);
        return date.toLocaleString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    getPeriodicidadTexto(periodicidad: any): string {
        if (!periodicidad) return 'Sin periodicidad';
        
        let texto = '';
        switch (periodicidad.periodicidad) {
            case 'diaria': texto = 'Diaria'; break;
            case 'semanal': texto = 'Semanal'; break;
            case 'quincenal': texto = 'Quincenal'; break;
            case 'mensual': texto = `Mensual (día ${periodicidad.dia_del_mes})`; break;
            default: texto = 'Personalizada';
        }
        return texto;
    }
}
