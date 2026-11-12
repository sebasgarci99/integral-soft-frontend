import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextarea } from 'primeng/inputtextarea';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { HcEntradaPrivada, HcHistoriaDetalle, HcPermisos } from '../../../interfaces/historias-clinicas';
import { HistoriasClinicasService } from '../../../services/historias-clinicas/historias-clinicas.service';
import { HcPrivacidadDialogComponent } from '../hc-privacidad-dialog/hc-privacidad-dialog.component';

@Component({
    selector: 'app-historia-clinica-ver',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        DialogModule,
        InputTextarea,
        TooltipModule,
        Tabs,
        TabList,
        Tab,
        TabPanels,
        TabPanel,
        HcPrivacidadDialogComponent
    ],
    templateUrl: './historia-clinica-ver.component.html',
    styleUrl: './historia-clinica-ver.component.css',
    providers: [MessageService, ConfirmationService]
})
export class HistoriaClinicaVerComponent implements OnInit {
    idHistoria: number | null = null;
    detalle: HcHistoriaDetalle | null = null;
    permisos: HcPermisos | null = null;
    cargando = false;
    activeTab = 0;

    privateDialogVisible = false;
    accessToken: string | null = null;
    privateEntries: HcEntradaPrivada[] = [];
    privateLoading = false;

    correccionVisible = false;
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
        this.route.params.subscribe(async params => {
            const id = Number(params['idHistoria']);
            this.idHistoria = Number.isFinite(id) && id > 0 ? id : null;
            this.detalle = null;
            this.accessToken = null;
            this.privateEntries = [];
            this.activeTab = 0;
            await this.cargarPermisos();
            if (!this.idHistoria) {
                this.router.navigate(['/historias_clinicas']);
                return;
            }
            this.cargarDetalle();
        });
    }

    async cargarPermisos(): Promise<void> {
        (await this.hcService.obtenerPermisos()).subscribe({
            next: permisos => { this.permisos = permisos; },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron consultar los permisos.' })
        });
    }

    async cargarDetalle(): Promise<void> {
        if (!this.idHistoria) return;
        this.cargando = true;
        (await this.hcService.obtenerHistoriaById(this.idHistoria)).subscribe({
            next: detalle => {
                this.detalle = detalle;
                this.cargando = false;
            },
            error: err => {
                this.cargando = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.msg || 'No se pudo cargar el registro.' });
            }
        });
    }

    get historia() {
        return this.detalle?.historia || null;
    }

    get datos() {
        return this.detalle?.datos || {};
    }

    get esRol1(): boolean {
        return Number(this.permisos?.rol) === 1;
    }

    get puedeCorregir(): boolean {
        return this.historia?.estado === 'FINALIZADA' && this.historia?.tipo_registro !== 'CORRECCION';
    }

    get puedeAnular(): boolean {
        return this.esRol1 && this.historia?.estado !== 'ANULADA';
    }

    volver(): void {
        if (this.historia) {
            this.router.navigate(['/historias_clinicas/paciente', this.historia.id_paciente]);
        } else {
            this.router.navigate(['/historias_clinicas']);
        }
    }

    async descargarPdf(tipo: 'PUBLICO' | 'PRIVADO'): Promise<void> {
        if (!this.historia) return;
        if (tipo === 'PRIVADO' && !this.accessToken) {
            this.messageService.add({ severity: 'warn', summary: 'Acceso privado', detail: 'Solicita acceso a los datos privados antes de generar este PDF.' });
            return;
        }
        (await this.hcService.generarPdfHistoria(this.historia.id_historia, tipo, this.accessToken || undefined)).subscribe({
            next: blob => this.guardarBlob(blob, `historia-clinica-${this.historia?.id_historia}.pdf`),
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el PDF.' })
        });
    }

    abrirCorreccion(): void {
        this.motivoCorreccion = '';
        this.correccionVisible = true;
    }

    async guardarCorreccion(): Promise<void> {
        if (!this.historia || !this.motivoCorreccion.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Falta el motivo', detail: 'Describe la corrección.' });
            return;
        }
        this.guardandoCorreccion = true;
        (await this.hcService.crearNotaCorreccion(this.historia.id_historia, this.motivoCorreccion.trim())).subscribe({
            next: response => {
                this.guardandoCorreccion = false;
                if (response.state === 'OK') {
                    this.correccionVisible = false;
                    this.messageService.add({ severity: 'success', summary: 'Corrección registrada', detail: 'El registro original no se modificó.' });
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

    anular(): void {
        if (!this.historia) return;
        this.confirmationService.confirm({
            message: '¿Deseas anular este registro? No se borrará, quedará marcado como ANULADO con auditoría.',
            header: 'Anular registro',
            icon: 'fa fa-triangle-exclamation',
            acceptLabel: 'Sí, anular',
            rejectLabel: 'Cancelar',
            accept: async () => {
                (await this.hcService.anularRegistro(this.historia!.id_historia, 'Anulación administrativa')).subscribe({
                    next: response => {
                        if (response.state === 'OK') {
                            this.messageService.add({ severity: 'success', summary: 'Registro anulado', detail: 'El registro quedó anulado.' });
                            this.cargarDetalle();
                        } else {
                            this.messageService.add({ severity: 'error', summary: 'Error', detail: response.msg });
                        }
                    },
                    error: err => this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.msg || 'No se pudo anular el registro.' })
                });
            }
        });
    }

    abrirDialogoPrivado(): void {
        this.privateDialogVisible = true;
    }

    onAccesoConcedido(event: { access_token: string; id_paciente: number; id_historia: number | null }): void {
        this.accessToken = event.access_token;
        this.activeTab = 1;
        this.cargarDatosPrivados();
    }

    async cargarDatosPrivados(): Promise<void> {
        if (!this.historia || !this.accessToken) return;
        this.privateLoading = true;
        (await this.hcService.obtenerDatosPrivados(this.historia.id_paciente, this.historia.id_historia, this.accessToken)).subscribe({
            next: response => {
                this.privateEntries = response.entradas || [];
                this.privateLoading = false;
            },
            error: err => {
                this.privateLoading = false;
                this.accessToken = null;
                this.messageService.add({ severity: 'warn', summary: 'Acceso privado', detail: err?.error?.msg || 'El acceso privado expiró.' });
            }
        });
    }

    bloquearPrivado(): void {
        this.accessToken = null;
        this.privateEntries = [];
        this.messageService.add({ severity: 'info', summary: 'Datos privados bloqueados', detail: 'La información se ocultó de la pantalla.' });
    }

    getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        if (estado === 'FINALIZADA') return 'success';
        if (estado === 'BORRADOR') return 'warn';
        if (estado === 'ANULADA') return 'danger';
        return 'info';
    }

    getTipoSeverity(tipo: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        if (tipo === 'CONTROL') return 'warn';
        if (tipo === 'CORRECCION') return 'danger';
        if (tipo === 'EGRESO') return 'success';
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
