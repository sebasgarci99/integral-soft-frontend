import { Component } from '@angular/core';
import { ReportePacienteVacuna, AnioGrupo, PacienteGrupo, VacunaDetalle } from '../../interfaces/ReportePacienteVacuna';
import { VacunacionAnioGrupo, VacunaGrupo, VacunacionDetalle } from '../../interfaces/ReporteVacunas';

import { ReportesService } from '../../services/reportes/reportes.service';

import { SidebarComponent } from "../sidebar/sidebar.component";

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { StepsModule } from 'primeng/steps';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FloatLabelModule } from 'primeng/floatlabel';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { RadioButtonModule } from 'primeng/radiobutton';
import { AccordionModule } from 'primeng/accordion';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PacientesService } from '../../services/pacientes/pacientes.service';
import { VacunaService } from '../../services/vacunas/vacuna.service';
import { ConnectedOverlayScrollHandler } from 'primeng/dom';

@Component({
    selector: 'app-reportes-vacunacion',
    imports: [
        CommonModule,
        FormsModule,
        SidebarComponent,
        /* PrimeNG */
        TableModule,
        DialogModule,
        StepsModule,
        CalendarModule,
        DropdownModule,
        InputTextModule,
        InputNumberModule,
        FloatLabelModule,
        ButtonModule,
        ToastModule,
        ConfirmDialogModule,
        AccordionModule,
        RadioButtonModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './reportes-vacunacion.component.html',
    styleUrl: './reportes-vacunacion.component.css'
})
export class ReportesVacunacionComponent {
    // Filtro paciente
    filtro = {
        fechaInicio: new Date(),
        fechaFin: new Date(),
        paciente: null
    };

    // Filtro de vacuinas
    filtroVac = {
        fechaInicio: new Date(),
        fechaFin: new Date(),
        vacuna: null
    };

    pacientes: any[] = [];
    reportePacientes: ReportePacienteVacuna[] = [];

    anioGrupos: AnioGrupo[] = [];

    expandedAnios: { [key: string]: boolean } = {};
    expandedPacientes: { [key: string]: boolean } = {};

    vacunas: any[] = []; // dropdown
    vacunacionAnios: VacunacionAnioGrupo[] = [];

    expandedVacAnios: { [key: string]: boolean } = {};
    expandedVacunas: { [key: string]: boolean } = {};

    constructor(
        private reportesService: ReportesService,
        private pacientesService: PacientesService,
        private VacunaService: VacunaService
    ) {
    }

    async ngOnInit(): Promise<void> {
        await this.obtenerPacientes();
        await this.obtenerVacunas();
    }

    async generarReportePacientes() {
        console.log(this.filtro);

        try {
            this.reportesService.obtenerReporteVacunacion(
                this.obtenerFechaHoraActualFormatoIso(this.filtro.fechaInicio),
                this.obtenerFechaHoraActualFormatoIso(this.filtro.fechaFin),
                this.filtro.paciente
            ).subscribe((data) => {

                const mapAnios = new Map<number, AnioGrupo>();

                data.forEach(item => {
                    const anio = Number(item.anio_vacunacion);

                    if (!mapAnios.has(anio)) {
                        mapAnios.set(anio, {
                            key: anio,
                            anio,
                            pacientes: []
                        });
                    }

                    const anioGrupo = mapAnios.get(anio)!;

                    let paciente = anioGrupo.pacientes.find(
                        p => p.documento === item.numero_documento
                    );

                    if (!paciente) {
                        paciente = {
                            key: `${anio}-${item.numero_documento}`,
                            nombreCompleto: item.nombre_paciente,
                            documento: item.numero_documento,
                            sexo: item.sexo,
                            telefono: item.telefono_contacto,
                            email: item.correo_electronico,
                            vacunas: []
                        };
                        anioGrupo.pacientes.push(paciente);
                    }

                    paciente.vacunas.push({
                        vacuna: item.nombre_vacuna,
                        fechaVacuna: new Date(item.fecha_vacunacion),
                        lote: item.lote_vacuna_aplicada,
                        dosis: item.dosis_aplicada,
                        edad: item.edad_vacuna
                    });
                });

                this.anioGrupos = Array.from(mapAnios.values())
                    .sort((a, b) => b.anio - a.anio);
            });
        } catch (e) {
            console.error(e)
        }
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

    async obtenerPacientes() {
        this.pacientesService.obtenerPacientes().subscribe(data => {
            this.pacientes = data.filter(e => e.estado === 'A').map(e => {
                return {
                    key: e.id_paciente,
                    nombreCompleto: `${e.nombres} ${e.apellidos}`,
                    documento: e.numero_documento,
                    sexo: e.sexo,
                    telefono: e.telefono_contacto,
                    email: e.correo_electronico
                };
            });
        });
    }

    async generarReporteVacunacion() {
        this.vacunacionAnios = [];
        this.expandedVacAnios = {};
        this.expandedVacunas = {};

        this.reportesService.obtenerReporteVacunasAplicadas(
            this.obtenerFechaHoraActualFormatoIso(this.filtroVac.fechaInicio),
            this.obtenerFechaHoraActualFormatoIso(this.filtroVac.fechaFin),
            this.filtroVac.vacuna
        ).subscribe(data => {

            const mapAnios = new Map<number, VacunacionAnioGrupo>();

            data.forEach(item => {

                const anio = Number(item.anio_vacunacion);

                // ================= AÑO =================
                if (!mapAnios.has(anio)) {
                    mapAnios.set(anio, {
                        anio,
                        vacunas: []
                    });
                }

                const anioGrupo = mapAnios.get(anio)!;

                // ================= VACUNA =================
                let vacuna = anioGrupo.vacunas.find(
                    v => v.nombre_vacuna === item.nombre_vacuna
                );

                if (!vacuna) {
                    vacuna = {
                        key: `${anio}-${item.nombre_vacuna}`,
                        nombre_vacuna: item.nombre_vacuna,
                        nombre_laboratorio: item.nombre_laboratorio,
                        cantidad_dosis_parametrizada: item.cantidad_dosis_parametrizada,
                        detalle: []
                    };
                    anioGrupo.vacunas.push(vacuna);
                }

                // ================= DETALLE =================
                vacuna.detalle.push({
                    mes_vacunacion: item.mes_vacunacion,
                    fecha_vacunacion: new Date(item.fecha_vacunacion),
                    lote_vacuna_aplicada: item.lote_vacuna_aplicada,
                    dosis_aplicada: item.dosis_aplicada
                });

            });

            this.vacunacionAnios = Array
                .from(mapAnios.values())
                .sort((a, b) => b.anio - a.anio);

        });
    }

    async obtenerVacunas() {
        this.VacunaService.obtenerVacunas().subscribe(data => {
            this.vacunas = data.filter(e => e.estado === 'A').map(e => {
                return {
                    key: e.id,
                    nombre_vacuna: e.nombre_vacuna
                };
            });
        });
    }

    exportarPacientesExcel() {

        const rows: any[] = [];

        this.anioGrupos.forEach(anio => {
            rows.push({ Año: anio.anio });

            anio.pacientes.forEach(p => {
                rows.push({
                    Paciente: p.nombreCompleto,
                    Documento: p.documento,
                    Sexo: p.sexo,
                    Teléfono: p.telefono,
                    Email: p.email
                });

                p.vacunas.forEach(v => {
                    rows.push({
                        Vacuna: v.vacuna,
                        Fecha: v.fechaVacuna,
                        Lote: v.lote,
                        Dosis: v.dosis,
                        Edad: v.edad
                    });
                });

                rows.push({});
            });

            rows.push({});
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pacientes');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([excelBuffer]), 'reporte_pacientes.xlsx');
    }

    exportarPacientesPdf() {
        const doc = new jsPDF() as jsPDF & { lastAutoTable?: any };

        const startY =
            doc.lastAutoTable && doc.lastAutoTable.finalY
                ? doc.lastAutoTable.finalY + 12
                : 25;

        this.anioGrupos.forEach((anio, idx) => {

            doc.setFontSize(14);
            doc.text(`Año: ${anio.anio}`, 14, startY);

            anio.pacientes.forEach(p => {
                const startY =
                    doc.lastAutoTable?.finalY
                        ? doc.lastAutoTable.finalY + 12
                        : 30;

                doc.setFontSize(11);
                doc.text(
                    `Paciente: ${p.nombreCompleto} (${p.documento})`,
                    14,
                    startY
                );

                autoTable(doc, {
                    startY: startY + 5,
                    head: [['Vacuna', 'Fecha', 'Lote', 'Dosis', 'Edad']],
                    body: p.vacunas.map(v => [
                        v.vacuna,
                        v.fechaVacuna.toISOString().substring(0, 10),
                        v.lote,
                        v.dosis,
                        v.edad
                    ]),
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [41, 128, 185] }
                });
            });

            if (idx < this.anioGrupos.length - 1) {
                doc.addPage();
            }
        });

        this.agregarFooterYMarcaAgua(doc);

        doc.save('reporte_pacientes.pdf');
    }

    exportarVacunacionExcel() {

        const rows: any[] = [];

        this.vacunacionAnios.forEach(anio => {
            rows.push({ Año: anio.anio });

            anio.vacunas.forEach(v => {
                rows.push({
                    Vacuna: v.nombre_vacuna,
                    Laboratorio: v.nombre_laboratorio,
                    Dosis_Parametrizadas: v.cantidad_dosis_parametrizada
                });

                v.detalle.forEach(d => {
                    rows.push({
                        Mes: d.mes_vacunacion,
                        Fecha: d.fecha_vacunacion,
                        Lote: d.lote_vacuna_aplicada,
                        Dosis_Aplicada: d.dosis_aplicada
                    });
                });

                rows.push({});
            });

            rows.push({});
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Vacunación');

        saveAs(
            new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]),
            'reporte_vacunacion.xlsx'
        );
    }

    exportarVacunacionPdf() {
        const doc = new jsPDF() as jsPDF & { lastAutoTable?: any };

        this.vacunacionAnios.forEach((anio, idxAnio) => {

            /* ========= TÍTULO DEL AÑO ========= */
            const startYAnio = doc.lastAutoTable?.finalY
                ? doc.lastAutoTable.finalY + 20
                : 20;

            doc.setFontSize(14);
            doc.text(`Año ${anio.anio}`, 14, startYAnio);

            let currentY = startYAnio + 8;

            /* ========= VACUNAS DEL AÑO ========= */
            anio.vacunas.forEach(v => {

                /* ---- TÍTULO VACUNA ---- */
                doc.setFontSize(11);
                doc.text(
                    `Vacuna: ${v.nombre_vacuna} (${v.nombre_laboratorio})`,
                    14,
                    currentY
                );

                /* ---- TABLA DETALLE ---- */
                autoTable(doc, {
                    startY: currentY + 4,
                    head: [['Mes', 'Fecha', 'Lote', 'Dosis']],
                    body: v.detalle.map(d => [
                        d.mes_vacunacion,
                        d.fecha_vacunacion
                            ? d.fecha_vacunacion.toISOString().substring(0, 10)
                            : '',
                        d.lote_vacuna_aplicada,
                        d.dosis_aplicada
                    ]),
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [41, 128, 185] },
                    margin: { left: 14, right: 14 }
                });

                currentY = doc.lastAutoTable.finalY + 10;
            });

            /* ========= SALTO DE PÁGINA ENTRE AÑOS ========= */
            if (idxAnio < this.vacunacionAnios.length - 1) {
                doc.addPage();
            }
        });

        /* ========= FOOTER + MARCA DE AGUA ========= */
        this.agregarFooterYMarcaAgua(doc);

        doc.save('reporte_vacunacion.pdf');
    }

    agregarFooterYMarcaAgua(
        doc: jsPDF & { lastAutoTable?: any }
    ) {
        const pageCount = doc.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageWidth = pageSize.getWidth();
        const pageHeight = pageSize.getHeight();

        const fechaGen = new Date().toLocaleString('es-CO');

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            /* ========= MARCA DE AGUA ========= */
            doc.saveGraphicsState();
            doc.setFontSize(40);
            doc.setTextColor(200, 200, 200);
            doc.setGState(new (doc as any).GState({ opacity: 0.12 }));
            doc.text(
                'Integral-soft.com',
                pageWidth / 2,
                pageHeight / 2,
                { align: 'center', angle: 45 }
            );
            doc.restoreGraphicsState();

            /* ========= FOOTER ========= */
            doc.setFontSize(8);
            doc.setTextColor(120);
            doc.text(
                `Generado el: ${fechaGen}`,
                14,
                pageHeight - 10
            );

            doc.text(
                `Página ${i} de ${pageCount}`,
                pageWidth - 14,
                pageHeight - 10,
                { align: 'right' }
            );
        }
    }


}
