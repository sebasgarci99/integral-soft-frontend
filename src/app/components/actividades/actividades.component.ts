import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ActividadesService } from '../../services/actividades/actividades.service';
import {
    Actividad,
    ActividadInstancia,
    RegistroCumplimiento,
    TipoActividad,
    Usuario
} from '../../interfaces/actividad';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HttpClientModule } from '@angular/common/http';

import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule } from 'primeng/paginator';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { InputTextarea } from 'primeng/inputtextarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TabMenuModule } from 'primeng/tabmenu';
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { BadgeModule } from 'primeng/badge';
import { TimelineModule } from 'primeng/timeline';
import { FileUploadModule } from 'primeng/fileupload';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-actividades',
    standalone: true,
    imports: [
        SidebarComponent,
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
        DropdownModule,
        InputNumberModule,
        CalendarModule,
        InputTextarea,
        RadioButtonModule,
        TabMenuModule,
        CheckboxModule,
        MultiSelectModule,
        BadgeModule,
        TimelineModule,
        FileUploadModule,
        TooltipModule
    ],
    templateUrl: './actividades.component.html',
    styleUrl: './actividades.component.css',
    providers: [MessageService, ConfirmationService]
})
export class ActividadesComponent implements OnInit {
    actividades: Actividad[] = [];
    instancias: ActividadInstancia[] = [];
    tiposActividad: TipoActividad[] = [];
    usuariosEmpresa: Usuario[] = [];
    cumplimientos: RegistroCumplimiento[] = [];

    rolUsuario: number = 0;
    horaActual: Date = new Date();

    fechaSeleccionada: Date = new Date();
    fechaMes: Date = new Date();

    displayDialog: boolean = false;
    displayDetalleDialog: boolean = false;
    displayIniciarDialog: boolean = false;
    displayFinalizarDialog: boolean = false;

    currentStep = 0;
    steps = [
        { label: 'Datos de la Actividad', command: () => this.currentStep = 0 },
        { label: 'Periodicidad', command: () => this.currentStep = 1 },
        { label: 'Invitados', command: () => this.currentStep = 2 }
    ];
    activeItem = this.steps[0];

    instanciaSeleccionada: ActividadInstancia | null = null;
    actividadEdicion: Actividad | null = null;

    formData: any = {
        titulo: '',
        descripcion: '',
        id_tipo_actividad: null,
        fecha_inicio: new Date(),
        fecha_fin: null,
        tipo_periodicidad: 'diaria',
        dias_semana: [],
        cada_n_dias: null,
        intervalo_semanas: 1,
        hora_default: '09:00',
        duracion_minutos: 60,
        invitados: []
    };

    formIniciar: any = {
        observaciones: ''
    };

    formFinalizar: any = {
        observaciones: '',
        evidencia: []
    };

    evidenciaFiles: any[] = [];

    nombreMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    nombreDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    diasCalendario: { dia: number; fecha: Date; esMesActual: boolean; instancias: ActividadInstancia[] }[] = [];

    opcionesPeriodicidad = [
        { label: 'Diaria', value: 'diaria' },
        { label: 'Semanal', value: 'semanal' },
        { label: 'Quincenal', value: 'quincenal' },
        { label: 'Mensual', value: 'mensual' },
        { label: 'Personalizada', value: 'personalizada' }
    ];

    diasSemanaOpciones = [
        { label: 'Lunes', value: 'L', shortcut: '1' },
        { label: 'Martes', value: 'M', shortcut: '2' },
        { label: 'Miércoles', value: 'X', shortcut: '3' },
        { label: 'Jueves', value: 'J', shortcut: '4' },
        { label: 'Viernes', value: 'V', shortcut: '5' },
        { label: 'Sábado', value: 'S', shortcut: '6' },
        { label: 'Domingo', value: 'D', shortcut: '7' }
    ];

    constructor(
        private actividadesService: ActividadesService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) { }

    ngOnInit(): void {
        this.rolUsuario = Number(localStorage.getItem('idRol'));
        this.horaActual = new Date();
        setInterval(() => {
            this.horaActual = new Date();
        }, 60000);

        this.cargarActividades();
        this.cargarTiposActividad();
        this.cargarUsuarios();
        this.generarCalendario();
        this.actualizarCalendario();
    }

    get esAdmin(): boolean {
        return this.rolUsuario === 1;
    }

