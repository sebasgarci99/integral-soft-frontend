import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { firstValueFrom } from 'rxjs';
import {
    HcEntradaPrivada,
    HcHistoria,
    HcHistoriaDetalle,
    HcPacienteResumen,
    HcPermisos
} from '../../../interfaces/historias-clinicas';
import { HistoriasClinicasService } from '../../../services/historias-clinicas/historias-clinicas.service';
import { HcPrivacidadDialogComponent } from '../hc-privacidad-dialog/hc-privacidad-dialog.component';

interface FormularioHc {
    id_especialidad: number | null;
    fecha_atencion: string;
    tipo_registro: string;
    motivo: string;
    datos: Record<string, any>;
}

interface PrivadoForm {
    notas: string;
    salud_mental: string;
    salud_sexual: string;
    violencia: string;
}

@Component({
    selector: 'app-historia-clinica-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        CalendarModule,
        DropdownModule,
        FloatLabelModule,
        InputTextModule,
        InputTextarea,
        SelectButtonModule,
        Tabs,
        TabList,
        Tab,
        TabPanels,
        TabPanel,
        ProgressBarModule,
        AccordionModule,
        TagModule,
        ToastModule,
        TooltipModule,
        ConfirmDialogModule,
        HcPrivacidadDialogComponent
    ],
    templateUrl: './historia-clinica-form.component.html',
    styleUrl: './historia-clinica-form.component.css',
    providers: [MessageService, ConfirmationService]
})
export class HistoriaClinicaFormComponent implements OnInit {
    permisos: HcPermisos | null = null;
    paciente: HcPacienteResumen | null = null;
    historiasPaciente: HcHistoria[] = [];
    idPaciente: number | null = null;
    idHistoria: number | null = null;
    esEdicion = false;
    cargando = false;
    guardando = false;
    finalizando = false;
    accesoDenegado = false;

    step = 0;
    seccion: 'registro' | 'privado' = 'registro';
    readonly pasos = [
        'Datos generales',
        'Examen visual I',
        'Examen visual II',
        'Diagnóstico y plan',
        'Firma y cierre'
    ];

    tiposRegistro = [
        { label: 'Ingreso', value: 'INGRESO' },
        { label: 'Periódico', value: 'PERIODICO' },
        { label: 'Control', value: 'CONTROL' },
        { label: 'Egreso', value: 'EGRESO' }
    ];

    ishiharaOptions = [
        { label: 'Normal', value: 'Normal' },
        { label: 'Deficiencia leve', value: 'Deficiencia leve' },
        { label: 'Deficiencia moderada', value: 'Deficiencia moderada' },
        { label: 'No realizado', value: 'No realizado' }
    ];

    form: FormularioHc = {
        id_especialidad: null,
        fecha_atencion: new Date().toISOString().slice(0, 10),
        tipo_registro: 'INGRESO',
        motivo: '',
        datos: this.datosVacios()
    };

