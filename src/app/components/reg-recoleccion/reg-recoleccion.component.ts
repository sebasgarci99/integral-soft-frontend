import { Component  } from '@angular/core';
import { OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';

import { SidebarComponent } from "../sidebar/sidebar.component";

import { RecoleccionService } from '../../services/recoleccion/recoleccion.service';
import { ConsultorioService } from '../../services/consultorio/consultorio.service';
import { ConfirmationService, MessageService } from 'primeng/api';

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
import { Tag } from 'primeng/tag';

import { localeEs } from '../../utils/locale-es';
 
import { MenuItem, SelectItem } from 'primeng/api';

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
        SignatureCanvasComponent,
        Tag
    ],
    templateUrl: './reg-recoleccion.component.html',
    styleUrl: './reg-recoleccion.component.css',
    providers: [MessageService, ConfirmationService]
})
export class RegRecoleccionComponent implements OnInit{

    @ViewChild('firmaPad') firmaPad!: SignatureCanvasComponent;

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
    // registroDiaHoy: number | null = null; // esto va en tu componente
    registroDiaHoy: number[] = [];

    // Diálogo / formulario
    displayDialog = false;
    isEdit = false;
    blobFirmaEdit:string = '';

    // Mensaje para firma
    mostrarMensajeOK:boolean = false;

    steps: MenuItem[] = [
        { label: 'General' },
        { label: 'Residuos' },
        { label: 'Bolsas' },
        { label: 'Confirmación y firma' }
    ];

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

    residuosFirstLine = [
        { prop: 'aprovechablesBlanco',  label: 'Aprovechables - Blanco (kg)', icon: 'fa fa-recycle' },
        { prop: 'noAprovechablesNegra', label: 'NO Aprovechables - Negra (kg)', icon: 'fa fa-trash' },
        { prop: 'biosanitariosRoja',    label: 'Biosanitarios - Roja (kg)', icon: 'fa fa-exclamation-triangle' },
        { prop: 'cortopunzantesK',      label: 'Cortopunzantes K', icon: 'fa fa-eyedropper' },
        { prop: 'cortopunzantesNG',     label: 'Cortopunzantes NG', icon: 'fa fa-eyedropper' },
        { prop: 'anatomopatologicos',   label: 'Anatomopatológicos', icon: 'fa fa-tint' },
        { prop: 'farmacos',             label: 'Fármacos', icon: 'fa fa-plus-circle' },
        { prop: 'chatarraElectronica',  label: 'Chatarra electrónica', icon: 'fa fa-desktop' },
        { prop: 'pilas',                label: 'Pilas', icon: 'fa fa-battery-empty' },
        { prop: 'quimicos',             label: 'Químicos', icon: 'fa fa-flask' },
        { prop: 'iluminarias',          label: 'Iluminarias', icon: 'fa fa-lightbulb' },
        { prop: 'aceitesUsados',        label: 'Aceites usados', icon: 'fa fa-filter' }
    ];

    siNoOpts = [
        { label: 'Si', value: 'Si' },
        { label: 'No', value: 'No' }
    ];

    constructor(
        private RecoleccionService: RecoleccionService,
        private consultorioService: ConsultorioService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) {}

