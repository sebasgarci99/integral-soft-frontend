import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import SignaturePad from 'signature_pad';

import { GestionPacientesService } from '../../services/gestion-pacientes/gestion-pacientes.service';
import { GestionPaciente, GestionPacienteConsentimiento, GestionPacienteHistorico } from '../../interfaces/gestion-pacientes';
import { ProcedimientoRiesgo } from '../../interfaces/gestion-pacientes';

import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule } from 'primeng/paginator';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TabMenuModule } from 'primeng/tabmenu';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { AccordionModule } from 'primeng/accordion';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
    selector: 'app-gestion-pacientes',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        InputTextarea,
        ToastModule,
        ConfirmDialogModule,
        PaginatorModule,
        FloatLabelModule,
        TabMenuModule,
        DropdownModule,
        RadioButtonModule,
        CalendarModule,
        CheckboxModule,
        TagModule,
        AccordionModule,
        ProgressSpinnerModule,
        MultiSelectModule
    ],
    templateUrl: './gestion-pacientes.component.html',
    styleUrl: './gestion-pacientes.component.css',
    providers: [MessageService, ConfirmationService]
})
export class GestionPacientesComponent implements OnInit {

    @ViewChild('firmaPad', { static: false }) firmaPadRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('firmaPadFull', { static: false }) firmaPadFullRef!: ElementRef<HTMLCanvasElement>;
    private firmaPad: SignaturePad | null = null;
    private firmaPadFull: SignaturePad | null = null;

    pacientes: GestionPaciente[] = [];
    tiposConsentimiento: { key: string; label: string; borrador: string; oficial: string }[] = [];
    consentimientos: GestionPacienteConsentimiento[] = [];
    historico: GestionPacienteHistorico[] = [];

    displayDialog = false;
    dialogTipoConsentimiento = false;
    dialogFirma = false;
    dialogHistorico = false;
    dialogBorrador = false;
    fullscreen = false;

    isEdit = false;
    firmaOK = false;
    citaModificada = false;

    activeItem: MenuItem | undefined;
    tabs: MenuItem[] = [
        { label: 'Datos básicos', icon: 'fa-solid fa-id-card', command: () => this.currentTab = 0 },
        { label: 'Cita', icon: 'fa-solid fa-calendar-check', command: () => this.currentTab = 1 },
        { label: 'Consentimientos', icon: 'fa-solid fa-file-signature', command: () => this.currentTab = 2 },
        { label: 'Histórico', icon: 'fa-solid fa-clock-rotate-left', command: () => this.currentTab = 3 }
    ];
    currentTab = 0;

    formData: any = {};
    tipoConsentimientoSeleccionado: any = null;
    aplicaAcudiente = false;
    acudiente = '';
    numDocAcudiente = '';
    correoBorrador = '';
    pacienteActivo: GestionPaciente | null = null;

    // Propiedades para CONSENTIMIENTO INFORMADO (Tab Consentimientos)
    tipoConsentimientoInfoSeleccionado: any = null;
    aplicaAcudienteInfo = false;
    nombreAcudienteInfo = '';
    tipoDocAcudienteInfo = '';
    numDocAcudienteInfo = '';
    ciudadDocAcudienteInfo = '';
    relacionAcudienteInfo = '';
    procedimientoRealizarInfo = '';
    firmaConsentimientoOK = false;
    firmaConsentimientoDataURL = '';
    cargandoBorrador = false;
    cargandoDocumento = false;
    cargandoReenvio = false;
    cargandoPdf = false;
    displayCorreoReenvio = false;
    correoReenvio = '';
    consentimientoReenvio: GestionPacienteConsentimiento | null = null;

    procedimientosDisponibles: ProcedimientoRiesgo[] = [];
    procedimientosSeleccionados: any[] = [];
    riesgosInfo = '';
    lugarProcedimientoInfo = '';

