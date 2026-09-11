import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService, SelectItem } from 'primeng/api';
import { ReportesService } from '../../services/reportes/reportes.service';
import { ConsultorioService } from '../../services/consultorio/consultorio.service';
import { SecureStorageService } from '../../services/secure-storage.service';

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
import { TagModule } from 'primeng/tag';


import type * as XLSXType from 'xlsx-js-style';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
    selector: 'app-reportes',
    imports: [
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
        TagModule
    ],
    templateUrl: './reportes.component.html',
    styleUrl: './reportes.component.css',
    providers: [MessageService, ConfirmationService]
})
export class ReportesComponent implements OnInit {

    idRol:number = 0;
    enviando: boolean = false;

    fechaInicio: Date = new Date;
    fechaFin: Date = new Date;
    consultorio: number | null = null;
    tipoReporte: 'totalizado' | 'detallado' | 'consolidado_dia' = 'totalizado';
    datos: any[] = [];
    columnas: any[] = [];
    totales: { [key: string]: number } = {};
    gruposColumnas: { base: any[]; grupos: any[]; cierre: any | null } = { base: [], grupos: [], cierre: null };

    // Paleta única compartida por pantalla, Excel y PDF
    readonly COLORES_GRUPO = [
        { color: '#0d8aa6', head: '#d7eef3', soft: '#f2fafc', total: '#bfe6ee' },
        { color: '#b45309', head: '#fde9c8', soft: '#fffaf0', total: '#fbdca8' },
        { color: '#6d28d9', head: '#ece1fb', soft: '#f9f6ff', total: '#ddcbf7' },
        { color: '#047857', head: '#d0f0e2', soft: '#f1fbf7', total: '#b7e7d4' }
    ];
    readonly COLOR_BASE = { header: '#e6f4f7', color: '#0d8aa6' };
    readonly COLOR_TOTAL_GENERAL = { bg: '#075e70', color: '#ffffff' };

    tipoReporteOptions = [
        { label: 'Totalizado', value: 'totalizado' },
        { label: 'Detallado', value: 'detallado' },
        { label: 'Consolidado por día', value: 'consolidado_dia' }
    ];

    // Agrupación RESPEL para la visualización de los reportes
    readonly GRUPOS_REPORTE = [
        {
            titulo: 'Res. no peligrosos',
            campos: ['aprovechables', 'aprovechables_organicos', 'no_aprovechables'],
            total: 'total_no_peligrosos'
        },
        {
            titulo: 'Res. riesgo biológico/infeccioso',
            campos: ['biosanitarios', 'anatomopatologicos', 'cortopunzantes_ng', 'cortopunzantes_k', 'de_animales'],
            total: 'total_riesgo_biologico'
        },
        {
            titulo: 'Otros residuos peligrosos',
            campos: ['quimicos', 'corrosivos', 'explosivos', 'reactivos', 'toxicos', 'inflamables',
                     'farmacos', 'chatarra_electronica', 'pilas', 'iluminarias', 'aceites_usados'],
            total: 'total_otros_peligrosos'
        },
        {
            titulo: 'Radiactivos',
            campos: ['radioactivos'],
            total: 'total_radiactivos'
        }
    ];

