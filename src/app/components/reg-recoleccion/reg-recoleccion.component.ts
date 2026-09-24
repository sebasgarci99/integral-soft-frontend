import { Component  } from '@angular/core';
import { OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';

import { RecoleccionService, ResultadoCreacionRecoleccion } from '../../services/recoleccion/recoleccion.service';
import { ConsultorioService } from '../../services/consultorio/consultorio.service';
import { SecureStorageService } from '../../services/secure-storage.service';
import { OfflineDbService, OutboxRecoleccion } from '../../services/offline/offline-db.service';
import { SyncRecoleccionService } from '../../services/offline/sync-recoleccion.service';
import { NetworkService } from '../../services/offline/network.service';
import { InfoUsuarioService } from '../../services/info-usuario/info-usuario.service';
import { ConfirmationService, MessageService } from 'primeng/api';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
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
import { Tag } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { localeEs } from '../../utils/locale-es';
 
import { MenuItem, SelectItem } from 'primeng/api';
import { firstValueFrom, timeout } from 'rxjs';

/* Firma */
// import { SignaturePadModule } from 'ngx-signaturepad';
// import type { SignaturePad }  from 'ngx-signaturepad/signature-pad';  // 👈  sub‑path correcto

// Interfaces 
import { Recoleccion } from '../../interfaces/recoleccion';

// Firma 
import { SignatureCanvasComponent } from '../../utils/signature-canvas.component';


@Component({
    selector: 'app-reg-recoleccion',
    standalone: true, 
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
        SignatureCanvasComponent,
        Tag,
        TooltipModule
    ],
    templateUrl: './reg-recoleccion.component.html',
    styleUrl: './reg-recoleccion.component.css',
    providers: [MessageService, ConfirmationService]
})
export class RegRecoleccionComponent implements OnInit{

    @ViewChild('firmaPad') firmaPad!: SignatureCanvasComponent;
    @ViewChild('firmaPadFull') firmaPadFull!: SignatureCanvasComponent;
    @ViewChild('tabla') tabla!: Table;

    // Modo maximizado de la firma
    fullscreen = false;

    // Variable local de traducción del lenguaje de los calendar
    local_espaniol:any = null;

    // Objeto con las variables de sesión
    datosUsuario:any = {};

    /** Paso actual (0‑based) */
    current = 0;

    // Fecha actual
    hoy = new Date();   // para [defaultDate]

    /** Títulos que pintan el progressbar —solo para mostrar */
    readonly titles = [
        'Datos Generales',
        'Residuos',
        'Bolsas y Horarios',
        'Confirmación',
    ];

    // Tabla
    recolecciones: Recoleccion[] = [];
    totalRecords = 0;
    pagina = 1;
    limite = 25;
    busquedaGlobal = '';
    // registroDiaHoy: number | null = null; // esto va en tu componente
    registroDiaHoy: number[] = [];

    // Diálogo / formulario
    displayDialog = false;
    isEdit = false;
    blobFirmaEdit:string = '';

    // Sincronización offline
    pendientesCount = 0;
    guardando = false;

    // Mensaje para firma
    mostrarMensajeOK:boolean = false;

    habilitarPaso3 = false;

    steps: MenuItem[] = [
        { label: 'General' },
        { label: 'Residuos' },
        { label: 'Confirmación y firma' }
    ];

    private construirSteps(): void {
        this.steps = this.habilitarPaso3
            ? [
                { label: 'General' },
                { label: 'Residuos' },
                { label: 'Bolsas' },
                { label: 'Confirmación y firma' }
            ]
            : [
                { label: 'General' },
                { label: 'Residuos' },
                { label: 'Confirmación y firma' }
            ];
    }

    // Clave del paso actual, para no depender de índices fijos cuando el paso 3 se oculta
    pasoKey(): 'general' | 'residuos' | 'bolsas' | 'confirmacion' {
        if (this.current === 0) { return 'general'; }
        if (this.current === 1) { return 'residuos'; }
        if (this.habilitarPaso3) {
            return this.current === 2 ? 'bolsas' : 'confirmacion';
        }
        return 'confirmacion';
    }

