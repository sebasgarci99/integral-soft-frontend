import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';

import { FactRipsService } from '../../services/fact-rips/fact-rips.service';
import {
    FactRipsCatalogos,
    FactRipsCie10,
    FactRipsConfig,
    FactRipsCups,
    FactRipsDashboard,
    FactRipsDetalle,
    FactRipsEstadoConfiguracion,
    FactRipsFactura,
    FactRipsMunicipio,
    FactRipsPaciente,
    FactRipsPacienteDetalle,
    FactRipsReporte,
    FactRipsServicioForm,
    FactRipsValidacion,
    FactRipsWizardForm
} from '../../interfaces/fact-rips';
import { ReceiptPrintAnimationComponent } from '../shared/receipt-print-animation/receipt-print-animation.component';

type Pestana = 'dashboard' | 'facturar' | 'historial' | 'reportes' | 'configuracion';

@Component({
    selector: 'app-fact-rips',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ToastModule,
        ConfirmDialogModule,
        TooltipModule,
        SelectModule,
        DatePickerModule,
        ReceiptPrintAnimationComponent
    ],
    templateUrl: './fact-rips.component.html',
    styleUrl: './fact-rips.component.css',
    providers: [MessageService, ConfirmationService],
    animations: [
        trigger('expandir', [
            transition(':enter', [
                style({ height: '0', opacity: 0, overflow: 'hidden' }),
                animate('220ms ease-out', style({ height: '*', opacity: 1, overflow: 'hidden' }))
            ]),
            transition(':leave', [
                style({ height: '*', opacity: 1, overflow: 'hidden' }),
                animate('180ms ease-in', style({ height: '0', opacity: 0, overflow: 'hidden' }))
            ])
        ])
    ]
})
export class FactRipsComponent implements OnInit, OnDestroy {

    readonly configSteps = [
        { key: 'empresa', number: 1, label: 'Empresa / prestador', icon: 'fa-solid fa-building' },
        { key: 'numeracion', number: 2, label: 'Numeración', icon: 'fa-solid fa-receipt' },
        { key: 'parametros', number: 3, label: 'Parámetros RIPS', icon: 'fa-solid fa-layer-group' },
        { key: 'consentimiento', number: 4, label: 'Consentimiento', icon: 'fa-solid fa-shield-heart' },
        { key: 'plantillas', number: 5, label: 'Plantillas', icon: 'fa-solid fa-envelope' },
        { key: 'catalogos', number: 6, label: 'Catálogos', icon: 'fa-solid fa-database', opcional: true },
        { key: 'tarifario', number: 7, label: 'Tarifario', icon: 'fa-solid fa-money-bill-wave', opcional: true }
    ];

    readonly consentimientoOpciones = [
        { label: 'Todos', value: '' },
        { label: 'Firmado', value: 'FIRMADO' },
        { label: 'Pendiente', value: 'PENDIENTE' }
    ];
    readonly facturaOpciones = [
        { label: 'Todas', value: '' },
        { label: 'Sin facturar', value: 'SIN_FACTURA' },
        { label: 'Borrador', value: 'BORRADOR' },
        { label: 'Emitida', value: 'EMITIDA' }
    ];
    readonly historialEstadoOpciones = [
        { label: 'Todos', value: '' },
        { label: 'Borrador', value: 'BORRADOR' },
        { label: 'Emitida', value: 'EMITIDA' },
        { label: 'Anulada', value: 'ANULADA' }
    ];
    readonly modoSalidaOpciones = [
        { label: 'JSON RIPS', value: 'JSON_RIPS' },
        { label: 'Paquete PDF + JSON', value: 'PAQUETE_REPORTE' }
    ];
    readonly formatoOpciones = [
        { label: 'A4', value: 'A4' },
        { label: 'Ticket 80 mm', value: 'TICKET' }
    ];
    readonly viaIngresoOpciones = [
        { label: 'Consulta externa', value: '01' },
        { label: 'Urgencias', value: '02' },
        { label: 'Hospitalización', value: '03' }
    ];
    local_espaniol = {
        firstDayOfWeek: 1,
        dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
        monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    };
    citasOpciones: { label: string; value: number | null }[] = [];

    readonly reportes = [
        { key: 'fecha', label: 'Por fecha' },
        { key: 'entidad', label: 'Por entidad' },
        { key: 'especialidad', label: 'Por especialidad' },
        { key: 'cups', label: 'Por CUPS' },
        { key: 'estado', label: 'Estado RIPS' },
        { key: 'cartera', label: 'Cartera' },
        { key: 'envios', label: 'Envíos' }
    ];

    pestana: Pestana = 'dashboard';
    loading = false;
    guardando = false;
    hoy = '';

    dashboard: FactRipsDashboard | null = null;
    pacientes: FactRipsPaciente[] = [];
    totalPacientes = 0;
    filtros = { buscar: '', desde: '', hasta: '', especialidad: '', consentimiento: '', estado_factura: '' };
    filtrosExpandidos = false;
    especialidades: { codigo: string; descripcion: string }[] = [];

    pacientesSeleccion: FactRipsPaciente[] = [];
    cargandoSeleccion = false;
    buscarSeleccion = '';

    facturas: FactRipsFactura[] = [];
    totalFacturas = 0;
    historialFiltro = { buscar: '', desde: '', hasta: '', estado: '' };
    historialRangoActivo = 'todo';
    filtrosHistorialExpandidos = false;
    cargandoHistorial = false;

    reporteTipo = 'fecha';
    reporteDesde = '';
    reporteHasta = '';
    reporte: FactRipsReporte | null = null;
    cargandoReporte = false;

    config: FactRipsConfig = {};
    estadoConfig: FactRipsEstadoConfiguracion | null = null;
    catalogos: FactRipsCatalogos | null = null;
    configTab = 'empresa';
    configGuiada = false;
    configGuiaPaso = 1;
    cargandoConfig = false;

    catalogoTipo = 'cups';
    catalogoBuscar = '';
    catalogoRows: any[] = [];
    cargandoCatalogo = false;
    tarifarioBuscar = '';
    tarifarioRows: any[] = [];
    cargandoTarifario = false;

    importPreviewVisible = false;
    importTipo = 'cups';
    importRows: string[][] = [];
    importFileName = '';
    importResumen = { nuevos: 0, actualizados: 0, rechazados: 0 };
    importando = false;

    wizardVisible = false;
    wizardPaso = 1;
    wizardPaciente: FactRipsPaciente | null = null;
    wizardDetalle: FactRipsPacienteDetalle | null = null;
    wizardForm: FactRipsWizardForm = this.formularioVacio();
    wizardServicios: FactRipsServicioForm[] = [];
    wizardValidacion: FactRipsValidacion | null = null;
    wizardFactura: FactRipsFactura | null = null;
    wizardEmitida = false;
    wizardCargando = false;
    wizardGuardando = false;
    wizardConsentimiento: any = null;

    servicioModalVisible = false;
    servicioEditandoIndex: number | null = null;
    servicioForm: FactRipsServicioForm = this.servicioVacio();
    cupsBuscar = '';
    cupsResultados: FactRipsCups[] = [];
    cie10Buscar = '';
    cie10Resultados: FactRipsCie10[] = [];
    cupsSeleccionado: FactRipsCups | null = null;
    cie10Seleccionado: FactRipsCie10 | null = null;
    cargandoCups = false;
    cargandoCie10 = false;
    private cupsTimer: ReturnType<typeof setTimeout> | null = null;
    private cie10Timer: ReturnType<typeof setTimeout> | null = null;
    private buscarTimer: ReturnType<typeof setTimeout> | null = null;
    private historialTimer: ReturnType<typeof setTimeout> | null = null;

    jsonModalVisible = false;
    jsonContenido: any = null;
    jsonNombre = '';

    envioModalVisible = false;
    envioTipo: 'CORREO' | 'WHATSAPP' = 'CORREO';
    envioFactura: FactRipsFactura | null = null;
    envioDestino = '';
    envioMensaje = '';
    whatsappUrl = '';
    enviando = false;

    anulacionModalVisible = false;
    anulacionFactura: FactRipsFactura | null = null;
    anulacionMotivo = '';

    printAnimationActive = false;
    printHtml = '';
    private pestanaSub?: Subscription;

