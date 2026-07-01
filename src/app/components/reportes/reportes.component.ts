import { Component } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar.component";

import { OnInit } from '@angular/core';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { ReportesService } from '../../services/reportes/reportes.service';
import { ConsultorioService } from '../../services/consultorio/consultorio.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { HttpClient, HttpClientModule } from '@angular/common/http'; 
import { PaginatorModule } from 'primeng/paginator';
import { FloatLabelModule  } from 'primeng/floatlabel';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';


import * as XLSX from 'xlsx';

@Component({
    selector: 'app-reportes',
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
        InputTextModule,
        DropdownModule,
        CalendarModule,
        IconFieldModule,
        InputIconModule,
        InputIconModule,
        ProgressSpinnerModule,
        TagModule
    ],
    templateUrl: './reportes.component.html',
    styleUrl: './reportes.component.css',
    providers: [MessageService, ConfirmationService]
})
export class ReportesComponent {

    idRol:number = 0;
    loader: boolean = false;

    fechaInicio: Date = new Date;
    fechaFin: Date = new Date;
    consultorio: number | null = null;
    tipoReporte: 'totalizado' | 'detallado' = 'totalizado';
    datos: any[] = [];
    columnas: any[] = [];
    totales: { [key: string]: number } = {};

    tipoReporteOptions = [
        { label: 'Totalizado', value: 'totalizado' },
        { label: 'Detallado', value: 'detallado' }
    ];

    consultoriosOpts: SelectItem[] = [
        // // { label: 'Seleccionar', value: null },
    ];

    globalFilterValue: string = '';

    showLogsDialog: boolean = false;
    logs: any[] = [];
    logColumns: any[] = [
        { field: 'fecha_envio', header: 'Fecha env\u00edo' },
        { field: 'usuario_nombre', header: 'Usuario' },
        { field: 'fecha_inicio', header: 'Fecha inicio' },
        { field: 'fecha_fin', header: 'Fecha fin' },
        { field: 'tipo_reporte', header: 'Tipo' },
        { field: 'cantidad_consultorios', header: 'Consultorios' },
        { field: 'es_envio_completo', header: 'Completo' },
        { field: 'estado', header: 'Estado' },
    ];

    constructor(
        private reportesService : ReportesService,
        private consultorioService: ConsultorioService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) {
        this.idRol = Number(localStorage.getItem('idRol'));

        this.cargarConsultorios();
    }

    generarReporte() {
        if(!this.validarParametrosReporte()) {
            return;
        }

        if(this.tipoReporte == 'totalizado') {
            this.reportesService.obtenerReporteTotalizado(this.fechaInicio, this.fechaFin, this.consultorio).subscribe((data) => {
                this.datos = data;
                if (data.length) {
                    this.columnas = Object.keys(data[0]).map(col => ({ field: col, header: this.formatHeader(col) }));
                    this.calcularTotales();
                }
            });
        }

         if(this.tipoReporte == 'detallado') {
            this.reportesService.obtenerReporteDetallado(this.fechaInicio, this.fechaFin, this.consultorio).subscribe((data) => {
                this.datos = data;
                if (data.length) {
                    this.columnas = Object.keys(data[0]).map(col => ({ field: col, header: this.formatHeader(col) }));
                    this.calcularTotales();
                }
            });
        }
    }

    cargarConsultorios() {
        try {
            this.consultorioService.obtenerDatosConsultorios().subscribe((data) => {
                this.consultoriosOpts = data.filter(e => e.estado == 'A').map((item: any) => ({
                    label: item.codigo+'-'+item.descripcion,
                    value: item.id
                }));
            });
        } catch(e) {
            console.error(e)
        }
        
    }

