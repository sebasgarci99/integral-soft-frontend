import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import SignaturePad from 'signature_pad';
import html2pdf from 'html2pdf.js';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { GestionPacientesService } from '../../services/gestion-pacientes/gestion-pacientes.service';
import { GestionPaciente, GestionPacienteConsentimiento, GestionPacienteHistorico } from '../../interfaces/gestion-pacientes';

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
import Swal from 'sweetalert2';

@Component({
    selector: 'app-gestion-pacientes',
    standalone: true,
    imports: [
        SidebarComponent,
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
        AccordionModule
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
        { label: 'Antecedentes médicos', icon: 'fa-solid fa-book-medical', command: () => this.currentTab = 2 },
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
        Swal.fire({
            title: '¿Inactivar?',
            text: '¿Está seguro de inactivar este paciente?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí',
            cancelButtonText: 'No'
        }).then((result) => {
            if (result.isConfirmed) {
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
        this.gestionPacientesService.enviarBorrador(
            paciente.id_paciente,
            paciente.id_cita,
            this.tipoConsentimientoSeleccionado.key,
            this.correoBorrador
        ).subscribe({
                next: (res) => {
                    if (res.state === 'OK') {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Borrador enviado correctamente.' });
                        this.dialogBorrador = false;
                        this.displayDialog = false;
                    } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: String(res.msg || 'Error al enviar borrador') });
                }
            },
            error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al enviar borrador.' }); }
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
            this.formData.firma_responsable = this.firmaPadFull.toDataURL('image/png');
            this.firmaPad?.fromDataURL(this.formData.firma_responsable);
            this.firmaOK = true;
            this.fullscreen = false;
            this.dialogFirma = true;
        }
    }

    limpiarFirma(): void {
        this.firmaPad?.clear();
        this.firmaOK = false;
    }

    limpiarFirmaFull(): void {
        this.firmaPadFull?.clear();
        this.firmaOK = false;
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
            next: (res) => {
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Consentimiento generado. Descargando PDF...' });
                    this.dialogFirma = false;
                    this.formData.firma_responsable = undefined;
                    this.firmaOK = false;
                    this.descargarPdf(res.body.html, `Consentimiento_${paciente.numero_documento}_${new Date().toISOString().split('T')[0]}.pdf`);
                    this.cargarPacientes();
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: String(res.msg || 'Error al generar consentimiento') });
                }
            },
            error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al generar consentimiento.' }); }
        });
    }

    descargarPdf(html: string, nombreArchivo: string): void {
        const container = document.createElement('div');
        container.innerHTML = html;
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '210mm';
        document.body.appendChild(container);

        const opt = {
            margin: 10,
            filename: nombreArchivo,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        html2pdf().set(opt).from(container).save().then(() => {
            document.body.removeChild(container);
        }).catch(() => {
            document.body.removeChild(container);
        });
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
        Swal.fire({
            title: 'Reenviar consentimiento',
            input: 'email',
            inputLabel: 'Correo electrónico',
            inputValue: this.pacienteActivo?.correo_electronico || '',
            showCancelButton: true,
            confirmButtonText: 'Enviar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed && result.value && c.id_consentimiento) {
                this.gestionPacientesService.reenviarConsentimiento(c.id_consentimiento, result.value).subscribe({
                    next: (res) => {
                        if (res.state === 'OK') {
                            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Consentimiento reenviado.' });
                            this.dialogHistorico = false;
                        } else {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: String(res.msg || 'Error al reenviar') });
                        }
                    },
                    error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al reenviar consentimiento.' }); }
                });
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
