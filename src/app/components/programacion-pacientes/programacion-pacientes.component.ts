import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextarea } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TabViewModule } from 'primeng/tabview';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { normalizarTelefono } from '../../utils/telefono.util';

import { ProgramacionPacientesService, CitaPaciente, PacienteBusqueda } from '../../services/programacion-pacientes/programacion-pacientes.service';

interface DiaCalendario {
    fecha: Date;
    numero: number;
    esMesActual: boolean;
    esHoy: boolean;
    esSeleccionado: boolean;
    tieneCitas: boolean;
}

@Component({
    selector: 'app-programacion-pacientes',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        CalendarModule,
        InputNumberModule,
        InputTextarea,
        CheckboxModule,
        DropdownModule,
        ToastModule,
        AutoCompleteModule,
        TabViewModule,
        ConfirmDialogModule,
        TooltipModule
    ],
    templateUrl: './programacion-pacientes.component.html',
    styleUrl: './programacion-pacientes.component.css',
    providers: [MessageService, ConfirmationService]
})
export class ProgramacionPacientesComponent implements OnInit {
    @ViewChild('timelineContainer') timelineContainer!: ElementRef;

    fechaActual = new Date();
    fechaSeleccionada = new Date();
    diasCalendario: DiaCalendario[] = [];
    citas: CitaPaciente[] = [];
    filteredPacientes: PacienteBusqueda[] = [];

    horasInicio = 7;
    horasFin = 21;
    hours: number[] = [];

    displayDialog = false;
    displayConfirmDialog = false;
    displayNuevoPacienteDialog = false;
    displayDetalleDialog = false;
    displayPreviewWhatsappDialog = false;
    displayConfigPlantillaDialog = false;

    esEdicion = false;
    citaEdicion: CitaPaciente | null = null;
    citaDetalle: CitaPaciente | null = null;

    previewWhatsappData: any = {
        id_cita: null,
        telefono: '',
        mensaje: ''
    };

    plantillaWhatsApp: string = 'Integral-Soft | Hola {nombre_paciente}, le recordamos su cita programada para el día {fecha} a la hora: {hora}. Feliz día.';

    formData: any = {
        id_paciente: null,
        pacienteSeleccionado: null,
        fecha_cita: new Date(),
        hora_inicio: '09:00',
        duracion_minutos: 60,
        tipo_cita: '',
        motivo: ''
    };

    confirmData = {
        enviar_correo: false,
        enviar_whatsapp: false
    };

    nuevoPaciente: any = {
        nombres: '',
        apellidos: '',
        tipo_documento: 'CC',
        numero_documento: '',
        fecha_nacimiento: null,
        sexo: '',
        telefono_contacto: '+57',
        correo_electronico: ''
    };

    tiposDocumento = [
        { label: 'Cédula', value: 'CC' },
        { label: 'TI', value: 'TI' },
        { label: 'CE', value: 'CE' },
        { label: 'Pasaporte', value: 'PAS' }
    ];

    sexoOptions = [
        { label: 'Femenino', value: 'F' },
        { label: 'Masculino', value: 'M' },
        { label: 'Otro', value: 'O' }
    ];