    readonly ETIQUETAS: { [key: string]: string } = {
        codigo: 'Consultorio',
        fecha: 'Fecha',
        aprovechables: 'Aprovechables',
        aprovechables_organicos: 'Aprovechables orgánicos',
        no_aprovechables: 'No aprovechables',
        biosanitarios: 'Biosanitarios',
        anatomopatologicos: 'Anatomopatológicos',
        cortopunzantes_ng: 'Cortopunzantes NG',
        cortopunzantes_k: 'Cortopunzantes K',
        de_animales: 'De animales',
        quimicos: 'Químicos (legado)',
        corrosivos: 'Corrosivos',
        explosivos: 'Explosivos',
        reactivos: 'Reactivos',
        toxicos: 'Tóxicos',
        inflamables: 'Inflamables',
        farmacos: 'Fármacos',
        chatarra_electronica: 'Chatarra electrónica',
        pilas: 'Pilas',
        iluminarias: 'Iluminarias',
        aceites_usados: 'Aceites usados',
        radioactivos: 'Radioactivos',
        total: 'Total (legado)'
    };

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
        private confirmService: ConfirmationService,
        private secureStorage: SecureStorageService
    ) {
        this.secureStorage.getItem('idRol').then(idRol => {
            this.idRol = Number(idRol) || 0;
        });
    }

    ngOnInit(): void {
        this.cargarConsultorios();
    }

    async generarReporte() {
        if(!this.validarParametrosReporte()) {
            return;
        }

        let obs: any;

        if (this.tipoReporte == 'totalizado') {
            obs = await this.reportesService.obtenerReporteTotalizado(this.fechaInicio, this.fechaFin, this.consultorio);
        } else if (this.tipoReporte == 'detallado') {
            obs = await this.reportesService.obtenerReporteDetallado(this.fechaInicio, this.fechaFin, this.consultorio);
        } else {
            obs = await this.reportesService.obtenerReporteConsolidadoDia(this.fechaInicio, this.fechaFin, this.consultorio);
        }

        obs.subscribe((data: any[]) => {
            this.prepararDatos(data || []);
        });
    }

    // Convierte los datos crudos, calcula subtotales de grupo y arma columnas agrupadas
    private prepararDatos(datos: any[]): void {
        this.datos = (datos || []).map(obj => {
            const n: any = { ...obj };

            for (const k in n) {
                if (n[k] !== null && n[k] !== '' && typeof n[k] !== 'boolean' && !isNaN(n[k])) {
                    n[k] = parseFloat(n[k]);
                }
            }

            for (const g of this.GRUPOS_REPORTE) {
                n[g.total] = g.campos.reduce((acc, c) => acc + (Number(n[c]) || 0), 0);
            }
            n['total_general'] = this.GRUPOS_REPORTE.reduce((acc, g) => acc + (Number(n[g.total]) || 0), 0);

            return n;
        });

        this.columnas = this.construirColumnas(this.datos);
        this.calcularTotales();
    }

    private construirColumnas(datos: any[]): any[] {
        if (!datos.length) {
            this.gruposColumnas = { base: [], grupos: [], cierre: null };
            return [];
        }

        const especiales = new Set<string>();
        this.GRUPOS_REPORTE.forEach(g => {
            g.campos.forEach(c => especiales.add(c));
            especiales.add(g.total);
        });

        const baseFields = Object.keys(datos[0]).filter(
            k => !especiales.has(k) && k !== 'total' && k !== 'total_general'
        );

        const cols: any[] = [];
        const base: any[] = [];

        baseFields.forEach(f => {
            const col = { field: f, header: this.etiqueta(f), base: true };
            cols.push(col);
            base.push(col);
        });

        const grupos: any[] = [];

        this.GRUPOS_REPORTE.forEach((g, gi) => {
            const visibles = g.campos.filter(c => c in datos[0]);

            visibles.forEach((c, idx) => {
                cols.push({
                    field: c,
                    header: this.etiqueta(c),
                    grupo: gi,
                    grupoInicio: idx === 0
                });
            });

            cols.push({ field: g.total, header: 'TOTAL', esTotal: true, grupo: gi, grupoFin: true });
            grupos.push({ titulo: g.titulo, colspan: visibles.length + 1, index: gi });
        });

        const colTotalGeneral = { field: 'total_general', header: 'TOTAL GENERAL', esTotalFuerte: true };
        cols.push(colTotalGeneral);

        this.gruposColumnas = { base, grupos, cierre: colTotalGeneral };

        return cols;
    }

    private etiqueta(field: string): string {
        return this.ETIQUETAS[field] ?? this.formatHeader(field);
    }

    // Estilos (colores) de una columna, compartidos con Excel/PDF
    estilosColumna(col: any, esHeader = false): { [k: string]: string } {
        const estilos: { [k: string]: string } = {};

        if (col.base) {
            if (esHeader) {
                estilos['background-color'] = this.COLOR_BASE.header;
                estilos['color'] = this.COLOR_BASE.color;
                estilos['font-weight'] = '700';
            }
            return estilos;
        }

        if (col.esTotalFuerte) {
            estilos['background-color'] = this.COLOR_TOTAL_GENERAL.bg;
            estilos['color'] = this.COLOR_TOTAL_GENERAL.color;
            estilos['font-weight'] = '700';
            estilos['border-left'] = `3px solid ${this.COLOR_TOTAL_GENERAL.bg}`;
            return estilos;
        }

        if (col.grupo !== undefined && col.grupo !== null) {
            const pal = this.COLORES_GRUPO[col.grupo] || this.COLORES_GRUPO[0];

            if (col.esTotal) {
                estilos['background-color'] = pal.total;
                estilos['color'] = pal.color;
                estilos['font-weight'] = '700';
                estilos['border-left'] = `1px dashed ${pal.color}`;
                estilos['border-right'] = `3px solid ${pal.color}`;
            } else {
                estilos['background-color'] = pal.soft;
                if (esHeader) {
                    estilos['color'] = pal.color;
                    estilos['font-weight'] = '700';
                }
            }

            if (col.grupoInicio) {
                estilos['border-left'] = `3px solid ${pal.color}`;
            }
        }

        return estilos;
    }

    // Estilo del título de cada grupo RESPEL
    estilosGrupo(index: number): { [k: string]: string } {
        const pal = this.COLORES_GRUPO[index] || this.COLORES_GRUPO[0];
        return {
            'background-color': pal.head,
            'color': pal.color,
            'font-weight': '700',
            'border-top': `2px solid ${pal.color}`,
            'border-left': `3px solid ${pal.color}`,
            'border-right': `3px solid ${pal.color}`
        };
    }

    get estiloTotalGeneral(): { [k: string]: string } {
        return {
            'background-color': this.COLOR_TOTAL_GENERAL.bg,
            'color': this.COLOR_TOTAL_GENERAL.color,
            'font-weight': '700'
        };
    }

    async cargarConsultorios() {
        try {
            (await this.consultorioService.obtenerDatosConsultorios()).subscribe((data) => {
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

    async descargarExcel(): Promise<void> {
        const XLSX = await import('xlsx-js-style');

        const cols = this.columnas;
        const nCols = cols.length;
        if (!nCols) { return; }

        const fila0: any[] = new Array(nCols).fill(null);
        const fila1: any[] = new Array(nCols).fill(null);

        this.gruposColumnas.base.forEach((col, i) => { fila0[i] = col.header; });

        let colIdx = this.gruposColumnas.base.length;
        this.gruposColumnas.grupos.forEach(g => {
            fila0[colIdx] = g.titulo;
            for (let k = 0; k < g.colspan; k++) {
                const col = cols[colIdx + k];
                if (col) { fila1[colIdx + k] = col.header; }
            }
            colIdx += g.colspan;
        });

        let idxCierre = -1;
        if (this.gruposColumnas.cierre) {
            idxCierre = cols.findIndex(c => c.field === this.gruposColumnas.cierre.field);
            if (idxCierre >= 0) { fila0[idxCierre] = this.gruposColumnas.cierre.header; }
        }

        const aoa: any[][] = [fila0, fila1];

        this.datos.forEach(row => {
            aoa.push(cols.map(col => {
                const v = row[col.field];
                return v === null || v === undefined ? '' : v;
            }));
        });

        const filaTot: any[] = cols.map((col, i) => {
            if (i === 0) { return 'TOTAL'; }
            const t = this.totales[col.field];
            return t === undefined ? '' : t;
        });
        aoa.push(filaTot);

        const ws: XLSXType.WorkSheet = XLSX.utils.aoa_to_sheet(aoa);

        const merges: any[] = [];
        this.gruposColumnas.base.forEach((_, i) => merges.push({ s: { r: 0, c: i }, e: { r: 1, c: i } }));
        colIdx = this.gruposColumnas.base.length;
        this.gruposColumnas.grupos.forEach(g => {
            if (g.colspan > 1) {
                merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + g.colspan - 1 } });
            }
            colIdx += g.colspan;
        });
        if (idxCierre >= 0) {
            merges.push({ s: { r: 0, c: idxCierre }, e: { r: 1, c: idxCierre } });
        }
        ws['!merges'] = merges;

        ws['!cols'] = cols.map(col => ({ wch: Math.max(13, String(col.header || '').length + 3) }));
        ws['!rows'] = [{ hpt: 24 }, { hpt: 30 }];

        const borde = { style: 'thin', color: { rgb: 'DBE9EE' } };
        const borderAll = { top: borde, bottom: borde, left: borde, right: borde };

        const setCell = (r: number, c: number, style: any) => {
            const addr = XLSX.utils.encode_cell({ r, c });
            if (!ws[addr]) { (ws as any)[addr] = { t: 's', v: '' }; }
            (ws as any)[addr].s = style;
        };

        const headAlign = { horizontal: 'center', vertical: 'center', wrapText: true };
        const baseHeader = {
            fill: { fgColor: { rgb: this.hex(this.COLOR_BASE.header) } },
            font: { color: { rgb: this.hex(this.COLOR_BASE.color) }, bold: true },
            alignment: headAlign,
            border: borderAll
        };

        cols.forEach((col, i) => {
            if (col.base) {
                setCell(0, i, baseHeader);
                setCell(1, i, baseHeader);
                return;
            }

            if (col.esTotalFuerte) {
                const tot = {
                    fill: { fgColor: { rgb: this.hex(this.COLOR_TOTAL_GENERAL.bg) } },
                    font: { color: { rgb: 'FFFFFF' }, bold: true },
                    alignment: headAlign,
                    border: borderAll
                };
                setCell(0, i, tot);
                setCell(1, i, tot);
                return;
            }

            if (col.grupo !== undefined && col.grupo !== null) {
                const pal = this.COLORES_GRUPO[col.grupo];

                if (col.grupoInicio) {
                    setCell(0, i, {
                        fill: { fgColor: { rgb: this.hex(pal.head) } },
                        font: { color: { rgb: this.hex(pal.color) }, bold: true },
                        alignment: headAlign,
                        border: borderAll
                    });
                }

                if (col.esTotal) {
                    setCell(1, i, {
                        fill: { fgColor: { rgb: this.hex(pal.total) } },
                        font: { color: { rgb: this.hex(pal.color) }, bold: true },
                        alignment: headAlign,
                        border: borderAll
                    });
                } else {
                    setCell(1, i, {
                        fill: { fgColor: { rgb: this.hex(pal.soft) } },
                        font: { color: { rgb: this.hex(pal.color) }, bold: true },
                        alignment: headAlign,
                        border: borderAll
                    });
                }
            }
        });

        const primeraFilaDatos = 2;
        const ultimaFila = aoa.length - 1;

        for (let r = primeraFilaDatos; r <= ultimaFila; r++) {
            const esFilaTotal = r === ultimaFila;

            cols.forEach((col, c) => {
                const style: any = { border: borderAll, alignment: { vertical: 'center' } };

                if (col.esTotalFuerte) {
                    style.fill = { fgColor: { rgb: this.hex(this.COLOR_TOTAL_GENERAL.bg) } };
                    style.font = { color: { rgb: 'FFFFFF' }, bold: true };
                } else if (col.grupo !== undefined && col.grupo !== null) {
                    const pal = this.COLORES_GRUPO[col.grupo];
                    if (col.esTotal) {
                        style.fill = { fgColor: { rgb: this.hex(pal.total) } };
                        style.font = { color: { rgb: this.hex(pal.color) }, bold: true };
                    } else {
                        style.fill = { fgColor: { rgb: this.hex(pal.soft) } };
                    }
                } else if (col.base) {
                    style.font = { color: { rgb: this.hex(this.COLOR_BASE.color) }, bold: true };
                }

                if (esFilaTotal) {
                    style.font = { ...(style.font || {}), bold: true };
                }

                setCell(r, c, style);
            });
        }

        const wb: XLSXType.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
        XLSX.writeFile(wb, `reporte_${this.tipoReporte}.xlsx`);
    }

    private hex(color: string): string {
        return color.replace('#', '').toUpperCase();
    }

    descargarPdf() {
        const cols = this.columnas;
        if (!cols.length) { return; }

        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

        const fila0: any[] = [];
        const fila1: any[] = [];

        this.gruposColumnas.base.forEach(col => fila0.push({ content: col.header, rowSpan: 2 }));

        this.gruposColumnas.grupos.forEach(g => fila0.push({ content: g.titulo, colSpan: g.colspan }));

        if (this.gruposColumnas.cierre) {
            fila0.push({ content: this.gruposColumnas.cierre.header, rowSpan: 2 });
        }

        cols.filter(c => !c.base && !c.esTotalFuerte).forEach(col => fila1.push({ content: col.header }));

        const body = this.datos.map(row =>
            cols.map(col => {
                const valor = row[col.field];
                return valor === null || valor === undefined ? '' : valor;
            })
        );

        const foot = [[
            ...cols.map((col, i) => {
                if (i === 0) { return 'TOTAL'; }
                const t = this.totales[col.field];
                return t === undefined ? '' : t;
            })
        ]];

        autoTable(doc, {
            head: [fila0, fila1],
            body,
            foot,
            showFoot: 'lastPage',
            styles: { fontSize: 6, cellPadding: 2, lineColor: '#DBE9EE', lineWidth: 0.5, valign: 'middle' },
            headStyles: { fontSize: 6, halign: 'center', valign: 'middle', fillColor: '#F1F7F9', textColor: '#0D8AA6' },
            footStyles: { fontSize: 6, halign: 'right', fontStyle: 'bold' },
            margin: { top: 52, left: 20, right: 20, bottom: 30 },
            didParseCell: (data: any) => {
                const col = cols[data.column.index];
                if (!col) { return; }

                if (col.esTotalFuerte) {
                    data.cell.styles.fillColor = this.COLOR_TOTAL_GENERAL.bg;
                    data.cell.styles.textColor = this.COLOR_TOTAL_GENERAL.color;
                    data.cell.styles.fontStyle = 'bold';
                } else if (col.grupo !== undefined && col.grupo !== null) {
                    const pal = this.COLORES_GRUPO[col.grupo];

                    if (col.esTotal) {
                        data.cell.styles.fillColor = pal.total;
                        data.cell.styles.textColor = pal.color;
                        data.cell.styles.fontStyle = 'bold';
                    } else if (data.section === 'head') {
                        data.cell.styles.fillColor = pal.head;
                        data.cell.styles.textColor = pal.color;
                        data.cell.styles.fontStyle = 'bold';
                    } else if (data.section !== 'foot') {
                        data.cell.styles.fillColor = pal.soft;
                    }
                } else if (col.base && data.section !== 'foot') {
                    if (data.section === 'head') {
                        data.cell.styles.fillColor = this.COLOR_BASE.header;
                        data.cell.styles.textColor = this.COLOR_BASE.color;
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            },
            didDrawPage: () => {
                doc.setFontSize(11);
                doc.setTextColor(13, 138, 166);
                doc.text(`Reporte ${this.etiquetaTipoReporte()}`, 20, 26);

                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text(
                    `Desde ${this.formatoFechaLocal(this.fechaInicio)} hasta ${this.formatoFechaLocal(this.fechaFin)}`,
                    20, 40
                );
            }
        });

        doc.save(`reporte_${this.tipoReporte}.pdf`);
    }

    private etiquetaTipoReporte(): string {
        switch (this.tipoReporte) {
            case 'totalizado': return 'Totalizado';
            case 'detallado': return 'Detallado';
            case 'consolidado_dia': return 'Consolidado por día';
            default: return this.tipoReporte;
        }
    }

    private formatoFechaLocal(fecha: Date | null): string {
        if (!fecha) { return ''; }
        const d = new Date(fecha);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    async enviarReporteConsultorios() {
        this.confirmService.confirm({
            header: 'Enviar reporte por correo electrónico',
            icon: 'fa fa-exclamation-triangle',
            message: '¿Estás seguro de enviar el reporte generado a los correos electrónicos de los consultorios? Recuerda que se enviarán a todos los consultorios que hayas generado en el reporte.',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                this.enviando = true;

                (await this.reportesService.enviarReporteCorreosConsultorios(
                    this.fechaInicio, this.fechaFin, this.consultorio, this.tipoReporte
                )).subscribe({
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
                        this.enviando = false;
                    }
                });
            }
        });
    }

    async abrirHistorialEnvios() {
        this.showLogsDialog = true;
        (await this.reportesService.obtenerLogsReportes()).subscribe({
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
