import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextarea } from 'primeng/inputtextarea';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { HcEntradaPrivada, HcHistoria, HcPacienteResumen, HcPermisos } from '../../interfaces/historias-clinicas';
import { HistoriasClinicasService } from '../../services/historias-clinicas/historias-clinicas.service';
import { HcPrivacidadDialogComponent } from './hc-privacidad-dialog/hc-privacidad-dialog.component';

@Component({
    selector: 'app-historias-clinicas',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TableModule,
        ButtonModule,
        TagModule,
        TooltipModule,
        DialogModule,
        InputTextarea,
        ToastModule,
        ConfirmDialogModule,
        Tabs,
        TabList,
        Tab,
        TabPanels,
        TabPanel,
        HcPrivacidadDialogComponent
    ],
    templateUrl: './historias-clinicas.component.html',
    styleUrl: './historias-clinicas.component.css',
    providers: [MessageService, ConfirmationService]
})
export class HistoriasClinicasComponent implements OnInit {
    permisos: HcPermisos | null = null;
    idPaciente: number | null = null;
    paciente: HcPacienteResumen | null = null;
    historias: HcHistoria[] = [];
    cargando = false;
    accesoDenegado = false;
    abriendoRegistro = false;

    activeTab = 0;
    privateDialogVisible = false;
    accessToken: string | null = null;
    privateEntries: HcEntradaPrivada[] = [];
    privateLoading = false;
    mostrarInfo = false;

    correccionVisible = false;
    historiaCorreccion: HcHistoria | null = null;
    motivoCorreccion = '';
    guardandoCorreccion = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private hcService: HistoriasClinicasService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    async ngOnInit(): Promise<void> {
        this.route.params.subscribe(params => {
            const id = Number(params['idPaciente']);
            this.idPaciente = Number.isFinite(id) && id > 0 ? id : null;
            this.accessToken = null;
            this.privateEntries = [];
            this.activeTab = 0;
            this.cargarTodo();
        });
    }

    async cargarTodo(): Promise<void> {
        this.cargando = true;
        this.accesoDenegado = false;
        (await this.hcService.obtenerPermisos()).subscribe({
            next: permisos => {
                this.permisos = permisos;
                if (!permisos.habilitado) {
                    this.accesoDenegado = true;
                    this.cargando = false;
                    return;
                }
                this.cargarHistorias();
            },
            error: () => {
                this.cargando = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron consultar los permisos del módulo.' });
            }
        });
    }

