import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { PqrsPropiedadesService } from '../../../services/pqrs/pqrs-propiedades.service';
import { PqrsReportesService } from '../../../services/pqrs/pqrs-reportes.service';
import { PropiedadHorizontal } from '../../../interfaces/pqrs';

@Component({
    selector: 'app-reportes-pqrs',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, ButtonModule, DropdownModule, CalendarModule, ToastModule
    ],
    templateUrl: './reportes-pqrs.component.html',
    styleUrls: ['./reportes-pqrs.component.css'],
    providers: [MessageService]
})
export class ReportesPqrsComponent implements OnInit {

    propiedades: PropiedadHorizontal[] = [];
    propiedadSeleccionada: PropiedadHorizontal | null = null;

    filtros = {
        fecha_inicio: '',
        fecha_fin: '',
        estado: ''
    };

    estados = [
        { label: 'Todos', value: '' },
        { label: 'Radicado', value: 'RADICADO' },
        { label: 'Categorizado', value: 'CATEGORIZADO' },
        { label: 'En avance', value: 'EN_AVANCE' },
        { label: 'Finalizado', value: 'FINALIZADO' }
    ];

    resultados: any[] = [];
    cargando = false;

    constructor(
        private propiedadesService: PqrsPropiedadesService,
        private reportesService: PqrsReportesService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.cargarPropiedades();
    }

    async cargarPropiedades() {
        (await this.propiedadesService.getPropiedadesHorizontales()).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.propiedades = res.body || [];
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al cargar propiedades.' });
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
            }
        });
    }

    async generar() {
        if (!this.filtros.fecha_inicio || !this.filtros.fecha_fin) {
            this.messageService.add({ severity: 'warn', summary: 'Seleccione el rango de fechas.' });
            return;
        }

        this.cargando = true;
        (await this.reportesService.generarReporte(
            this.propiedadSeleccionada?.id_propiedad_horizontal || null,
            this.filtros.fecha_inicio,
            this.filtros.fecha_fin,
            this.filtros.estado || undefined
        )).subscribe({
            next: (res) => {
                this.cargando = false;
                if (res.state === 'OK') {
                    this.resultados = res.body || [];
                } else {
                    this.messageService.add({ severity: 'error', summary: res.msg || 'Error al generar reporte.' });
                }
            },
            error: () => {
                this.cargando = false;
                this.messageService.add({ severity: 'error', summary: 'Error de conexión.' });
            }
        });
    }

    exportarExcel() {
        if (this.resultados.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'No hay datos para exportar.' });
            return;
        }

        const datos = this.resultados.map(r => ({
            'Código radicado': r.codigo_radicado,
            'Propiedad horizontal': r.propiedad_horizontal,
            'Solicitante': r.nombre_solicitante,
            'Documento': r.documento_solicitante,
            'Email': r.email_solicitante,
            'Piso': r.piso,
            'Ubicación': r.ubicacion,
            'Tipo PQR': r.tipo_pqr,
            'Categoría': r.categoria,
            'Estado': r.estado,
            'Pretensiones': r.pretensiones,
            'Observaciones': r.observaciones,
            'Fecha radicación': r.fecha_radicacion,
            'Fecha categorización': r.fecha_categorizacion,
            'Fecha último avance': r.fecha_ultimo_avance,
            'Fecha finalización': r.fecha_finalizacion,
            'Resumen finalización': r.resumen_finalizacion,
            'Cantidad avances': r.cantidad_avances,
            'Último avance': r.ultimo_avance,
            'Días transcurridos': r.dias_transcurridos
        }));

        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte PQRS');
        const blob = new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `reporte_pqrs_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    limpiar() {
        this.propiedadSeleccionada = null;
        this.filtros = { fecha_inicio: '', fecha_fin: '', estado: '' };
        this.resultados = [];
    }
}