    getHoraActual(): string {
        return this.horaActual.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }

    getFechaActual(): string {
        return this.horaActual.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    getEstadoActividad(instancia: ActividadInstancia): { label: string; class: string } {
        if (!this.esHoy(new Date(instancia.fecha))) {
            return { label: 'Pasada', class: 'badge bg-secondary' };
        }

        const ahora = this.horaActual;
        const [horaInicio, minutoInicio] = instancia.hora_inicio.split(':').map(Number);
        const [horaFin, minutoFin] = instancia.hora_fin.split(':').map(Number);

        const inicio = new Date();
        inicio.setHours(horaInicio, minutoInicio, 0, 0);

        const fin = new Date();
        fin.setHours(horaFin, minutoFin, 0, 0);

        if (ahora < inicio) {
            return { label: 'Por venir', class: 'badge bg-info' };
        } else if (ahora >= inicio && ahora <= fin) {
            return { label: 'En curso', class: 'badge bg-warning text-dark' };
        } else {
            return { label: 'Finalizada', class: 'badge bg-secondary' };
        }
    }

    generarCalendario(): void {
        const year = this.fechaMes.getFullYear();
        const month = this.fechaMes.getMonth();
        const primerDia = new Date(year, month, 1);
        const ultimoDia = new Date(year, month + 1, 0);
        const diaInicioSemana = primerDia.getDay();
        const diasMesAnterior = new Date(year, month, 0).getDate();

        this.diasCalendario = [];

        for (let i = diaInicioSemana - 1; i >= 0; i--) {
            const dia = diasMesAnterior - i;
            const fecha = new Date(year, month - 1, dia);
            this.diasCalendario.push({
                dia,
                fecha,
                esMesActual: false,
                instancias: this.getInstanciasPorFecha(fecha)
            });
        }

        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            const fecha = new Date(year, month, dia);
            this.diasCalendario.push({
                dia,
                fecha,
                esMesActual: true,
                instancias: this.getInstanciasPorFecha(fecha)
            });
        }

        const diasRestantes = 42 - this.diasCalendario.length;
        for (let dia = 1; dia <= diasRestantes; dia++) {
            const fecha = new Date(year, month + 1, dia);
            this.diasCalendario.push({
                dia,
                fecha,
                esMesActual: false,
                instancias: this.getInstanciasPorFecha(fecha)
            });
        }
    }

    getInstanciasPorFecha(fecha: Date): ActividadInstancia[] {
        const fechaStr = this.formatearFecha(fecha);
        return this.instancias.filter(inst => this.formatearFecha(inst.fecha) === fechaStr);
    }

    getNombreMesActual(): string {
        return this.nombreMeses[this.fechaMes.getMonth()] + ' ' + this.fechaMes.getFullYear();
    }

    mesAnterior(): void {
        this.fechaMes = new Date(this.fechaMes.getFullYear(), this.fechaMes.getMonth() - 1, 1);
        this.generarCalendario();
        this.actualizarCalendario();
    }

    mesSiguiente(): void {
        this.fechaMes = new Date(this.fechaMes.getFullYear(), this.fechaMes.getMonth() + 1, 1);
        this.generarCalendario();
        this.actualizarCalendario();
    }

    esHoy(fecha: Date): boolean {
        const hoy = new Date();
        return fecha.toDateString() === hoy.toDateString();
    }

    esFechaSeleccionada(fecha: Date): boolean {
        return fecha.toDateString() === this.fechaSeleccionada.toDateString();
    }

    seleccionarFecha(diaCalendario: any): void {
        if (!diaCalendario.esMesActual) return;
        this.fechaSeleccionada = diaCalendario.fecha;
        this.mostrarDetalleDia(diaCalendario.fecha);
    }