    privateDialogVisible = false;
    accessToken: string | null = null;
    privateEntries: HcEntradaPrivada[] = [];
    privateLoading = false;
    privateGuardando = false;
    privateForm: PrivadoForm = {
        notas: '',
        salud_mental: '',
        salud_sexual: '',
        violencia: ''
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private hcService: HistoriasClinicasService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    async ngOnInit(): Promise<void> {
        const idHistoria = Number(this.route.snapshot.paramMap.get('idHistoria'));
        const idPaciente = Number(this.route.snapshot.paramMap.get('idPaciente'));

        await this.cargarPermisos();

        if (Number.isFinite(idHistoria) && idHistoria > 0) {
            this.idHistoria = idHistoria;
            this.esEdicion = true;
            await this.cargarRegistro(idHistoria);
        } else if (Number.isFinite(idPaciente) && idPaciente > 0) {
            this.idPaciente = idPaciente;
            await this.cargarPaciente(idPaciente);
        } else {
            this.router.navigate(['/historias_clinicas']);
        }
    }

    private datosVacios(): Record<string, any> {
        return {
            antecedentes_visuales: '',
            av_vl_od: '',
            av_vl_oi: '',
            av_vl_ph: '',
            av_vc_od: '',
            av_vc_oi: '',
            av_vc_ph: '',
            examen_externo_od: '',
            examen_externo_oi: '',
            oftalmoscopia_od: '',
            oftalmoscopia_oi: '',
            estado_forico_vl: '',
            estado_forico_vc: '',
            ishihara: 'Normal',
            profundidad: '',
            refraccion_od: '',
            refraccion_oi: '',
            refraccion_add: '',
            diagnostico_od: '',
            diagnostico_oi: '',
            disposicion: '',
            observacion: '',
            control: ''
        };
    }

    async cargarPermisos(): Promise<void> {
        this.cargando = true;
        (await this.hcService.obtenerPermisos()).subscribe({
            next: permisos => {
                this.permisos = permisos;
                if (!permisos.habilitado) {
                    this.accesoDenegado = true;
                    this.cargando = false;
                    return;
                }
                if (!this.form.id_especialidad && permisos.especialidad_principal) {
                    this.form.id_especialidad = permisos.especialidad_principal.id_especialidad;
                }
                this.cargando = false;
            },
            error: () => {
                this.cargando = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron consultar los permisos.' });
            }
        });
    }

    async cargarPaciente(idPaciente: number): Promise<void> {
        this.cargando = true;
        (await this.hcService.obtenerHistoriasPaciente(idPaciente)).subscribe({
            next: response => {
                this.paciente = response.paciente;
                this.historiasPaciente = response.historias || [];
                this.idPaciente = response.paciente.id_paciente;
                this.cargando = false;
            },
            error: err => {
                this.cargando = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.msg || 'No se pudo cargar el paciente.' });
            }
        });
    }

    async cargarRegistro(idHistoria: number): Promise<void> {
        this.cargando = true;
        (await this.hcService.obtenerHistoriaById(idHistoria)).subscribe({
            next: async detalle => {
                const historia = detalle.historia;
                if (historia.estado !== 'BORRADOR') {
                    this.messageService.add({ severity: 'warn', summary: 'Registro finalizado', detail: 'El registro ya no se puede editar.' });
                    this.router.navigate(['/historias_clinicas/ver', historia.id_historia]);
                    return;
                }
                this.form = {
                    id_especialidad: historia.id_especialidad,
                    fecha_atencion: historia.fecha_atencion,
                    tipo_registro: historia.tipo_registro,
                    motivo: historia.motivo || '',
                    datos: { ...this.datosVacios(), ...(detalle.datos || {}) }
                };
                await this.cargarPaciente(historia.id_paciente);
                this.cargando = false;
            },
            error: err => {
                this.cargando = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.msg || 'No se pudo cargar el registro.' });
            }
        });
    }

    async cargarAntecedentes(): Promise<void> {
        const anterior = this.historiasPaciente.find(h => h.id_historia !== this.idHistoria);
        if (!anterior) {
            this.messageService.add({ severity: 'info', summary: 'Sin antecedentes', detail: 'No hay un registro anterior para traer antecedentes.' });
            return;
        }
        (await this.hcService.obtenerHistoriaById(anterior.id_historia)).subscribe({
            next: detalle => {
                this.form.datos['antecedentes_visuales'] = detalle.datos?.['antecedentes_visuales'] || '';
                this.messageService.add({ severity: 'success', summary: 'Antecedentes', detail: 'Se trajeron los antecedentes del registro anterior.' });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron traer los antecedentes.' })
        });
    }

    get progreso(): number {
        return Math.round(((this.step + 1) / this.pasos.length) * 100);
    }

    get nombreProfesional(): string {
        return this.permisos?.usuario?.nombre_completo || 'Profesional en sesión';
    }

    get registroProfesional(): string {
        return this.permisos?.especialidad_principal?.registro_profesional || '—';
    }

    get documentoProfesional(): string {
        return this.permisos?.especialidad_principal?.documento_profesional || this.permisos?.usuario?.documento || '—';
    }

    anterior(): void {
        if (this.step > 0) this.step--;
    }

    siguiente(): void {
        if (this.step === 0 && !String(this.form.motivo || '').trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el motivo', detail: 'Completa el motivo de consulta.' });
            return;
        }
        if (this.step < this.pasos.length - 1) this.step++;
    }

    async guardarBorrador(): Promise<void> {
        const id = await this.guardarRegistro();
        if (id) {
            this.messageService.add({ severity: 'success', summary: 'Borrador guardado', detail: 'Puedes continuar este registro después.' });
        }
    }

    async guardarRegistro(): Promise<number | null> {
        if (!this.idPaciente || !this.form.id_especialidad) {
            this.messageService.add({ severity: 'error', summary: 'Datos incompletos', detail: 'Selecciona paciente y especialidad.' });
            return null;
        }
        this.guardando = true;
        const payload = {
            id_paciente: this.idPaciente,
            id_especialidad: this.form.id_especialidad,
            fecha_atencion: this.form.fecha_atencion,
            tipo_registro: this.form.tipo_registro,
            motivo: this.form.motivo,
            diagnostico_principal: this.form.datos['diagnostico_od'] || '',
            datos: this.form.datos
        };
        try {
            if (this.idHistoria) {
                const response = await firstValueFrom(await this.hcService.actualizarRegistro(this.idHistoria, payload));
                this.guardando = false;
                if (response.state !== 'OK') {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: response.msg });
                    return null;
                }
                return this.idHistoria;
            }
            const response = await firstValueFrom(await this.hcService.crearRegistro(payload));
            this.guardando = false;
            if (response.state !== 'OK') {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: response.msg });
                return null;
            }
            this.idHistoria = response.body.id_historia;
            this.esEdicion = true;
            return this.idHistoria;
        } catch (error: any) {
            this.guardando = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: error?.error?.msg || 'No se pudo guardar el registro.' });
            return null;
        }
    }

    async finalizar(): Promise<void> {
        if (!String(this.form.motivo || '').trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el motivo', detail: 'Completa el motivo de consulta.' });
            this.step = 0;
            return;
        }
        this.finalizando = true;
        const id = await this.guardarRegistro();
        if (!id) {
            this.finalizando = false;
            return;
        }
        if (this.accessToken && this.privateFormTieneDatos()) {
            const guardadoPrivado = await this.guardarPrivadoSilencioso();
            if (!guardadoPrivado) {
                this.finalizando = false;
                return;
            }
        }
        (await this.hcService.finalizarRegistro(id)).subscribe({
            next: response => {
                this.finalizando = false;
                if (response.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Registro finalizado', detail: 'El registro se firmó y quedó bloqueado.' });
                    this.router.navigate(['/historias_clinicas/ver', id]);
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: response.msg });
                }
            },
            error: err => {
                this.finalizando = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.msg || 'No se pudo finalizar el registro.' });
            }
        });
    }

    async abrirDialogoPrivado(): Promise<void> {
        if (!this.idHistoria) {
            const id = await this.guardarRegistro();
            if (!id) return;
        }
        this.privateDialogVisible = true;
    }

    onAccesoConcedido(event: { access_token: string; id_paciente: number; id_historia: number | null }): void {
        this.accessToken = event.access_token;
        this.seccion = 'privado';
        this.cargarDatosPrivados();
    }

    async cargarDatosPrivados(): Promise<void> {
        if (!this.idPaciente || !this.idHistoria || !this.accessToken) return;
        this.privateLoading = true;
        (await this.hcService.obtenerDatosPrivados(this.idPaciente, this.idHistoria, this.accessToken)).subscribe({
            next: response => {
                this.privateEntries = response.entradas || [];
                const propia = this.privateEntries.find(e => e.es_creador && e.id_historia === this.idHistoria);
                if (propia?.datos) {
                    this.privateForm = {
                        notas: propia.datos['notas'] || '',
                        salud_mental: propia.datos['salud_mental'] || '',
                        salud_sexual: propia.datos['salud_sexual'] || '',
                        violencia: propia.datos['violencia'] || ''
                    };
                }
                this.privateLoading = false;
            },
            error: err => {
                this.privateLoading = false;
                this.accessToken = null;
                this.messageService.add({ severity: 'warn', summary: 'Acceso privado', detail: err?.error?.msg || 'El acceso privado expiró.' });
            }
        });
    }

    async guardarPrivado(): Promise<void> {
        const ok = await this.guardarPrivadoSilencioso();
        if (ok) {
            this.messageService.add({ severity: 'success', summary: 'Datos privados guardados', detail: 'La entrada privada quedó cifrada.' });
        }
    }

    private async guardarPrivadoSilencioso(): Promise<boolean> {
        if (!this.idPaciente || !this.idHistoria || !this.accessToken) {
            this.messageService.add({ severity: 'warn', summary: 'Acceso requerido', detail: 'Solicita y verifica el código antes de guardar.' });
            return false;
        }
        this.privateGuardando = true;
        try {
            const response = await firstValueFrom(await this.hcService.guardarDatosPrivados(
                this.idPaciente,
                this.idHistoria,
                this.accessToken,
                { ...this.privateForm }
            ));
            this.privateGuardando = false;
            if (response.state !== 'OK') {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: response.msg });
                return false;
            }
            await this.cargarDatosPrivados();
            return true;
        } catch (error: any) {
            this.privateGuardando = false;
            this.messageService.add({ severity: 'error', summary: 'Error', detail: error?.error?.msg || 'No se pudieron guardar los datos privados.' });
            return false;
        }
    }

    bloquearPrivado(): void {
        this.accessToken = null;
        this.privateEntries = [];
        this.messageService.add({ severity: 'info', summary: 'Datos privados bloqueados', detail: 'La información se ocultó de la pantalla.' });
    }

    private privateFormTieneDatos(): boolean {
        return !!(this.privateForm.notas || this.privateForm.salud_mental || this.privateForm.salud_sexual || this.privateForm.violencia);
    }

    irAHistoria(): void {
        if (this.idPaciente) {
            this.router.navigate(['/historias_clinicas/paciente', this.idPaciente]);
        } else {
            this.router.navigate(['/historias_clinicas']);
        }
    }

    formatoFecha(fecha: string | Date): string {
        if (!fecha) return '—';
        const valor = typeof fecha === 'string' && fecha.length === 10 ? `${fecha}T00:00:00` : fecha;
        return new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
}
