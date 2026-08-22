import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { PanelModule } from 'primeng/panel';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClientModule } from '@angular/common/http';

import { CalculoEmpleadoService } from '../../services/calculo-empleado/calculo-empleado.service';
import { DatosCalculoEmpleado, ResultadoCalculoEmpleado } from '../../interfaces/calculo-empleado';

@Component({
    selector: 'app-calculo-empleado',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        HttpClientModule,
        ButtonModule,
        InputNumberModule,
        SelectModule,
        CheckboxModule,
        PanelModule,
        CardModule,
        DividerModule,
        ToastModule
    ],
    templateUrl: './calculo-empleado.component.html',
    styleUrl: './calculo-empleado.component.css',
    providers: [MessageService]
})
export class CalculoEmpleadoComponent implements OnInit {

    formData: DatosCalculoEmpleado = {
        periodicidad: 'mensual',
        salarioBase: 0,
        diasTrabajados: 30,
        diasIncapacidad: 0,
        aplicaAuxilioTransporte: true,
        auxilioAutomatico: true,
        salarioEnSmmlv: false,
        cantidadSmmlv: 1,
        smmlv: 1750905,
        auxilioTransporte: 249095,
        uvt: 58333,
        tipoContrato: 'indefinido',
        claseRiesgo: 1,
        porcentajeSaludEmpleado: 4,
        porcentajeSaludEmpresa: 8.5,
        porcentajePensionEmpleado: 4,
        porcentajePensionEmpresa: 16,
        porcentajeSENA: 2,
        porcentajeICBF: 3,
        porcentajeCajas: 4,
        horasExtrasDiurnas: 0,
        horasExtrasNocturnas: 0,
        recargoNocturno: 0,
        recargoDominicalFestivo: 0,
        horasExtrasDominicalDiurna: 0,
        horasExtrasDominicalNocturna: 0,
        aplicaFondoSolidaridad: false,
        porcentajeFondoSolidaridad: 1,
        aplicaRetencionFuente: true,
        aplicaIndemnizacion: false,
        mesesContratoFijoRestantes: 0,
        anosTrabajados: 0
    };

    resultado: ResultadoCalculoEmpleado | null = null;
    cargando: boolean = false;

    opcionesPeriodicidad = [
        { label: 'Mensual', value: 'mensual' },
        { label: 'Quincenal', value: 'quincenal' }
    ];

    opcionesContrato = [
        { label: 'Término indefinido', value: 'indefinido' },
        { label: 'Término fijo', value: 'fijo' },
        { label: 'Prestación de servicios', value: 'prestacion_servicios' },
        { label: 'Obra o labor', value: 'obra_labor' }
    ];

    opcionesRiesgo = [
        { label: 'Clase I (0.522%)', value: 1 },
        { label: 'Clase II (1.044%)', value: 2 },
        { label: 'Clase III (2.436%)', value: 3 },
        { label: 'Clase IV (4.36%)', value: 4 },
        { label: 'Clase V (6.96%)', value: 5 }
    ];

    constructor(
        private calculoService: CalculoEmpleadoService,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        this.calcularAuxilio();
    }

    onCambioCantidadSmmlv(): void {
        if (this.formData.salarioEnSmmlv) {
            this.formData.salarioBase = Math.round((this.formData.cantidadSmmlv || 0) * this.formData.smmlv);
            this.calcularAuxilio();
        }
    }

    onCambioSmmlv(): void {
        if (this.formData.salarioEnSmmlv) {
            this.formData.salarioBase = Math.round((this.formData.cantidadSmmlv || 0) * this.formData.smmlv);
        }
        this.calcularAuxilio();
    }

    onToggleSalarioEnSmmlv(): void {
        if (this.formData.salarioEnSmmlv) {
            this.formData.salarioBase = Math.round((this.formData.cantidadSmmlv || 1) * this.formData.smmlv);
        }
        this.calcularAuxilio();
    }

    onCambioSalarioBase(): void {
        this.calcularAuxilio();
    }

    onToggleAuxilioAutomatico(): void {
        this.calcularAuxilio();
    }

    calcularAuxilio(): void {
        if (!this.formData.auxilioAutomatico) {
            return;
        }

        const limite = this.formData.smmlv * 2;
        if (this.formData.salarioBase <= limite) {
            this.formData.aplicaAuxilioTransporte = true;
            this.formData.auxilioTransporte = 249095;
        } else {
            this.formData.aplicaAuxilioTransporte = false;
            this.formData.auxilioTransporte = 0;
        }
    }

    async calcular(): Promise<void> {
        if (!this.validarFormulario()) {
            return;
        }

        this.cargando = true;
        this.resultado = null;

        (await this.calculoService.calcular(this.formData)).subscribe({
            next: (data: ResultadoCalculoEmpleado) => {
                this.resultado = data;
                this.cargando = false;
            },
            error: (err: any) => {
                console.error('Error al calcular:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo realizar el cálculo. Intente nuevamente.'
                });
                this.cargando = false;
            }
        });
    }

    validarFormulario(): boolean {
        if (!this.formData.salarioBase || this.formData.salarioBase <= 0) {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'El salario base debe ser mayor a 0.' });
            return false;
        }
        if (this.formData.diasTrabajados < 0 || this.formData.diasTrabajados > 30) {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Los días trabajados deben estar entre 0 y 30.' });
            return false;
        }
        return true;
    }

    limpiar(): void {
        this.formData = {
            periodicidad: 'mensual',
            salarioBase: 0,
            diasTrabajados: 30,
            diasIncapacidad: 0,
            aplicaAuxilioTransporte: true,
            auxilioAutomatico: true,
            salarioEnSmmlv: false,
            cantidadSmmlv: 1,
            smmlv: 1750905,
            auxilioTransporte: 249095,
            uvt: 58333,
            tipoContrato: 'indefinido',
            claseRiesgo: 1,
            porcentajeSaludEmpleado: 4,
            porcentajeSaludEmpresa: 8.5,
            porcentajePensionEmpleado: 4,
            porcentajePensionEmpresa: 16,
            porcentajeSENA: 2,
            porcentajeICBF: 3,
            porcentajeCajas: 4,
            horasExtrasDiurnas: 0,
            horasExtrasNocturnas: 0,
            recargoNocturno: 0,
            recargoDominicalFestivo: 0,
            horasExtrasDominicalDiurna: 0,
            horasExtrasDominicalNocturna: 0,
            aplicaFondoSolidaridad: false,
            porcentajeFondoSolidaridad: 1,
            aplicaRetencionFuente: true,
            aplicaIndemnizacion: false,
            mesesContratoFijoRestantes: 0,
            anosTrabajados: 0
        };
        this.calcularAuxilio();
        this.resultado = null;
    }

    formatearValor(valor: number | undefined): string {
        if (valor === undefined || valor === null) return '$0';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(valor);
    }
}
