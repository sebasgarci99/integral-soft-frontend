import { Component } from '@angular/core';
import { ReportePacienteVacuna, AnioGrupo, PacienteGrupo, VacunaDetalle } from '../../interfaces/ReportePacienteVacuna';
import { VacunacionAnioGrupo, VacunaGrupo, VacunacionDetalle, VacunaPorEdad, RangoEdad } from '../../interfaces/ReporteVacunas';

import { ReportesService } from '../../services/reportes/reportes.service';

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
import { TooltipModule } from 'primeng/tooltip';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { RadioButtonModule } from 'primeng/radiobutton';
import { AccordionModule } from 'primeng/accordion';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PacientesService } from '../../services/pacientes/pacientes.service';
import { VacunaService } from '../../services/vacunas/vacuna.service';

type TabReporte = 'pacientes' | 'vacunacion' | 'edad';
type TipoRango = 'mes' | 'mes-anterior' | 'trimestre' | 'semestre' | 'anio';

@Component({
    selector: 'app-reportes-vacunacion',
    imports: [
        CommonModule,
        FormsModule,
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
        RadioButtonModule,
        TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './reportes-vacunacion.component.html',
    styleUrl: './reportes-vacunacion.component.css'
})
export class ReportesVacunacionComponent {
    // Filtro paciente
    filtro: {
        fechaInicio: Date;
        fechaFin: Date;
        paciente: number | null;
        sexo: string | null;
        eps: string | null;
        regimen: string | null;
    } = {
        fechaInicio: new Date(),
        fechaFin: new Date(),
        paciente: null,
        sexo: null,
        eps: null,
        regimen: null
    };

    // Filtro de vacunas
    filtroVac: {
        fechaInicio: Date;
        fechaFin: Date;
        vacuna: number | null;
        sexo: string | null;
        eps: string | null;
        regimen: string | null;
    } = {
        fechaInicio: new Date(),
        fechaFin: new Date(),
        vacuna: null,
        sexo: null,
        eps: null,
        regimen: null
    };

    // Filtro vacunas por edad
    filtroEdad: {
        fechaInicio: Date;
        fechaFin: Date;
        sexo: string | null;
        edad: RangoEdad | null;
    } = {
        fechaInicio: new Date(),
        fechaFin: new Date(),
        sexo: null,
        edad: null
    };

    pacientes: any[] = [];
    reportePacientes: ReportePacienteVacuna[] = [];

    anioGrupos: AnioGrupo[] = [];
    totalRegistrosPacientes = 0;

    expandedAnios: { [key: string]: boolean } = {};
    expandedPacientes: { [key: string]: boolean } = {};

    vacunas: any[] = []; // dropdown
    vacunacionAnios: VacunacionAnioGrupo[] = [];
    totalRegistrosVacunacion = 0;

    expandedVacAnios: { [key: string]: boolean } = {};
    expandedVacunas: { [key: string]: boolean } = {};

    vacunasPorEdad: VacunaPorEdad[] = [];
    totalRegistrosEdad = 0;

    cargandoPacientes = false;
    cargandoVacunacion = false;
    cargandoEdad = false;

    mostrarInfoEdad = false;

    opcionesSexo = [
        { label: 'Femenino', value: 'F' },
        { label: 'Masculino', value: 'M' },
        { label: 'Otro', value: 'O' }
    ];

    opcionesRegimen = [
        { label: 'Contributivo', value: 'Contributivo' },
        { label: 'Subsidiado', value: 'Subsidiado' },
        { label: 'Especial', value: 'Especial' },
        { label: 'Excepción', value: 'Excepción' },
        { label: 'No afiliado', value: 'No afiliado' },
        { label: 'Población pobre no asegurada', value: 'Población pobre no asegurada' }
    ];

    epsOpciones: string[] = [];
    regimenOpciones: string[] = [];
    rangosEdad: RangoEdad[] = [];

    constructor(
        private reportesService: ReportesService,
        private pacientesService: PacientesService,
        private VacunaService: VacunaService
    ) {
    }

    async ngOnInit(): Promise<void> {
        this.generarRangosEdad();
        await this.obtenerPacientes();
        await this.obtenerVacunas();
        this.setFechaHoraDefecto();
    }

    get pacientesOpciones(): any[] {
        return this.pacientes.filter((paciente: any) => paciente.estado === 'A');
    }

    async generarReportePacientes() {
        this.cargandoPacientes = true;

        try {
            const observable = await this.reportesService.obtenerReporteVacunacion(
                this.obtenerFechaHoraActualFormatoIso(this.filtro.fechaInicio),
                this.obtenerFechaHoraActualFormatoIso(this.filtro.fechaFin, true),
                this.filtro.paciente,
                this.filtro.sexo,
                this.filtro.eps,
                this.filtro.regimen
            );

            observable.subscribe({
                next: (data: any[]) => {
                    const mapAnios = new Map<number, AnioGrupo>();
                    let contador = 0;

                    (data || []).forEach((item: any) => {
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
                            (p: any) => p.documento === item.numero_documento
                        );

                        if (!paciente) {
                            paciente = {
                                key: `${anio}-${item.numero_documento}`,
                                nombreCompleto: item.nombre_paciente,
                                documento: item.numero_documento,
                                sexo: item.sexo,
                                telefono: item.telefono_contacto,
                                email: item.correo_electronico,
                                eps: item.eps,
                                regimen: item.regimen,
                                vacunas: []
                            };
                            anioGrupo.pacientes.push(paciente);
                        }

                        paciente.vacunas.push({
                            numRegistro: ++contador,
                            vacuna: item.nombre_vacuna,
                            fechaVacuna: new Date(item.fecha_vacunacion),
                            lote: item.lote_vacuna_aplicada,
                            dosis: item.dosis_aplicada,
                            edad: item.edad_vacuna,
                            empresa_entidad: item.empresa_entidad,
                            orden_remision: item.orden_remision
                        });
                    });

                    this.anioGrupos = Array.from(mapAnios.values())
                        .sort((a: any, b: any) => b.anio - a.anio);
                    this.totalRegistrosPacientes = contador;
                    this.cargandoPacientes = false;
                },
                error: (error: any) => {
                    console.error(error);
                    this.anioGrupos = [];
                    this.totalRegistrosPacientes = 0;
                    this.cargandoPacientes = false;
                }
            });
        } catch (e) {
            console.error(e);
            this.cargandoPacientes = false;
        }
    }

    public obtenerFechaHoraActualFormatoIso(
        fecha: Date,
        esFin: boolean = false
    ): string {

        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');

        const horas = esFin ? '23' : '00';
        const minutos = esFin ? '59' : '00';
        const segundos = esFin ? '59' : '00';

        return `${year}-${month}-${day}T${horas}:${minutos}:${segundos}`;
    }

    async obtenerPacientes() {
        (await this.pacientesService.obtenerPacientes()).subscribe((data: any[]) => {
            const mapped = (data || []).map((e: any) => {
                const admin = e.t_datos_admin_paciente || e.t_datos_admin_pacientes || {};
                return {
                    key: e.id_paciente,
                    nombreCompleto: `${e.nombres} ${e.apellidos}`,
                    documento: e.numero_documento,
                    sexo: e.sexo,
                    telefono: e.telefono_contacto,
                    email: e.correo_electronico,
                    estado: e.estado,
                    eps: admin.eps || e.eps || '',
                    regimen: admin.regimen || e.regimen || ''
                };
            });

            this.pacientes = mapped;

            const epsSet = new Set<string>();
            const regimenSet = new Set<string>();
            mapped.forEach((paciente: any) => {
                if (paciente.eps) { epsSet.add(String(paciente.eps)); }
                if (paciente.regimen) { regimenSet.add(String(paciente.regimen)); }
            });

            this.epsOpciones = Array.from(epsSet).sort();
            this.regimenOpciones = Array.from(regimenSet).sort();
        });
    }

    async generarReporteVacunacion() {
        this.vacunacionAnios = [];
        this.expandedVacAnios = {};
        this.expandedVacunas = {};
        this.cargandoVacunacion = true;

        try {
            const observable = await this.reportesService.obtenerReporteVacunasAplicadas(
                this.obtenerFechaHoraActualFormatoIso(this.filtroVac.fechaInicio),
                this.obtenerFechaHoraActualFormatoIso(this.filtroVac.fechaFin, true),
                this.filtroVac.vacuna,
                this.filtroVac.sexo,
                this.filtroVac.eps,
                this.filtroVac.regimen
            );

            observable.subscribe({
                next: (data: any[]) => {
                    const mapAnios = new Map<number, VacunacionAnioGrupo>();
                    let contador = 0;

                    (data || []).forEach((item: any) => {
                        const anio = Number(item.anio_vacunacion);

                        if (!mapAnios.has(anio)) {
                            mapAnios.set(anio, {
                                anio,
                                vacunas: []
                            });
                        }

                        const anioGrupo = mapAnios.get(anio)!;

                        let vacuna = anioGrupo.vacunas.find(
                            (v: any) => v.nombre_vacuna === item.nombre_vacuna
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

                        vacuna.detalle.push({
                            numRegistro: ++contador,
                            mes_vacunacion: item.mes_vacunacion,
                            fecha_vacunacion: new Date(item.fecha_vacunacion),
                            lote_vacuna_aplicada: item.lote_vacuna_aplicada,
                            dosis_aplicada: item.dosis_aplicada
                        });
                    });

                    this.vacunacionAnios = Array
                        .from(mapAnios.values())
                        .sort((a: any, b: any) => b.anio - a.anio);
                    this.totalRegistrosVacunacion = contador;
                    this.cargandoVacunacion = false;
                },
                error: (error: any) => {
                    console.error(error);
                    this.vacunacionAnios = [];
                    this.totalRegistrosVacunacion = 0;
                    this.cargandoVacunacion = false;
                }
            });
        } catch (e) {
            console.error(e);
            this.cargandoVacunacion = false;
        }
    }

    async generarReporteVacunasPorEdad() {
        this.vacunasPorEdad = [];
        this.totalRegistrosEdad = 0;
        this.cargandoEdad = true;

        try {
            const rango = this.filtroEdad.edad;
            const observable = await this.reportesService.obtenerReporteVacunasPorEdad(
                this.obtenerFechaHoraActualFormatoIso(this.filtroEdad.fechaInicio),
                this.obtenerFechaHoraActualFormatoIso(this.filtroEdad.fechaFin, true),
                this.filtroEdad.sexo,
                rango ? rango.edadMin : null,
                rango ? rango.edadMax : null
            );

            observable.subscribe({
                next: (data: any[]) => {
                    this.vacunasPorEdad = (data || []).map((item: any, index: number) => ({
                        ...item,
                        numRegistro: index + 1
                    }));
                    this.totalRegistrosEdad = this.vacunasPorEdad.length;
                    this.cargandoEdad = false;
                },
                error: (error: any) => {
                    console.error(error);
                    this.vacunasPorEdad = [];
                    this.totalRegistrosEdad = 0;
                    this.cargandoEdad = false;
                }
            });
        } catch (e) {
            console.error(e);
            this.cargandoEdad = false;
        }
    }

    async obtenerVacunas() {
        (await this.VacunaService.obtenerVacunas()).subscribe((data: any[]) => {
            this.vacunas = (data || []).filter((e: any) => e.estado === 'A').map((e: any) => {
                return {
                    key: e.id,
                    nombre_vacuna: e.nombre_vacuna
                };
            });
        });
    }

    aplicarRango(tipo: TipoRango, tab: TabReporte): void {
        const rango = this.calcularRango(tipo);

        if (tab === 'pacientes') {
            this.filtro.fechaInicio = rango.inicio;
            this.filtro.fechaFin = rango.fin;
            this.generarReportePacientes();
        } else if (tab === 'vacunacion') {
            this.filtroVac.fechaInicio = rango.inicio;
            this.filtroVac.fechaFin = rango.fin;
            this.generarReporteVacunacion();
        } else {
            this.filtroEdad.fechaInicio = rango.inicio;
            this.filtroEdad.fechaFin = rango.fin;
            this.generarReporteVacunasPorEdad();
        }
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
                    Email: p.email,
                    EPS: p.eps,
                    'Régimen': p.regimen
                });

                p.vacunas.forEach(v => {
                    rows.push({
                        Registros: v.numRegistro,
                        Vacuna: v.vacuna,
                        Fecha: v.fechaVacuna,
                        Lote: v.lote,
                        Dosis: v.dosis,
                        Edad: v.edad,
                        'Empresa/Entidad': v.empresa_entidad,
                        'Orden/Remisión': v.orden_remision
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

    exportarTodosRegistrosPacientesExcel() {

        const registros: any[] = [];

        // Aplanar datos
        this.anioGrupos.forEach(anio => {
            anio.pacientes.forEach(p => {
                p.vacunas.forEach(v => {
                    registros.push({
                        numRegistro: v.numRegistro,
                        fecha: v.fechaVacuna,
                        paciente: p.nombreCompleto,
                        documento: p.documento,
                        sexo: p.sexo,
                        telefono: p.telefono,
                        email: p.email,
                        eps: p.eps,
                        regimen: p.regimen,
                        vacuna: v.vacuna,
                        lote: v.lote,
                        dosis: v.dosis,
                        edad: v.edad,
                        empresa_entidad: v.empresa_entidad,
                        orden_remision: v.orden_remision
                    });
                });
            });
        });

        // Ordenar por fecha y paciente
        registros.sort((a, b) => {
            const f = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
            if (f !== 0) return f;
            return a.documento.localeCompare(b.documento);
        });

        const rows: any[] = [];

        let ultimaFecha = "";
        let ultimoDocumento = "";
        let contadorExport = 0;

        registros.forEach(r => {

            const nuevaFecha = r.fecha !== ultimaFecha;
            const nuevoPaciente = r.documento !== ultimoDocumento;

            rows.push({
                Registros: ++contadorExport,
                Fecha: nuevaFecha ? r.fecha : "",
                Paciente: nuevoPaciente ? r.paciente : "",
                Documento: nuevoPaciente ? r.documento : "",
                Sexo: nuevoPaciente ? r.sexo : "",
                Teléfono: nuevoPaciente ? r.telefono : "",
                Email: nuevoPaciente ? r.email : "",
                EPS: r.eps,
                'Régimen': r.regimen,
                Vacuna: r.vacuna,
                Lote: r.lote,
                Dosis: r.dosis,
                Edad: r.edad,
                'Empresa/Entidad': r.empresa_entidad,
                'Orden/Remisión': r.orden_remision
            });

            ultimaFecha = r.fecha;
            ultimoDocumento = r.documento;

        });

        const ws = XLSX.utils.json_to_sheet(rows);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pacientes total');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([excelBuffer]), 'reporte_total_pacientes.xlsx');
    }

    exportarPacientesPdf() {
        type ColumnaPdf = {
            header: string;
            key: string;
            width: number;
            align?: 'left' | 'center' | 'right';
            opcional?: boolean;
        };

        const filas: Record<string, string | number>[] = [];
        let contador = 0;

        this.anioGrupos.forEach(anio => {
            anio.pacientes.forEach(p => {
                p.vacunas.forEach(v => {
                    contador++;
                    filas.push({
                        num: contador,
                        anio: anio.anio,
                        fecha: this.formatearFecha(v.fechaVacuna),
                        paciente: p.nombreCompleto,
                        documento: p.documento,
                        sexo: this.obtenerLabelSexo(p.sexo),
                        eps: p.eps || '',
                        regimen: p.regimen || '',
                        vacuna: v.vacuna,
                        lote: v.lote,
                        dosis: v.dosis ?? '',
                        edad: v.edad,
                        empresa: v.empresa_entidad || '',
                        orden: v.orden_remision || ''
                    });
                });
            });
        });

        const columnas: ColumnaPdf[] = [
            { header: 'N°', key: 'num', width: 9, align: 'center' },
            { header: 'Año', key: 'anio', width: 11, align: 'center' },
            { header: 'Fecha', key: 'fecha', width: 18, align: 'center' },
            { header: 'Paciente', key: 'paciente', width: 40 },
            { header: 'Documento', key: 'documento', width: 21, align: 'center' },
            { header: 'Sexo', key: 'sexo', width: 12, align: 'center' },
            { header: 'EPS', key: 'eps', width: 22, opcional: true },
            { header: 'Régimen', key: 'regimen', width: 22, opcional: true },
            { header: 'Vacuna', key: 'vacuna', width: 24 },
            { header: 'Lote', key: 'lote', width: 16 },
            { header: 'Dosis', key: 'dosis', width: 14, align: 'center' },
            { header: 'Edad', key: 'edad', width: 14, align: 'center' },
            { header: 'Empresa', key: 'empresa', width: 24, opcional: true },
            { header: 'Remisión', key: 'orden', width: 20, opcional: true }
        ];

        const columnasVisibles = columnas.filter(columna => {
            if (!columna.opcional) { return true; }
            return filas.some(fila => String(fila[columna.key] ?? '').trim() !== '');
        });

        this.escalarColumnas(columnasVisibles);

        const columnStyles = columnasVisibles.reduce(
            (estilos: Record<number, any>, columna, index) => {
                estilos[index] = {
                    cellWidth: columna.width,
                    halign: columna.align ?? 'left'
                };
                return estilos;
            },
            {}
        );

        const filtros = [
            `Rango: ${this.formatearFecha(this.filtro.fechaInicio)} a ${this.formatearFecha(this.filtro.fechaFin)}   |   Sexo: ${this.obtenerLabelSexo(this.filtro.sexo)}   |   EPS: ${this.filtro.eps || 'Todas'}   |   Régimen: ${this.filtro.regimen || 'Todos'}`,
            `Paciente: ${this.obtenerNombrePaciente(this.filtro.paciente)}`
        ];

        this.generarPdf({
            titulo: 'Reporte de Pacientes Vacunados',
            filtros,
            total: filas.length,
            head: [columnasVisibles.map(columna => columna.header)],
            body: filas.map(fila => columnasVisibles.map(columna => fila[columna.key] ?? '')),
            columnStyles,
            fontSize: 8,
            headFontSize: 8.5,
            filename: 'reporte_pacientes.pdf'
        });
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
                        Registros: d.numRegistro,
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
        const body: (string | number)[][] = [];
        let contador = 0;

        this.vacunacionAnios.forEach(anio => {
            anio.vacunas.forEach(vac => {
                vac.detalle.forEach(d => {
                    contador++;
                    body.push([
                        contador,
                        anio.anio,
                        d.mes_vacunacion,
                        this.formatearFecha(d.fecha_vacunacion),
                        vac.nombre_vacuna,
                        vac.nombre_laboratorio,
                        d.lote_vacuna_aplicada,
                        d.dosis_aplicada ?? '',
                        vac.cantidad_dosis_parametrizada ?? ''
                    ]);
                });
            });
        });

        const filtros = [
            `Rango: ${this.formatearFecha(this.filtroVac.fechaInicio)} a ${this.formatearFecha(this.filtroVac.fechaFin)}   |   Vacuna: ${this.obtenerNombreVacuna(this.filtroVac.vacuna)}   |   Sexo: ${this.obtenerLabelSexo(this.filtroVac.sexo)}`,
            `EPS: ${this.filtroVac.eps || 'Todas'}   |   Régimen: ${this.filtroVac.regimen || 'Todos'}`
        ];

        const columnas = [
            { header: 'N°', width: 10, align: 'center' as const },
            { header: 'Año', width: 12, align: 'center' as const },
            { header: 'Mes', width: 12, align: 'center' as const },
            { header: 'Fecha', width: 22, align: 'center' as const },
            { header: 'Vacuna', width: 48 },
            { header: 'Laboratorio', width: 40 },
            { header: 'Lote', width: 26 },
            { header: 'Dosis aplicada', width: 28, align: 'center' as const },
            { header: 'Dosis param.', width: 30, align: 'center' as const }
        ];

        this.escalarColumnas(columnas);

        const columnStyles = columnas.reduce(
            (estilos: Record<number, any>, columna, index) => {
                estilos[index] = {
                    cellWidth: columna.width,
                    halign: columna.align ?? 'left'
                };
                return estilos;
            },
            {}
        );

        this.generarPdf({
            titulo: 'Reporte de Vacunas Aplicadas',
            filtros,
            total: body.length,
            head: [columnas.map(columna => columna.header)],
            body,
            columnStyles,
            fontSize: 9,
            headFontSize: 9.5,
            filename: 'reporte_vacunacion.pdf'
        });
    }

    exportarVacunasPorEdadExcel() {
        const rows = this.vacunasPorEdad.map(v => ({
            Registros: v.numRegistro,
            'Fecha vacuna': this.formatearFecha(v.fecha_vacuna),
            'Vacuna aplicada': v.vacuna_aplicada,
            Lote: v.lote,
            Paciente: v.paciente,
            Documento: v.documento,
            Edad: v.edad,
            EPS: v.eps,
            Sexo: v.sexo,
            Email: v.email
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Vacunas por edad');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([excelBuffer]), 'reporte_vacunas_por_edad.xlsx');
    }

    exportarVacunasPorEdadPdf() {
        const filtros = [
            `Rango: ${this.formatearFecha(this.filtroEdad.fechaInicio)} a ${this.formatearFecha(this.filtroEdad.fechaFin)}   |   Sexo: ${this.obtenerLabelSexo(this.filtroEdad.sexo)}   |   Edad: ${this.obtenerRangoEdadLabel()}`
        ];

        const columnas = [
            { header: 'N°', width: 9, align: 'center' as const },
            { header: 'Fecha', width: 18, align: 'center' as const },
            { header: 'Vacuna', width: 30 },
            { header: 'Lote', width: 20 },
            { header: 'Paciente', width: 45 },
            { header: 'Documento', width: 22, align: 'center' as const },
            { header: 'Edad', width: 12, align: 'center' as const },
            { header: 'EPS', width: 26 },
            { header: 'Sexo', width: 12, align: 'center' as const },
            { header: 'Email', width: 48 }
        ];

        this.escalarColumnas(columnas);

        const columnStyles = columnas.reduce(
            (estilos: Record<number, any>, columna, index) => {
                estilos[index] = {
                    cellWidth: columna.width,
                    halign: columna.align ?? 'left'
                };
                return estilos;
            },
            {}
        );

        this.generarPdf({
            titulo: 'Reporte de Vacunas por Edad',
            filtros,
            total: this.vacunasPorEdad.length,
            head: [columnas.map(columna => columna.header)],
            body: this.vacunasPorEdad.map(v => [
                v.numRegistro,
                this.formatearFecha(v.fecha_vacuna),
                v.vacuna_aplicada,
                v.lote,
                v.paciente,
                v.documento,
                v.edad,
                v.eps,
                this.obtenerLabelSexo(v.sexo),
                v.email
            ]),
            columnStyles,
            fontSize: 8,
            headFontSize: 8.5,
            filename: 'reporte_vacunas_por_edad.pdf'
        });
    }

    private generarPdf(opciones: {
        titulo: string;
        filtros: string[];
        total: number;
        head: string[][];
        body: (string | number)[][];
        columnStyles?: any;
        fontSize?: number;
        headFontSize?: number;
        filename: string;
    }): void {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        }) as jsPDF & { lastAutoTable?: any };

        const fechaGen = this.formatearFechaHora(new Date());
        const fontSize = opciones.fontSize ?? 8;
        let primeraPagina = true;

        autoTable(doc, {
            startY: 52,
            tableWidth: 270,
            head: opciones.head,
            body: opciones.body,
            margin: { top: 52, left: 13.5, right: 13.5, bottom: 22 },
            styles: {
                font: 'helvetica',
                fontSize,
                cellPadding: 2.5,
                overflow: 'linebreak',
                lineColor: [226, 232, 240],
                lineWidth: 0.1,
                textColor: [30, 41, 59],
                valign: 'middle'
            },
            headStyles: {
                fillColor: [0, 95, 153],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: opciones.headFontSize ?? (fontSize + 0.5),
                halign: 'center',
                valign: 'middle'
            },
            alternateRowStyles: {
                fillColor: [240, 249, 252]
            },
            columnStyles: opciones.columnStyles,
            showHead: 'everyPage',
            rowPageBreak: 'avoid',
            willDrawPage: () => {
                this.dibujarEncabezadoPdf(
                    doc,
                    opciones.titulo,
                    opciones.filtros,
                    opciones.total,
                    fechaGen,
                    primeraPagina
                );
                primeraPagina = false;
                this.dibujarMarcaAguaPdf(doc);
            }
        });

        this.agregarPiePaginaPdf(doc, fechaGen);
        doc.save(opciones.filename);
    }

    private escalarColumnas(columnas: { width: number }[], anchoDisponible = 270): void {
        const anchoTotal = columnas.reduce((suma, columna) => suma + columna.width, 0);
        if (anchoTotal === 0) { return; }

        const factor = anchoDisponible / anchoTotal;
        columnas.forEach(columna => {
            columna.width = Math.round(columna.width * factor * 10) / 10;
        });
    }

    private dibujarEncabezadoPdf(
        doc: jsPDF & { lastAutoTable?: any },
        titulo: string,
        filtros: string[],
        total: number,
        fechaGen: string,
        esPrimera: boolean
    ): void {
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFillColor(0, 95, 153);
        doc.rect(0, 0, pageWidth, 28, 'F');

        doc.setFillColor(61, 161, 184);
        doc.rect(0, 28, pageWidth, 1.6, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(titulo, 12, 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Sistema de Vacunación - Integral-soft', 12, 20.5);

        doc.setFontSize(9);
        doc.text(`Generado: ${fechaGen}`, pageWidth - 12, 12, { align: 'right' });
        doc.text(`Total registros: ${total}`, pageWidth - 12, 20.5, { align: 'right' });

        if (esPrimera && filtros.length) {
            doc.setTextColor(51, 65, 85);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);

            let y = 35;
            filtros.forEach(linea => {
                doc.text(linea, 12, y);
                y += 5;
            });

            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.2);
            doc.line(12, y - 1.5, pageWidth - 12, y - 1.5);
        }
    }

    private dibujarMarcaAguaPdf(doc: jsPDF & { lastAutoTable?: any }): void {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.saveGraphicsState();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(48);
        doc.setTextColor(61, 161, 184);
        doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
        doc.text('Integral-soft.com', pageWidth / 2, pageHeight / 2, {
            align: 'center',
            angle: 45
        });
        doc.restoreGraphicsState();
    }

    private agregarPiePaginaPdf(
        doc: jsPDF & { lastAutoTable?: any },
        fechaGen: string
    ): void {
        const pageCount = doc.getNumberOfPages();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.2);
            doc.line(12, pageHeight - 15, pageWidth - 12, pageHeight - 15);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(0, 95, 153);
            doc.text('Integral-soft - Sistema de Vacunación', 12, pageHeight - 8);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text(`Generado: ${fechaGen}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - 12, pageHeight - 8, { align: 'right' });
        }
    }

    private formatearFechaHora(fecha: Date): string {
        const fechaTexto = this.formatearFecha(fecha);
        const hora = fecha.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit'
        });
        return `${fechaTexto} ${hora}`;
    }

    private obtenerLabelSexo(valor: string | null | undefined): string {
        const opcion = this.opcionesSexo.find(o => o.value === valor);
        return opcion ? opcion.label : 'Todos';
    }

    private obtenerNombrePaciente(id: number | null): string {
        if (!id) { return 'Todos'; }

        const paciente = this.pacientes.find(p => p.key === id);
        return paciente
            ? `${paciente.nombreCompleto} (${paciente.documento})`
            : 'Todos';
    }

    private obtenerNombreVacuna(id: number | null): string {
        if (!id) { return 'Todas'; }

        const vacuna = this.vacunas.find(v => v.key === id);
        return vacuna ? vacuna.nombre_vacuna : 'Todas';
    }

    private obtenerRangoEdadLabel(): string {
        return this.filtroEdad.edad ? this.filtroEdad.edad.label : 'Todas';
    }

    setFechaHoraDefecto() {
        [this.filtro, this.filtroVac, this.filtroEdad].forEach(filtro => {
            filtro.fechaInicio.setHours(0, 0, 0, 0);
            filtro.fechaFin.setHours(23, 59, 59, 999);
        });
    }

    private generarRangosEdad(): void {
        const rangos: RangoEdad[] = [];

        for (let min = 0; min < 90; min += 10) {
            rangos.push({
                label: `${min} a ${min + 9} años`,
                edadMin: min,
                edadMax: min + 10
            });
        }

        rangos.push({ label: '90 años o más', edadMin: 90, edadMax: null });
        this.rangosEdad = rangos;
    }

    private calcularRango(tipo: TipoRango): { inicio: Date; fin: Date } {
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = hoy.getMonth();

        switch (tipo) {
            case 'mes':
                return { inicio: new Date(anio, mes, 1), fin: new Date(anio, mes + 1, 0) };
            case 'mes-anterior':
                return { inicio: new Date(anio, mes - 1, 1), fin: new Date(anio, mes, 0) };
            case 'trimestre': {
                const trimestre = Math.floor(mes / 3);
                return {
                    inicio: new Date(anio, trimestre * 3, 1),
                    fin: new Date(anio, trimestre * 3 + 3, 0)
                };
            }
            case 'semestre': {
                const semestre = mes < 6 ? 0 : 1;
                return {
                    inicio: new Date(anio, semestre * 6, 1),
                    fin: new Date(anio, semestre * 6 + 6, 0)
                };
            }
            case 'anio':
                return { inicio: new Date(anio, 0, 1), fin: new Date(anio, 11, 31) };
            default:
                return { inicio: new Date(anio, mes, 1), fin: new Date(anio, mes + 1, 0) };
        }
    }

    private formatearFecha(value: Date | string): string {
        const fecha = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(fecha.getTime())) { return ''; }

        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${anio}-${mes}-${dia}`;
    }

}
