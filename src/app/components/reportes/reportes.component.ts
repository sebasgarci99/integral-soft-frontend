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
import { InputNumberModule } from 'primeng/inputnumber';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';


import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { firstValueFrom } from 'rxjs';
import { ValorResiduosService } from '../../services/valor-residuos/valor-residuos.service';
import { ValorResiduo } from '../../interfaces/valor-residuo';

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
        InputNumberModule,
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
    tipoReporte: 'totalizado' | 'detallado' | 'consolidado_dia' | 'totalizado_valor' = 'totalizado';
    datos: any[] = [];
    reporteGenerado = false;
    columnas: any[] = [];
    totales: { [key: string]: number } = {};
    gruposColumnas: { base: any[]; grupos: any[]; valor?: any | null; cierre: any | null } = { base: [], grupos: [], valor: null, cierre: null };

    // Paleta única compartida por pantalla, Excel y PDF
    readonly COLORES_GRUPO = [
        { color: '#0d8aa6', head: '#d7eef3', soft: '#f2fafc', total: '#bfe6ee' },
        { color: '#b45309', head: '#fde9c8', soft: '#fffaf0', total: '#fbdca8' },
        { color: '#7c3aed', head: '#ede9fe', soft: '#faf8ff', total: '#ddd6fe' },
        { color: '#047857', head: '#d0f0e2', soft: '#f1fbf7', total: '#b7e7d4' },
        { color: '#475569', head: '#e2e8f0', soft: '#f8fafc', total: '#cbd5e1' }
    ];
    readonly COLOR_BASE = { header: '#e6f4f7', color: '#0d8aa6' };
    readonly COLOR_TOTAL_GENERAL = { bg: '#075e70', color: '#ffffff' };
    // Color propio de la columna "Valor a cobrar (pesos)" del reporte Totalizado + Valor total
    readonly COLOR_VALOR = { color: '#be123c', head: '#fce7ee', soft: '#fdf2f6', total: '#f7ccd9' };
    readonly CAMPO_VALOR_TOTAL = 'valor_total_riesgo_biologico';

    tipoReporteOptions = [
        { label: 'Totalizado', value: 'totalizado' },
        { label: 'Detallado', value: 'detallado' },
        { label: 'Consolidado por día', value: 'consolidado_dia' }
    ];

    // ===== Valor a cobrar de residuos (rol 1) =====
    valorKgActual: number | null = null;
    showValorDialog = false;
    guardandoValor = false;
    valores: ValorResiduo[] = [];
    nuevoValorKg: number | null = null;
    nuevoValorFecha: Date = new Date();
    nuevoValorObservacion = '';

    // ===== Reporte comparativo (rol 1) =====
    comparativoData: any[] = [];
    comparativoResumen: any = { Consultorio: null, Administracion: null };
    comparativoExpandido: any = { Consultorio: false, Administracion: false };
    cargandoComparativo = false;
    comparativoGenerado = false;

    // Agrupación RESPEL para la visualización de los reportes
    readonly GRUPOS_REPORTE = [
        {
            titulo: 'Res. no peligrosos',
            campos: ['aprovechables', 'aprovechables_organicos', 'no_aprovechables'],
            total: 'total_no_peligrosos'
        },
        {
            titulo: 'Res. riesgo biológico/infeccioso',
            campos: ['biosanitarios', 'anatomopatologicos', 'cortopunzantes', 'de_animales'],
            total: 'total_riesgo_biologico'
        },
        {
            titulo: 'Radiactivos',
            campos: ['radioactivos'],
            total: 'total_radiactivos'
        },
        {
            titulo: 'Otros residuos peligrosos',
            campos: ['corrosivos', 'explosivos', 'reactivos', 'toxicos', 'inflamables'],
            total: 'total_otros_peligrosos'
        },
        {
            titulo: 'Residuos peligrosos identificables',
            campos: ['quimicos', 'farmacos', 'chatarra_electronica', 'pilas', 'iluminarias', 'aceites_usados'],
            total: 'total_otros_no_norma'
        }
    ];

    // En estos tipos de reporte el grupo se omite SOLO en Excel/PDF (en pantalla sí se ve)
    private readonly GRUPO_NO_NORMA_TOTAL = 'total_otros_no_norma';
    private readonly TIPOS_EXPORT_SIN_NO_NORMA = ['totalizado_valor'];
    // Residuos físicos que se mapean a la característica Tóxico de la norma
    private readonly CAMPOS_MAPEADOS_TOXICO = ['farmacos', 'chatarra_electronica', 'pilas', 'iluminarias', 'aceites_usados'];

    // Campos (kg) que se muestran en el detalle por día del reporte comparativo
    readonly CAMPOS_DETALLE_COMPARATIVO: string[] = [
        'aprovechables', 'aprovechables_organicos', 'no_aprovechables',
        'biosanitarios', 'anatomopatologicos', 'cortopunzantes', 'de_animales',
        'radioactivos',
        'quimicos', 'corrosivos', 'explosivos', 'reactivos', 'toxicos', 'inflamables',
        'farmacos', 'chatarra_electronica', 'pilas', 'iluminarias', 'aceites_usados',
        'total'
    ];

    readonly ETIQUETAS: { [key: string]: string } = {
        codigo: 'Consultorio',
        fecha: 'Fecha',
        aprovechables: 'Aprovechables',
        aprovechables_organicos: 'Aprovechables orgánicos',
        no_aprovechables: 'No aprovechables',
        biosanitarios: 'Biosanitarios',
        anatomopatologicos: 'Anatomopatológicos',
        cortopunzantes: 'Cortopunzantes',
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
        private secureStorage: SecureStorageService,
        private valorResiduosService: ValorResiduosService
    ) {
        this.secureStorage.getItem('idRol').then(idRol => {
            this.idRol = Number(idRol) || 0;

            if (this.idRol === 1) {
                this.tipoReporteOptions = [
                    ...this.tipoReporteOptions,
                    { label: 'Totalizado + Valor total', value: 'totalizado_valor' }
                ];
            }
        });
    }

    ngOnInit(): void {
        this.cargarConsultorios();
    }

    async generarReporte() {
        if(!this.validarParametrosReporte()) {
            return;
        }

        // El reporte "Totalizado + Valor total" requiere el valor vigente por kg
        if (this.tipoReporte === 'totalizado_valor') {
            try {
                const vigente: any = await firstValueFrom(await this.valorResiduosService.obtenerValorVigente());
                this.valorKgActual = vigente ? Number(vigente.valor_kg) : null;

                if (this.valorKgActual == null) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Sin valor configurado',
                        detail: 'Configure el valor a cobrar de los residuos para generar este reporte.'
                    });
                    return;
                }
            } catch (e) {
                this.valorKgActual = null;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo obtener el valor a cobrar de los residuos.'
                });
                return;
            }
        }

        let obs: any;

        if (this.tipoReporte == 'totalizado' || this.tipoReporte == 'totalizado_valor') {
            obs = await this.reportesService.obtenerReporteTotalizado(this.fechaInicio, this.fechaFin, this.consultorio);
        } else if (this.tipoReporte == 'detallado') {
            obs = await this.reportesService.obtenerReporteDetallado(this.fechaInicio, this.fechaFin, this.consultorio);
        } else {
            obs = await this.reportesService.obtenerReporteConsolidadoDia(this.fechaInicio, this.fechaFin, this.consultorio);
        }

        obs.subscribe((data: any[]) => {
            this.reporteGenerado = true;
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

            // Mapeo a la norma: los residuos físicos suman a la característica Tóxico
            // (se conserva el valor histórico guardado en tóxicos).
            const aporteToxico = this.CAMPOS_MAPEADOS_TOXICO.reduce((acc, c) => acc + (Number(n[c]) || 0), 0);
            n['toxicos'] = (Number(n['toxicos']) || 0) + aporteToxico;

            for (const g of this.GRUPOS_REPORTE) {
                n[g.total] = g.campos.reduce((acc, c) => acc + (Number(n[c]) || 0), 0);
            }

            // TOTAL GENERAL: los campos mapeados ya están dentro de Tóxicos; no se suman de nuevo.
            // Químicos (legado) solo cuenta cuando su grupo está visible.
            const totalBase = ['total_no_peligrosos', 'total_riesgo_biologico', 'total_radiactivos', 'total_otros_peligrosos']
                .reduce((acc, f) => acc + (Number(n[f]) || 0), 0);
            n['total_general'] = totalBase + (this.ocultaGrupoNoNormaPantalla() ? 0 : (Number(n['quimicos']) || 0));

            // En el reporte "Totalizado + Valor total" se agrega una columna NUEVA
            // con el valor a cobrar en pesos (total biológico * valor por kg),
            // independiente de la suma del grupo biológico (que sigue en kg).
            if (this.tipoReporte === 'totalizado_valor' && this.valorKgActual != null) {
                n[this.CAMPO_VALOR_TOTAL] = (Number(n['total_riesgo_biologico']) || 0) * this.valorKgActual;
            }

            return n;
        });

        this.columnas = this.construirColumnas(this.datos);
        this.calcularTotales();
    }

    private construirColumnas(datos: any[]): any[] {
        if (!datos.length) {
            this.gruposColumnas = { base: [], grupos: [], valor: null, cierre: null };
            return [];
        }

        const especiales = new Set<string>();
        this.GRUPOS_REPORTE.forEach(g => {
            g.campos.forEach(c => especiales.add(c));
            especiales.add(g.total);
        });
        especiales.add(this.CAMPO_VALOR_TOTAL);

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
        let colValor: any | null = null;

        this.GRUPOS_REPORTE.forEach((g, gi) => {
            if (this.ocultaGrupoNoNormaPantalla() && g.total === this.GRUPO_NO_NORMA_TOTAL) { return; }

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

            // La columna de valor a cobrar (pesos) se ubica junto al TOTAL del grupo de riesgo biológico
            if (this.tipoReporte === 'totalizado_valor'
                && this.valorKgActual != null
                && g.total === 'total_riesgo_biologico') {
                colValor = { field: this.CAMPO_VALOR_TOTAL, header: 'VALOR A COBRAR (PESOS)', esValorTotal: true };
                cols.push(colValor);
            }
        });

        const colTotalGeneral = { field: 'total_general', header: 'TOTAL GENERAL', esTotalFuerte: true };
        cols.push(colTotalGeneral);

        this.gruposColumnas = { base, grupos, valor: colValor, cierre: colTotalGeneral };

        return cols;
    }

    // Orden de encabezados (grupos + columna de valor intercalada)
    private construirCabecera(grupos: any[], valor: any | null): any[] {
        const cells: any[] = [];
        for (const g of grupos) {
            cells.push({ tipo: 'grupo', grupo: g });
            if (valor && this.GRUPOS_REPORTE[g.index]?.total === 'total_riesgo_biologico') {
                cells.push({ tipo: 'valor', col: valor });
            }
        }
        return cells;
    }

    get cabeceraOrdenada(): any[] {
        return this.construirCabecera(this.gruposColumnas.grupos, this.gruposColumnas.valor ?? null);
    }

    // ¿El tipo de reporte actual debe ocultar el grupo "no incluidos"/identificables en PANTALLA?
    // En Consolidado por día (que alimenta el RH1) no deben aparecer.
    private ocultaGrupoNoNormaPantalla(): boolean {
        return this.tipoReporte === 'consolidado_dia';
    }

    // ¿El tipo de reporte actual debe exportar sin el grupo "no incluidos en la norma"?
    private exportaSinGrupoNoNorma(): boolean {
        return this.TIPOS_EXPORT_SIN_NO_NORMA.includes(this.tipoReporte);
    }

    // Campos (y total) del grupo "Otros residuos no incluidos en la norma"
    private camposGrupoNoNorma(): Set<string> {
        const campos = new Set<string>();
        const grupo = this.GRUPOS_REPORTE.find(g => g.total === this.GRUPO_NO_NORMA_TOTAL);
        if (grupo) {
            grupo.campos.forEach(c => campos.add(c));
            campos.add(grupo.total);
        }
        return campos;
    }

    /**
     * Vistas de columnas/datos para exportación (Excel/PDF).
     * En 'Consolidado por día' y 'Totalizado + Valor total' excluye el grupo
     * "Otros residuos no incluidos en la norma" y recalcula el TOTAL GENERAL
     * para que cuadre con lo visible. La visualización en pantalla no cambia.
     */
    private datosExportacion(): {
        cols: any[];
        base: any[];
        cabecera: any[];
        valor: any | null;
        cierre: any | null;
        datos: any[];
        totales: { [key: string]: number };
    } {
        const omitir = this.exportaSinGrupoNoNorma();
        const excluidos = omitir ? this.camposGrupoNoNorma() : new Set<string>();

        const cols = this.columnas
            .filter(col => !(col.grupo !== undefined && col.grupo !== null && excluidos.has(col.field)))
            .map(col => ({ ...col }));

        const base = cols.filter(col => col.base);

        const grupos = this.gruposColumnas.grupos
            .filter(g => !(omitir && this.GRUPOS_REPORTE[g.index]?.total === this.GRUPO_NO_NORMA_TOTAL))
            .map(g => ({ ...g }));

        const valor = this.gruposColumnas.valor ? { ...this.gruposColumnas.valor } : null;
        const cabecera = this.construirCabecera(grupos, valor);
        let cierre = this.gruposColumnas.cierre ? { ...this.gruposColumnas.cierre } : null;
        let datos = this.datos;
        let totales = this.totales;

        if (omitir) {
            // El grupo mostrado en pantalla solo aporta al TOTAL GENERAL los Químicos (legado);
            // los demás campos ya están incluidos en Tóxico. Al exportar se quitan.
            datos = this.datos.map(row => ({
                ...row,
                total_general_export: (Number(row['total_general']) || 0) - (Number(row['quimicos']) || 0)
            }));

            totales = {
                ...this.totales,
                total_general_export: (Number(this.totales['total_general']) || 0) - (Number(this.totales['quimicos']) || 0)
            };

            if (cierre) { cierre = { ...cierre, field: 'total_general_export' }; }
        }

        return { cols, base, cabecera, valor, cierre, datos, totales };
    }

    private etiqueta(field: string): string {
        return this.ETIQUETAS[field] ?? this.formatHeader(field);
    }

    // Estilos (colores) de una columna, compartidos con Excel/PDF
    estilosColumna(col: any, esHeader = false): { [k: string]: string } {
        const estilos: { [k: string]: string } = {};

        // Columna Fecha: se agranda para que se vea completa
        if (col.field === 'fecha') {
            estilos['min-width'] = '130px';
            estilos['width'] = '130px';
        }

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

        if (col.esValorTotal) {
            estilos['background-color'] = esHeader ? this.COLOR_VALOR.head : this.COLOR_VALOR.soft;
            estilos['color'] = this.COLOR_VALOR.color;
            estilos['font-weight'] = '700';
            estilos['border-left'] = `3px solid ${this.COLOR_VALOR.color}`;
            estilos['border-right'] = `3px solid ${this.COLOR_VALOR.color}`;
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
        // xlsx-js-style es CommonJS: el import dinámico puede exponer la API
        // directamente o bajo ".default" según el bundler. Normalizamos ambos.
        const mod: any = await import('xlsx-js-style');
        const XLSX: any = (mod && mod.utils) ? mod : (mod?.default ?? mod);

        const { cols, base, cabecera, cierre, datos, totales } = this.datosExportacion();
        const nCols = cols.length;
        if (!nCols) { return; }

        const fila0: any[] = new Array(nCols).fill(null);
        const fila1: any[] = new Array(nCols).fill(null);

        base.forEach((col, i) => { fila0[i] = col.header; });

        let colIdx = base.length;
        cabecera.forEach(cell => {
            if (cell.tipo === 'valor') {
                fila0[colIdx] = cell.col.header;
                colIdx += 1;
                return;
            }
            const g = cell.grupo;
            fila0[colIdx] = g.titulo;
            for (let k = 0; k < g.colspan; k++) {
                const col = cols[colIdx + k];
                if (col) { fila1[colIdx + k] = col.header; }
            }
            colIdx += g.colspan;
        });

        let idxCierre = -1;
        if (cierre) {
            idxCierre = cols.findIndex(c => c.field === cierre.field);
            if (idxCierre >= 0) { fila0[idxCierre] = cierre.header; }
        }

        const aoa: any[][] = [fila0, fila1];

        datos.forEach(row => {
            aoa.push(cols.map(col => {
                const v = row[col.field];
                return v === null || v === undefined ? '' : v;
            }));
        });

        const filaTot: any[] = cols.map((col, i) => {
            if (i === 0) { return 'TOTAL'; }
            const t = totales[col.field];
            return t === undefined ? '' : t;
        });
        aoa.push(filaTot);

        const ws: any = XLSX.utils.aoa_to_sheet(aoa);

        const merges: any[] = [];
        base.forEach((_, i) => merges.push({ s: { r: 0, c: i }, e: { r: 1, c: i } }));
        colIdx = base.length;
        cabecera.forEach(cell => {
            if (cell.tipo === 'valor') {
                merges.push({ s: { r: 0, c: colIdx }, e: { r: 1, c: colIdx } });
                colIdx += 1;
                return;
            }
            const g = cell.grupo;
            if (g.colspan > 1) {
                merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + g.colspan - 1 } });
            }
            colIdx += g.colspan;
        });
        if (idxCierre >= 0) {
            merges.push({ s: { r: 0, c: idxCierre }, e: { r: 1, c: idxCierre } });
        }
        ws['!merges'] = merges;

        ws['!cols'] = cols.map(col => ({ wch: col.field === 'fecha' ? 20 : Math.max(13, String(col.header || '').length + 3) }));
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

            if (col.esValorTotal) {
                const valHead = {
                    fill: { fgColor: { rgb: this.hex(this.COLOR_VALOR.head) } },
                    font: { color: { rgb: this.hex(this.COLOR_VALOR.color) }, bold: true },
                    alignment: headAlign,
                    border: borderAll
                };
                setCell(0, i, valHead);
                setCell(1, i, valHead);
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
                } else if (col.esValorTotal) {
                    style.fill = { fgColor: { rgb: this.hex(this.COLOR_VALOR.soft) } };
                    style.font = { color: { rgb: this.hex(this.COLOR_VALOR.color) }, bold: true };
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

        const wb: any = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
        XLSX.writeFile(wb, `reporte_${this.tipoReporte}.xlsx`);
    }

    private hex(color: string): string {
        return color.replace('#', '').toUpperCase();
    }

    descargarPdf() {
        const { cols, base, cabecera, cierre, datos, totales } = this.datosExportacion();
        if (!cols.length) { return; }

        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

        const fila0: any[] = [];
        const fila1: any[] = [];

        base.forEach(col => fila0.push({ content: col.header, rowSpan: 2 }));

        cabecera.forEach(cell => {
            if (cell.tipo === 'valor') {
                fila0.push({ content: cell.col.header, rowSpan: 2 });
            } else {
                fila0.push({ content: cell.grupo.titulo, colSpan: cell.grupo.colspan });
            }
        });

        if (cierre) {
            fila0.push({ content: cierre.header, rowSpan: 2 });
        }

        cols.filter(c => !c.base && !c.esTotalFuerte && !c.esValorTotal).forEach(col => fila1.push({ content: col.header }));

        const body = datos.map(row =>
            cols.map(col => {
                const valor = row[col.field];
                return valor === null || valor === undefined ? '' : valor;
            })
        );

        const foot = [[
            ...cols.map((col, i) => {
                if (i === 0) { return 'TOTAL'; }
                const t = totales[col.field];
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
            columnStyles: (() => {
                const idxFecha = cols.findIndex(c => c.field === 'fecha');
                return idxFecha >= 0 ? { [idxFecha]: { cellWidth: 72 } } : {};
            })(),
            didParseCell: (data: any) => {
                const col = cols[data.column.index];
                if (!col) { return; }

                if (col.esTotalFuerte) {
                    data.cell.styles.fillColor = this.COLOR_TOTAL_GENERAL.bg;
                    data.cell.styles.textColor = this.COLOR_TOTAL_GENERAL.color;
                    data.cell.styles.fontStyle = 'bold';
                } else if (col.esValorTotal) {
                    data.cell.styles.fillColor = data.section === 'head' ? this.COLOR_VALOR.head : this.COLOR_VALOR.soft;
                    data.cell.styles.textColor = this.COLOR_VALOR.color;
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
            case 'totalizado_valor': return 'Totalizado + Valor total';
            default: return this.tipoReporte;
        }
    }

    // Indica si la columna es la NUEVA del valor a cobrar en pesos
    esColumnaValor(col: any): boolean {
        return this.tipoReporte === 'totalizado_valor' && col?.field === this.CAMPO_VALOR_TOTAL;
    }

    // Formato de moneda (pesos) para el reporte de valor total
    formatearValor(valor: any): string {
        const n = Number(valor) || 0;
        return '$ ' + n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    // Etiqueta del consultorio seleccionado en los filtros (para el comparativo)
    get consultorioSeleccionadoLabel(): string {
        if (!this.consultorio) { return 'Todos los consultorios'; }
        const opt = this.consultoriosOpts.find(o => o.value === this.consultorio);
        return opt ? String(opt.label) : 'Consultorio seleccionado';
    }

    /* ================== Valor a cobrar de residuos (rol 1) ================== */

    async abrirValorDialog(): Promise<void> {
        this.showValorDialog = true;
        this.nuevoValorKg = this.valorKgActual;
        this.nuevoValorFecha = new Date();
        this.nuevoValorObservacion = '';
        await this.cargarValores();
    }

    async cargarValores(): Promise<void> {
        try {
            const data = await firstValueFrom(await this.valorResiduosService.obtenerValores());
            this.valores = data || [];
        } catch (e) {
            this.valores = [];
            this.messageService.add({ severity: 'error', summary: 'No se pudo cargar el histórico de valores.' });
        }
    }

    async guardarValor(): Promise<void> {
        if (this.nuevoValorKg == null || this.nuevoValorKg < 0) {
            this.messageService.add({ severity: 'warn', summary: 'Ingrese un valor por kg válido.' });
            return;
        }

        this.guardandoValor = true;

        try {
            const obs = await this.valorResiduosService.crearValor(
                Number(this.nuevoValorKg),
                this.formatoFechaLocal(this.nuevoValorFecha) as string,
                this.nuevoValorObservacion || null
            );

            obs.subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Valor guardado correctamente.' });
                    this.valorKgActual = Number(this.nuevoValorKg);
                    this.nuevoValorKg = null;
                    this.nuevoValorObservacion = '';
                    this.cargarValores();
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'No se pudo guardar el valor.' }),
                complete: () => { this.guardandoValor = false; }
            });
        } catch (e) {
            this.guardandoValor = false;
            this.messageService.add({ severity: 'error', summary: 'No se pudo guardar el valor.' });
        }
    }

    /* ================== Reporte comparativo (rol 1) ================== */

    async generarComparativo(): Promise<void> {
        if (!this.validarParametrosReporte()) { return; }

        this.cargandoComparativo = true;
        this.comparativoGenerado = true;

        try {
            const data = await firstValueFrom(
                await this.reportesService.obtenerReporteComparativo(this.fechaInicio, this.fechaFin, this.consultorio)
            );
            this.comparativoData = data || [];
            this.construirResumenComparativo();
            this.comparativoExpandido = { Consultorio: false, Administracion: false };
        } catch (e) {
            this.comparativoData = [];
            this.comparativoResumen = { Consultorio: null, Administracion: null };
            this.messageService.add({ severity: 'error', summary: 'No se pudo generar el reporte comparativo.' });
        } finally {
            this.cargandoComparativo = false;
        }
    }

    private construirResumenComparativo(): void {
        const crearResumen = (tipo: string) => {
            const filas = this.comparativoData.filter(r => r.tipo === tipo);
            if (!filas.length) { return null; }

            const resumen: any = { tipo, registros: filas.length };

            this.GRUPOS_REPORTE.forEach(g => {
                g.campos.forEach(c => {
                    resumen[c] = filas.reduce((acc, r) => acc + (Number(r[c]) || 0), 0);
                });
            });

            // Mapeo a la norma: los residuos físicos suman a Tóxico
            const aporteToxico = this.CAMPOS_MAPEADOS_TOXICO.reduce((acc, c) => acc + (Number(resumen[c]) || 0), 0);
            resumen['toxicos'] = (Number(resumen['toxicos']) || 0) + aporteToxico;

            this.GRUPOS_REPORTE.forEach(g => {
                resumen[g.total] = g.campos.reduce((acc, c) => acc + (Number(resumen[c]) || 0), 0);
            });

            resumen['total_general'] = ['total_no_peligrosos', 'total_riesgo_biologico', 'total_radiactivos', 'total_otros_peligrosos']
                .reduce((acc, f) => acc + (Number(resumen[f]) || 0), 0) + (Number(resumen['quimicos']) || 0);

            return resumen;
        };

        this.comparativoResumen = {
            Consultorio: crearResumen('Consultorio'),
            Administracion: crearResumen('Administracion')
        };
    }

    detalleComparativo(tipo: string): any[] {
        return this.comparativoData.filter(r => r.tipo === tipo);
    }

    toggleComparativo(tipo: string): void {
        this.comparativoExpandido[tipo] = !this.comparativoExpandido[tipo];
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