    // Datos del formulario
    formData: Recoleccion = this.emptyForm();

    /* --- Listas para dropdowns --- */
    consultoriosOpts: SelectItem[] = [
        // // { label: 'Seleccionar', value: null },
    ];

    pretUsadoOpts: SelectItem[] = [
        { label: 'No aplica', value: 'N/A' },
        { label: 'Químico', value: 'Químico'},
        { label: 'Térmico', value: 'Térmico' }
    ];

    tratamientoOpts: SelectItem[] = [
        { label: 'Incineración', value: 'Incineración' },
        { label: 'Bioremediación', value: 'Bioremediación' },
        { label: 'Celda de seguridad', value: 'Celda de seguridad' },
        { label: 'Esterilización', value: 'Esterilización' }
    ];

    boolOpts: SelectItem[] = [
        { label: 'No', value: 'No' },
        { label: 'Si', value: 'Si' }
    ];

    // Categorías de residuos agrupadas según clasificación RESPEL
    residuosGrupos = [
        {
            titulo: 'Residuos no peligrosos',
            nota: '',
            campos: [
                { prop: 'aprovechablesBlanco', label: 'Aprovechables - Blanco (kg)', icon: 'fa fa-recycle' },
                { prop: 'aprovechablesOrganicos', label: 'Aprovechables orgánicos (kg)', icon: 'fa fa-leaf' },
                { prop: 'noAprovechablesNegra', label: 'NO Aprovechables - Negra (kg)', icon: 'fa fa-trash' }
            ]
        },
        {
            titulo: 'Residuos con riesgo biológico o infeccioso',
            nota: 'Cortopunzantes: incluye los generados y no generados en la prestación de servicios de salud.',
            campos: [
                { prop: 'biosanitariosRoja', label: 'Biosanitarios - Roja (kg)', icon: 'fa fa-exclamation-triangle' },
                { prop: 'anatomopatologicos', label: 'Anatomopatológicos', icon: 'fa fa-tint' },
                { prop: 'cortopunzantes', label: 'Cortopunzantes (kg)', icon: 'fa fa-eyedropper' },
                { prop: 'deAnimales', label: 'De animales', icon: 'fa fa-paw' }
            ]
        },
        // NOTA: Las características CRETI (químicos, corrosivos, explosivos, reactivos,
        // tóxicos, inflamables) ya no se capturan en el formulario: el operario registra
        // los residuos físicos y el reporte los mapea a las características de la norma.
        // Los campos siguen existiendo en el modelo/payload para conservar el histórico.
        {
            titulo: 'Residuos peligrosos identificables o Químicos',
            nota: 'Registre aquí los residuos que identifica al recibir. Se reportan en las categorías de la norma.',
            campos: [
                { prop: 'reactivos', label: 'Reactivos', icon: 'fa fa-vial' },
                { prop: 'corrosivos', label: 'Corrosivos', icon: 'fa fa-flask' },
                { prop: 'inflamables', label: 'Inflamables (hidrocarburos)', icon: 'fa fa-fire' },
                { prop: 'farmacos', label: 'Fármacos', icon: 'fa fa-plus-circle' },
                { prop: 'chatarraElectronica', label: 'Chatarra electrónica', icon: 'fa fa-desktop' },
                { prop: 'pilas', label: 'Pilas', icon: 'fa fa-battery-empty' },
                { prop: 'iluminarias', label: 'Iluminarias', icon: 'fa fa-lightbulb' },
                { prop: 'aceitesUsados', label: 'Aceites usados', icon: 'fa fa-filter' }
            ]
        },
        {
            titulo: 'Radiactivos',
            nota: '',
            campos: [
                { prop: 'radioactivos', label: 'Radioactivos', icon: 'fa fa-radiation' }
            ]
        }
    ];

