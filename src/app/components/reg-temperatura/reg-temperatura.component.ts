import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';

import { ChartModule } from 'primeng/chart';

import { RegistroTemperaturaService } from '../../services/reg-temperatura/reg-temperatura.service';

@Component({
    selector: 'app-reg-temperatura',
    standalone: true,
    imports: [
        SidebarComponent,
        CommonModule,
        FormsModule,
        TableModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        ToastModule,
        ConfirmDialogModule,
        FloatLabelModule,
        CalendarModule,
        DropdownModule,
        ChartModule
    ],
    templateUrl: './reg-temperatura.component.html',
    styleUrl: './reg-temperatura.component.css',
    providers: [MessageService, ConfirmationService]
})
export class RegTemperaturaComponent implements OnInit {

    registros: any[] = [];
    displayDialog: boolean = false;

    formData = this.resetForm();

    horarios: any[] = [];

    chartData: any;
    chartOptions: any;

    registrosMesActual: any[] = [];

    constructor(
        private registroService: RegistroTemperaturaService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) { }

    async ngOnInit() {
        await this.cargarRegistros();
        this.cargarHorarios();
    }

    async cargarRegistrosMesActualGrafica() {
        const hoy = new Date();
        const mesActual = hoy.getMonth();
        const anioActual = hoy.getFullYear();

        // 1️⃣ Filtrar mes actual
        this.registrosMesActual = this.registros
            .filter(r => {
                const fecha = new Date(r.fecha_registro);
                return (
                    fecha.getMonth() === mesActual &&
                    fecha.getFullYear() === anioActual
                );
            })
            // 2️⃣ Ordenar por fecha ascendente
            .sort((a, b) =>
                new Date(a.fecha_registro).getTime() - new Date(b.fecha_registro).getTime()
            );

        // 3️⃣ Construir gráfica
        this.construirGrafica();
    }

    construirGrafica() {
        const labels: string[] = [];
        const temperaturas: number[] = [];

        this.registrosMesActual.forEach(r => {
            const fecha = new Date(r.fecha_registro);

            const dia = fecha.getDate().toString().padStart(2, '0');
            const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
            const anio = fecha.getFullYear();

            labels.push(`${dia}/${mes}/${anio} - ${r.horario}`);
            temperaturas.push(Number(r.temperatura));
        });

        console.log(labels);
        console.log(temperaturas);

        this.chartData = {
            labels,
            datasets: [
                {
                    label: 'Temperatura (°C)',
                    data: temperaturas,
                    fill: false,
                    tension: 0 // Sin curvas
                }
            ]
        };

        this.chartOptions = {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Temperatura (°C)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Fecha'
                    }
                }
            }
        };
    }

    cargarHorarios() {
        this.horarios = [
            { label: 'Mañana', value: 'Mañana' },
            { label: 'Tarde', value: 'Tarde' }
        ];
    }

    resetForm() {
        return {
            area: '',
            responsable: '',
            horario: '',
            temperatura: null,
            humedad: null,
            tipo_medida: '(°C)',
            fecha: new Date()
        };
    }

    cerrarDialog() {
        this.displayDialog = false;
        this.formData = this.resetForm();
    }

    async cargarRegistros() {
        await this.registroService.obtenerRegistros().subscribe((res) => {
            this.registros = res;

            // Cargamos los registros del mes actual para la gráfica
            this.cargarRegistrosMesActualGrafica();
        });
    }

    abrirFormulario() {
        let ahora = new Date();

        this.formData = {
            ...this.formData,
            fecha: ahora,
            horario: ''
        };

        this.definirHorarioPorHora(ahora);
        this.displayDialog = true;
    }

    definirHorarioPorHora(fecha: Date) {
        let horaActual = Number(this.obtenerFechaHoraActualFormatoIso(fecha).toString().split('T')[1].split(':')[0]);

        if (horaActual > 12 && horaActual < 23) {
            this.formData.horario = 'Tarde';
        } else {
            this.formData.horario = 'Mañana';
        }
    }

    guardarRegistro() {

        let dataFormulario = {
            ...this.formData,
            fecha: this.obtenerFechaHoraActualFormatoIso(this.formData.fecha)
        };

        this.registroService.crearRegistro(dataFormulario).subscribe((res) => {
            if (res.state === 'OK') {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Registro creado correctamente'
                });
                this.displayDialog = false;
                this.formData = this.resetForm();
                this.cargarRegistros();
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error al guardar'
                });
            }
        });
    }

    eliminarRegistro(id: number) {
        this.confirmService.confirm({
            header: 'Eliminar registro',
            message: '¿Desea eliminar este registro?',
            icon: 'fa fa-exclamation-triangle',
            accept: () => {
                this.registroService.eliminarRegistro(id).subscribe(() => {
                    this.cargarRegistros();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Registro eliminado'
                    });
                });
            }
        });
    }

    public obtenerFechaHoraActualFormatoIso(
        fecha: Date,
        hora?: Date // Opcional
    ): string {
        // Si el parametro de hora no se envia
        // tomamos el valor de la fecha
        hora = hora ?? fecha;

        // Construimos a pedal la fecha en formato ISO String
        // Ya que la función nativa nos cambia el UTC a 0
        let fechaActualConvertida: string =
            fecha.getFullYear()
            + '-' + String(fecha.getMonth() + 1).padStart(2, '0')
            + '-' + String(fecha.getDate()).padStart(2, '0')
            + 'T' +
            String(hora.getHours()).padStart(2, '0')
            + ':' + String(hora.getMinutes()).padStart(2, '0')
            + ':' + String(hora.getSeconds()).padStart(2, '0')
            ;

        return fechaActualConvertida;
    }
}
