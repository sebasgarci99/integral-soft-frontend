import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ClienteService } from '../../../services/cliente/cliente.service';
import { Cliente } from '../../../interfaces/cliente';

@Component({
    selector: 'app-cliente-info-arl',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        DropdownModule,
        ToastModule,
        TooltipModule
    ],
    templateUrl: './cliente-info-arl.component.html',
    styleUrls: ['./cliente-info-arl.component.css'],
    providers: [MessageService]
})
export class ClienteInfoArlComponent implements OnInit {
    clientes: Cliente[] = [];
    cargando = false;

    displayDialog = false;
    clienteSeleccionado: Cliente | null = null;
    arl: string | null = null;
    riesgoArl: number | null = null;
    rangoEmpleados: string | null = null;

    riesgosArl = [
        { label: 'Clase I (0.522%)', value: 1 },
        { label: 'Clase II (1.044%)', value: 2 },
        { label: 'Clase III (2.436%)', value: 3 },
        { label: 'Clase IV (4.36%)', value: 4 },
        { label: 'Clase V (6.96%)', value: 5 }
    ];

    rangosEmpleados = [
        { label: '0 a 10 empleados', value: '0-10' },
        { label: '11 a 50 empleados', value: '11-50' },
        { label: '51 o más empleados', value: '51+' }
    ];

    constructor(
        private clienteService: ClienteService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.cargarClientes();
    }

    async cargarClientes(): Promise<void> {
        this.cargando = true;
        try {
            const observable = await this.clienteService.obtenerDatosClientes();
            observable.subscribe({
                next: (data) => {
                    this.clientes = data || [];
                    this.cargando = false;
                },
                error: () => {
                    this.cargando = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudieron cargar los clientes.'
                    });
                }
            });
        } catch {
            this.cargando = false;
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar los clientes.'
            });
        }
    }

    abrirEdicion(cliente: Cliente): void {
        this.clienteSeleccionado = cliente;
        this.arl = cliente.arl ?? null;
        this.riesgoArl = cliente.riesgo_arl ?? null;
        this.rangoEmpleados = cliente.rango_empleados ?? null;
        this.displayDialog = true;
    }

    async guardar(): Promise<void> {
        if (!this.clienteSeleccionado?.id_cliente) return;

        const arl = this.arl?.trim() || null;

        if (arl && arl.length > 150) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'El nombre de la ARL no puede superar 150 caracteres.'
            });
            return;
        }

        (await this.clienteService.actualizarInfoArl(this.clienteSeleccionado.id_cliente, {
            arl,
            riesgo_arl: this.riesgoArl,
            rango_empleados: this.rangoEmpleados
        })).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.clienteSeleccionado!.arl = arl;
                    this.clienteSeleccionado!.riesgo_arl = this.riesgoArl;
                    this.clienteSeleccionado!.rango_empleados = this.rangoEmpleados;
                    this.displayDialog = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Guardado',
                        detail: 'Información ARL actualizada correctamente.'
                    });
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.body || 'No se pudo guardar la información ARL.'
                    });
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo guardar la información ARL.'
                });
            }
        });
    }

    etiquetaRiesgo(valor: number | null | undefined): string {
        return this.riesgosArl.find(r => r.value === valor)?.label || 'Sin definir';
    }

    etiquetaRango(valor: string | null | undefined): string {
        return this.rangosEmpleados.find(r => r.value === valor)?.label || 'Sin definir';
    }
}