    siNoOpts = [
        { label: 'Si', value: 'Si' },
        { label: 'No', value: 'No' }
    ];

    constructor(
        private RecoleccionService: RecoleccionService,
        private consultorioService: ConsultorioService,
        private messageService: MessageService,
        private confirmService: ConfirmationService,
        private secureStorage: SecureStorageService,
        private offlineDb: OfflineDbService,
        private syncRecoleccion: SyncRecoleccionService,
        private network: NetworkService,
        private infoUsuarioService: InfoUsuarioService
    ) {}

    async ngOnInit(): Promise<void> {
        this.local_espaniol = localeEs;

        /* cargar recolecciones desde API aquí */ 
        // Sólo asigna la fecha actual si todavía no hay valor (útil si reutilizas este form en modo edición).
        if (!this.formData.fecha) {
            this.formData.fecha = new Date();   // ← hoy, con la hora del navegador
        }

        // Primero los consultorios: los registros necesitan sus etiquetas para el grid.
        await this.cargarConfigEmpresa();
        await this.cargarConsultorios();
        await this.cargarRegistrosRecoleccion();
        this.cargarInfoUsuarioSesion();
    }

    // Consulta si la empresa tiene habilitado el paso 3 (Bolsas / Info del proceso)
    private async cargarConfigEmpresa(): Promise<void> {
        try {
            const data: any = await firstValueFrom(await this.infoUsuarioService.getEmpresaConfig());
            this.habilitarPaso3 = data?.habilitar_paso3_bolsas_recolec === true
                || data?.habilitar_paso3_bolsas_recolec === 'true';
        } catch (e) {
            this.habilitarPaso3 = false;
        }
        this.construirSteps();
    }

    // Funcion que limpia y habilita el formulario de recolección, a su vez impulsa el abrir.
    abrirFormulario(): void {
        this.formData = this.emptyForm();

        // Marcamos el tratamiento quimico
        this.formData.pretratamiento = 'Químico';

        this.isEdit = false;
        this.current = 0;
        this.displayDialog = true;
    }

    // Permite habilitar el formulario para edición y cargar los datos.
    async editarRecoleccion(row: any): Promise<void> {
        try {
            const obs = await this.RecoleccionService.obtenerRegistroRecoleccionPorId(row.id_registropeso);
            obs.subscribe({
                next: (reg: any) => {
                    this.formData = this.mapearRegistroAFormulario(reg);
                    this.isEdit = true;
                    this.blobFirmaEdit = reg.blob_firma || '';
                    this.current = 0;
                    this.displayDialog = true;
                },
                error: (err: any) => {
                    console.error(err);
                    this.messageService.add({ severity: 'error', summary: 'Error al cargar el registro' });
                }
            });
        } catch (e) {
            console.error(e);
        }
    }