    constructor(
        private factRipsService: FactRipsService,
        public messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.hoy = this.hoyISO();
        this.reporteDesde = this.hoy.slice(0, 7) + '-01';
        this.reporteHasta = this.hoy;
        this.pestana = (this.route.snapshot.data['pestana'] as Pestana) || 'dashboard';
        this.pestanaSub = this.route.data.subscribe(data => {
            const nueva = (data['pestana'] as Pestana) || 'dashboard';
            if (nueva !== this.pestana) {
                this.pestana = nueva;
                this.cargarSeccion();
            }
        });
        this.cargarCatalogos();
        this.cargarConfiguracion();
        this.cargarSeccion();
    }

    ngOnDestroy(): void {
        this.pestanaSub?.unsubscribe();
    }

    // ============================================================
    // Navegación y dashboard
    // ============================================================
    cambiarPestana(pestana: Pestana): void {
        this.router.navigate(['/fact_rips', pestana]);
    }

    private cargarSeccion(): void {
        if (this.pestana === 'dashboard') this.cargarDashboard();
        else if (this.pestana === 'facturar') this.cargarSeleccion();
        else if (this.pestana === 'historial') this.cargarHistorial();
        else if (this.pestana === 'reportes') this.cargarReporte();
        else if (this.pestana === 'configuracion') this.cargarConfiguracion();
    }

    seccionInfo(): { titulo: string; subtitulo: string; icono: string } {
        switch (this.pestana) {
            case 'facturar':
                return { titulo: 'Facturar RIPS', subtitulo: 'Selecciona un paciente y una atención para iniciar la liquidación.', icono: 'fa-solid fa-file-invoice-dollar' };
            case 'historial':
                return { titulo: 'Historial', subtitulo: 'Consulta, reimprime, reenvía o anula facturas emitidas y borradores.', icono: 'fa-solid fa-clock-rotate-left' };
            case 'reportes':
                return { titulo: 'Reportes', subtitulo: 'Analiza la facturación por fecha, entidad, especialidad, CUPS, estado, cartera y envíos.', icono: 'fa-solid fa-chart-column' };
            case 'configuracion':
                return { titulo: 'Configuración', subtitulo: 'Configura la empresa, numeración, parámetros RIPS, catálogos y consentimiento.', icono: 'fa-solid fa-sliders' };
            default:
                return { titulo: 'Dashboard', subtitulo: 'Resumen de facturación, consentimientos y atenciones del día.', icono: 'fa-solid fa-chart-pie' };
        }
    }

    async cargarDashboard(): Promise<void> {
        try {
            this.loading = true;
            const [dashboard, pagina] = await Promise.all([
                firstValueFrom(await this.factRipsService.getDashboard()),
                firstValueFrom(await this.factRipsService.getPacientes({ ...this.filtros, page: 1, rows: 1000 }))
            ]);
            this.dashboard = dashboard;
            this.pacientes = pagina.pacientes || [];
            this.totalPacientes = pagina.total || 0;
            if (this.catalogos) {
                this.especialidades = [{ codigo: 'Atención general', descripcion: 'Atención general' }, ...this.catalogos.especialidades];
            }
        } catch (error: any) {
            this.toastError(error, 'No se pudo cargar el dashboard RIPS');
        } finally {
            this.loading = false;
        }
    }

    async aplicarFiltros(): Promise<void> {
        try {
            this.loading = true;
            const pagina = await firstValueFrom(await this.factRipsService.getPacientes({ ...this.filtros, page: 1, rows: 1000 }));
            this.pacientes = pagina.pacientes || [];
            this.totalPacientes = pagina.total || 0;
        } catch (error: any) {
            this.toastError(error, 'No se pudieron aplicar los filtros');
        } finally {
            this.loading = false;
        }
    }

    toggleFiltros(): void {
        this.filtrosExpandidos = !this.filtrosExpandidos;
    }

    toggleFiltrosHistorial(): void {
        this.filtrosHistorialExpandidos = !this.filtrosHistorialExpandidos;
    }

    limpiarFiltros(): void {
        this.filtros = { buscar: '', desde: '', hasta: '', especialidad: '', consentimiento: '', estado_factura: '' };
        this.aplicarFiltros();
    }

    async cargarSeleccion(): Promise<void> {
        try {
            this.cargandoSeleccion = true;
            const pagina = await firstValueFrom(await this.factRipsService.getPacientes({ buscar: this.buscarSeleccion, page: 1, rows: 1000 }));
            this.pacientesSeleccion = pagina.pacientes || [];
        } catch (error: any) {
            this.toastError(error, 'No se pudieron cargar los pacientes');
        } finally {
            this.cargandoSeleccion = false;
        }
    }

    onBuscarSeleccion(value: string): void {
        this.buscarSeleccion = value;
        if (this.buscarTimer) clearTimeout(this.buscarTimer);
        this.buscarTimer = setTimeout(() => this.cargarSeleccion(), 300);
    }

    limpiarBuscarSeleccion(): void {
        this.buscarSeleccion = '';
        this.cargarSeleccion();
    }

    async cargarHistorial(): Promise<void> {
        try {
            this.cargandoHistorial = true;
            const pagina = await firstValueFrom(await this.factRipsService.getFacturas({ ...this.historialFiltro, page: 1, rows: 200 }));
            this.facturas = pagina.facturas || [];
            this.totalFacturas = pagina.total || 0;
        } catch (error: any) {
            this.toastError(error, 'No se pudo cargar el historial');
        } finally {
            this.cargandoHistorial = false;
        }
    }

    onBuscarHistorial(value: string): void {
        this.historialFiltro.buscar = value;
        if (this.historialTimer) clearTimeout(this.historialTimer);
        this.historialTimer = setTimeout(() => this.cargarHistorial(), 300);
    }

    limpiarHistorial(): void {
        this.historialFiltro = { buscar: '', desde: '', hasta: '', estado: '' };
        this.historialRangoActivo = 'todo';
        this.cargarHistorial();
    }

    aplicarRangoHistorial(rango: string): void {
        this.historialRangoActivo = rango;
        const base = new Date(this.hoy + 'T00:00:00');
        if (rango === 'hoy') {
            this.historialFiltro.desde = this.hoy;
            this.historialFiltro.hasta = this.hoy;
        } else if (rango === 'semana') {
            const dia = base.getDay();
            const offset = dia === 0 ? -6 : 1 - dia;
            const lunes = new Date(base);
            lunes.setDate(base.getDate() + offset);
            const domingo = new Date(lunes);
            domingo.setDate(lunes.getDate() + 6);
            this.historialFiltro.desde = this.fechaIso(lunes);
            this.historialFiltro.hasta = this.fechaIso(domingo);
        } else if (rango === 'mesAnterior') {
            const primerDiaActual = new Date(base.getFullYear(), base.getMonth(), 1);
            const ultimoDiaAnterior = new Date(primerDiaActual.getTime() - 86400000);
            const primerDiaAnterior = new Date(ultimoDiaAnterior.getFullYear(), ultimoDiaAnterior.getMonth(), 1);
            this.historialFiltro.desde = this.fechaIso(primerDiaAnterior);
            this.historialFiltro.hasta = this.fechaIso(ultimoDiaAnterior);
        } else if (rango === 'trimestre') {
            const primerDiaActual = new Date(base.getFullYear(), base.getMonth(), 1);
            const ultimoDiaAnterior = new Date(primerDiaActual.getTime() - 86400000);
            const primerDiaHaceTres = new Date(ultimoDiaAnterior.getFullYear(), ultimoDiaAnterior.getMonth() - 2, 1);
            this.historialFiltro.desde = this.fechaIso(primerDiaHaceTres);
            this.historialFiltro.hasta = this.fechaIso(ultimoDiaAnterior);
        } else {
            this.historialFiltro.desde = '';
            this.historialFiltro.hasta = '';
        }
        this.cargarHistorial();
    }

    async cargarReporte(): Promise<void> {
        try {
            this.cargandoReporte = true;
            this.reporte = await firstValueFrom(await this.factRipsService.getReporte(this.reporteTipo, this.reporteDesde, this.reporteHasta));
        } catch (error: any) {
            this.toastError(error, 'No se pudo generar el reporte');
        } finally {
            this.cargandoReporte = false;
        }
    }