    constructor(
        private service: ProgramacionPacientesService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {
        this.generarHoras();
    }

    async ngOnInit() {
        this.generarCalendario();
        await this.cargarCitas();
        await this.cargarPlantillaWhatsApp();
    }

    async cargarPlantillaWhatsApp() {
        try {
            const obs = await this.service.obtenerPlantillaWhatsApp();
            obs.subscribe({
                next: (plantilla) => {
                    if (plantilla && plantilla.trim().length > 0) {
                        this.plantillaWhatsApp = plantilla;
                    }
                },
                error: () => {
                    // Se mantiene plantilla por defecto
                }
            });
        } catch (error) {
            // Se mantiene plantilla por defecto
        }
    }

    generarHoras() {
        this.hours = [];
        for (let h = this.horasInicio; h <= this.horasFin; h++) {
            this.hours.push(h);
        }
    }

    async cargarCitas() {
        try {
            const obs = await this.service.getCitasPacientes();
            obs.subscribe({
                next: (data) => {
                    this.citas = data || [];
                    this.generarCalendario();
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las citas.' });
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    generarCalendario() {
        const anio = this.fechaActual.getFullYear();
        const mes = this.fechaActual.getMonth();
        const primerDia = new Date(anio, mes, 1);
        const ultimoDia = new Date(anio, mes + 1, 0);
        const diaInicioSemana = primerDia.getDay();
        const diasMesAnterior = new Date(anio, mes, 0).getDate();

        this.diasCalendario = [];

        for (let i = diaInicioSemana - 1; i >= 0; i--) {
            const fecha = new Date(anio, mes - 1, diasMesAnterior - i);
            this.diasCalendario.push(this.crearDia(fecha, false));
        }

        for (let i = 1; i <= ultimoDia.getDate(); i++) {
            const fecha = new Date(anio, mes, i);
            this.diasCalendario.push(this.crearDia(fecha, true));
        }

        const totalCeldas = 42;
        const diasRestantes = totalCeldas - this.diasCalendario.length;
        for (let i = 1; i <= diasRestantes; i++) {
            const fecha = new Date(anio, mes + 1, i);
            this.diasCalendario.push(this.crearDia(fecha, false));
        }
    }

    crearDia(fecha: Date, esMesActual: boolean): DiaCalendario {
        const hoy = new Date();
        const esHoy = fecha.toDateString() === hoy.toDateString();
        const esSeleccionado = fecha.toDateString() === this.fechaSeleccionada.toDateString();
        const tieneCitas = this.citas.some(c => {
            if (!c.fecha_cita) return false;
            const fc = new Date(c.fecha_cita);
            return fc.toDateString() === fecha.toDateString();
        });

        return {
            fecha,
            numero: fecha.getDate(),
            esMesActual,
            esHoy,
            esSeleccionado,
            tieneCitas
        };
    }

    cambiarMes(delta: number) {
        this.fechaActual = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth() + delta, 1);
        this.generarCalendario();
    }

    seleccionarFecha(dia: DiaCalendario) {
        if (!dia.esMesActual) return;
        this.fechaSeleccionada = dia.fecha;
        this.generarCalendario();
    }

    getCitasDelDia(fecha: Date): CitaPaciente[] {
        return this.citas
            .filter(c => {
                if (!c.fecha_cita) return false;
                const fc = new Date(c.fecha_cita);
                return fc.toDateString() === fecha.toDateString();
            })
            .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));
    }

    getNombreMes(): string {
        return this.fechaActual.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    }

    formatHour(hour: number): string {
        const periodo = hour >= 12 ? 'PM' : 'AM';
        const hora12 = hour % 12 || 12;
        return `${hora12}:00 ${periodo}`;
    }

    convertirHoraADate(hora: string): Date {
        const [h, m] = hora.split(':').map(Number);
        const fecha = new Date();
        fecha.setHours(h, m, 0, 0);
        return fecha;
    }

    convertirDateAHora(date: Date): string {
        if (!date) return '09:00';
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    }

    getEventStyle(cita: CitaPaciente): any {
        const [hora, minuto] = (cita.hora_inicio || '09:00').split(':').map(Number);
        const inicioMinutos = (hora - this.horasInicio) * 60 + minuto;
        const duracion = cita.duracion_minutos || 60;
        const top = (inicioMinutos / 60) * 60;
        const height = (duracion / 60) * 60;

        let borderColor = '#3b82f6';
        let background = '#e8f4fd';

        if (cita.estado_cita === 'CANCELADA') {
            borderColor = '#6b7280';
            background = '#f3f4f6';
        } else if (cita.estado_cita === 'CUMPLIDA') {
            borderColor = '#10b981';
            background = '#d1fae5';
        }

        return {
            top: `${top}px`,
            height: `${height}px`,
            'background-color': background,
            'border-left-color': borderColor
        };
    }

    getClaseEstado(cita: CitaPaciente): string {
        if (cita.estado_cita === 'CANCELADA') return 'cita-event--cancelada';
        if (cita.estado_cita === 'CUMPLIDA') return 'cita-event--cumplida';
        return 'cita-event--programada';
    }

    abrirFormulario(cita?: CitaPaciente) {
        this.esEdicion = !!cita;
        this.citaEdicion = cita || null;

        if (cita) {
            this.formData = {
                id_cita: cita.id_cita,
                id_paciente: cita.id_paciente,
                pacienteSeleccionado: {
                    id_paciente: cita.id_paciente,
                    nombres: cita.nombre_paciente,
                    apellidos: '',
                    numero_documento: '',
                    telefono_contacto: cita.telefono_contacto,
                    correo_electronico: cita.correo_electronico
                },
                fecha_cita: new Date(cita.fecha_cita),
                hora_inicio: cita.hora_inicio || '09:00',
                hora_inicio_date: this.convertirHoraADate(cita.hora_inicio || '09:00'),
                duracion_minutos: cita.duracion_minutos || 60,
                tipo_cita: cita.tipo_cita || '',
                motivo: cita.motivo || ''
            };
        } else {
            this.formData = {
                id_paciente: null,
                pacienteSeleccionado: null,
                fecha_cita: new Date(this.fechaSeleccionada),
                hora_inicio: '09:00',
                hora_inicio_date: this.convertirHoraADate('09:00'),
                duracion_minutos: 60,
                tipo_cita: '',
                motivo: ''
            };
        }

        this.confirmData = { enviar_correo: false, enviar_whatsapp: false };
        this.displayDialog = true;
    }

    abrirFormularioDesdeHorario(hora: number) {
        this.esEdicion = false;
        this.citaEdicion = null;
        const horaStr = `${String(hora).padStart(2, '0')}:00`;
        this.formData = {
            id_paciente: null,
            pacienteSeleccionado: null,
            fecha_cita: new Date(this.fechaSeleccionada),
            hora_inicio: horaStr,
            hora_inicio_date: this.convertirHoraADate(horaStr),
            duracion_minutos: 60,
            tipo_cita: '',
            motivo: ''
        };
        this.confirmData = { enviar_correo: false, enviar_whatsapp: false };
        this.displayDialog = true;
    }

    async buscarPacientes(event: any) {
        const query = event.query;
        if (!query || query.length < 2) {
            this.filteredPacientes = [];
            return;
        }
        try {
            const obs = await this.service.getPacientesProgramacion(query);
            obs.subscribe({
                next: (data) => {
                    this.filteredPacientes = data.map(p => ({
                        ...p,
                        nombre_completo: `${p.nombres} ${p.apellidos} - ${p.numero_documento}`
                    }));
                },
                error: () => {
                    this.filteredPacientes = [];
                }
            });
        } catch (error) {
            this.filteredPacientes = [];
        }
    }

    seleccionarPaciente(event: any) {
        if (event && event.id_paciente) {
            this.formData.id_paciente = event.id_paciente;
            this.formData.pacienteSeleccionado = event;
        }
    }

    onPacienteChange(event: any) {
        this.formData.pacienteSeleccionado = event;
        if (event && event.id_paciente) {
            this.formData.id_paciente = event.id_paciente;
        } else {
            this.formData.id_paciente = null;
        }
    }

    abrirNuevoPaciente() {
        this.nuevoPaciente = {
            nombres: '',
            apellidos: '',
            tipo_documento: 'CC',
            numero_documento: '',
            fecha_nacimiento: null,
            sexo: '',
            telefono_contacto: '+57',
            correo_electronico: ''
        };
        this.displayNuevoPacienteDialog = true;
    }

    async guardarNuevoPaciente() {
        if (!this.validarNuevoPaciente()) return;

        this.nuevoPaciente.telefono_contacto = normalizarTelefono(this.nuevoPaciente.telefono_contacto);

        try {
            const obs = await this.service.crearPacienteRapido(this.nuevoPaciente);
            obs.subscribe({
                next: (res: any) => {
                    if (res.state === 'OK') {
                        const paciente: PacienteBusqueda = {
                            id_paciente: res.body.id_paciente,
                            nombres: this.nuevoPaciente.nombres,
                            apellidos: this.nuevoPaciente.apellidos,
                            numero_documento: this.nuevoPaciente.numero_documento,
                            telefono_contacto: this.nuevoPaciente.telefono_contacto,
                            correo_electronico: this.nuevoPaciente.correo_electronico,
                            nombre_completo: `${this.nuevoPaciente.nombres} ${this.nuevoPaciente.apellidos} - ${this.nuevoPaciente.numero_documento}`
                        };
                        this.formData.pacienteSeleccionado = paciente;
                        this.formData.id_paciente = paciente.id_paciente;
                        this.displayNuevoPacienteDialog = false;
                        this.messageService.add({ severity: 'success', summary: 'Paciente creado', detail: 'El paciente fue creado correctamente.' });
                    } else {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: res.body || 'No se pudo crear el paciente.' });
                    }
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear el paciente.' });
                }
            });
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear el paciente.' });
        }
    }

    validarNuevoPaciente(): boolean {
        if (!this.nuevoPaciente.nombres || !this.nuevoPaciente.apellidos || !this.nuevoPaciente.numero_documento ||
            !this.nuevoPaciente.fecha_nacimiento || !this.nuevoPaciente.sexo) {
            this.messageService.add({ severity: 'warn', summary: 'Campos incompletos', detail: 'Complete los campos obligatorios del paciente.' });
            return false;
        }
        return true;
    }

    confirmarGuardar() {
        if (!this.validarFormulario()) return;

        const paciente = this.formData.pacienteSeleccionado;
        this.confirmData.enviar_correo = !!paciente.correo_electronico;
        this.confirmData.enviar_whatsapp = !!paciente.telefono_contacto;

        this.displayConfirmDialog = true;
    }

    validarFormulario(): boolean {
        const paciente = this.formData.pacienteSeleccionado;
        const idPaciente = this.formData.id_paciente || paciente?.id_paciente;

        if (!idPaciente || !paciente) {
            this.messageService.add({ severity: 'warn', summary: 'Paciente requerido', detail: 'Seleccione o cree un paciente.' });
            return false;
        }

        this.formData.id_paciente = idPaciente;

        if (!this.formData.fecha_cita || !this.formData.hora_inicio) {
            this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Fecha y hora son requeridas.' });
            return false;
        }
        return true;
    }

    async guardarCita() {
        this.displayConfirmDialog = false;

        const fecha = new Date(this.formData.fecha_cita);
        const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
        const horaInicio = this.convertirDateAHora(this.formData.hora_inicio_date);

        const data = {
            id_paciente: this.formData.id_paciente,
            fecha_cita: fechaStr,
            hora_inicio: horaInicio,
            duracion_minutos: this.formData.duracion_minutos || 60,
            tipo_cita: this.formData.tipo_cita,
            motivo: this.formData.motivo,
            enviar_correo: this.confirmData.enviar_correo
        };

        try {
            if (this.esEdicion && this.citaEdicion?.id_cita) {
                const obs = await this.service.actualizarCita({ ...data, id_cita: this.citaEdicion.id_cita });
                obs.subscribe({
                    next: (res: any) => {
                        if (res.state === 'OK') {
                            this.messageService.add({ severity: 'success', summary: 'Cita actualizada', detail: 'La cita fue actualizada correctamente.' });
                            this.displayDialog = false;
                            this.cargarCitas();
                        } else {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: res.body || 'No se pudo actualizar la cita.' });
                        }
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar la cita.' });
                    }
                });
            } else {
                const obs = await this.service.crearCita(data);
                obs.subscribe({
                    next: (res: any) => {
                        if (res.state === 'OK') {
                            this.messageService.add({ severity: 'success', summary: 'Cita creada', detail: 'La cita fue creada correctamente.' });
                            this.displayDialog = false;
                            this.cargarCitas();
                            if (this.confirmData.enviar_whatsapp) {
                                this.abrirPreviewWhatsapp(res.body?.id_cita);
                            }
                        } else {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: res.body || 'No se pudo crear la cita.' });
                        }
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear la cita.' });
                    }
                });
            }
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar la cita.' });
        }
    }

    abrirDetalle(cita: CitaPaciente) {
        this.citaDetalle = cita;
        this.displayDetalleDialog = true;
    }

    notificarWhatsAppDesdeTabla(cita: CitaPaciente, event: Event) {
        event.stopPropagation();
        this.abrirPreviewWhatsapp(cita.id_cita, cita);
    }

    cancelarCita() {
        if (!this.citaDetalle?.id_cita) return;

        this.confirmationService.confirm({
            message: '¿Está seguro de cancelar esta cita?',
            header: 'Confirmar cancelación',
            icon: 'fas fa-exclamation-triangle',
            accept: async () => {
                const obs = await this.service.cancelarCita(this.citaDetalle!.id_cita!);
                obs.subscribe({
                    next: (res: any) => {
                        if (res.state === 'OK') {
                            this.messageService.add({ severity: 'success', summary: 'Cita cancelada', detail: 'La cita fue cancelada correctamente.' });
                            this.displayDetalleDialog = false;
                            this.cargarCitas();
                        } else {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: res.body || 'No se pudo cancelar.' });
                        }
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cancelar la cita.' });
                    }
                });
            }
        });
    }

    marcarCumplida() {
        if (!this.citaDetalle?.id_cita) return;

        this.confirmationService.confirm({
            message: '¿Marcar esta cita como cumplida?',
            header: 'Confirmar',
            icon: 'fas fa-check-circle',
            accept: async () => {
                const obs = await this.service.marcarCitaCumplida(this.citaDetalle!.id_cita!);
                obs.subscribe({
                    next: (res: any) => {
                        if (res.state === 'OK') {
                            this.messageService.add({ severity: 'success', summary: 'Cita cumplida', detail: 'La cita fue marcada como cumplida.' });
                            this.displayDetalleDialog = false;
                            this.cargarCitas();
                        } else {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: res.body || 'No se pudo marcar.' });
                        }
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al marcar la cita.' });
                    }
                });
            }
        });
    }

    abrirPreviewWhatsapp(idCita?: number, cita?: CitaPaciente) {
        const paciente = cita
            ? {
                id_paciente: cita.id_paciente,
                nombres: cita.nombre_paciente?.split(' ')[0] || '',
                apellidos: cita.nombre_paciente?.split(' ').slice(1).join(' ') || '',
                telefono_contacto: cita.telefono_contacto,
                correo_electronico: cita.correo_electronico
            }
            : this.formData.pacienteSeleccionado;

        if (!paciente?.telefono_contacto) {
            this.messageService.add({ severity: 'warn', summary: 'Sin teléfono', detail: 'El paciente no tiene número de contacto.' });
            return;
        }

        const idCitaReal = idCita || cita?.id_cita;
        if (!idCitaReal) {
            this.messageService.add({ severity: 'warn', summary: 'Sin cita', detail: 'No se encontró el identificador de la cita.' });
            return;
        }

        const fecha = cita
            ? new Date(cita.fecha_cita).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : new Date(this.formData.fecha_cita).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const hora = cita ? cita.hora_inicio : this.formData.hora_inicio;
        const nombrePaciente = `${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim();

        const mensaje = this.plantillaWhatsApp
            .replace(/{nombre_paciente}/g, nombrePaciente)
            .replace(/{fecha}/g, fecha)
            .replace(/{hora}/g, hora || '')
            .replace(/{empresa}/g, 'Integral-Soft');

        let telefono = normalizarTelefono(paciente.telefono_contacto).replace(/^\+/, '');

        this.previewWhatsappData = {
            id_cita: idCitaReal,
            telefono,
            mensaje
        };

        this.displayPreviewWhatsappDialog = true;
    }

    abrirWhatsAppWebDesdePreview() {
        this.displayPreviewWhatsappDialog = false;

        const { telefono, mensaje, id_cita } = this.previewWhatsappData;
        const mensajeEncoded = encodeURIComponent(mensaje);

        const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const url = esMovil
            ? `https://wa.me/${telefono}?text=${mensajeEncoded}`
            : `https://web.whatsapp.com/send?phone=${telefono}&text=${mensajeEncoded}`;

        const ancho = 650;
        const alto = 750;
        const izquierda = (window.screen.width - ancho) / 2;
        const arriba = (window.screen.height - alto) / 2;

        const ventana = window.open(
            url,
            'whatsappWeb',
            `width=${ancho},height=${alto},top=${arriba},left=${izquierda},toolbar=no,location=no,status=no,menubar=no`
        );

        if (ventana) {
            const intervalo = setInterval(() => {
                if (ventana.closed) {
                    clearInterval(intervalo);
                    this.registrarNotificacionWhatsApp(id_cita);
                }
            }, 1000);
        }
    }

    async registrarNotificacionWhatsApp(idCita: number) {
        try {
            const obs = await this.service.registrarNotificacionWhatsApp(idCita);
            obs.subscribe({
                next: (res: any) => {
                    if (res.state === 'OK') {
                        this.cargarCitas();
                    }
                },
                error: () => {
                    // Se ignora el error para no interrumpir la experiencia
                }
            });
        } catch (error) {
            // Se ignora el error para no interrumpir la experiencia
        }
    }

    async guardarPlantillaWhatsApp() {
        if (!this.plantillaWhatsApp || this.plantillaWhatsApp.trim().length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Plantilla vacía', detail: 'Ingrese una plantilla válida.' });
            return;
        }

        try {
            const obs = await this.service.guardarPlantillaWhatsApp(this.plantillaWhatsApp.trim());
            obs.subscribe({
                next: (res: any) => {
                    if (res.state === 'OK') {
                        this.messageService.add({ severity: 'success', summary: 'Plantilla guardada', detail: 'La plantilla de WhatsApp fue actualizada.' });
                        this.displayConfigPlantillaDialog = false;
                    } else {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: res.body || 'No se pudo guardar la plantilla.' });
                    }
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar la plantilla.' });
                }
            });
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar la plantilla.' });
        }
    }

    abrirConfigPlantillaWhatsApp() {
        this.displayConfigPlantillaDialog = true;
    }

    abrirWhatsAppWeb() {
        const paciente = this.formData.pacienteSeleccionado;
        if (!paciente?.telefono_contacto) return;

        let telefono = normalizarTelefono(paciente.telefono_contacto).replace(/^\+/, '');

        const nombrePaciente = `${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim();
        const fecha = this.formData.fecha_cita
            ? new Date(this.formData.fecha_cita).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : '';
        const hora = this.formData.hora_inicio || '';

        const mensaje = this.plantillaWhatsApp
            .replace(/{nombre_paciente}/g, nombrePaciente)
            .replace(/{fecha}/g, fecha)
            .replace(/{hora}/g, hora)
            .replace(/{empresa}/g, 'Integral-Soft');
        const mensajeEncoded = encodeURIComponent(mensaje);

        const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const url = esMovil
            ? `https://wa.me/${telefono}?text=${mensajeEncoded}`
            : `https://web.whatsapp.com/send?phone=${telefono}&text=${mensajeEncoded}`;

        window.open(url, '_blank');
    }

    get puedeEnviarCorreo(): boolean {
        const paciente = this.formData.pacienteSeleccionado;
        return !!paciente?.correo_electronico;
    }

    get puedeEnviarWhatsapp(): boolean {
        const paciente = this.formData.pacienteSeleccionado;
        return !!paciente?.telefono_contacto;
    }

    get diaSeleccionadoTexto(): string {
        return this.fechaSeleccionada.toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}