    tiposDocumento = [
        { label: 'C.C.', value: 'CC' },
        { label: 'T.I.', value: 'TI' },
        { label: 'R.C.', value: 'RC' },
        { label: 'Pasaporte', value: 'PA' },
        { label: 'P.P.T', value: 'PPT' },
        { label: 'Cédula de extranjería', value: 'CE' },
        { label: 'Certificado de nacimiento', value: 'CM' },
        { label: 'Adulto sin identificación', value: 'AS' },
        { label: 'Menor sin identificación', value: 'MS' },
        { label: 'Carné diplomático', value: 'CD' },
        { label: 'Salvoconducto de Permanencia', value: 'SC' },
        { label: 'Permiso especial de permanencia', value: 'PE' },
        { label: 'Documento de Extranjería', value: 'DE' }
    ];

    opcionesSexo = [
        { label: 'Femenino', value: 'F' },
        { label: 'Masculino', value: 'M' },
        { label: 'Otro', value: 'O' }
    ];

    opcionesSiNo = [
        { label: 'Sí', value: true },
        { label: 'No', value: false }
    ];

    local_espaniol = {
        firstDayOfWeek: 1,
        dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
        monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    };

    constructor(
        private gestionPacientesService: GestionPacientesService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) { }

    ngOnInit(): void {
        this.activeItem = this.tabs[0];
        this.cargarPacientes();
        this.cargarTiposConsentimiento();
    }

    cargarPacientes(): void {
        this.gestionPacientesService.obtenerPacientes().subscribe({
            next: (data) => { this.pacientes = data; },
            error: (err) => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pacientes.' }); }
        });
    }

    cargarTiposConsentimiento(): void {
        this.gestionPacientesService.obtenerTiposConsentimiento().subscribe({
            next: (data) => { this.tiposConsentimiento = data; },
            error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los tipos de consentimiento.' }); }
        });
    }

    abrirFormulario(item?: GestionPaciente): void {
        this.activeItem = this.tabs[0];
        this.currentTab = 0;
        this.isEdit = !!item;
        this.displayDialog = true;
        this.firmaOK = false;
        this.historico = [];

        if (item) {
            this.formData = { ...item };
            this.pacienteActivo = item;
            this.gestionPacientesService.obtenerPaciente(item.id_paciente).subscribe({
                next: (res) => {
                    this.historico = res.historico || [];
                    const p = res.paciente || {};
                    // Cargar la última cita para mostrarla en el campo de fecha
                    this.citaModificada = false;
                    if (p.fecha_ultima_cita) {
                        this.formData.fecha_cita = new Date(p.fecha_ultima_cita);
                    }
                    this.formData.fecha_ultima_cita = p.fecha_ultima_cita || null;
                    this.formData.id_ultima_cita = p.id_ultima_cita || 0;
                    this.formData.estado_ultima_cita = p.estado_ultima_cita || '';
                },
                error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el histórico.' }); }
            });
        } else {
            this.formData = { estado: 'A' };
            this.pacienteActivo = null;
        }
    }

    cerrar(): void {
        this.displayDialog = false;
        this.formData = {};
        this.currentTab = 0;
        this.activeItem = this.tabs[0];
        this.tipoConsentimientoInfoSeleccionado = null;
        this.aplicaAcudienteInfo = false;
        this.nombreAcudienteInfo = '';
        this.tipoDocAcudienteInfo = '';
        this.numDocAcudienteInfo = '';
        this.ciudadDocAcudienteInfo = '';
        this.relacionAcudienteInfo = '';
        this.procedimientoRealizarInfo = '';
        this.procedimientosSeleccionados = [];
        this.riesgosInfo = '';
        this.lugarProcedimientoInfo = '';
        this.firmaConsentimientoOK = false;
        this.firmaConsentimientoDataURL = '';
        this.cargandoBorrador = false;
        this.cargandoDocumento = false;
    }