    cargarActividades(): void {
        this.actividadesService.getActividades().subscribe({
            next: (data) => {
                if (data.state == 'OK') {
                    this.actividades = data.body || [];
                }
            },
            error: (err) => {
                console.error('Error al cargar actividades:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las actividades.' });
            }
        });
    }

    cargarTiposActividad(): void {
        this.actividadesService.getTiposActividad().subscribe({
            next: (data) => {
                if (data.state === 'OK') {
                    this.tiposActividad = data.body || [];
                }
            },
            error: (err) => {
                console.error('Error al cargar tipos:', err);
            }
        });
    }

    cargarUsuarios(): void {
        this.actividadesService.getUsuariosEmpresa().subscribe({
            next: (data) => {
                if (data.body) {
                    this.usuariosEmpresa = data.body.map((u: any) => ({
                        id: u.id,
                        nombre_completo: u.nombre_completo,
                        usuario: u.usuario
                    }));
                }
            },
            error: (err) => {
                console.error('Error al cargar usuarios:', err);
            }
        });
    }

    async actualizarCalendario(): Promise<void> {
        const fechaInicio = new Date(this.fechaMes.getFullYear(), this.fechaMes.getMonth(), 1);
        const fechaFin = new Date(this.fechaMes.getFullYear(), this.fechaMes.getMonth() + 1, 0);

        await (await this.actividadesService.getActividadesCalendario(
            this.formatearFecha(fechaInicio),
            this.formatearFecha(fechaFin)
        )).subscribe({
            next: (data) => {
                if (data.state == 'OK') {
                    this.instancias = data.body || [];
                    this.generarCalendario();
                }
            },
            error: (err) => {
                console.error('Error al cargar calendario:', err);
            }
        });
    }

    onDateSelect(date: Date): void {
        this.fechaSeleccionada = date;
        this.mostrarDetalleDia(date);
    }

    async mostrarDetalleDia(fecha: Date): Promise<void> {
        const fechaStr = this.formatearFecha(fecha);
        const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

        (await this.actividadesService.getActividadesCalendario(
            this.formatearFecha(inicioMes),
            this.formatearFecha(finMes)
        )).subscribe({
            next: (data) => {
                if (data.state == 'OK') {
                    console.log(this.instancias);
                    this.instancias = (data.body || []).filter((inst: ActividadInstancia) =>
                        this.formatearFecha(inst.fecha) == fechaStr
                    );
                    if (this.instancias.length > 0) {
                        // Iniciamos el detalle de cumplimientos vacio por defecto
                        this.cumplimientos = [];
                        this.displayDetalleDialog = true;
                    }
                }
            },
            error: (err) => {
                console.error('Error:', err);
            }
        });
    }

    getInstanciasDelDia(fecha: Date): ActividadInstancia[] {
        const fechaStr = this.formatearFecha(fecha);
        return this.instancias.filter(inst => this.formatearFecha(inst.fecha) == fechaStr);
    }

    getBadgeSeverity(estado: string): string {
        switch (estado) {
            case 'completada': return 'success';
            case 'iniciada': return 'warning';
            case 'programada': return 'info';
            case 'cancelada': return 'danger';
            default: return 'info';
        }
    }

    getBadgeClass(estado: string): string {
        switch (estado) {
            case 'completada': return 'badge-completada';
            case 'iniciada': return 'badge-iniciada';
            case 'programada': return 'badge-programada';
            case 'cancelada': return 'badge-cancelada';
            default: return 'badge-programada';
        }
    }

    abrirFormulario(actividad?: Actividad): void {
        this.currentStep = 0;
        this.actividadEdicion = actividad || null;

        if (actividad) {
            this.formData = {
                id_actividad: actividad.id_actividad,
                titulo: actividad.titulo,
                descripcion: actividad.descripcion || '',
                id_tipo_actividad: actividad.id_tipo_actividad,
                fecha_inicio: new Date(actividad.fecha_inicio),
                fecha_fin: actividad.fecha_fin ? new Date(actividad.fecha_fin) : null,
                tipo_periodicidad: actividad.tipo_periodicidad || 'diaria',
                dias_semana: actividad.dias_semana ? actividad.dias_semana.split(',') : [],
                cada_n_dias: actividad.cada_n_dias,
                intervalo_semanas: actividad.intervalo_semanas || 1,
                hora_default: actividad.hora_default || '09:00',
                duracion_minutos: actividad.duracion_minutos || 60,
                invitados: actividad.invitados?.map(inv => inv.id_usuario) || []
            };
        } else {
            this.formData = {
                titulo: '',
                descripcion: '',
                id_tipo_actividad: null,
                fecha_inicio: new Date(),
                fecha_fin: null,
                tipo_periodicidad: 'diaria',
                dias_semana: [],
                cada_n_dias: null,
                intervalo_semanas: 1,
                hora_default: '09:00',
                duracion_minutos: 60,
                invitados: []
            };
        }

        this.displayDialog = true;
    }

    cerrarDialogo(): void {
        this.displayDialog = false;
        this.actividadEdicion = null;
    }

    abrirDetalleInstancia(instancia: ActividadInstancia): void {
        this.instanciaSeleccionada = instancia;
        this.cargarCumplimientos(instancia.id_actividad);
        this.displayDetalleDialog = true;
    }

    cargarCumplimientos(idInstancia: number): void {
        this.actividadesService.getCumplimiento(idInstancia, this.instanciaSeleccionada?.fecha, this.instanciaSeleccionada?.fecha).subscribe({
            next: (data) => {
                if (data.state === 'OK') {
                    this.cumplimientos = data.body || [];
                }
            },
            error: (err) => {
                console.error('Error al cargar cumplimientos:', err);
            }
        });
    }

    getCumplimientoInicio(): RegistroCumplimiento | undefined {
        return this.cumplimientos.find(c => c.tipo_registro === 'inicio');
    }

    getCumplimientoFin(): RegistroCumplimiento | undefined {
        return this.cumplimientos.find(c => c.tipo_registro === 'fin');
    }

    formatearFechaHora(fechaHora: string | Date): string {
        if (!fechaHora) return '';
        const date = fechaHora instanceof Date ? fechaHora : new Date(fechaHora);
        return date.toLocaleString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    abrirIniciarDialog(instancia: ActividadInstancia): void {
        this.instanciaSeleccionada = instancia;
        this.formIniciar = { observaciones: '' };
        this.displayIniciarDialog = true;
    }

    abrirFinalizarDialog(instancia: ActividadInstancia): void {
        this.instanciaSeleccionada = instancia;
        this.formFinalizar = { observaciones: '', evidencia: [] };
        this.evidenciaFiles = [];
        this.displayFinalizarDialog = true;
    }

    cerrarDetalleDialogo(): void {
        this.displayDetalleDialog = false;
        this.instanciaSeleccionada = null;
    }

    iniciarActividad(): void {
        if (!this.instanciaSeleccionada) return;

        this.actividadesService.iniciarActividad(
            this.instanciaSeleccionada.id_instancia,
            this.formIniciar.observaciones
        ).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Actividad iniciada correctamente.' });
                    this.displayIniciarDialog = false;
                    this.displayDetalleDialog = false;
                    this.actualizarCalendario();
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: res.body });
                }
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo iniciar la actividad.' });
            }
        });
    }

    finalizarActividad(): void {
        if (!this.instanciaSeleccionada) return;

        this.actividadesService.finalizarActividad(
            this.instanciaSeleccionada.id_instancia,
            this.formFinalizar.observaciones,
            this.formFinalizar.evidencia
        ).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Actividad finalizada correctamente.' });
                    this.displayFinalizarDialog = false;
                    this.displayDetalleDialog = false;
                    this.actualizarCalendario();
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: res.body });
                }
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo finalizar la actividad.' });
            }
        });
    }

    getHoraDefault(): string {
        const hora = this.formData.hora_default;
        if (!hora) return '09:00';

        if (hora instanceof Date) {
            return String(hora.getHours()).padStart(2, '0') + ':' + String(hora.getMinutes()).padStart(2, '0');
        }

        if (typeof hora === 'string') {
            return hora.substring(0, 5);
        }

        return '09:00';
    }

    guardarActividad(): void {
        if (!this.validarFormulario()) return;

        const dataToSend: any = {
            titulo: this.formData.titulo,
            descripcion: this.formData.descripcion,
            id_tipo_actividad: this.formData.id_tipo_actividad,
            fecha_inicio: this.obtenerFechaHoraActualFormatoIso(this.formData.fecha_inicio),
            fecha_fin: this.formData.fecha_fin ? this.obtenerFechaHoraActualFormatoIso(this.formData.fecha_fin) : null,
            tipo_periodicidad: this.formData.tipo_periodicidad,
            dias_semana: this.formData.dias_semana.join(','),
            cada_n_dias: this.formData.cada_n_dias,
            intervalo_semanas: this.formData.intervalo_semanas,
            hora_default: this.getHoraDefault(),
            duracion_minutos: this.formData.duracion_minutos,
            invitados: this.formData.invitados
        };

        if (this.actividadEdicion) {
            dataToSend.id_actividad = this.actividadEdicion.id_actividad;
            this.actividadesService.actualizarActividad(dataToSend).subscribe({
                next: (res) => {
                    if (res.state === 'OK') {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Actividad actualizada correctamente.' });
                        this.cargarActividades();
                        this.actualizarCalendario();
                        this.cerrarDialogo();
                    } else {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: res.body });
                    }
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la actividad.' });
                }
            });
        } else {
            this.actividadesService.crearActividad(dataToSend).subscribe({
                next: (res) => {
                    if (res.state === 'OK') {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Actividad creada correctamente.' });
                        this.cargarActividades();
                        this.actualizarCalendario();
                        this.cerrarDialogo();
                    } else {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: res.body });
                    }
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la actividad.' });
                }
            });
        }
    }

    eliminarActividad(id: number): void {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Eliminar actividad',
            message: '¿Estás seguro de eliminar esta actividad?',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.actividadesService.eliminarActividad(id).subscribe({
                    next: (res) => {
                        if (res.state === 'OK') {
                            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Actividad eliminada.' });
                            this.cargarActividades();
                            this.actualizarCalendario();
                        } else {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: res.body });
                        }
                    },
                    error: (err) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' });
                    }
                });
            }
        });
    }

    validarFormulario(): boolean {
        if (!this.formData.titulo || this.formData.titulo.trim() === '') {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'El título es requerido.' });
            return false;
        }
        if (!this.formData.fecha_inicio) {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'La fecha de inicio es requerida.' });
            return false;
        }
        if ((this.formData.tipo_periodicidad === 'semanal' || this.formData.tipo_periodicidad === 'personalizada')
            && (!this.formData.dias_semana || this.formData.dias_semana.length === 0)) {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione al menos un día de la semana.' });
            return false;
        }
        return true;
    }

    public obtenerFechaHoraActualFormatoIso(
        fecha: Date,
        hora?: Date // Opcional
    ): string {
        // Si el parametro de hora no se envia
        // tomamos el valor de la fecha
        hora = hora ?? fecha;

        // Construimos a pedal la fecha en formato ISO String
        // Ya que la función nativa nos cambia el UTC a 0
        let fechaActualConvertida: string =
            fecha.getFullYear()
            + '-' + String(fecha.getMonth() + 1).padStart(2, '0')
            + '-' + String(fecha.getDate()).padStart(2, '0')
            + 'T' +
            String(hora.getHours()).padStart(2, '0')
            + ':' + String(hora.getMinutes()).padStart(2, '0')
            + ':' + String(hora.getSeconds()).padStart(2, '0')
            ;

        return fechaActualConvertida;
    }

    // Funcion que convierte las cadenas de texto en horas, es importante contemplar que la cadena deberá ser en formato TIME HH:MI:SS
    stringToTime(timeStr: string): Date {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, seconds || 0, 0);
        return date;
    }

    formatearFecha(date: Date | string): string {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatearFechaVisual(fecha: string): string {
        if (!fecha) return '';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    formatearHora(hora: string): string {
        if (!hora) return '';
        return hora.substring(0, 5);
    }

    formatDateFull(date: Date): string {
        return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    nextStep(): void {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.activeItem = this.steps[this.currentStep];
        }
    }

    prevStep(): void {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.activeItem = this.steps[this.currentStep];
        }
    }

    onFileSelect(event: any): void {
        for (let file of event.files) {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                this.evidenciaFiles.push(file);
                this.formFinalizar.evidencia.push({
                    tipo: file.type,
                    url: file.name,
                    base64: base64,
                    descripcion: ''
                });
            };
            reader.readAsDataURL(file);
        }
    }

    descargarEvidencia(evidencia: any): void {
        if (!evidencia.base64) {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'La evidencia no es descargable.' });
            return;
        }
        const link = document.createElement('a');
        link.href = `data:${evidencia.tipo};base64,${evidencia.base64}`;
        link.download = evidencia.url;
        link.click();
    }

    removeFile(index: number): void {
        this.evidenciaFiles.splice(index, 1);
        this.formFinalizar.evidencia.splice(index, 1);
    }

    getUsuarioNombre(idUsuario: number): string {
        const usuario = this.usuariosEmpresa.find(u => u.id === idUsuario);
        return usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''} (@${usuario.usuario})` : `Usuario #${idUsuario}`;
    }
}
