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
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';


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
        MultiSelectModule,
        CalendarModule,
        InputNumberModule,
        IconFieldModule,
        InputIconModule,
        InputIconModule,
        TagModule,
        TooltipModule
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
    gruposColumnas: { base: any[]; cabecera: any[]; cierre: any | null } = { base: [], cabecera: [], cierre: null };

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

    // ===== Valor a cobrar de residuos por grupo/corriente (rol 1) =====
    valoresVigentes: ValorResiduo[] = [];
    showValorDialog = false;
    guardandoValor = false;
    valores: ValorResiduo[] = [];
    nuevoValorTipo: 'grupo' | 'corriente' = 'grupo';
    nuevoValorClave: string | null = null;
    nuevoValorClaves: string[] = [];
    nuevoValorKg: number | null = null;
    nuevoValorFecha: Date = new Date();
    nuevoValorObservacion = '';

    // Edición de un valor del histórico
    showEditValorDialog = false;
    editValorId: number | null = null;
    editValorObjetivo = '';
    editValorKg: number | null = null;
    editValorFecha: Date = new Date();
    editValorObservacion = '';
    guardandoEdicionValor = false;

    // Objetivos configurables: grupos y sus corrientes
    readonly GRUPOS_VALOR = [
        {
            label: 'Res. no peligrosos', total: 'total_no_peligrosos', corrientes: [
                { label: 'Aprovechables', value: 'aprovechables' },
                { label: 'Aprovechables orgánicos', value: 'aprovechables_organicos' },
                { label: 'No aprovechables', value: 'no_aprovechables' }
            ]
        },
        {
            label: 'Res. riesgo biológico/infeccioso', total: 'total_riesgo_biologico', corrientes: [
                { label: 'Biosanitarios', value: 'biosanitarios' },
                { label: 'Anatomopatológicos', value: 'anatomopatologicos' },
                { label: 'Cortopunzantes', value: 'cortopunzantes' },
                { label: 'De animales', value: 'de_animales' }
            ]
        },
        {
            label: 'Radiactivos', total: 'total_radiactivos', corrientes: [
                { label: 'Radioactivos', value: 'radioactivos' }
            ]
        },
        {
            label: 'Otros residuos peligrosos', total: 'total_otros_peligrosos', corrientes: [
                { label: 'Corrosivos', value: 'corrosivos' },
                { label: 'Explosivos', value: 'explosivos' },
                { label: 'Reactivos', value: 'reactivos' },
                { label: 'Tóxicos', value: 'toxicos' },
                { label: 'Inflamables (hidrocarburos)', value: 'inflamables' }
            ]
        },
        {
            label: 'Residuos peligrosos identificables o Químicos', total: 'total_otros_no_norma', corrientes: [
                { label: 'Fármacos', value: 'farmacos' },
                { label: 'Chatarra electrónica', value: 'chatarra_electronica' },
                { label: 'Pilas', value: 'pilas' },
                { label: 'Iluminarias', value: 'iluminarias' },
                { label: 'Aceites usados', value: 'aceites_usados' }
            ]
        }
    ];

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
            total: 'total_radiactivos',
            sinTotal: true
        },
        {
            titulo: 'Otros residuos peligrosos',
            campos: ['corrosivos', 'explosivos', 'reactivos', 'toxicos', 'inflamables'],
            total: 'total_otros_peligrosos'
        },
        {
            titulo: 'Residuos peligrosos identificables o Químicos',
            campos: ['farmacos', 'chatarra_electronica', 'pilas', 'iluminarias', 'aceites_usados'],
            total: 'total_otros_no_norma'
        }
    ];

    // En estos tipos de reporte el grupo se omite SOLO en Excel/PDF (en pantalla sí se ve)
    private readonly GRUPO_NO_NORMA_TOTAL = 'total_otros_no_norma';
    private readonly TIPOS_EXPORT_SIN_NO_NORMA = ['totalizado_valor'];
    // Residuos físicos que se mapean a la característica Tóxico (químicos legado incluido, sin captura nueva)
    private readonly CAMPOS_MAPEADOS_TOXICO = ['farmacos', 'chatarra_electronica', 'pilas', 'iluminarias', 'quimicos'];
    // Los aceites usados suman a Inflamables (hidrocarburos)
    private readonly CAMPOS_MAPEADOS_INFLAMABLES = ['aceites_usados'];

    // Campos (kg) que se muestran en el detalle por día del reporte comparativo
    readonly CAMPOS_DETALLE_COMPARATIVO: string[] = [
        'aprovechables', 'aprovechables_organicos', 'no_aprovechables',
        'biosanitarios', 'anatomopatologicos', 'cortopunzantes', 'de_animales',
        'radioactivos',
        'corrosivos', 'explosivos', 'reactivos', 'toxicos', 'inflamables',
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
        inflamables: 'Inflamables (hidrocarburos)',
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

        // El reporte "Totalizado + Valor total" requiere los valores vigentes por grupo/corriente
        this.valoresVigentes = [];
        if (this.tipoReporte === 'totalizado_valor') {
            try {
                const vigentes: any = await firstValueFrom(await this.valorResiduosService.obtenerValoresVigentes());
                this.valoresVigentes = vigentes || [];

                if (!this.valoresVigentes.length) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Sin valores configurados',
                        detail: 'Configure el valor a cobrar por grupo o corriente para generar este reporte.'
                    });
                    return;
                }
            } catch (e) {
                this.valoresVigentes = [];
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron obtener los valores a cobrar de los residuos.'
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

            // Mapeo a la norma:
            //  - Tóxicos = histórico + Fármacos + Chatarra + Pilas + Iluminarias
            //  - Inflamables (hidrocarburos) = histórico + Aceites usados
            const aporteToxico = this.CAMPOS_MAPEADOS_TOXICO.reduce((acc, c) => acc + (Number(n[c]) || 0), 0);
            n['toxicos'] = (Number(n['toxicos']) || 0) + aporteToxico;

            const aporteInflamable = this.CAMPOS_MAPEADOS_INFLAMABLES.reduce((acc, c) => acc + (Number(n[c]) || 0), 0);
            n['inflamables'] = (Number(n['inflamables']) || 0) + aporteInflamable;

            for (const g of this.GRUPOS_REPORTE) {
                n[g.total] = g.campos.reduce((acc, c) => acc + (Number(n[c]) || 0), 0);
            }

            // TOTAL GENERAL: los campos mapeados ya están dentro de Tóxico/Inflamable; no se suman de nuevo.
            n['total_general'] = ['total_no_peligrosos', 'total_riesgo_biologico', 'total_radiactivos', 'total_otros_peligrosos']
                .reduce((acc, f) => acc + (Number(n[f]) || 0), 0);

            // Redondear a 2 decimales todos los campos numéricos
            for (const k in n) {
                if (typeof n[k] === 'number' && isFinite(n[k])) {
                    n[k] = Math.round(n[k] * 100) / 100;
                }
            }

            // Columnas de valor a cobrar por objetivo (grupo o corriente)
            if (this.tipoReporte === 'totalizado_valor') {
                for (const v of this.valoresVigentes) {
                    const clave = String(v.clave_objetivo || '');
                    if (!clave) { continue; }
                    n[`valor_${clave}`] = Math.round((Number(n[clave]) || 0) * (Number(v.valor_kg) || 0) * 100) / 100;
                }
            }

            return n;
        });

        this.columnas = this.construirColumnas(this.datos);
        this.calcularTotales();
    }

    private construirColumnas(datos: any[]): any[] {
        if (!datos.length) {
            this.gruposColumnas = { base: [], cabecera: [], cierre: null };
            return [];
        }

        const especiales = new Set<string>();
        this.GRUPOS_REPORTE.forEach(g => {
            g.campos.forEach(c => especiales.add(c));
            especiales.add(g.total);
        });
        // Campo legado oculto (ya no se captura); su histórico se mapea a Tóxicos
        especiales.add('quimicos');
        this.valoresVigentes.forEach(v => {
            if (v.clave_objetivo) { especiales.add(`valor_${v.clave_objetivo}`); }
        });

        const baseFields = Object.keys(datos[0]).filter(
            k => !especiales.has(k) && k !== 'total' && k !== 'total_general' && !k.startsWith('valor_')
        );

        const cols: any[] = [];
        const base: any[] = [];
        const cabecera: any[] = [];

        baseFields.forEach(f => {
            const col = { field: f, header: this.etiqueta(f), base: true };
            cols.push(col);
            base.push(col);
        });

        // Columnas de valor a cobrar, indexadas por el campo después del cual van
        const valorPorCampo: { [campo: string]: any[] } = {};
        if (this.tipoReporte === 'totalizado_valor') {
            for (const v of this.valoresVigentes) {
                const clave = String(v.clave_objetivo || '');
                if (!clave) { continue; }

                const grupo = this.GRUPOS_REPORTE.find(g => g.total === clave);
                const afterField = (v.tipo_objetivo === 'grupo' && grupo && (grupo as any).sinTotal)
                    ? grupo.campos[grupo.campos.length - 1]
                    : clave;

                const col = {
                    field: `valor_${clave}`,
                    header: 'VALOR A COBRAR (PESOS)',
                    esValorTotal: true,
                    valorObjetivo: clave,
                    tipoObjetivo: v.tipo_objetivo
                };
                (valorPorCampo[afterField] = valorPorCampo[afterField] || []).push(col);
            }
        }

        this.GRUPOS_REPORTE.forEach((g, gi) => {
            if (this.ocultaGrupoNoNormaPantalla() && g.total === this.GRUPO_NO_NORMA_TOTAL) { return; }

            const visibles = g.campos.filter(c => c in datos[0]);
            if (!visibles.length) { return; }

            let segmento: string[] = [];
            const cerrarSegmento = () => {
                if (segmento.length) {
                    cabecera.push({ tipo: 'grupo', titulo: g.titulo, colspan: segmento.length, index: gi });
                    segmento = [];
                }
            };

            visibles.forEach((c, idx) => {
                cols.push({
                    field: c,
                    header: (this.tipoReporte === 'consolidado_dia' && c === 'inflamables') ? 'Inflamable' : this.etiqueta(c),
                    grupo: gi,
                    grupoInicio: idx === 0
                });
                segmento.push(c);

                if (valorPorCampo[c]) {
                    cerrarSegmento();
                    for (const col of valorPorCampo[c]) {
                        cols.push(col);
                        cabecera.push({ tipo: 'valor', col });
                    }
                }
            });

            if (!(g as any).sinTotal) {
                cols.push({ field: g.total, header: 'TOTAL', esTotal: true, grupo: gi, grupoFin: true });
                segmento.push(g.total);
            }
            cerrarSegmento();

            if (valorPorCampo[g.total]) {
                for (const col of valorPorCampo[g.total]) {
                    cols.push(col);
                    cabecera.push({ tipo: 'valor', col });
                }
            }
        });

        const colTotalGeneral = { field: 'total_general', header: 'TOTAL GENERAL', esTotalFuerte: true };
        cols.push(colTotalGeneral);

        this.gruposColumnas = { base, cabecera, cierre: colTotalGeneral };

        return cols;
    }

    get cabeceraOrdenada(): any[] {
        return this.gruposColumnas.cabecera;
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
        cierre: any | null;
        datos: any[];
        totales: { [key: string]: number };
    } {
        const omitir = this.exportaSinGrupoNoNorma();
        const omitIndex = this.GRUPOS_REPORTE.findIndex(g => g.total === this.GRUPO_NO_NORMA_TOTAL);
        const omitFields = new Set<string>(omitIndex >= 0 ? this.GRUPOS_REPORTE[omitIndex].campos : []);

        const esOmitido = (col: any): boolean => {
            if (!omitir) { return false; }
            if (col.grupo === omitIndex) { return true; }
            if (col.esValorTotal) {
                if (col.tipoObjetivo === 'grupo') { return col.valorObjetivo === this.GRUPO_NO_NORMA_TOTAL; }
                return omitFields.has(col.valorObjetivo);
            }
            return false;
        };

        const cols = this.columnas.filter(col => !esOmitido(col)).map(col => ({ ...col }));
        const base = cols.filter(col => col.base);

        const cabecera = this.gruposColumnas.cabecera.filter(cell => {
            if (!omitir) { return true; }
            if (cell.tipo === 'grupo') { return cell.index !== omitIndex; }
            const col = cell.col;
            if (col.tipoObjetivo === 'grupo') { return col.valorObjetivo !== this.GRUPO_NO_NORMA_TOTAL; }
            return !omitFields.has(col.valorObjetivo);
        }).map(cell => (cell.tipo === 'grupo' ? { ...cell } : { tipo: 'valor', col: { ...cell.col } }));

        const cierre = this.gruposColumnas.cierre ? { ...this.gruposColumnas.cierre } : null;

        return { cols, base, cabecera, cierre, datos: this.datos, totales: this.totales };
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
            const suma = this.datos.reduce((acc, cur) => acc + (cur[field] || 0), 0);
            this.totales[field] = Math.round(suma * 100) / 100;
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
            fila0[colIdx] = cell.titulo;
            for (let k = 0; k < cell.colspan; k++) {
                const col = cols[colIdx + k];
                if (col) { fila1[colIdx + k] = col.header; }
            }
            colIdx += cell.colspan;
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
            if (cell.colspan > 1) {
                merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + cell.colspan - 1 } });
            }
            colIdx += cell.colspan;
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

                if (col.esTotal) {
                    setCell(1, i, {
                        fill: { fgColor: { rgb: this.hex(pal.total) } },
                        font: { color: { rgb: this.hex(pal.color) }, bold: true },
                        alignment: headAlign,
                        border: borderAll
                    });
                } else {
                    setCell(0, i, {
                        fill: { fgColor: { rgb: this.hex(pal.head) } },
                        font: { color: { rgb: this.hex(pal.color) }, bold: true },
                        alignment: headAlign,
                        border: borderAll
                    });
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
                    style.numFmt = '0.00';
                } else if (col.esValorTotal) {
                    style.fill = { fgColor: { rgb: this.hex(this.COLOR_VALOR.soft) } };
                    style.font = { color: { rgb: this.hex(this.COLOR_VALOR.color) }, bold: true };
                    style.numFmt = '0.00';
                } else if (col.grupo !== undefined && col.grupo !== null) {
                    const pal = this.COLORES_GRUPO[col.grupo];
                    if (col.esTotal) {
                        style.fill = { fgColor: { rgb: this.hex(pal.total) } };
                        style.font = { color: { rgb: this.hex(pal.color) }, bold: true };
                    } else {
                        style.fill = { fgColor: { rgb: this.hex(pal.soft) } };
                    }
                    style.numFmt = '0.00';
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
                fila0.push({ content: cell.titulo, colSpan: cell.colspan });
            }
        });

        if (cierre) {
            fila0.push({ content: cierre.header, rowSpan: 2 });
        }

        cols.filter(c => !c.base && !c.esTotalFuerte && !c.esValorTotal).forEach(col => fila1.push({ content: col.header }));

        const body = datos.map(row =>
            cols.map(col => this.formatearNumero(row[col.field]))
        );

        const foot = [[
            ...cols.map((col, i) => {
                if (i === 0) { return 'TOTAL'; }
                return this.formatearNumero(totales[col.field]);
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
                const estilos: any = {};
                const idxFecha = cols.findIndex(c => c.field === 'fecha');
                if (idxFecha >= 0) { estilos[idxFecha] = { cellWidth: 72 }; }
                cols.forEach((col, i) => {
                    if (col.base) { return; }
                    estilos[i] = { ...(estilos[i] || {}), halign: 'right' };
                });
                return estilos;
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

    // Indica si la columna es una columna de valor a cobrar en pesos
    esColumnaValor(col: any): boolean {
        return col?.esValorTotal === true;
    }

    // Formatea un número a 2 decimales (o devuelve el valor tal cual si no es numérico)
    formatearNumero(valor: any): string {
        if (valor === null || valor === undefined || valor === '') { return ''; }
        const n = Number(valor);
        if (isNaN(n)) { return String(valor); }
        return n.toFixed(2);
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
        this.nuevoValorTipo = 'grupo';
        this.nuevoValorClave = null;
        this.nuevoValorClaves = [];
        this.nuevoValorKg = null;
        this.nuevoValorFecha = new Date();
        this.nuevoValorObservacion = '';
        await this.cargarValores();
    }

    async cargarValores(): Promise<void> {
        try {
            const data = await firstValueFrom(await this.valorResiduosService.obtenerValores());
            this.valores = (data || []).filter(v => v.tipo_objetivo && v.clave_objetivo);
        } catch (e) {
            this.valores = [];
            this.messageService.add({ severity: 'error', summary: 'No se pudo cargar el histórico de valores.' });
        }
    }

    // Opciones de grupo para el configurador
    get gruposValorOpts(): { label: string; value: string }[] {
        return this.GRUPOS_VALOR.map(g => ({ label: g.label, value: g.total }));
    }

    // Opciones de corriente (aplanadas, con el grupo como prefijo)
    get corrientesValorOpts(): { label: string; value: string }[] {
        const opts: { label: string; value: string }[] = [];
        for (const g of this.GRUPOS_VALOR) {
            for (const c of g.corrientes) {
                opts.push({ label: `${g.label} · ${c.label}`, value: c.value });
            }
        }
        return opts;
    }

    // Opciones de corriente agrupadas por grupo (para el dropdown con group)
    get corrientesValorGrouped(): any[] {
        return this.GRUPOS_VALOR.map(g => ({
            label: g.label,
            items: g.corrientes.map(c => ({ label: c.label, value: c.value }))
        }));
    }

    // Etiqueta del objetivo actualmente seleccionado (para la vista previa)
    get objetivoSeleccionadoLabel(): string {
        if (!this.nuevoValorClave) { return ''; }
        return this.etiquetaObjetivo({ tipo_objetivo: this.nuevoValorTipo, clave_objetivo: this.nuevoValorClave });
    }

    // ¿Hay al menos un objetivo seleccionado (grupo o una/más corrientes)?
    get hayObjetivoSeleccionado(): boolean {
        return this.nuevoValorTipo === 'grupo'
            ? !!this.nuevoValorClave
            : this.nuevoValorClaves.length > 0;
    }

    // Texto de la vista previa (nombre del grupo o resumen de corrientes)
    get objetivoPreviewLabel(): string {
        if (this.nuevoValorTipo === 'grupo') {
            if (!this.nuevoValorClave) { return ''; }
            return this.etiquetaObjetivo({ tipo_objetivo: 'grupo', clave_objetivo: this.nuevoValorClave });
        }

        const etiquetas = this.nuevoValorClaves.map(c =>
            this.etiquetaObjetivo({ tipo_objetivo: 'corriente', clave_objetivo: c })
        );

        if (etiquetas.length <= 2) { return etiquetas.join(' y '); }
        return `${etiquetas.length} corrientes`;
    }

    // Etiqueta legible del objetivo configurado
    etiquetaObjetivo(v: any): string {
        const clave = v?.clave_objetivo;
        if (!clave) { return '-'; }
        if (v.tipo_objetivo === 'grupo') {
            const g = this.GRUPOS_VALOR.find(x => x.total === clave);
            return g ? g.label : clave;
        }
        for (const g of this.GRUPOS_VALOR) {
            const c = g.corrientes.find(x => x.value === clave);
            if (c) { return `${g.label} · ${c.label}`; }
        }
        return clave;
    }

    async guardarValor(): Promise<void> {
        const claves = this.nuevoValorTipo === 'grupo'
            ? (this.nuevoValorClave ? [this.nuevoValorClave] : [])
            : [...this.nuevoValorClaves];

        if (!claves.length) {
            this.messageService.add({ severity: 'warn', summary: 'Seleccione el grupo o al menos una corriente.' });
            return;
        }

        if (this.nuevoValorKg == null || this.nuevoValorKg < 0) {
            this.messageService.add({ severity: 'warn', summary: 'Ingrese un valor por kg válido.' });
            return;
        }

        this.guardandoValor = true;

        const fecha = this.formatoFechaLocal(this.nuevoValorFecha) as string;
        let guardados = 0;
        let primerError = '';

        for (const clave of claves) {
            try {
                const obs = await this.valorResiduosService.crearValor(
                    this.nuevoValorTipo,
                    clave,
                    Number(this.nuevoValorKg),
                    fecha,
                    this.nuevoValorObservacion || null
                );
                await firstValueFrom(obs);
                guardados++;
            } catch (err: any) {
                if (!primerError) { primerError = err?.error?.msg || 'No se pudo guardar el valor.'; }
            }
        }

        this.guardandoValor = false;

        if (guardados > 0) {
            this.messageService.add({
                severity: 'success',
                summary: guardados === 1 ? 'Valor guardado correctamente.' : `${guardados} valores guardados correctamente.`
            });
            this.nuevoValorClave = null;
            this.nuevoValorClaves = [];
            this.nuevoValorKg = null;
            this.nuevoValorObservacion = '';
            this.cargarValores();
        }

        if (guardados < claves.length) {
            this.messageService.add({
                severity: 'error',
                summary: 'Algunos valores no se guardaron',
                detail: primerError || 'Revise las corrientes seleccionadas.'
            });
        }
    }

    /* ================== Editar / Inactivar valores (rol 1) ================== */

    abrirEditarValor(row: any): void {
        this.editValorId = row.id_valor;
        this.editValorObjetivo = this.etiquetaObjetivo(row);
        this.editValorKg = Number(row.valor_kg) || 0;
        this.editValorFecha = row.fecha_vigencia ? new Date(row.fecha_vigencia) : new Date();
        this.editValorObservacion = row.observacion || '';
        this.showEditValorDialog = true;
    }

    async guardarEdicionValor(): Promise<void> {
        if (this.editValorId == null) { return; }

        if (this.editValorKg == null || this.editValorKg < 0) {
            this.messageService.add({ severity: 'warn', summary: 'Ingrese un valor por kg válido.' });
            return;
        }

        this.guardandoEdicionValor = true;

        try {
            const obs = await this.valorResiduosService.actualizarValor(
                this.editValorId,
                Number(this.editValorKg),
                this.formatoFechaLocal(this.editValorFecha) as string,
                this.editValorObservacion || null
            );
            await firstValueFrom(obs);

            this.messageService.add({ severity: 'success', summary: 'Valor actualizado correctamente.' });
            this.showEditValorDialog = false;
            this.cargarValores();
        } catch (err: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'No se pudo actualizar el valor',
                detail: err?.error?.msg || 'Intente nuevamente.'
            });
        } finally {
            this.guardandoEdicionValor = false;
        }
    }

    inactivarValorFila(row: any): void {
        this.confirmService.confirm({
            message: `¿Inactivar el valor de "${this.etiquetaObjetivo(row)}"? Dejará de usarse en los reportes.`,
            header: 'Inactivar valor',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, inactivar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    const obs = await this.valorResiduosService.inactivarValor(row.id_valor);
                    await firstValueFrom(obs);
                    this.messageService.add({ severity: 'success', summary: 'Valor inactivado correctamente.' });
                    this.cargarValores();
                } catch (err: any) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'No se pudo inactivar el valor',
                        detail: err?.error?.msg || 'Intente nuevamente.'
                    });
                }
            }
        });
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

            // Mapeo a la norma: Tóxico (físicos sin aceites) e Inflamables (+ aceites)
            const aporteToxico = this.CAMPOS_MAPEADOS_TOXICO.reduce((acc, c) => acc + (Number(resumen[c]) || 0), 0);
            resumen['toxicos'] = (Number(resumen['toxicos']) || 0) + aporteToxico;

            const aporteInflamable = this.CAMPOS_MAPEADOS_INFLAMABLES.reduce((acc, c) => acc + (Number(resumen[c]) || 0), 0);
            resumen['inflamables'] = (Number(resumen['inflamables']) || 0) + aporteInflamable;

            this.GRUPOS_REPORTE.forEach(g => {
                resumen[g.total] = g.campos.reduce((acc, c) => acc + (Number(resumen[c]) || 0), 0);
            });

            // Redondear a 2 decimales
            for (const k in resumen) {
                if (typeof resumen[k] === 'number' && isFinite(resumen[k])) {
                    resumen[k] = Math.round(resumen[k] * 100) / 100;
                }
            }

            resumen['total_general'] = ['total_no_peligrosos', 'total_riesgo_biologico', 'total_radiactivos', 'total_otros_peligrosos']
                .reduce((acc, f) => acc + (Number(resumen[f]) || 0), 0);

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