    cambiarReporte(tipo: string): void {
        this.reporteTipo = tipo;
        this.cargarReporte();
    }

    // ============================================================
    // Catálogos y configuración
    // ============================================================
    async cargarCatalogos(): Promise<void> {
        try {
            const data = await firstValueFrom(await this.factRipsService.getCatalogos());
            this.catalogos = data;
            this.config = { ...this.config, ...data.config };
            this.especialidades = [{ codigo: 'Atención general', descripcion: 'Atención general' }, ...data.especialidades];
        } catch (error: any) {
            this.toastError(error, 'No se pudieron cargar los catálogos RIPS');
        }
    }

    async cargarConfiguracion(): Promise<void> {
        try {
            this.cargandoConfig = true;
            const data = await firstValueFrom(await this.factRipsService.getConfiguracion());
            this.config = data.config || {};
            this.estadoConfig = data.estado;
            const completada = Boolean(data.estado?.configuracion_completada);
            this.configGuiada = !completada;
            this.configGuiaPaso = completada ? 1 : Math.max(1, Math.min(7, Number(data.estado?.paso_actual || 1)));
            this.configTab = this.configGuiada ? (this.configSteps[this.configGuiaPaso - 1]?.key || 'empresa') : 'empresa';
            if (this.configTab === 'catalogos') this.cargarCatalogo();
            if (this.configTab === 'tarifario') this.cargarTarifario();
        } catch (error: any) {
            this.toastError(error, 'No se pudo cargar la configuración RIPS');
        } finally {
            this.cargandoConfig = false;
        }
    }

    seleccionarConfigTab(tab: string): void {
        const indice = this.configSteps.findIndex(t => t.key === tab);
        if (this.configGuiada && indice >= 0) {
            const pasoActual = Math.max(1, Number(this.configGuiaPaso) || 1);
            if (indice + 1 > pasoActual) {
                this.messageService.add({ severity: 'warn', summary: 'Paso bloqueado', detail: 'Completa los pasos anteriores para continuar.' });
                return;
            }
            this.configGuiaPaso = indice + 1;
        }
        this.configTab = tab;
        if (tab === 'catalogos') this.cargarCatalogo();
        if (tab === 'tarifario') this.cargarTarifario();
    }

    configTabActual(): number {
        return this.configSteps.find(t => t.key === this.configTab)?.number || 1;
    }

    async guardarPasoConfiguracion(avanzar = false): Promise<void> {
        try {
            this.guardando = true;
            const paso = this.configTabActual();
            const data = await firstValueFrom(await this.factRipsService.guardarPaso(paso, { ...this.config }));
            this.config = data.config || this.config;
            this.estadoConfig = data.estado;
            if (avanzar && this.configGuiada) {
                if (paso >= 7) {
                    this.configGuiada = false;
                    this.configTab = 'empresa';
                    this.messageService.add({ severity: 'success', summary: 'Configuración completada', detail: 'Fact. RIPS está listo para facturar.' });
                } else {
                    this.configGuiaPaso = paso + 1;
                    this.configTab = this.configSteps[paso]?.key || 'empresa';
                    this.messageService.add({ severity: 'success', summary: `Paso ${paso} guardado`, detail: `Continuamos con el paso ${paso + 1}.` });
                }
            } else {
                this.messageService.add({ severity: 'success', summary: 'Cambios guardados', detail: 'La configuración se actualizó correctamente.' });
            }
            if (this.configTab === 'catalogos') this.cargarCatalogo();
            if (this.configTab === 'tarifario') this.cargarTarifario();
        } catch (error: any) {
            this.toastError(error, 'No se pudo guardar la configuración');
        } finally {
            this.guardando = false;
        }
    }

    atrasConfiguracion(): void {
        const paso = Math.max(1, Number(this.configGuiaPaso) || 1);
        if (paso <= 1) return;
        this.configGuiaPaso = paso - 1;
        this.configTab = this.configSteps[this.configGuiaPaso - 1].key;
        if (this.configTab === 'catalogos') this.cargarCatalogo();
        if (this.configTab === 'tarifario') this.cargarTarifario();
    }

    salirConfiguracion(): void {
        this.guardarPasoConfiguracion(false);
        this.configGuiada = false;
    }

    reanudarConfiguracion(): void {
        this.configGuiada = true;
        this.configGuiaPaso = Math.max(1, Math.min(7, Number(this.estadoConfig?.paso_actual || 1)));
        this.configTab = this.configSteps[this.configGuiaPaso - 1].key;
    }

    repetirConfiguracion(): void {
        this.configGuiada = true;
        this.configGuiaPaso = 1;
        this.configTab = 'empresa';
    }

    async cargarCatalogo(): Promise<void> {
        try {
            this.cargandoCatalogo = true;
            this.catalogoRows = await firstValueFrom(await this.factRipsService.getCatalogo(this.catalogoTipo, this.catalogoBuscar));
        } catch (error: any) {
            this.toastError(error, 'No se pudo cargar el catálogo');
        } finally {
            this.cargandoCatalogo = false;
        }
    }

    cambiarCatalogoTipo(tipo: string): void {
        this.catalogoTipo = tipo;
        this.catalogoBuscar = '';
        this.cargarCatalogo();
    }

    async cargarTarifario(): Promise<void> {
        try {
            this.cargandoTarifario = true;
            this.tarifarioRows = await firstValueFrom(await this.factRipsService.getTarifario(this.tarifarioBuscar));
        } catch (error: any) {
            this.toastError(error, 'No se pudo cargar el tarifario');
        } finally {
            this.cargandoTarifario = false;
        }
    }

    columnasCatalogo(): string {
        if (this.catalogoTipo === 'cie10') return 'codigo,descripcion,capitulo';
        if (this.catalogoTipo === 'municipios') return 'codigo,nombre,departamento';
        return 'codigo,descripcion,tipo,grupo_servicio,cod_servicio,modalidad_sugerida,finalidad_sugerida,ambito_sugerido,valor_referencia,requiere_autorizacion';
    }

    descargarPlantillaCatalogo(): void {
        const tipo = this.catalogoTipo;
        if (tipo === 'cie10') {
            this.descargarCsv('plantilla_cie10.csv', [
                ['codigo', 'descripcion', 'capitulo'],
                ['J00', 'Rinofaringitis aguda (resfriado común)', 'Enfermedades del aparato respiratorio']
            ]);
        } else if (tipo === 'municipios') {
            this.descargarCsv('plantilla_municipios.csv', [
                ['codigo', 'nombre', 'departamento'],
                ['11001', 'Bogotá D.C.', 'Cundinamarca']
            ]);
        } else {
            this.descargarCsv('plantilla_cups.csv', [
                ['codigo', 'descripcion', 'tipo', 'grupo_servicio', 'cod_servicio', 'modalidad_sugerida', 'finalidad_sugerida', 'ambito_sugerido', 'valor_referencia', 'requiere_autorizacion'],
                ['890301', 'Consulta externa por medicina general', 'CONSULTA', '01', '001', '01', '04', '01', '75000', 'false']
            ]);
        }
    }

    descargarPlantillaTarifario(): void {
        const rows: any[][] = [['codigo_cups', 'descripcion', 'valor']];
        this.tarifarioRows.slice(0, 15).forEach(row => rows.push([row.codigo, row.descripcion, row.valor]));
        this.descargarCsv('plantilla_tarifario.csv', rows);
    }