    private mapearRegistroAFormulario(row: any): Recoleccion {
        return {
            id_registropeso: row.id_registropeso,
            fecha: new Date(row.fecha_registro),
            consultorio: this.valorConsultorio(row.id_consultorio),
            aprovechablesBlanco: parseFloat(row.aprovechables) || 0,
            noAprovechablesNegra: parseFloat(row.no_aprovechables) || 0,
            biosanitariosRoja: parseFloat(row.biosanitarios) || 0,
            cortopunzantes: parseFloat(row.cortopunzantes) || 0,
            anatomopatologicos: parseFloat(row.anatomopatologicos) || 0,
            farmacos: parseFloat(row.farmacos) || 0,
            chatarraElectronica: parseFloat(row.chatarra_electronica) || 0,
            pilas: parseFloat(row.pilas) || 0,
            quimicos: parseFloat(row.quimicos) || 0,
            iluminarias: parseFloat(row.iluminarias) || 0,
            aceitesUsados: parseFloat(row.aceites_usados) || 0,
            aprovechablesOrganicos: parseFloat(row.aprovechables_organicos) || 0,
            deAnimales: parseFloat(row.de_animales) || 0,
            corrosivos: parseFloat(row.corrosivos) || 0,
            explosivos: parseFloat(row.explosivos) || 0,
            reactivos: parseFloat(row.reactivos) || 0,
            toxicos: parseFloat(row.toxicos) || 0,
            inflamables: parseFloat(row.inflamables) || 0,
            radioactivos: parseFloat(row.radioactivos) || 0,
            bolsasGuardianes: row.bolsas_g ? parseInt(row.bolsas_g) : 0,
            bolsasBlanco: row.bolsas_b ? parseInt(row.bolsas_b) : 0,
            bolsasNegra: row.bolsas_n ? parseInt(row.bolsas_n) : 0,
            bolsasRoja: row.bolsas_r ? parseInt(row.bolsas_r) : 0,
            pretratamiento: this.pretUsadoOpts.find(e => e.label === row.pret_usado)?.value || null,
            almacenamientoDias: row.dias_almacenamiento,
            tratamiento: this.tratamientoOpts.find(e => e.label === row.tratamiento)?.value || null,
            horaRoja: row.hora_roja ? this.stringToTime(row.hora_roja) : null,
            horaNegra: row.hora_negra ? this.stringToTime(row.hora_negra) : null,
            dotacionGenerador: this.siNoOpts.find(e => e.label === row.dotacion_perso_adecuada)?.value || null,
            dotacionPseg: this.siNoOpts.find(e => e.label === row.dotacion_pers_pseg_adecuada)?.value || null,
            firma: row.blob_firma
        };
    }