    guardar(): void {
        if (!this.validarFormulario()) return;

        const payload = { ...this.formData };
        if (!this.citaModificada) {
            delete payload.fecha_cita;
        } else if (payload.fecha_cita) {
            payload.fecha_cita = this.formatearFechaLocal(payload.fecha_cita);
        }
        if (payload.fecha_nacimiento) {
            payload.fecha_nacimiento = this.formatearFechaNacimiento(payload.fecha_nacimiento);
        }

        const obs = this.isEdit
            ? this.gestionPacientesService.actualizarPaciente(payload)
            : this.gestionPacientesService.crearPaciente(payload);

        obs.subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.isEdit ? 'Paciente actualizado.' : 'Paciente creado.' });
                    this.displayDialog = false;
                    this.cargarPacientes();
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: String(res.msg || 'Error al guardar') });
                }
            },
            error: (err) => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar.' }); }
        });
    }

    inactivar(item: GestionPaciente): void {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Inactivar paciente',
            message: `¿Está seguro de inactivar al paciente <strong>${item.nombres} ${item.apellidos}</strong>?`,
            acceptLabel: 'Sí, Inactivar',
            rejectLabel: 'No',
            accept: () => {
                this.gestionPacientesService.inactivarPaciente(item.id_paciente).subscribe({
                    next: (res) => {
                        if (res.state === 'OK') {
                            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Paciente inactivado.' });
                            this.cargarPacientes();
                        } else {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: String(res.msg || 'Error al inactivar') });
                        }
                    },
                    error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al inactivar.' }); }
                });
            }
        });
    }

    validarFormulario(): boolean {
        if (!this.formData.nombres) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'El nombre es obligatorio.' });
            return false;
        }
        if (!this.formData.apellidos) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'El apellido es obligatorio.' });
            return false;
        }
        if (!this.formData.tipo_documento) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'El tipo de documento es obligatorio.' });
            return false;
        }
        if (!this.formData.numero_documento) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'El número de documento es obligatorio.' });
            return false;
        }
        if (!this.formData.fecha_nacimiento) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'La fecha de nacimiento es obligatoria.' });
            return false;
        }
        if (!this.formData.telefono_contacto) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'El teléfono es obligatorio.' });
            return false;
        }
        if (!this.formData.correo_electronico) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'El correo electrónico es obligatorio.' });
            return false;
        }
        return true;
    }

    formatearFechaLocal(date: any): string {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    formatearFechaNacimiento(date: any): string {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    }

    abrirBorradorDesdeFormulario(): void {
        if (!this.pacienteActivo || !this.formData.id_cita) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'No hay una cita activa para enviar borrador.' });
            return;
        }
        this.dialogBorrador = true;
        this.correoBorrador = this.formData.correo_electronico || '';
        this.tipoConsentimientoSeleccionado = null;
    }

    abrirBorrador(item: GestionPaciente): void {
        if (!item.id_cita) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'El paciente no tiene una cita activa para enviar borrador.' });
            return;
        }
        this.pacienteActivo = item;
        this.dialogBorrador = true;
        this.correoBorrador = item.correo_electronico || '';
        this.tipoConsentimientoSeleccionado = null;
    }

    enviarBorrador(): void {
        const paciente = this.pacienteActivo || (this.isEdit ? this.formData : null);
        if (!paciente || !paciente.id_cita || !this.tipoConsentimientoSeleccionado) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'Seleccione tipo de consentimiento y asegúrese de tener cita activa.' });
            return;
        }
        this.cargandoBorrador = true;
        this.gestionPacientesService.enviarBorrador(
            paciente.id_paciente,
            paciente.id_cita,
            this.tipoConsentimientoSeleccionado.key,
            this.correoBorrador
        ).subscribe({
            next: (res) => {
                this.cargandoBorrador = false;
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Borrador enviado correctamente.' });
                    this.dialogBorrador = false;
                    this.displayDialog = false;
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: String(res.msg || 'Error al enviar borrador') });
                }
            },
            error: () => {
                this.cargandoBorrador = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al enviar borrador.' });
            }
        });
    }

    abrirConsentimientoDesdeFormulario(): void {
        if (!this.pacienteActivo || !this.formData.id_cita) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'No hay una cita activa para generar consentimiento.' });
            return;
        }
        this.dialogTipoConsentimiento = true;
        this.tipoConsentimientoSeleccionado = null;
        this.aplicaAcudiente = false;
        this.acudiente = '';
        this.numDocAcudiente = '';
    }

    abrirConsentimiento(item: GestionPaciente): void {
        if (!item.id_cita) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'El paciente no tiene una cita activa para generar consentimiento.' });
            return;
        }
        this.pacienteActivo = item;
        this.dialogTipoConsentimiento = true;
        this.tipoConsentimientoSeleccionado = null;
        this.aplicaAcudiente = false;
        this.acudiente = '';
        this.numDocAcudiente = '';
    }

    confirmarTipoConsentimiento(): void {
        if (!this.tipoConsentimientoSeleccionado) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'Seleccione un tipo de consentimiento.' });
            return;
        }
        this.dialogTipoConsentimiento = false;
        this.fullscreen = true;
        this.firmaOK = false;
        setTimeout(() => this.initSignaturePad(), 100);
    }

    initSignaturePad(): void {
        const setupPad = (canvas: HTMLCanvasElement): SignaturePad => {
            const rect = canvas.getBoundingClientRect();
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            if (rect.width > 0 && rect.height > 0) {
                canvas.width = rect.width * ratio;
                canvas.height = rect.height * ratio;
            }
            const pad = new SignaturePad(canvas, {
                backgroundColor: 'rgb(250,250,250)',
                penColor: 'rgb(0,0,0)'
            });
            const ctx = canvas.getContext('2d');
            if (ctx && rect.width > 0) ctx.scale(ratio, ratio);
            return pad;
        };
        if (this.firmaPadRef?.nativeElement) {
            this.firmaPad = setupPad(this.firmaPadRef.nativeElement);
        }
        if (this.firmaPadFullRef?.nativeElement) {
            this.firmaPadFull = setupPad(this.firmaPadFullRef.nativeElement);
        }
    }

    guardarFirma(): void {
        if (this.firmaPad && !this.firmaPad.isEmpty()) {
            this.formData.firma_responsable = this.firmaPad.toDataURL('image/png');
            this.firmaOK = true;
        }
    }

    guardarFirmaFull(): void {
        if (this.firmaPadFull && !this.firmaPadFull.isEmpty()) {
            const dataURL = this.firmaPadFull.toDataURL('image/png');
            // Detectar si estamos en flujo consentimiento informado (nuevo) o tradicional
            if (this.tipoConsentimientoInfoSeleccionado?.key === 'consentimiento_informado') {
                this.firmaConsentimientoDataURL = dataURL;
                this.firmaConsentimientoOK = true;
                this.fullscreen = false;
            } else {
                this.formData.firma_responsable = dataURL;
                this.firmaPad?.fromDataURL(dataURL);
                this.firmaOK = true;
                this.fullscreen = false;
                this.dialogFirma = true;
            }
        }
    }

    limpiarFirma(): void {
        this.firmaPad?.clear();
        this.firmaOK = false;
    }

    limpiarFirmaFull(): void {
        this.firmaPadFull?.clear();
        if (this.tipoConsentimientoInfoSeleccionado?.key === 'consentimiento_informado') {
            this.firmaConsentimientoOK = false;
            this.firmaConsentimientoDataURL = '';
        } else {
            this.firmaOK = false;
        }
    }

    openFullscreen(): void {
        this.fullscreen = true;
        setTimeout(() => this.initSignaturePad(), 150);
    }

    closeFullscreen(): void {
        this.fullscreen = false;
        setTimeout(() => this.initSignaturePad(), 100);
    }

    generarConsentimiento(): void {
        if (!this.firmaOK || !this.formData.firma_responsable) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'Debe registrar y guardar la firma.' });
            return;
        }
        const paciente = this.pacienteActivo || (this.isEdit ? this.formData : null);
        if (!paciente || !paciente.id_cita) return;

        const datos = {
            nombre_acudiente: this.aplicaAcudiente ? this.acudiente : null,
            num_documento_acudiente: this.aplicaAcudiente ? this.numDocAcudiente : null,
            aplica_acudiente: this.aplicaAcudiente
        };

        this.gestionPacientesService.generarConsentimiento(
            paciente.id_paciente,
            paciente.id_cita,
            this.tipoConsentimientoSeleccionado.key,
            datos,
            this.formData.firma_responsable
        ).subscribe({
            next: (res: any) => {
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Consentimiento generado. Descargando PDF...' });
                    this.dialogFirma = false;
                    this.formData.firma_responsable = undefined;
                    this.firmaOK = false;
                    this.descargarPdfDesdeBase64(res.body.pdf_base64, `Consentimiento_${paciente.numero_documento}_${new Date().toISOString().split('T')[0]}.pdf`);
                    this.cargarPacientes();
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: String(res.msg || 'Error al generar consentimiento') });
                }
            },
            error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al generar consentimiento.' }); }
        });
    }

    // ========== MÉTODOS NUEVOS PARA CONSENTIMIENTO INFORMADO (Tab Consentimientos) ==========

    tipoConsentimientoCambio(): void {
        this.aplicaAcudienteInfo = false;
        this.nombreAcudienteInfo = '';
        this.tipoDocAcudienteInfo = '';
        this.numDocAcudienteInfo = '';
        this.ciudadDocAcudienteInfo = '';
        this.relacionAcudienteInfo = '';
        this.procedimientoRealizarInfo = '';
        this.procedimientosSeleccionados = [];
        this.riesgosInfo = '';
        this.lugarProcedimientoInfo = '';
        this.firmaConsentimientoOK = false;
        this.firmaConsentimientoDataURL = '';
        if (this.tipoConsentimientoInfoSeleccionado?.key === 'consentimiento_informado') {
            this.gestionPacientesService.obtenerProcedimientosRiesgos().subscribe({
                next: (data) => { this.procedimientosDisponibles = data; },
                error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar procedimientos.' }); }
            });
        }
    }

    onProcedimientosChange(): void {
        if (this.procedimientosSeleccionados && this.procedimientosSeleccionados.length > 0) {
            const riesgos = this.procedimientosSeleccionados
                .map((p: any) => p.riesgos)
                .filter((r: string) => r && r.trim() !== '')
                .join(', ');
            this.riesgosInfo = riesgos;
        } else {
            this.riesgosInfo = '';
        }
    }

    abrirFirmaConsentimiento(): void {
        if (!this.pacienteActivo || !this.formData.id_cita) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'No hay una cita activa para generar consentimiento.' });
            return;
        }
        if (this.aplicaAcudienteInfo && (!this.nombreAcudienteInfo || !this.tipoDocAcudienteInfo || !this.numDocAcudienteInfo || !this.relacionAcudienteInfo)) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'Complete todos los datos del acudiente.' });
            return;
        }
        if (!this.procedimientosSeleccionados || this.procedimientosSeleccionados.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'Seleccione al menos un procedimiento a realizar.' });
            return;
        }
        this.procedimientoRealizarInfo = this.procedimientosSeleccionados.map((p: any) => p.procedimiento).join(', ');
        this.fullscreen = true;
        this.firmaConsentimientoOK = false;
        this.firmaConsentimientoDataURL = '';
        setTimeout(() => this.initSignaturePad(), 100);
    }

    guardarFirmaConsentimiento(): void {
        if (this.firmaPadFull && !this.firmaPadFull.isEmpty()) {
            this.firmaConsentimientoDataURL = this.firmaPadFull.toDataURL('image/png');
            this.firmaConsentimientoOK = true;
            this.fullscreen = false;
        } else {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'Debe dibujar la firma antes de guardar.' });
        }
    }

    limpiarFirmaConsentimiento(): void {
        this.firmaPadFull?.clear();
        this.firmaConsentimientoOK = false;
        this.firmaConsentimientoDataURL = '';
    }

    generarConsentimientoInformado(): void {
        if (!this.firmaConsentimientoOK || !this.firmaConsentimientoDataURL) {
            this.messageService.add({ severity: 'warn', summary: 'IMPORTANTE', detail: 'Debe registrar y guardar la firma.' });
            return;
        }
        const paciente = this.pacienteActivo || (this.isEdit ? this.formData : null);
        if (!paciente || !paciente.id_cita) return;

        const datos = {
            aplica_acudiente: this.aplicaAcudienteInfo,
            nombre_acudiente: this.aplicaAcudienteInfo ? this.nombreAcudienteInfo : null,
            tipo_documento_acudiente: this.aplicaAcudienteInfo ? this.tipoDocAcudienteInfo : null,
            num_documento_acudiente: this.aplicaAcudienteInfo ? this.numDocAcudienteInfo : null,
            ciudad_documento_acudiente: this.aplicaAcudienteInfo ? this.ciudadDocAcudienteInfo : null,
            relacion_acudiente: this.aplicaAcudienteInfo ? this.relacionAcudienteInfo : null,
            procedimiento_realizar: this.procedimientoRealizarInfo,
            riesgos: this.riesgosInfo || null,
            lugar_procedimiento: this.lugarProcedimientoInfo || null
        };

        this.cargandoDocumento = true;
        this.gestionPacientesService.generarConsentimiento(
            paciente.id_paciente,
            paciente.id_cita,
            'consentimiento_informado',
            datos,
            this.firmaConsentimientoDataURL
        ).subscribe({
            next: (res: any) => {
                this.cargandoDocumento = false;
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Consentimiento informado generado. Descargando PDF...' });
                    this.firmaConsentimientoOK = false;
                    this.firmaConsentimientoDataURL = '';
                    this.descargarPdfDesdeBase64(res.body.pdf_base64, `Consentimiento_Informado_${paciente.numero_documento}_${new Date().toISOString().split('T')[0]}.pdf`);
                    this.cargarPacientes();
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: String(res.msg || 'Error al generar consentimiento') });
                }
            },
            error: () => {
                this.cargandoDocumento = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al generar consentimiento informado.' });
            }
        });
    }

    descargarPdfDesdeBase64(pdfBase64: string, nombreArchivo: string): void {
        const binaryStr = atob(pdfBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    abrirHistorico(item: GestionPaciente): void {
        this.pacienteActivo = item;
        this.dialogHistorico = true;
        this.consentimientos = [];
        this.historico = [];
        if (item.id_paciente) {
            this.gestionPacientesService.obtenerConsentimientos(item.id_paciente).subscribe({
                next: (data) => { this.consentimientos = data; },
                error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar consentimientos.' }); }
            });
            this.gestionPacientesService.obtenerPaciente(item.id_paciente).subscribe({
                next: (res) => { this.historico = res.historico || []; },
                error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar histórico.' }); }
            });
        }
    }

    reenviarConsentimiento(c: GestionPacienteConsentimiento): void {
        this.consentimientoReenvio = c;
        this.correoReenvio = this.pacienteActivo?.correo_electronico || '';
        this.displayCorreoReenvio = true;
    }

    confirmarReenvio(): void {
        this.displayCorreoReenvio = false;
        this.confirmService.confirm({
            icon: 'fa fa-paper-plane',
            header: 'Reenviar consentimiento',
            message: `¿Está seguro de reenviar el consentimiento de <strong>${this.consentimientoReenvio?.nombre_paciente}</strong> al correo: <strong>${this.correoReenvio}</strong>?`,
            acceptLabel: 'Sí, Reenviar',
            rejectLabel: 'No',
            accept: () => {
                this.cargandoReenvio = true;
                this.gestionPacientesService.reenviarConsentimiento(
                    this.consentimientoReenvio!.id_consentimiento!,
                    this.correoReenvio
                ).subscribe({
                    next: (res) => {
                        this.cargandoReenvio = false;
                        if (res.state === 'OK') {
                            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Consentimiento reenviado exitosamente.' });
                            this.dialogHistorico = false;
                        } else {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: res.msg || 'No se pudo reenviar el consentimiento.' });
                        }
                    },
                    error: () => {
                        this.cargandoReenvio = false;
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al reenviar consentimiento.' });
                    }
                });
            }
        });
    }

    descargarConsentimientoPdf(c: GestionPacienteConsentimiento): void {
        if (!c.id_consentimiento) return;
        this.cargandoPdf = true;
        this.gestionPacientesService.descargarConsentimientoById(c.id_consentimiento).subscribe({
            next: (res: any) => {
                this.cargandoPdf = false;
                if (res.state === 'OK') {
                    this.descargarPdfDesdeBase64(res.body.pdf_base64, res.body.nombre_archivo || `consentimiento_${c.id_consentimiento}.pdf`);
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: String(res.msg || 'Error al descargar') });
                }
            },
            error: () => {
                this.cargandoPdf = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al descargar PDF.' });
            }
        });
    }

    getNombreCompleto(p: GestionPaciente): string {
        return `${p.nombres || ''} ${p.apellidos || ''}`.trim();
    }

    getBadgeSeverity(estado: string): string {
        switch (estado) {
            case 'ACTIVA': return 'success';
            case 'CUMPLIDA': return 'info';
            case 'NO_CUMPLIDA': return 'warning';
            case 'CANCELADA': return 'danger';
            default: return 'secondary';
        }
    }
}
