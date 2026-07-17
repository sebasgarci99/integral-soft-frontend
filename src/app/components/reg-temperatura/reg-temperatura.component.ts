import { Component, OnInit } from '@angular/core';

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
import { TooltipModule } from 'primeng/tooltip';

import { ChartModule } from 'primeng/chart';

import { RegistroTemperaturaService } from '../../services/reg-temperatura/reg-temperatura.service';
import { Sede } from '../../interfaces/sede';
import { Area } from '../../interfaces/area';

@Component({
    selector: 'app-reg-temperatura',
    standalone: true,
    imports: [
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
        TooltipModule,
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

    sedes: Sede[] = [];
    areas: Area[] = [];
    sedeSeleccionada: Sede | null = null;

    modoEdicion: boolean = false;
    registroEditando: any = null;

    dialogHeader: string = 'Nuevo registro de temperatura';

    constructor(
        private registroService: RegistroTemperaturaService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) { }

    ngOnInit() {
        this.cargarHorarios();
        this.cargarSedes();
    }

    cargarSedes() {
        this.registroService.obtenerSedes().subscribe({
            next: (sedes) => {
                this.sedes = sedes;
                if (sedes.length > 0) {
                    this.sedeSeleccionada = sedes[0];
                    this.cargarAreasPorSede();
                    this.cargarRegistros();
                }
            }
        });
    }

    onChangeSede(sede: Sede) {
        this.sedeSeleccionada = sede;
        this.formData.id_area = null;
        this.cargarAreasPorSede();
        this.cargarRegistros();
    }

    cargarAreasPorSede() {
        if (!this.sedeSeleccionada) return;

        this.registroService.obtenerAreas(this.sedeSeleccionada.id_sede).subscribe({
            next: (areas) => {
                this.areas = areas;
            }
        });
    }

    cargarRegistrosMesActualGrafica() {
        const hoy = new Date();
        const mesActual = hoy.getMonth();
        const anioActual = hoy.getFullYear();

        this.registrosMesActual = this.registros
            .filter(r => {
                const fecha = new Date(r.fecha_registro);
                return (
                    fecha.getMonth() === mesActual &&
                    fecha.getFullYear() === anioActual
                );
            })
            .sort((a, b) =>
                new Date(a.fecha_registro).getTime() - new Date(b.fecha_registro).getTime()
            );

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

        this.chartData = {
            labels,
            datasets: [
                {
                    label: 'Temperatura (°C)',
                    data: temperaturas,
                    fill: false,
                    tension: 0
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
            id_area: null,
            horario: '',
            temperatura: null,
            humedad: null,
            tipo_medida: '(°C)',
            fecha: new Date()
        };
    }

    cerrarDialog() {
        this.displayDialog = false;
        this.modoEdicion = false;
        this.registroEditando = null;
        this.formData = this.resetForm();
    }

    cargarRegistros() {
        const idSede = this.sedeSeleccionada?.id_sede;

        this.registroService.obtenerRegistros(idSede).subscribe((res) => {
            this.registros = res;
            this.cargarRegistrosMesActualGrafica();
        });
    }

    abrirFormulario() {
        this.modoEdicion = false;
        this.registroEditando = null;
        this.formData = this.resetForm();

        let ahora = new Date();
        this.formData.fecha = ahora;
        this.definirHorarioPorHora(ahora);

        this.dialogHeader = `Nuevo registro de temperatura - ${this.sedeSeleccionada?.nombre || ''}`;
        this.displayDialog = true;
    }

    editarRegistro(registro: any) {
        this.modoEdicion = true;
        this.registroEditando = registro;

        this.formData = {
            id_area: registro.id_area,
            horario: registro.horario,
            temperatura: registro.temperatura,
            humedad: registro.humedad,
            tipo_medida: registro.tipo_medida,
            fecha: new Date(registro.fecha_registro)
        };

        this.dialogHeader = `Editar registro de temperatura - ${this.sedeSeleccionada?.nombre || ''}`;
        this.displayDialog = true;
    }

    definirHorarioPorHora(fecha: Date) {
        let hora = Number(this.obtenerFechaHoraActualFormatoIso(fecha).toString().split('T')[1].split(':')[0]);
        this.formData.horario = (hora >= 12) ? 'Tarde' : 'Mañana';
    }

    getNombreArea(idArea: number): string {
        const area = this.areas.find(a => a.id_area === idArea);
        return area ? area.nombre : '';
    }

    guardarRegistro() {
        let dataFormulario = {
            ...this.formData,
            id_sede: this.sedeSeleccionada?.id_sede,
            fecha: this.obtenerFechaHoraActualFormatoIso(this.formData.fecha)
        };

        if (this.modoEdicion && this.registroEditando) {
            const dataEdicion: Record<string, unknown> = {
                ...dataFormulario,
                id_registro: this.registroEditando.id_registro
            };

            this.registroService.editarRegistro(dataEdicion).subscribe((res) => {
                if (res.state === 'OK') {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Registro actualizado correctamente'
                    });
                    this.cerrarDialog();
                    this.cargarRegistros();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error al actualizar'
                    });
                }
            });
        } else {
            this.registroService.crearRegistro(dataFormulario).subscribe((res) => {
                if (res.state === 'OK') {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Registro creado correctamente'
                    });
                    this.cerrarDialog();
                    this.cargarRegistros();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error al guardar'
                    });
                }
            });
        }
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
        hora?: Date
    ): string {
        hora = hora ?? fecha;

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