    // Función que lanza la inactivación del registro de recolección.
    borrarRecoleccion(id?: number): void {
        this.confirmService.confirm({
            icon: 'pi pi-exclamation-triangle', // <- Ícono de advertencia
            header: 'Eliminar registro de peso',
            message: '¿Estás seguro de eliminar este registro de recolección?',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                (await this.RecoleccionService.borrarRecoleccion(Number(id))).subscribe(() => {
                    this.cargarRegistrosRecoleccion();
                    this.messageService.add({ severity: 'success', summary: 'Registro de peso eliminado (inactivado).' });
                });
            }
        });
    }

    // Función que dispara el avanzar en el formulario de recolección
    next(): void {
        if (this.current < this.steps.length - 1) { this.current++; }

        // Caso de uso: edición del formulario
        if(this.current === 3 && this.isEdit == true) {
            console.log("Variable global en edicion")
            // Cargar la firma si existe en la variable global
            if (this.blobFirmaEdit) {
                setTimeout(() => {
                    this.firmaPad.fromDataBase64(this.blobFirmaEdit);
                }, 200);
            }
        }
    }

    // Función que dispara el retroceder en el formulario de recolección
    prev(): void {
        if (this.current > 0) { this.current--; }

        // Caso de uso: edición del formulario
        if(this.current === 3 && this.isEdit == true) {
            console.log("Variable global en edicion")
            // Cargar la firma si existe en la variable global
            if (this.blobFirmaEdit) {
                setTimeout(() => {
                    this.firmaPad.fromDataBase64(this.blobFirmaEdit);
                }, 200);
            }
        }
    }

    // Cerrar DIALOG (formulario de recolección)
    cerrar(): void {
        this.displayDialog = false;
        this.current = 0;
        this.mostrarMensajeOK = false;
    }

    async cargarConsultorios() {
        try {
            const data = await this.consultorioService.obtenerConsultoriosConCache();

            this.consultoriosOpts = data.filter(e => e.estado == 'A').map((item: any) => ({
                label: item.codigo+'-'+item.descripcion,
                value: item.id
            }));
        } catch(e) {
            console.error(e);
        }
    }

    async cargarRegistrosRecoleccion(): Promise<void> {
        try {
            // Asegura que existan los consultorios para resolver la etiqueta del grid.
            if (this.consultoriosOpts.length === 0) {
                await this.cargarConsultorios();
            }

            let pendientes = await this.offlineDb.obtenerPendientes();
            this.pendientesCount = pendientes.length;

            const mostrarSoloLocales = () => {
                this.recolecciones = pendientes.map(p => this.mapearPendienteAFila(p));
                this.totalRecords = this.recolecciones.length;
            };

            // Sin internet no se consulta el backend: se trabaja solo con la cola local.
            if (!this.network.estaOnline) {
                mostrarSoloLocales();
                return;
            }

            // Con pendientes y sin red apta, se espera a tener buena conexión para sincronizar.
            if (pendientes.length > 0 && (await this.network.medirCalidadRed()) === 'MALA') {
                mostrarSoloLocales();
                return;
            }

            // Con red apta: primero se sincroniza y luego se recarga del servidor.
            if (pendientes.length > 0) {
                await this.syncRecoleccion.sincronizarPendientes();
                pendientes = await this.offlineDb.obtenerPendientes();
                this.pendientesCount = pendientes.length;
            }

            const filasPendientes = pendientes.map(p => this.mapearPendienteAFila(p));

            const obs = await this.RecoleccionService.obtenerRegistrosRecoleccion(this.pagina, this.limite, this.busquedaGlobal);
            const data: any = await firstValueFrom(obs.pipe(timeout(6000)));

            const registros = (Array.isArray(data) ? data : (data.rows || [])).map((reg: any) => ({
                ...reg,
                pretratamiento: reg.pret_usado,
                firma: reg.blob_firma,
                consultorio: this.etiquetaConsultorio(reg.id_consultorio)
            }));

            const totalServidor = Array.isArray(data) ? registros.length : (data.total || 0);

            const combinado = this.pagina === 1 ? [...filasPendientes, ...registros] : registros;
            this.recolecciones = combinado.sort((a: any, b: any) => this.fechaOrden(b) - this.fechaOrden(a));
            this.totalRecords = totalServidor + pendientes.length;

            this.registroDiaHoy = registros
                .filter((r: any) => this.validarFechaEsHoy(r.fecha_registro))
                .map((r: any) => r.id_registropeso);
        } catch (e) {
            console.error(e);

            // Sin respuesta del servidor: al menos se muestran los registros en cola.
            const pendientes = await this.offlineDb.obtenerPendientes();
            this.pendientesCount = pendientes.length;
            this.recolecciones = pendientes.map(p => this.mapearPendienteAFila(p));
            this.totalRecords = this.recolecciones.length;
        }
    }

    // Etiqueta del consultorio a partir de su id (comparación numérica robusta)
    private etiquetaConsultorio(id: any): string | undefined {
        if (id === null || id === undefined) { return undefined; }
        return this.consultoriosOpts.find(e => Number(e.value) === Number(id))?.label;
    }

    // Valor (id) del consultorio a partir del id del registro
    private valorConsultorio(id: any): number | null {
        if (id === null || id === undefined) { return null; }
        const opt = this.consultoriosOpts.find(e => Number(e.value) === Number(id));
        return opt ? Number(opt.value) : null;
    }

    // Devuelve el timestamp de la fecha de un registro (para ordenar)
    private fechaOrden(row: any): number {
        const f = row?.fecha_registro;
        if (!f) { return 0; }
        const t = new Date(f).getTime();
        return isNaN(t) ? 0 : t;
    }

    private mapearPendienteAFila(item: OutboxRecoleccion): any {
        const payload: any = item.payload;
        return {
            id_registropeso: null,
            id_local: item.id_local,
            pendiente: true,
            intentos: item.intentos,
            ultimo_error: item.ultimo_error,
            fecha_registro: payload.fecha_registro,
            consultorio: this.etiquetaConsultorio(payload.id_consultorio),
            aprovechables: payload.aprovechables,
            no_aprovechables: payload.no_aprovechables,
            biosanitarios: payload.biosanitarios,
            cortopunzantes: payload.cortopunzantes ?? ((Number(payload.cortopunzantes_ng) || 0) + (Number(payload.cortopunzantes_k) || 0)),
            anatomopatologicos: payload.anatomopatologicos,
            farmacos: payload.farmacos
        };
    }

    onLazyLoad(event: any): void {
        this.pagina = Math.floor((event.first || 0) / (event.rows || this.limite)) + 1;
        this.limite = event.rows || this.limite;
        this.busquedaGlobal = event.globalFilter || '';
        this.cargarRegistrosRecoleccion();
    }

    // Función que lanza el WS de creación o actualización del registro de recolección.
    async crearActualizarRecoleccion(): Promise<void> {
        if (this.isEdit) {

            // Por precausión, realizamos la validación de la llave del registro
            if(this.formData.id_registropeso == null) {
                this.messageService.add({ severity: 'error', summary: 'No existe llave para procesar el registro.' });
                return;
            }

            // Si se esta editando
            (await this.RecoleccionService.actualizarRecoleccion(Number(this.formData.id_registropeso), this.formData)).subscribe(() => {
                this.cargarRegistrosRecoleccion();
                this.messageService.add({ severity: 'success', summary: 'Registro de peso actualizado correctamente.' });
                this.cerrar();
            });
        } else {
            // Si se va a crear el registro: local-first (medir red -> enviar o encolar)
            this.guardando = true;
            try {
                const resultado: ResultadoCreacionRecoleccion = await this.RecoleccionService.crearRecoleccion(this.formData);

                if (resultado.estado === 'SINCRONIZADO') {
                    this.messageService.add({ severity: 'success', summary: 'Registro de peso creado correctamente.' });
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Guardado localmente',
                        detail: 'No hay conexión estable. Se sincronizará automáticamente.'
                    });
                }

                await this.cargarRegistrosRecoleccion();
                this.cerrar();
            } catch (e) {
                console.error(e);
                this.messageService.add({ severity: 'error', summary: 'No se pudo guardar el registro.' });
            } finally {
                this.guardando = false;
            }
        }
    }

    /* Limpia el formulario */
    private emptyForm(): Recoleccion {
        return {
            id_registropeso : null,
            fecha: new Date(),
            consultorio: null,

            aprovechablesBlanco: null,
            noAprovechablesNegra: null,
            biosanitariosRoja: null,
            cortopunzantes: null,
            anatomopatologicos: null,
            farmacos: null,
            chatarraElectronica: null,
            pilas: null,
            quimicos: null,
            iluminarias: null,
            aceitesUsados: null,
            aprovechablesOrganicos: null,
            deAnimales: null,
            corrosivos: null,
            explosivos: null,
            reactivos: null,
            toxicos: null,
            inflamables: null,
            radioactivos: null,

            bolsasGuardianes: null,
            bolsasBlanco: null,
            bolsasNegra: null,
            bolsasRoja: null,
            pretratamiento: null,
            almacenamientoDias: null,
            tratamiento: null,
            horaRoja: null,
            horaNegra: null,

            dotacionGenerador: 'Si',
            dotacionPseg: 'Si',
            firma: null
        };

        this.mostrarMensajeOK = false;
    }

    // Guarda solo la firma en base64
    guardarFirma(): void {
        if (this.firmaPad && !this.firmaPad.isEmpty()) {
            // Obtiene solo el base64 (sin el prefijo data:image/png;base64)
            this.formData.firma = this.firmaPad.toDataBase64();
            console.log('Base64 puro:', this.formData.firma);
            
            // Si necesitas reconstruir el dataURL completo después:
            const fullDataUrl = `data:image/png;base64,${this.formData.firma}`;
            this.mostrarMensajeOK = true;
        }
    }

    // Abre la firma en modo maximizado (pantalla completa)
    openFullscreen(): void {
        this.fullscreen = true;

        setTimeout(() => {
            if (this.firmaPadFull) {
                this.firmaPadFull.fromDataBase64(this.firmaPad?.toDataBase64() || '');
                this.firmaPadFull.refresh();
            }
        }, 150);
    }

    // Cierra el modo maximizado y restaura el canvas original
    closeFullscreen(): void {
        this.fullscreen = false;
        setTimeout(() => {
            if (this.firmaPad) {
                this.firmaPad.reinitPad();
                if (this.formData.firma) {
                    this.firmaPad.fromDataBase64(this.formData.firma);
                }
            }
        });
    }

    // Guarda la firma dibujada en modo maximizado
    guardarFirmaFull(): void {
        if (this.firmaPadFull && !this.firmaPadFull.isEmpty()) {
            this.formData.firma = this.firmaPadFull.toDataBase64();
            this.firmaPad.fromDataBase64(this.formData.firma);
            this.mostrarMensajeOK = true;
            this.fullscreen = false;
        }
    }

    // Funcion que convierte las cadenas de texto en horas, es importante contemplar que la cadena deberá ser en formato TIME HH:MI:SS
    stringToTime(timeStr: string): Date {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, seconds || 0, 0);
        return date;
    }

    // Validaciones para cada paso de los formularios
    validacionesPasos() : boolean {

        // Paso general (datos generales)
        if (this.pasoKey() === 'general') {
            if (
                this.formData.consultorio == null ||
                this.formData.fecha == null
            ) {
                return true;
            }
        }

        // Paso final: confirmación y firma (las preguntas de dotación ya no se usan)
        if (this.pasoKey() === 'confirmacion') {
            if (this.formData.firma == null) {
                return true;
            }
        }

        return false;
    }

    cargarInfoUsuarioSesion() {
        Promise.all([
            this.secureStorage.getItem('idEmpresa'),
            this.secureStorage.getItem('idRol')
        ]).then(([idEmpresa, idRol]) => {
            this.datosUsuario = {
                "idEmpresa": idEmpresa,
                "idRol": idRol
            }
        });
    }

    // Suma las categorías de un grupo RESPEL del formulario
    subtotalGrupo(grupo: any): number {
        return grupo.campos.reduce(
            (acc: number, c: any) => acc + (Number((this.formData as any)[c.prop]) || 0),
            0
        );
    }

    // Total general de residuos del formulario
    get totalGeneralResiduos(): number {
        return this.residuosGrupos.reduce((acc, g) => acc + this.subtotalGrupo(g), 0);
    }

    // Resumen de los campos de residuos que se digitaron (> 0), para mostrar bajo la firma
    get resumenResiduos(): { label: string; valor: number }[] {
        const resumen: { label: string; valor: number }[] = [];
        for (const g of this.residuosGrupos) {
            for (const c of g.campos) {
                const valor = Number((this.formData as any)[c.prop]) || 0;
                if (valor > 0) {
                    resumen.push({ label: c.label, valor: valor });
                }
            }
        }
        return resumen;
    }

    validarFechaEsHoy(fecha: string | Date): boolean {
        const hoy = new Date();
        const f = new Date(fecha);
        return (
            hoy.getFullYear() === f.getFullYear() &&
            hoy.getMonth() === f.getMonth() &&
            hoy.getDate() === f.getDate()
        );
    }

    // Compara solo el día: la fecha con hora de apertura no debe marcar error por milisegundos.
    get fechaEsFutura(): boolean {
        if (!this.formData.fecha) { return false; }

        const f = new Date(this.formData.fecha);
        const ahora = new Date();
        const diaFecha = new Date(f.getFullYear(), f.getMonth(), f.getDate()).getTime();
        const diaHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();

        return diaFecha > diaHoy;
    }

    // Procedimiento dinamico para asignar una clase y pintar el o los registros del dia
    rowClass(row: any): any {
        if (row.pendiente) { return 'fila-pendiente'; }
        return this.registroDiaHoy.includes(row.id_registropeso) ? 'fila-hoy' : '';
    }

}