    seleccionarArchivoCatalogo(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const rows = this.parseCsv(String(reader.result || ''));
            if (rows.length && /codigo/i.test(String(rows[0][0] || ''))) rows.shift();
            if (!rows.length) {
                this.messageService.add({ severity: 'warn', summary: 'Archivo vacío', detail: 'No se encontraron filas para importar.' });
                return;
            }
            this.importTipo = this.catalogoTipo;
            this.importRows = rows;
            this.importFileName = file.name;
            this.calcularResumenImportacion();
            this.importPreviewVisible = true;
        };
        reader.readAsText(file, 'UTF-8');
        input.value = '';
    }

    seleccionarArchivoTarifario(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const rows = this.parseCsv(String(reader.result || ''));
            if (rows.length && /codigo/i.test(String(rows[0][0] || ''))) rows.shift();
            if (!rows.length) {
                this.messageService.add({ severity: 'warn', summary: 'Archivo vacío', detail: 'No se encontraron filas para importar.' });
                return;
            }
            this.importTipo = 'tarifario';
            this.importRows = rows;
            this.importFileName = file.name;
            this.calcularResumenImportacion();
            this.importPreviewVisible = true;
        };
        reader.readAsText(file, 'UTF-8');
        input.value = '';
    }

    calcularResumenImportacion(): void {
        let nuevos = 0;
        let actualizados = 0;
        let rechazados = 0;
        const codigos = new Set(this.importTipo === 'tarifario' ? this.tarifarioRows.map(r => r.codigo) : this.catalogoRows.map(r => r.codigo));
        this.importRows.forEach(row => {
            const codigo = String(row[0] || '').trim();
            const nombre = String(row[1] || '').trim();
            if (!codigo || !nombre) { rechazados++; return; }
            if (codigos.has(codigo)) actualizados++; else nuevos++;
        });
        this.importResumen = { nuevos, actualizados, rechazados };
    }

    async confirmarImportacion(): Promise<void> {
        try {
            this.importando = true;
            const resultado = this.importTipo === 'tarifario'
                ? await firstValueFrom(await this.factRipsService.importarTarifario(this.importRows))
                : await firstValueFrom(await this.factRipsService.importarCatalogo(this.importTipo, this.importRows));
            this.importPreviewVisible = false;
            this.messageService.add({
                severity: resultado.rechazados ? 'warn' : 'success',
                summary: 'Importación completada',
                detail: `${resultado.insertados} nuevos, ${resultado.actualizados} actualizados, ${resultado.rechazados} rechazados.`
            });
            if (this.importTipo === 'tarifario') this.cargarTarifario(); else this.cargarCatalogo();
        } catch (error: any) {
            this.toastError(error, 'No se pudo importar el archivo');
        } finally {
            this.importando = false;
        }
    }

    actualizarTarifa(row: any, event: Event): void {
        const input = event.target as HTMLInputElement;
        row.valor = this.parseCurrency(input.value);
        input.value = this.formatearMoneda(row.valor);
    }

    async guardarTarifario(): Promise<void> {
        try {
            this.guardando = true;
            const rows = this.tarifarioRows.map(row => [row.codigo, row.descripcion || '', String(row.valor)]);
            await firstValueFrom(await this.factRipsService.importarTarifario(rows));
            this.messageService.add({ severity: 'success', summary: 'Tarifario guardado', detail: 'Los valores se aplicarán a las nuevas facturas.' });
        } catch (error: any) {
            this.toastError(error, 'No se pudo guardar el tarifario');
        } finally {
            this.guardando = false;
        }
    }

    // ============================================================
    // Wizard de facturación
    // ============================================================
    async abrirWizard(paciente: FactRipsPaciente, cita?: any): Promise<void> {
        try {
            this.wizardCargando = true;
            this.wizardVisible = true;
            this.wizardPaso = 1;
            this.wizardPaciente = paciente;
            this.wizardServicios = [];
            this.wizardValidacion = null;
            this.wizardFactura = null;
            this.wizardEmitida = false;
            const detalle = await firstValueFrom(await this.factRipsService.getPaciente(paciente.id_paciente));
            this.wizardDetalle = detalle;
            const citas = detalle.citas || [];
            this.citasOpciones = [
                { label: 'Sin cita / atención particular', value: null },
                ...citas.map(c => ({
                    label: `${this.fechaHora(c.fecha_cita)} · ${c.tipo_cita || 'Atención general'} · ${c.estado_cita || ''}`,
                    value: c.id_cita
                }))
            ];
            const citaElegida = cita?.id_cita
                ? citas.find(c => Number(c.id_cita) === Number(cita.id_cita))
                : (citas.find(c => Number(c.id_cita) === Number(paciente.id_cita)) || citas[0]);
            const idCita = citaElegida?.id_cita || null;
            const fechaAtencion = citaElegida?.fecha_cita ? String(citaElegida.fecha_cita).slice(0, 10) : this.hoy;
            const especialidad = citaElegida?.tipo_cita || 'Atención general';
            const regimen = paciente.regimen || 'Contributivo';
            this.wizardForm = {
                id_paciente: paciente.id_paciente,
                id_cita: idCita,
                fecha_factura: this.hoy,
                fecha_atencion: fechaAtencion,
                tipo_cliente: regimen.toLowerCase().includes('particular') ? 'PARTICULAR' : 'EPS',
                entidad_nombre: paciente.eps || '',
                entidad_nit: '',
                convenio: '',
                modalidad_pago: 'TRANSFERENCIA',
                regimen,
                tipo_usuario: regimen.toLowerCase().includes('subsidiado') ? '02' : (regimen.toLowerCase().includes('particular') ? '03' : '01'),
                especialidad,
                aceptado_por_usuario: false
            };
            this.actualizarConsentimiento();
        } catch (error: any) {
            this.toastError(error, 'No se pudo abrir el paciente');
            this.wizardVisible = false;
        } finally {
            this.wizardCargando = false;
        }
    }

    cerrarWizard(): void {
        if (this.wizardServicios.length && !this.wizardEmitida && !this.wizardFactura) {
            this.confirmationService.confirm({
                header: 'Cerrar facturación',
                message: 'Hay una factura en curso sin guardar. ¿Deseas cerrar de todos modos?',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Sí, cerrar',
                rejectLabel: 'Continuar',
                accept: () => { this.wizardVisible = false; }
            });
            return;
        }
        this.wizardVisible = false;
    }

    cambiarCitaWizard(idCita: number | null): void {
        this.wizardForm.id_cita = idCita ? Number(idCita) : null;
        const cita = this.wizardDetalle?.citas.find(c => Number(c.id_cita) === Number(idCita));
        if (cita) {
            this.wizardForm.fecha_atencion = String(cita.fecha_cita).slice(0, 10);
            this.wizardForm.especialidad = cita.tipo_cita || 'Atención general';
        }
        this.actualizarConsentimiento();
    }

    actualizarConsentimiento(): void {
        if (!this.wizardForm.id_cita) {
            this.wizardConsentimiento = null;
            return;
        }
        this.wizardConsentimiento = this.wizardDetalle?.consentimientos.find(c => Number(c.id_cita) === Number(this.wizardForm.id_cita)) || null;
        this.wizardForm.id_consentimiento = this.wizardConsentimiento?.id_consentimiento || null;
    }

    citaSeleccionada(): any {
        return this.wizardDetalle?.citas.find(c => Number(c.id_cita) === Number(this.wizardForm.id_cita)) || null;
    }

    facturaDeCita(): FactRipsFactura | null {
        const cita = this.citaSeleccionada();
        return cita?.id_factura ? this.wizardDetalle?.facturas.find(f => Number(f.id_factura) === Number(cita.id_factura)) || null : null;
    }

    async descargarConsentimiento(): Promise<void> {
        const id = this.wizardConsentimiento?.id_consentimiento;
        if (!id) {
            this.messageService.add({ severity: 'warn', summary: 'Sin consentimiento', detail: 'No hay consentimiento firmado para esta atención.' });
            return;
        }
        try {
            const data = await firstValueFrom(await this.factRipsService.descargarConsentimiento(Number(id)));
            this.descargarBase64(data.pdf_base64, data.nombre_archivo || `Consentimiento_${id}.pdf`, 'application/pdf');
            this.messageService.add({ severity: 'success', summary: 'PDF descargado', detail: 'El consentimiento se descargó correctamente.' });
        } catch (error: any) {
            this.toastError(error, 'No se pudo descargar el consentimiento');
        }
    }

    async siguientePasoWizard(): Promise<void> {
        if (this.wizardPaso === 1) {
            if (!this.wizardForm.id_cita && !this.wizardForm.fecha_atencion) {
                this.messageService.add({ severity: 'warn', summary: 'Fecha requerida', detail: 'Selecciona una cita o registra la fecha de la atención particular.' });
                return;
            }
            const consentimiento = this.wizardConsentimiento;
            if (!consentimiento) {
                if (!this.config.permitir_sin_consentimiento) {
                    this.messageService.add({ severity: 'error', summary: 'Facturación bloqueada', detail: 'La empresa exige consentimiento firmado.' });
                    return;
                }
                if (this.config.exigir_aceptacion && !this.wizardForm.aceptado_por_usuario) {
                    this.messageService.add({ severity: 'warn', summary: 'Aceptación requerida', detail: 'Debes aceptar la facturación sin consentimiento.' });
                    return;
                }
            }
            this.wizardPaso = 2;
            return;
        }
        if (this.wizardPaso === 2) {
            if (!this.wizardServicios.length) {
                this.messageService.add({ severity: 'warn', summary: 'Sin servicios', detail: 'Agrega al menos un servicio a la factura.' });
                return;
            }
            if (!this.wizardForm.entidad_nombre && this.wizardForm.tipo_cliente !== 'PARTICULAR') {
                this.messageService.add({ severity: 'warn', summary: 'Entidad requerida', detail: 'Ingresa la entidad o EPS.' });
                return;
            }
            this.wizardPaso = 3;
            this.validarWizard();
            return;
        }
        if (this.wizardPaso === 3) {
            await this.validarWizard();
            if (this.wizardValidacion?.errores?.length) {
                this.messageService.add({ severity: 'error', summary: 'Errores RIPS', detail: 'Corrige los campos marcados antes de continuar.' });
                return;
            }
            this.wizardPaso = 4;
        }
    }

    atrasPasoWizard(): void {
        this.wizardPaso = Math.max(1, this.wizardPaso - 1);
    }

    calcularTotales(): any {
        let subtotal = 0, descuento = 0, copago = 0, cuota = 0, total = 0, paciente = 0;
        this.wizardServicios.forEach(s => {
            const bruto = Number(s.valor_unitario || 0) * Number(s.cantidad || 1);
            subtotal += bruto;
            descuento += Number(s.descuento || 0);
            copago += Number(s.copago || 0);
            cuota += Number(s.cuota_moderadora || 0);
            const linea = Math.max(0, bruto - Number(s.descuento || 0));
            total += linea;
            paciente += Number(s.copago || 0) + Number(s.cuota_moderadora || 0);
        });
        return { subtotal, descuento_total: descuento, copago_total: copago, cuota_moderadora_total: cuota, total, valor_paciente: paciente, valor_entidad: Math.max(0, total - paciente) };
    }

    abrirServicioModal(indice?: number): void {
        this.servicioEditandoIndex = indice ?? null;
        this.cupsBuscar = '';
        this.cie10Buscar = '';
        this.cupsResultados = [];
        this.cie10Resultados = [];
        if (indice !== undefined && this.wizardServicios[indice]) {
            const servicio = this.wizardServicios[indice];
            this.servicioForm = { ...servicio };
            this.cupsSeleccionado = {
                codigo: servicio.codigo_cups,
                descripcion: servicio.descripcion || '',
                tipo: servicio.tipo_servicio || 'CONSULTA',
                valor: Number(servicio.valor_unitario || 0),
                requiere_autorizacion: Boolean(servicio.requiere_autorizacion)
            };
            this.cie10Seleccionado = { codigo: servicio.cod_diagnostico_principal || '', descripcion: '' };
        } else {
            this.servicioForm = this.servicioVacio();
            this.cupsSeleccionado = null;
            this.cie10Seleccionado = null;
        }
        this.servicioModalVisible = true;
        this.buscarCupsServicio('');
        this.buscarCie10Servicio('');
    }

    cerrarServicioModal(): void {
        this.servicioModalVisible = false;
    }

    buscarCupsServicio(texto: string): void {
        this.cupsBuscar = texto;
        if (this.cupsTimer) clearTimeout(this.cupsTimer);
        this.cupsTimer = setTimeout(async () => {
            try {
                this.cargandoCups = true;
                this.cupsResultados = await firstValueFrom(await this.factRipsService.buscarCups(texto));
            } catch (error: any) {
                this.toastError(error, 'No se pudo buscar el CUPS');
            } finally {
                this.cargandoCups = false;
            }
        }, 220);
    }

    buscarCie10Servicio(texto: string): void {
        this.cie10Buscar = texto;
        if (this.cie10Timer) clearTimeout(this.cie10Timer);
        this.cie10Timer = setTimeout(async () => {
            try {
                this.cargandoCie10 = true;
                this.cie10Resultados = await firstValueFrom(await this.factRipsService.buscarCie10(texto));
            } catch (error: any) {
                this.toastError(error, 'No se pudo buscar el CIE-10');
            } finally {
                this.cargandoCie10 = false;
            }
        }, 220);
    }

    seleccionarCups(cups: FactRipsCups): void {
        this.cupsSeleccionado = cups;
        this.servicioForm.codigo_cups = cups.codigo;
        this.servicioForm.descripcion = cups.descripcion;
        this.servicioForm.tipo_servicio = cups.tipo;
        this.servicioForm.valor_unitario = Number(cups.valor || 0);
        this.servicioForm.requiere_autorizacion = Boolean(cups.requiere_autorizacion);
        this.servicioForm.ambito = cups.ambito_sugerido || this.config.ambito_default || '01';
        this.servicioForm.modalidad = cups.modalidad_sugerida || this.config.modalidad_default || '01';
        this.servicioForm.finalidad = cups.finalidad_sugerida || this.config.finalidad_default || '04';
        this.servicioForm.grupo_servicio = cups.grupo_servicio || '01';
        this.servicioForm.cod_servicio = cups.cod_servicio || '001';
    }

    seleccionarCie10(cie10: FactRipsCie10): void {
        this.cie10Seleccionado = cie10;
        this.servicioForm.cod_diagnostico_principal = cie10.codigo;
    }

    guardarServicio(): void {
        if (!this.servicioForm.codigo_cups || !this.servicioForm.cod_diagnostico_principal) {
            this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Selecciona el CUPS y el diagnóstico CIE-10.' });
            return;
        }
        const cantidad = Math.max(1, Number(this.servicioForm.cantidad || 1));
        const valor = Math.max(0, Number(this.servicioForm.valor_unitario || 0));
        const descuento = Math.max(0, Number(this.servicioForm.descuento || 0));
        const copago = Math.max(0, Number(this.servicioForm.copago || 0));
        const cuota = Math.max(0, Number(this.servicioForm.cuota_moderadora || 0));
        const servicio: FactRipsServicioForm = {
            ...this.servicioForm,
            codigo_cups: String(this.servicioForm.codigo_cups),
            cantidad,
            valor_unitario: valor,
            descuento,
            copago,
            cuota_moderadora: cuota,
            valor_total: Math.max(0, valor * cantidad - descuento),
            valor_pago_moderador: copago + cuota,
            tipo_diagnostico_principal: this.servicioForm.tipo_diagnostico_principal || '01',
            ambito: this.servicioForm.ambito || this.config.ambito_default || '01',
            finalidad: this.servicioForm.finalidad || this.config.finalidad_default || '04',
            causa_externa: this.servicioForm.causa_externa || this.config.causa_default || '06',
            modalidad: this.servicioForm.modalidad || this.config.modalidad_default || '01',
            grupo_servicio: this.servicioForm.grupo_servicio || '01',
            cod_servicio: this.servicioForm.cod_servicio || '001',
            concepto_recaudo: this.servicioForm.concepto_recaudo || this.config.concepto_recaudo_default || '05',
            fecha_inicio_atencion: this.servicioForm.fecha_inicio_atencion || this.wizardForm.fecha_atencion,
            consecutivo: this.servicioEditandoIndex !== null ? Number(this.servicioForm.consecutivo || 1) : this.wizardServicios.length + 1
        };
        if (!servicio.num_fev_pago_moderador && (copago + cuota) > 0) {
            servicio.num_fev_pago_moderador = `FEV-${String(this.wizardServicios.length + 1).padStart(3, '0')}`;
        }
        if (this.servicioEditandoIndex !== null) {
            this.wizardServicios[this.servicioEditandoIndex] = servicio;
        } else {
            this.wizardServicios.push(servicio);
        }
        this.servicioModalVisible = false;
        this.wizardValidacion = null;
        this.messageService.add({ severity: 'success', summary: 'Servicio agregado', detail: 'El servicio se agregó a la factura.' });
    }

    eliminarServicio(indice: number): void {
        this.wizardServicios.splice(indice, 1);
        this.wizardServicios.forEach((servicio, i) => servicio.consecutivo = i + 1);
        this.wizardValidacion = null;
    }

    actualizarServicio(indice: number): void {
        const servicio = this.wizardServicios[indice];
        servicio.valor_total = Math.max(0, Number(servicio.valor_unitario || 0) * Number(servicio.cantidad || 1) - Number(servicio.descuento || 0));
        servicio.valor_pago_moderador = Number(servicio.copago || 0) + Number(servicio.cuota_moderadora || 0);
        this.wizardValidacion = null;
    }

    async validarWizard(): Promise<void> {
        try {
            this.wizardGuardando = true;
            const input = this.construirInput();
            this.wizardValidacion = await firstValueFrom(await this.factRipsService.validar(input));
            if (this.wizardValidacion.errores.length) {
                this.messageService.add({ severity: 'warn', summary: 'Validación RIPS', detail: `${this.wizardValidacion.errores.length} error(es) y ${this.wizardValidacion.advertencias.length} advertencia(s).` });
            } else {
                this.messageService.add({ severity: 'success', summary: 'Validación RIPS', detail: 'Sin errores técnicos. Listo para emitir.' });
            }
        } catch (error: any) {
            this.toastError(error, 'No se pudo validar la factura');
        } finally {
            this.wizardGuardando = false;
        }
    }

    async guardarFactura(modo: 'BORRADOR' | 'EMITIR'): Promise<void> {
        try {
            this.wizardGuardando = true;
            const input = this.construirInput();
            const data = await firstValueFrom(await this.factRipsService.guardar(input, modo));
            this.wizardFactura = data.factura;
            this.wizardEmitida = modo === 'EMITIR';
            this.wizardPaso = 4;
            if (modo === 'EMITIR') {
                this.messageService.add({ severity: 'success', summary: 'Factura emitida', detail: `Se emitió ${data.factura.numero_factura || 'la factura'} correctamente.` });
                this.cargarDashboard();
            } else {
                this.messageService.add({ severity: 'success', summary: 'Borrador guardado', detail: 'Puedes retomarlo desde el historial.' });
            }
        } catch (error: any) {
            const detalle = error?.error?.body;
            if (detalle?.errores?.length) {
                this.wizardValidacion = detalle;
                this.wizardPaso = 3;
                this.messageService.add({ severity: 'error', summary: 'Errores RIPS', detail: detalle.errores[0]?.mensaje || 'Corrige los campos marcados.' });
            } else {
                this.toastError(error, 'No se pudo guardar la factura');
            }
        } finally {
            this.wizardGuardando = false;
        }
    }

    construirInput(): Record<string, unknown> {
        return {
            id_factura: this.wizardFactura?.id_factura,
            id_paciente: this.wizardForm.id_paciente,
            id_cita: this.wizardForm.id_cita,
            id_consentimiento: this.wizardForm.id_consentimiento,
            fecha_factura: this.wizardForm.fecha_factura,
            fecha_atencion: this.wizardForm.fecha_atencion,
            tipo_cliente: this.wizardForm.tipo_cliente,
            entidad_nombre: this.wizardForm.entidad_nombre,
            entidad_nit: this.wizardForm.entidad_nit,
            convenio: this.wizardForm.convenio,
            modalidad_pago: this.wizardForm.modalidad_pago,
            regimen: this.wizardForm.regimen,
            tipo_usuario: this.wizardForm.tipo_usuario,
            especialidad: this.wizardForm.especialidad,
            aceptado_por_usuario: this.wizardForm.aceptado_por_usuario,
            observacion_consentimiento: this.wizardForm.observacion_consentimiento,
            servicios: this.wizardServicios
        };
    }

    // ============================================================
    // PDF, JSON, envíos, anulación
    // ============================================================
    async descargarPdf(factura: FactRipsFactura | null, formato: 'A4' | 'TICKET' = 'A4'): Promise<void> {
        if (!factura) return;
        try {
            const data = await firstValueFrom(await this.factRipsService.generarPdf(factura.id_factura, formato));
            this.descargarBase64(data.pdf_base64, data.nombre_archivo, 'application/pdf');
            this.messageService.add({ severity: 'success', summary: 'PDF generado', detail: 'La factura se descargó correctamente.' });
        } catch (error: any) {
            this.toastError(error, 'No se pudo generar el PDF');
        }
    }

    async abrirJson(factura: FactRipsFactura | null): Promise<void> {
        if (!factura) return;
        try {
            const data = await firstValueFrom(await this.factRipsService.generarJson(factura.id_factura));
            this.jsonContenido = data.json;
            this.jsonNombre = data.nombre_archivo;
            this.jsonModalVisible = true;
        } catch (error: any) {
            this.toastError(error, 'No se pudo generar el JSON RIPS');
        }
    }

    descargarJson(): void {
        if (!this.jsonContenido) return;
        const blob = new Blob([JSON.stringify(this.jsonContenido, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.jsonNombre || 'RIPS.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    abrirEnvio(factura: FactRipsFactura, tipo: 'CORREO' | 'WHATSAPP'): void {
        this.envioFactura = factura;
        this.envioTipo = tipo;
        this.whatsappUrl = '';
        if (tipo === 'CORREO') {
            this.envioDestino = factura.correo_electronico || (this.wizardVisible ? this.wizardPaciente?.correo_electronico : '') || '';
            this.envioMensaje = '';
            this.envioModalVisible = true;
        } else {
            this.prepararWhatsapp(factura);
        }
    }

    async prepararWhatsapp(factura: FactRipsFactura): Promise<void> {
        try {
            const data = await firstValueFrom(await this.factRipsService.obtenerEnlaceWhatsapp(factura.id_factura));
            this.envioFactura = factura;
            this.envioTipo = 'WHATSAPP';
            this.envioDestino = data.whatsapp_telefono || '';
            this.envioMensaje = decodeURIComponent(data.whatsapp_texto || '');
            this.whatsappUrl = data.whatsapp_url || '';
            this.envioModalVisible = true;
        } catch (error: any) {
            this.toastError(error, 'No se pudo preparar el envío por WhatsApp');
        }
    }

    async enviarCorreo(): Promise<void> {
        if (!this.envioFactura || !this.envioDestino) return;
        try {
            this.enviando = true;
            await firstValueFrom(await this.factRipsService.enviarCorreo(this.envioFactura.id_factura, this.envioDestino));
            this.envioModalVisible = false;
            this.messageService.add({ severity: 'success', summary: 'Correo enviado', detail: `La factura se envió a ${this.envioDestino}.` });
        } catch (error: any) {
            this.toastError(error, 'No se pudo enviar el correo');
        } finally {
            this.enviando = false;
        }
    }

    abrirWhatsapp(): void {
        const telefono = String(this.envioDestino || '').replace(/\D/g, '');
        const texto = encodeURIComponent(this.envioMensaje || '');
        const url = telefono
            ? `https://api.whatsapp.com/send?phone=${telefono}&text=${texto}`
            : `https://api.whatsapp.com/send?text=${texto}`;
        window.open(url, '_blank');
        this.envioModalVisible = false;
    }

    abrirAnulacion(factura: FactRipsFactura): void {
        this.anulacionFactura = factura;
        this.anulacionMotivo = '';
        this.anulacionModalVisible = true;
    }

    async confirmarAnulacion(): Promise<void> {
        if (!this.anulacionFactura || !this.anulacionMotivo.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Motivo requerido', detail: 'Ingresa el motivo de la anulación.' });
            return;
        }
        try {
            await firstValueFrom(await this.factRipsService.anular(this.anulacionFactura.id_factura, this.anulacionMotivo.trim()));
            this.anulacionModalVisible = false;
            this.messageService.add({ severity: 'success', summary: 'Factura anulada', detail: 'La factura quedó marcada como anulada.' });
            this.cargarHistorial();
            this.cargarDashboard();
        } catch (error: any) {
            this.toastError(error, 'No se pudo anular la factura');
        }
    }

    async imprimirAnimacion(factura: FactRipsFactura | null, formato: 'A4' | 'TICKET' = 'TICKET'): Promise<void> {
        if (!factura) return;
        try {
            const data = await firstValueFrom(await this.factRipsService.getFactura(factura.id_factura));
            this.printHtml = this.construirHtmlFactura(data.factura, data.detalles, data.paciente);
        } catch {
            this.printHtml = this.construirHtmlFactura(factura);
        }
        this.printAnimationActive = true;
    }

    async abrirPdfPreview(factura: FactRipsFactura | null): Promise<void> {
        if (!factura) return;
        try {
            const data = await firstValueFrom(await this.factRipsService.generarPdf(factura.id_factura, 'A4'));
            const byteCharacters = atob(data.pdf_base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
            const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (error: any) {
            this.toastError(error, 'No se pudo abrir la vista previa');
        }
    }

    async guardarTodoConfig(): Promise<void> {
        try {
            this.guardando = true;
            for (const step of this.configSteps) {
                const data = await firstValueFrom(await this.factRipsService.guardarPaso(step.number, { ...this.config }));
                this.config = data.config || this.config;
                this.estadoConfig = data.estado;
            }
            this.messageService.add({ severity: 'success', summary: 'Configuración guardada', detail: 'Se guardaron todos los pasos de configuración.' });
        } catch (error: any) {
            this.toastError(error, 'No se pudo guardar la configuración');
        } finally {
            this.guardando = false;
        }
    }

    onAnimacionTerminada(): void {
        this.printAnimationActive = false;
    }

    // ============================================================
    // Reportes
    // ============================================================
    getReporteMax(): number {
        return Math.max(...(this.reporte?.rows || []).map((r: any) => this.getReporteValor(r)), 1);
    }

    getReporteTotal(): number {
        return (this.reporte?.rows || []).reduce((sum: number, r: any) => sum + this.getReporteValor(r), 0);
    }

    getReporteAltura(row: any): number {
        return Math.max(4, Math.round((this.getReporteValor(row) / this.getReporteMax()) * 100));
    }

    getDonutGradient(): string {
        const rows = (this.reporte?.rows || []).slice(0, 6);
        const total = rows.reduce((s: number, r: any) => s + this.getReporteValor(r), 0) || 1;
        const colors = ['#0d8aa6', '#3da1b8', '#7c3aed', '#f59e0b', '#16a34a', '#0ea5e9'];
        let acc = 0;
        const stops = rows.map((row: any, i: number) => {
            const start = (acc / total) * 100;
            acc += this.getReporteValor(row);
            const end = (acc / total) * 100;
            return `${colors[i % colors.length]} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
        });
        if (acc < total) stops.push(`#eef6f8 ${((acc / total) * 100).toFixed(2)}% 100%`);
        return `conic-gradient(${stops.join(',')})`;
    }

    exportarReporte(): void {
        if (!this.reporte?.rows?.length) return;
        const rows = [['Concepto', 'Cantidad', 'Total']];
        this.reporte.rows.forEach((row: any) => rows.push([row.label, String(row.cantidad), String(row.total)]));
        this.descargarCsv(`reporte_rips_${this.reporteTipo}.csv`, rows);
    }

    imprimirReporte(): void {
        if (!this.reporte) return;
        const filas = this.reporte.rows.map((row: any) => `<tr><td>${row.label}</td><td>${row.cantidad}</td><td>${this.formatearMoneda(row.total)}</td></tr>`).join('');
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte RIPS</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#142c38}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #dbe8ee;padding:8px;text-align:left;font-size:12px}th{background:#eef8fa}</style></head><body><h1>Reporte RIPS · ${this.reporteTipo}</h1><p>${this.config.empresa || ''} · ${this.fechaCorta(this.reporte.desde)} — ${this.fechaCorta(this.reporte.hasta)}</p><table><thead><tr><th>Concepto</th><th>Cantidad</th><th>Total</th></tr></thead><tbody>${filas}</tbody></table><script>window.onload=function(){setTimeout(function(){window.print();},250);}<\/script></body></html>`;
        const win = window.open('', '_blank', 'width=1000,height=800');
        if (!win) return;
        win.document.write(html);
        win.document.close();
    }

    // ============================================================
    // Utilidades
    // ============================================================
    formularioVacio(): FactRipsWizardForm {
        return {
            id_paciente: 0,
            id_cita: null,
            fecha_factura: this.hoyISO(),
            fecha_atencion: this.hoyISO(),
            tipo_cliente: 'EPS',
            entidad_nombre: '',
            entidad_nit: '',
            convenio: '',
            modalidad_pago: 'TRANSFERENCIA',
            regimen: 'Contributivo',
            tipo_usuario: '01',
            especialidad: 'Atención general',
            aceptado_por_usuario: false
        };
    }

    servicioVacio(): FactRipsServicioForm {
        return {
            tipo_servicio: 'CONSULTA',
            codigo_cups: '',
            descripcion: '',
            cantidad: 1,
            valor_unitario: 0,
            descuento: 0,
            copago: 0,
            cuota_moderadora: 0,
            concepto_recaudo: this.config.concepto_recaudo_default || '05',
            cod_diagnostico_principal: '',
            tipo_diagnostico_principal: '01',
            ambito: this.config.ambito_default || '01',
            finalidad: this.config.finalidad_default || '04',
            causa_externa: this.config.causa_default || '06',
            modalidad: this.config.modalidad_default || '01',
            grupo_servicio: '01',
            cod_servicio: '001',
            fecha_inicio_atencion: this.hoy,
            consecutivo: 1
        };
    }

    toDate(valor: string | Date | null | undefined): Date | null {
        if (!valor) return null;
        if (valor instanceof Date) return valor;
        const date = new Date(String(valor).slice(0, 10) + 'T00:00:00');
        return isNaN(date.getTime()) ? null : date;
    }

    toIso(valor: Date | null | undefined): string {
        if (!valor) return '';
        const year = valor.getFullYear();
        const month = String(valor.getMonth() + 1).padStart(2, '0');
        const day = String(valor.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    fechaModelo(event: Date | string | null | undefined): string {
        if (event instanceof Date) return this.toIso(event);
        return event ? String(event) : '';
    }

    hoyISO(): string {
        const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
        const valor = (tipo: string) => partes.find(p => p.type === tipo)?.value || '';
        return `${valor('year')}-${valor('month')}-${valor('day')}`;
    }

    formatearMoneda(valor: number | string | null | undefined): string {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(valor) || 0);
    }

    parseCurrency(valor: string): number {
        return Number(String(valor || '').replace(/[^\d]/g, '')) || 0;
    }

    fechaCorta(fecha: string | null | undefined): string {
        if (!fecha) return '—';
        const date = new Date(String(fecha).slice(0, 10) + 'T00:00:00');
        if (isNaN(date.getTime())) return String(fecha);
        return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
    }

    fechaHora(fecha: string | null | undefined): string {
        if (!fecha) return '—';
        const date = new Date(fecha);
        if (isNaN(date.getTime())) return String(fecha);
        return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
    }

    iniciales(nombres?: string, apellidos?: string): string {
        return `${(nombres || '').trim().charAt(0)}${(apellidos || '').trim().charAt(0)}`.toUpperCase() || 'NA';
    }

    nombrePaciente(paciente: FactRipsPaciente | null | undefined): string {
        return paciente ? `${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim() : '—';
    }

    edad(fechaNacimiento?: string): number | null {
        if (!fechaNacimiento) return null;
        const nacimiento = new Date(String(fechaNacimiento).slice(0, 10) + 'T00:00:00');
        if (isNaN(nacimiento.getTime())) return null;
        const hoy = new Date();
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const m = hoy.getMonth() - nacimiento.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
        return edad;
    }

    esHoy(fecha?: string): boolean {
        return String(fecha || '').slice(0, 10) === this.hoy;
    }

    totalFacturasPaciente(paciente: FactRipsPaciente): number {
        return Number(paciente.total_facturas || 0);
    }

    estadoFacturaPaciente(paciente: FactRipsPaciente): string {
        return paciente.estado_factura_cita === 'EMITIDA' ? 'Emitida'
            : paciente.estado_factura_cita === 'BORRADOR' ? 'Borrador'
            : paciente.estado_factura_cita === 'ANULADA' ? 'Anulada'
            : 'Sin facturar';
    }

    estadoClasePaciente(paciente: FactRipsPaciente): string {
        const estado = paciente.estado_factura_cita;
        if (estado === 'EMITIDA') return 'emitida';
        if (estado === 'BORRADOR') return 'borrador';
        if (estado === 'ANULADA') return 'anulada';
        return 'sin';
    }

    fechaIso(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    tonoEstadoFactura(estado?: string): string {
        return estado === 'EMITIDA' ? 'success' : estado === 'BORRADOR' ? 'warning' : estado === 'ANULADA' ? 'danger' : 'muted';
    }

    tonoConsentimiento(paciente: FactRipsPaciente): string {
        return paciente.id_consentimiento ? 'success' : 'warning';
    }

    getReporteEtiqueta(row: any): string {
        return row?.label || '';
    }

    private descargarBase64(base64: string, nombre: string, mime: string): void {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombre;
        a.click();
        URL.revokeObjectURL(url);
    }

    private descargarCsv(nombre: string, rows: any[][]): void {
        const csv = rows.map(row => row.map(celda => `"${String(celda ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombre;
        a.click();
        URL.revokeObjectURL(url);
    }

    private parseCsv(texto: string): string[][] {
        const rows: string[][] = [];
        let row: string[] = [];
        let field = '';
        let inQuotes = false;
        for (let i = 0; i < texto.length; i++) {
            const ch = texto[i];
            if (inQuotes) {
                if (ch === '"') {
                    if (texto[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
                } else {
                    field += ch;
                }
            } else if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                row.push(field);
                field = '';
            } else if (ch === '\n') {
                row.push(field);
                rows.push(row);
                row = [];
                field = '';
            } else if (ch !== '\r') {
                field += ch;
            }
        }
        if (field.length || row.length) { row.push(field); rows.push(row); }
        return rows.filter(r => r.some(c => String(c).trim() !== ''));
    }

    private construirHtmlFactura(factura: FactRipsFactura, detalles?: any[], paciente?: any): string {
        const p = paciente || this.wizardPaciente || {};
        const servicios = detalles || this.wizardServicios || [];
        const filas = servicios.map((s: any, i: number) => `
            <tr>
                <td>${i + 1}</td>
                <td>${s.codigo_cups || ''}</td>
                <td>${s.descripcion || ''}</td>
                <td style="text-align:right">${s.cantidad || 1}</td>
                <td style="text-align:right">${this.formatearMoneda(s.valor_unitario)}</td>
                <td style="text-align:right">${this.formatearMoneda(s.valor_total)}</td>
            </tr>`).join('');
        return `<div style="font-family:'Courier New',monospace;color:#142c38;padding:14px;width:290px;margin:0 auto">
            <div style="text-align:center;border-bottom:1px dashed #94a3b8;padding-bottom:10px">
                <h2 style="margin:0;font-size:15px;text-transform:uppercase">${this.config.empresa || 'Integral Soft Salud IPS'}</h2>
                <p style="margin:4px 0 0;font-size:9px">NIT ${this.config.nit || '—'} · Cód. prestador ${this.config.cod_prestador || '—'}</p>
                <p style="margin:2px 0 0;font-size:9px">${this.config.direccion || ''} · ${this.config.ciudad || ''}</p>
                <p style="margin:2px 0 0;font-size:9px">${this.config.telefono || ''} · ${this.config.email || ''}</p>
                <div style="margin-top:8px;font-size:10px;font-weight:700">FACTURA DE SERVICIOS DE SALUD</div>
                <div style="font-size:12px;font-weight:700">${factura.numero_factura || 'BORRADOR'}</div>
                <div style="font-size:8px">Fecha: ${this.fechaCorta(factura.fecha_factura)} · Estado: ${factura.estado || 'BORRADOR'}</div>
            </div>
            <div style="border-bottom:1px dashed #94a3b8;padding:8px 0;font-size:9px">
                <div><strong>Paciente:</strong> ${p.nombres || ''} ${p.apellidos || ''}</div>
                <div><strong>Documento:</strong> ${p.tipo_documento || ''} ${p.numero_documento || ''}</div>
                <div><strong>Entidad:</strong> ${factura.entidad_nombre || 'Particular'}</div>
                <div><strong>Atención:</strong> ${this.fechaCorta(factura.fecha_atencion || factura.fecha_factura)} · ${factura.especialidad || ''}</div>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:8px">
                <thead><tr><th style="text-align:left;border-bottom:1px dashed #94a3b8;padding:3px">#</th><th style="text-align:left;border-bottom:1px dashed #94a3b8;padding:3px">CUPS</th><th style="text-align:left;border-bottom:1px dashed #94a3b8;padding:3px">Descripción</th><th style="text-align:right;border-bottom:1px dashed #94a3b8;padding:3px">Cant</th><th style="text-align:right;border-bottom:1px dashed #94a3b8;padding:3px">Vr. unit</th><th style="text-align:right;border-bottom:1px dashed #94a3b8;padding:3px">Total</th></tr></thead>
                <tbody>${filas}</tbody>
            </table>
            <div style="margin-top:8px;font-size:9px">
                <div style="display:flex;justify-content:space-between"><span>Subtotal</span><strong>${this.formatearMoneda(factura.subtotal)}</strong></div>
                <div style="display:flex;justify-content:space-between"><span>Descuentos</span><strong>- ${this.formatearMoneda(factura.descuento_total)}</strong></div>
                <div style="display:flex;justify-content:space-between"><span>Copago</span><strong>${this.formatearMoneda(factura.copago_total)}</strong></div>
                <div style="display:flex;justify-content:space-between"><span>Cuota moderadora</span><strong>${this.formatearMoneda(factura.cuota_moderadora_total)}</strong></div>
                <div style="display:flex;justify-content:space-between;border-top:1px dashed #94a3b8;margin-top:5px;padding-top:5px;font-size:11px;font-weight:700"><span>TOTAL</span><strong>${this.formatearMoneda(factura.total)}</strong></div>
                <div style="display:flex;justify-content:space-between"><span>A cargo del paciente</span><strong>${this.formatearMoneda(factura.valor_paciente)}</strong></div>
                <div style="display:flex;justify-content:space-between"><span>A cargo de la entidad</span><strong>${this.formatearMoneda(factura.valor_entidad)}</strong></div>
            </div>
            <div style="margin-top:8px;padding:6px;border:1px solid #fed7aa;background:#fff7ed;color:#9a3412;font-size:7px;line-height:1.4">
                Documento interno de facturación. No constituye factura electrónica DIAN. El JSON RIPS es el reporte de servicios asociado a esta factura.
            </div>
            <div style="margin-top:6px;text-align:center;font-size:7px;color:#8aa6b3">Generado por Fact. RIPS</div>
        </div>`;
    }

    erroresServicio(indice: number): any[] {
        return (this.wizardValidacion?.errores || []).filter((error: any) => Number(error.indice) === Number(indice));
    }

    tipoConsentimientoLabel(tipo: string | undefined): string {
        return String(tipo || '').replace(/_/g, ' ');
    }

    exportarFacturasHistorial(): void {
        if (!this.facturas.length) return;
        const rows: any[][] = [['Factura', 'Paciente', 'Documento', 'Entidad', 'Fecha', 'Estado', 'Pago', 'Total']];
        this.facturas.forEach(f => rows.push([f.numero_factura || '', `${f.nombres || ''} ${f.apellidos || ''}`.trim(), `${f.tipo_documento || ''} ${f.numero_documento || ''}`, f.entidad_nombre || '', f.fecha_factura, f.estado || '', f.estado_pago || '', f.total || 0]));
        this.descargarCsv('facturas_rips.csv', rows);
    }

    getReporteValor(row: any): number {
        if (this.reporteTipo === 'envios') return Number(row?.cantidad || 0);
        return Number(row?.total || 0);
    }

    getReporteLabel(row: any): string {
        if (row?.label) return row.label;
        if (row?.numero_factura) return row.numero_factura;
        if (row?.canal) return `${row.canal} · ${row.estado || ''}`;
        return '—';
    }

    private toastError(error: any, mensaje: string): void {
        const detalle = error?.error?.msg || error?.message || 'Intenta nuevamente.';
        this.messageService.add({ severity: 'error', summary: mensaje, detail: detalle });
    }
}
