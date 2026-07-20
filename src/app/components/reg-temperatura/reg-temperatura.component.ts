import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

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
import { Equipo } from '../../interfaces/equipo';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

    registros: any[] = [];
    displayDialog: boolean = false;

    formData = this.resetForm();

    horarios: any[] = [];

    chartData: any;
    chartOptions: any;

    registrosMesActual: any[] = [];

    sedes: Sede[] = [];
    areas: Area[] = [];
    equipos: Equipo[] = [];
    sedeSeleccionada: Sede | null = null;
    equipoSeleccionado: Equipo | null = null;

    modoEdicion: boolean = false;
    registroEditando: any = null;

    dialogHeader: string = 'Nuevo registro de temperatura';

    displayPdfDialog: boolean = false;
    fechaInicioPdf: Date | null = null;
    fechaFinPdf: Date | null = null;

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
            }
        });
    }

    onChangeSede(sede: Sede) {
        this.sedeSeleccionada = sede;
        this.equipoSeleccionado = null;
        this.equipos = [];
        this.registros = [];
        this.formData.id_area = null;
        this.chartData = { labels: [], datasets: [] };

        this.cargarEquiposPorSede();
    }

    cargarEquiposPorSede() {
        if (!this.sedeSeleccionada) return;

        this.registroService.obtenerEquiposBySede(this.sedeSeleccionada.id_sede).subscribe({
            next: (equipos) => {
                this.equipos = equipos;
            }
        });
    }

    onChangeEquipo(equipoId: number) {
        const encontrado = this.equipos.find(e => e.id_equipo === equipoId);
        this.equipoSeleccionado = encontrado || null;

        if (this.equipoSeleccionado && this.sedeSeleccionada) {
            this.cargarAreasPorSede();
            this.cargarRegistros();
        } else {
            this.registros = [];
            this.chartData = { labels: [], datasets: [] };
        }
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
        const idEquipo = this.equipoSeleccionado?.id_equipo;

        if (!idSede || !idEquipo) return;

        this.registroService.obtenerRegistros(idSede, idEquipo).subscribe((res) => {
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

        this.dialogHeader = `Nuevo registro de temperatura - ${this.sedeSeleccionada?.nombre || ''} / ${this.equipoSeleccionado?.nombre || ''}`;
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

        this.dialogHeader = `Editar registro de temperatura - ${this.sedeSeleccionada?.nombre || ''} / ${this.equipoSeleccionado?.nombre || ''}`;
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
            id_equipo: this.equipoSeleccionado?.id_equipo,
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

    // ==============================
    // PDF
    // ==============================
    abrirDialogPdf() {
        this.fechaInicioPdf = null;
        this.fechaFinPdf = null;
        this.displayPdfDialog = true;
    }

    generarPdf() {
        if (!this.fechaInicioPdf || !this.fechaFinPdf) return;

        const fechaInicio = new Date(this.fechaInicioPdf);
        fechaInicio.setHours(0, 0, 0, 0);
        const fechaFin = new Date(this.fechaFinPdf);
        fechaFin.setHours(23, 59, 59, 999);

        const registrosFiltrados = this.registros.filter(r => {
            const fecha = new Date(r.fecha_registro);
            return fecha >= fechaInicio && fecha <= fechaFin;
        }).sort((a, b) =>
            new Date(a.fecha_registro).getTime() - new Date(b.fecha_registro).getTime()
        );

        if (registrosFiltrados.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No hay registros en el rango de fechas seleccionado'
            });
            return;
        }

        const doc = new jsPDF({ unit: 'pt', format: 'letter' });
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Registro de Temperatura', pageWidth / 2, 40, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Sede: ${this.sedeSeleccionada?.nombre || ''}`, 40, 60);
        doc.text(`Equipo: ${this.equipoSeleccionado?.nombre || ''}`, 40, 75);
        doc.text(`Rango: ${this.formatearFechaCorta(fechaInicio)} - ${this.formatearFechaCorta(fechaFin)}`, 40, 90);

        let currentY = 105;

        const canvas = document.querySelector('canvas');
        if (canvas) {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - 80;
            const imgHeight = (canvas.height / canvas.width) * imgWidth;

            doc.addImage(imgData, 'PNG', 40, currentY, imgWidth, Math.min(imgHeight, 200));
            currentY += Math.min(imgHeight, 200) + 15;
        }

        autoTable(doc, {
            startY: currentY,
            head: [['Sede', 'Área', 'Equipo', 'Fecha', 'Horario', 'Temp. (°C)', 'Humedad (%)', 'Tipo medida', 'Responsable']],
            body: registrosFiltrados.map(r => [
                this.sedeSeleccionada?.nombre || '',
                this.getNombreArea(r.id_area),
                this.equipoSeleccionado?.nombre || '',
                this.formatearFechaCorta(new Date(r.fecha_registro)),
                r.horario || '',
                String(r.temperatura || ''),
                String(r.humedad || ''),
                r.tipo_medida || '',
                r.responsable || ''
            ]),
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            margin: { left: 40, right: 40 }
        });

        const nombreArchivo = `registro_temperatura_${this.sedeSeleccionada?.nombre || ''}_${this.equipoSeleccionado?.nombre || ''}_${this.formatearFechaCorta(fechaInicio)}_${this.formatearFechaCorta(fechaFin)}.pdf`;
        doc.save(nombreArchivo);

        this.displayPdfDialog = false;
        this.messageService.add({
            severity: 'success',
            summary: 'PDF descargado correctamente'
        });
    }

    formatearFechaCorta(fecha: Date): string {
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}-${mes}-${anio}`;
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