    calcularTotales() {
        this.totales = {};
        if (!this.datos.length) return;

        // const numericFields = Object.keys(this.datos[0]).filter(k => typeof this.datos[0][k] === 'number');
        // Convertimos los string que retorna el servicio a decimal
        this.datos = this.datos.map(obj => {
            const newObj = { ...obj };
            for (const key in newObj) {
                if (!isNaN(newObj[key]) && newObj[key] !== "" && newObj[key] !== null) {
                newObj[key] = parseFloat(newObj[key]);
                }
            }
            return newObj;
        });

        // Y obtenemos netamente las columnas numericas
        const numericFields = Object.keys(this.datos[0]).filter(k => typeof this.datos[0][k] === 'number');

        console.log(numericFields)
        for (const field of numericFields) {
            this.totales[field] = this.datos.reduce((acc, cur) => acc + (cur[field] || 0), 0);
        }
    }

    descargarExcel() {
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.datos);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
        XLSX.writeFile(wb, `reporte_${this.tipoReporte}.xlsx`);
    }

    async enviarReporteConsultorios() {
        this.confirmService.confirm({
            header: 'Enviar reporte por correo electrónico',
            icon: 'fa fa-exclamation-triangle',
            message: '¿Estás seguro de enviar el reporte generado a los correos electrónicos de los consultorios? Recuerda que se enviarán a todos los consultorios que hayas generado en el reporte.',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.loader = true;

                this.reportesService.enviarReporteCorreosConsultorios(
                    this.fechaInicio, this.fechaFin, this.consultorio, this.tipoReporte
                ).subscribe({
                    next: (res) => {
                        if (res.state === 'OK') {
                            let detalle = '';
                            if (res.body) {
                                detalle = `Enviado a ${res.body.enviados} de ${res.body.total_consultorios} consultorios.`;
                            }
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Reporte enviado correctamente',
                                detail: detalle || 'Por favor espere a que el proceso se ejecute por completo...',
                                life: 6000
                            });
                        } else if (res.body?.enviados !== undefined) {
                            this.messageService.add({
                                severity: 'warn',
                                summary: 'Envío parcial',
                                detail: `Enviados: ${res.body.enviados}, Fallidos: ${res.body.fallidos} de ${res.body.total_consultorios} consultorios.`,
                                life: 8000
                            });
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error en el envío',
                                detail: typeof res.body === 'string' ? res.body : 'Revise el log para más detalles.',
                                life: 5000
                            });
                        }
                    },
                    error: (e) => {
                        console.log(e);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No fue posible enviar el reporte.',
                            life: 5000
                        });
                    },
                    complete: () => {
                        this.loader = false;
                    }
                });
            }
        });
    }

    abrirHistorialEnvios() {
        this.loader = true;
        this.showLogsDialog = true;
        this.reportesService.obtenerLogsReportes().subscribe({
            next: (data) => {
                this.logs = data;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar el historial de envíos.',
                    life: 5000
                });
            },
            complete: () => {
                this.loader = false;
            }
        });
    }

    getSeverityLog(estado: string): 'success' | 'warn' | 'danger' | 'info' {
        switch (estado) {
            case 'EXITOSA': return 'success';
            case 'PARCIAL': return 'warn';
            case 'FALLIDA': return 'danger';
            default: return 'info';
        }
    }

    formatoFechaLog(fecha: string): string {
        if (!fecha) return '';
        const d = new Date(fecha);
        return d.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatoFecha(fecha: Date | null): string | null {
        if (!fecha) return null;
        return fecha.toISOString().split('T')[0];
    }

    formatHeader(header: string): string {
        return header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    validarParametrosReporte():boolean {
        console.log(this.fechaInicio )

        if(this.fechaInicio == null ) {
            this.messageService.add({ severity: 'warn', summary: 'Debes seleccionar una fecha de inicio' });
            return false;
        }

        if(this.fechaFin == null ) {
            this.messageService.add({ severity: 'warn', summary: 'Debes seleccionar una fecha de fin' });
            return false;
        }

        if(this.fechaInicio > this.fechaFin) {
            this.messageService.add({ severity: 'warn', summary: 'La fecha de inicio no debe ser supérior a la fecha fin' });
            return false;
        }

        return true;
    }

}