    ngOnInit(): void { 
        this.local_espaniol = localeEs;

        /* cargar recolecciones desde API aquí */ 
        // Sólo asigna la fecha actual si todavía no hay valor (útil si reutilizas este form en modo edición).
        if (!this.formData.fecha) {
            this.formData.fecha = new Date();   // ← hoy, con la hora del navegador
        }

        this.cargarConsultorios();
        this.cargarRegistrosRecoleccion();
        this.cargarInfoUsuarioSesion();
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
    editarRecoleccion(row: any): void {
        //this.formData = { ...row};

        // Mapeo de campos entre la respuesta API y el formulario
        this.formData = {
            id_registropeso: row.id_registropeso,
            fecha: new Date(row.fecha_registro),
            consultorio: this.consultoriosOpts.find(e => e.label === row.consultorio)?.value || null,
            aprovechablesBlanco: parseFloat(row.aprovechables) || 0,
            noAprovechablesNegra: parseFloat(row.no_aprovechables),
            biosanitariosRoja: parseFloat(row.biosanitarios),
            cortopunzantesNG: parseFloat(row.cortopunzantes_ng),
            cortopunzantesK: parseFloat(row.cortopunzantes_k),
            anatomopatologicos: parseFloat(row.anatomopatologicos),
            farmacos: parseFloat(row.farmacos),
            chatarraElectronica: parseFloat(row.chatarra_electronica),
            pilas: parseFloat(row.pilas),
            quimicos: parseFloat(row.quimicos),
            iluminarias: parseFloat(row.iluminarias),
            aceitesUsados: parseFloat(row.aceites_usados),
            bolsasGuardianes: row.bolsas_g ? parseInt(row.bolsas_g) : 0,
            bolsasBlanco: row.bolsas_b ? parseInt(row.bolsas_b) : 0,
            bolsasNegra: row.bolsas_n ? parseInt(row.bolsas_n) : 0,
            bolsasRoja: row.bolsas_r ? parseInt(row.bolsas_r) : 0,
            pretratamiento: this.pretUsadoOpts.find(e => e.label === row.pretratamiento)?.value || null,
            almacenamientoDias: row.dias_almacenamiento,
            tratamiento: this.tratamientoOpts.find(e => e.label === row.tratamiento)?.value || null,
            horaRoja: row.hora_roja ? this.stringToTime(row.hora_roja) : null,
            horaNegra: row.hora_negra ? this.stringToTime(row.hora_negra) : null,
            dotacionGenerador: this.siNoOpts.find(e => e.label === row.dotacion_perso_adecuada)?.value || null,
            dotacionPseg: this.siNoOpts.find(e => e.label === row.dotacion_pers_pseg_adecuada)?.value || null,
            firma: row.blob_firma
        };
        
        this.isEdit = true;
        this.blobFirmaEdit = row.blob_firma;
        this.current = 0;
        this.displayDialog = true;
    }

    // Función que lanza la inactivación del registro de recolección.
    borrarRecoleccion(id?: number): void {
        this.confirmService.confirm({
            icon: 'pi pi-exclamation-triangle', // <- Ícono de advertencia
            header: 'Eliminar registro de peso',
            message: '¿Estás seguro de eliminar este registro de recolección?',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.RecoleccionService.borrarRecoleccion(Number(id)).subscribe(() => {
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

    cargarConsultorios() {
        try {
            this.consultorioService.obtenerDatosConsultorios().subscribe((data) => {
                this.consultoriosOpts = data.map((item: any) => ({
                    label: item.codigo+'-'+item.descripcion,
                    value: item.id
                }));
            });
        } catch(e) {
            console.error(e)
        }
        
    }

    cargarRegistrosRecoleccion() {
        try {
            this.RecoleccionService.obtenerRegistrosRecoleccion().subscribe((data) => {  
                const registros = data.map((reg:any) => ({
                        ...reg,
                        pretratamiento : reg.pret_usado,
                        firma : reg.blob_firma,
                        consultorio: this.consultoriosOpts.find(e => e.value === reg.id_consultorio)?.label
                    })
                ).filter(e => e.estado == 'A');

                this.recolecciones = registros;

                // Busca los registros del día de hoy y lo pinta sobre el grid
                let auxiliarValidacion = this.registroDiaHoy = registros
                    .filter(r => this.validarFechaEsHoy(r.fecha_registro))
                    .map(r => r.id_registropeso);

                console.log(this.recolecciones)
            });
            
        } catch(e) {
            console.log(e)
        }
        
    }

    // Función que lanza el WS de creación o actualización del registro de recolección.
    crearActualizarRecoleccion(): void {
        if (this.isEdit) {

            // Por precausión, realizamos la validación de la llave del registro
            if(this.formData.id_registropeso == null) {
                this.messageService.add({ severity: 'error', summary: 'No existe llave para procesar el registro.' });
                return;
            }

            // Si se esta editando
            this.RecoleccionService.actualizarRecoleccion(Number(this.formData.id_registropeso), this.formData).subscribe(() => {
                this.cargarRegistrosRecoleccion();
                this.displayDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Registro de peso actualizado correctamente.' });
            });
        } else {
            // Si se va a crear el registro
            this.RecoleccionService.crearRecoleccion(this.formData).subscribe(() => {
                this.cargarRegistrosRecoleccion();
                this.displayDialog = false;
                this.messageService.add({ severity: 'success', summary: 'Registro de peso creado correctamente.' });
            });
        }
        this.cerrar();
    }

    /* Limpia el formulario */
    private emptyForm(): Recoleccion {
        return {
            id_registropeso : null,
            fecha: null as Date | null,
            consultorio: null,

            aprovechablesBlanco: null,
            noAprovechablesNegra: null,
            biosanitariosRoja: null,
            cortopunzantesK: null,
            cortopunzantesNG: null,
            anatomopatologicos: null,
            farmacos: null,
            chatarraElectronica: null,
            pilas: null,
            quimicos: null,
            iluminarias: null,
            aceitesUsados: null,

            bolsasGuardianes: null,
            bolsasBlanco: null,
            bolsasNegra: null,
            bolsasRoja: null,
            pretratamiento: null,
            almacenamientoDias: null,
            tratamiento: null,
            horaRoja: null,
            horaNegra: null,

            dotacionGenerador: null,
            dotacionPseg: null,
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

    // Funcion que convierte las cadenas de texto en horas, es importante contemplar que la cadena deberá ser en formato TIME HH:MI:SS
    stringToTime(timeStr: string): Date {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, seconds || 0, 0);
        return date;
    }

    // Validaciones para cada paso de los formularios
    validacionesPasos() : boolean {

        // Paso 0 o de datos generales
        if(this.current == 0) {
            if(
                this.formData.consultorio == null || 
                this.formData.fecha == null
            ) {
                return true;
            } 
        }

        // Paso 1 o de REGISTRO PROPIO DE PESOS
        // Validamos que todos los campos esten digitados
        // 05-08-2025 Se retiran condiciones
        // if(this.current == 1) {
        //     if(
        //         this.formData.aprovechablesBlanco == null ||
        //         this.formData.noAprovechablesNegra == null ||
        //         this.formData.biosanitariosRoja == null ||
        //         this.formData.cortopunzantesK == null ||
        //         this.formData.cortopunzantesNG == null ||
        //         this.formData.anatomopatologicos == null ||
        //         this.formData.farmacos == null ||
        //         this.formData.chatarraElectronica == null ||
        //         this.formData.pilas == null ||
        //         this.formData.quimicos == null ||
        //         this.formData.iluminarias == null ||
        //         this.formData.aceitesUsados == null 
        //     ) {
        //         return true;
        //     } 
        // }

        // Paso 2 o de las bolsas
        // Pendiente porque no se sin son obligatorias

        // Paso 3 o final : de confirmación
        if(this.current == 3) {
            if(
                this.formData.dotacionPseg == null || 
                this.formData.dotacionGenerador == null || 
                this.formData.firma == null
            ) {
                return true;
            }
        }
        
        return false;
    }

    cargarInfoUsuarioSesion() {
        this.datosUsuario = {
            "idEmpresa" : localStorage.getItem('idEmpresa'),
            "idRol" : localStorage.getItem('idRol')
        }
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

    // Procedimiento dinamico para asignar una clase y pintar el o los registros del dia
    rowClass(row: any): any {
        return this.registroDiaHoy.includes(row.id_registropeso) ? 'fila-hoy' : '';
    }

}