    async cargarHistorias(): Promise<void> {
        if (!this.idPaciente) {
            this.cargando = false;
            return;
        }
        (await this.hcService.obtenerHistoriasPaciente(this.idPaciente)).subscribe({
            next: response => {
                this.paciente = response.paciente;
                this.historias = response.historias || [];
                this.cargando = false;
            },
            error: err => {
                this.cargando = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.msg || 'No se pudo cargar la historia clínica.' });
            }
        });
    }

    irAPacientes(): void {
        this.router.navigate(['/gestion_pacientes']);
    }

    nuevoRegistro(): void {
        if (!this.idPaciente || this.abriendoRegistro) return;
        const idPaciente = this.idPaciente;
        this.abriendoRegistro = true;
        setTimeout(() => {
            this.router.navigate(['/historias_clinicas/nuevo', idPaciente])
                .catch(() => { this.abriendoRegistro = false; });
        }, 320);
    }

    verRegistro(historia: HcHistoria): void {
        this.router.navigate(['/historias_clinicas/ver', historia.id_historia]);
    }

    editarBorrador(historia: HcHistoria): void {
        this.router.navigate(['/historias_clinicas/editar', historia.id_historia]);
    }

    async descargarPdf(historia: HcHistoria, tipo: 'PUBLICO' | 'PRIVADO' = 'PUBLICO'): Promise<void> {
        if (tipo === 'PRIVADO' && !this.accessToken) {
            this.messageService.add({ severity: 'warn', summary: 'Acceso privado', detail: 'Solicita acceso a los datos privados antes de generar este PDF.' });
            return;
        }
        (await this.hcService.generarPdfHistoria(historia.id_historia, tipo, this.accessToken || undefined)).subscribe({
            next: blob => this.guardarBlob(blob, `historia-clinica-${historia.id_historia}.pdf`),
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el PDF.' })
        });
    }

    abrirCorreccion(historia: HcHistoria): void {
        this.historiaCorreccion = historia;
        this.motivoCorreccion = '';
        this.correccionVisible = true;
    }

    async guardarCorreccion(): Promise<void> {
        if (!this.historiaCorreccion || !this.motivoCorreccion.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el motivo', detail: 'Describe la corrección.' });
            return;
        }
        this.guardandoCorreccion = true;
        (await this.hcService.crearNotaCorreccion(this.historiaCorreccion.id_historia, this.motivoCorreccion.trim())).subscribe({
            next: response => {
                this.guardandoCorreccion = false;
                if (response.state === 'OK') {
                    this.correccionVisible = false;
                    this.messageService.add({ severity: 'success', summary: 'Corrección registrada', detail: 'El registro original no se modificó.' });
                    this.cargarHistorias();
                    this.router.navigate(['/historias_clinicas/ver', response.body.id_historia]);
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: response.msg });
                }
            },
            error: err => {
                this.guardandoCorreccion = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.msg || 'No se pudo registrar la corrección.' });
            }
        });
    }

    abrirDialogoPrivado(): void {
        if (!this.idPaciente) return;
        this.privateDialogVisible = true;
    }

    onAccesoConcedido(event: { access_token: string; id_paciente: number; id_historia: number | null }): void {
        this.accessToken = event.access_token;
        this.activeTab = 1;
        this.cargarDatosPrivados();
    }

    async cargarDatosPrivados(): Promise<void> {
        if (!this.idPaciente || !this.accessToken) return;
        this.privateLoading = true;
        const idHistoria = this.historias[0]?.id_historia || null;
        (await this.hcService.obtenerDatosPrivados(this.idPaciente, idHistoria, this.accessToken)).subscribe({
            next: response => {
                this.privateEntries = response.entradas || [];
                this.privateLoading = false;
            },
            error: err => {
                this.privateLoading = false;
                this.accessToken = null;
                this.messageService.add({ severity: 'warn', summary: 'Acceso privado', detail: err?.error?.msg || 'El acceso privado expiró o no es válido.' });
            }
        });
    }

    bloquearPrivado(): void {
        this.accessToken = null;
        this.privateEntries = [];
        this.messageService.add({ severity: 'info', summary: 'Datos privados bloqueados', detail: 'La información se ocultó de la pantalla.' });
    }

    toggleInfo(): void {
        this.mostrarInfo = !this.mostrarInfo;
    }

    get idHistoriaPrivada(): number | null {
        return this.historias.length ? this.historias[0].id_historia : null;
    }

    get totalBorradores(): number {
        return this.historias.filter(h => h.estado === 'BORRADOR').length;
    }

    get totalFinalizadas(): number {
        return this.historias.filter(h => h.estado === 'FINALIZADA').length;
    }

    get totalCorrecciones(): number {
        return this.historias.filter(h => h.tipo_registro === 'CORRECCION').length;
    }

    getTipoIcon(tipo: string): string {
        const valor = String(tipo || '').toUpperCase();
        if (valor === 'INGRESO') return 'fa-sign-in-alt';
        if (valor === 'PERIODICO') return 'fa-repeat';
        if (valor === 'CONTROL') return 'fa-stethoscope';
        if (valor === 'EGRESO' || valor === 'SALIDA') return 'fa-sign-out-alt';
        if (valor === 'CORRECCION') return 'fa-file-medical';
        return 'fa-circle-info';
    }

    getEstadoIcon(estado: string): string {
        if (estado === 'FINALIZADA') return 'fa fa-circle-check';
        if (estado === 'BORRADOR') return 'fa fa-pen-to-square';
        if (estado === 'ANULADA') return 'fa fa-ban';
        return 'fa fa-circle-info';
    }

    getProfesional(historia: HcHistoria): string {
        const nombre = historia.profesional_nombre_snapshot
            || `${historia.usuario_nombre || ''} ${historia.usuario_apellido || ''}`.trim();
        return nombre || 'Sin profesional';
    }

    getIniciales(historia: HcHistoria): string {
        const partes = this.getProfesional(historia).split(/\s+/).filter(Boolean);
        if (!partes.length) return 'HC';
        if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
        return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    }

    getTipoSeverity(tipo: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        if (tipo === 'CONTROL' || tipo === 'Control') return 'warn';
        if (tipo === 'CORRECCION' || tipo === 'Corrección') return 'danger';
        if (tipo === 'EGRESO' || tipo === 'Egreso') return 'success';
        return 'info';
    }

    getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        if (estado === 'FINALIZADA') return 'success';
        if (estado === 'BORRADOR') return 'warn';
        if (estado === 'ANULADA') return 'danger';
        return 'info';
    }

    formatoFecha(fecha: string | Date): string {
        if (!fecha) return '—';
        const valor = typeof fecha === 'string' && fecha.length === 10 ? `${fecha}T00:00:00` : fecha;
        return new Date(valor).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    private guardarBlob(blob: Blob, nombre: string): void {
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombre;
        enlace.click();
        window.URL.revokeObjectURL(url);
    }
}
