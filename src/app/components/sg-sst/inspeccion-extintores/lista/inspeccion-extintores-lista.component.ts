import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { DropdownModule } from 'primeng/dropdown';
import { ClienteService } from '../../../../services/cliente/cliente.service';
import { SgSstEstandaresService } from '../../../../services/sg-sst-estandares/sg-sst-estandares.service';
import { Cliente } from '../../../../interfaces/cliente';
import { SgsstRegistro } from '../../../../interfaces/sgsst-estandar-registro';
import { EstandarGrupo, EstandarOpcion } from '../../../../interfaces/sg-sst-estandares';
import { buscarGrupo, buscarOpcion } from '../../../../data/sg-sst-estandares';

@Component({
    selector: 'app-sgsst-inspeccion-extintores-lista',
    standalone: true,
    imports: [CommonModule, FormsModule, DropdownModule],
    templateUrl: './inspeccion-extintores-lista.component.html',
    styleUrls: ['./inspeccion-extintores-lista.component.css', '../acciones-soft.css']
})
export class InspeccionExtintoresListaComponent implements OnInit, OnDestroy {

    private static readonly MESES = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    grupo: EstandarGrupo | null = null;
    opcion: EstandarOpcion | null = null;
    grupoId = '';
    opcionId = '';
    idCliente: number | null = null;
    cliente: Cliente | null = null;
    registros: SgsstRegistro[] = [];
    cargando = false;
    filtro = '';
    filtroEstado: 'todos' | 'borrador' | 'cerrada' = 'todos';
    readonly opcionesEstado = [
        { label: 'Todos los estados', value: 'todos' },
        { label: 'Cerradas', value: 'cerrada' },
        { label: 'Borradores', value: 'borrador' }
    ];

    private sub = new Subscription();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private clienteService: ClienteService,
        private estandaresService: SgSstEstandaresService
    ) {}

    ngOnInit(): void {
        window.scrollTo({ top: 0 });
        this.sub.add(
            combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, query]) => {
                this.grupoId = params.get('grupoId') || '';
                this.opcionId = params.get('opcionId') || '';
                this.grupo = buscarGrupo(this.grupoId) || null;
                this.opcion = buscarOpcion(this.grupoId, this.opcionId) || null;

                const queryCliente = Number(query.get('cliente'));
                const guardado = Number(localStorage.getItem('sgsst_idCliente'));
                this.idCliente = queryCliente || guardado || null;

                if (!this.grupo || !this.opcion || !this.idCliente) {
                    this.volverAlHub();
                    return;
                }

                this.cargar();
            })
        );
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    get esExtintores(): boolean {
        return this.opcionId === 'inspeccion-extintores';
    }

    get nombreCliente(): string {
        return this.cliente?.nombre_razon_social || 'Cliente';
    }

    get tituloOpcion(): string {
        return this.opcion?.nombre || 'Estándar';
    }

    get registrosFiltrados(): SgsstRegistro[] {
        const texto = this.filtro.trim().toLowerCase();
        return this.registros.filter(registro => {
            if (this.filtroEstado !== 'todos' && registro.estado !== this.filtroEstado) return false;
            if (!texto) return true;
            const contenido = `${this.mesLargo(registro.mes_registro)} ${registro.nombre_inspector || ''} ${registro.estado || ''}`.toLowerCase();
            return contenido.includes(texto);
        });
    }

    get totalExtintores(): number {
        return this.registros.reduce((total, registro) => total + (registro.total_extintores || 0), 0);
    }

    get totalFotos(): number {
        return this.registros.reduce((total, registro) => total + (registro.total_fotos || 0), 0);
    }

    get pesoTotal(): number {
        return this.registros.reduce((total, registro) => total + (registro.peso_bytes || 0), 0);
    }

    async cargar(): Promise<void> {
        await this.cargarCliente();
        if (!this.esExtintores) return;
        await this.cargarRegistros();
    }

    private async cargarCliente(): Promise<void> {
        if (!this.idCliente) return;
        try {
            const observable = await this.clienteService.obtenerDatosClientes();
            const clientes = await firstValueFrom(observable);
            this.cliente = (clientes || []).find(cliente => cliente.id_cliente === this.idCliente) || null;
        } catch {
            this.cliente = null;
        }
    }

    async cargarRegistros(): Promise<void> {
        if (!this.idCliente) return;
        this.cargando = true;
        try {
            const observable = await this.estandaresService.getRegistros(this.idCliente);
            this.registros = await firstValueFrom(observable) || [];
        } catch {
            this.registros = [];
            Swal.fire('Error', 'No se pudieron cargar las inspecciones.', 'error');
        } finally {
            this.cargando = false;
        }
    }

    nueva(): void {
        if (!this.esExtintores) {
            Swal.fire('En construcción', 'Esta opción del estándar aún no está disponible.', 'info');
            return;
        }
        this.router.navigate(
            ['/gestion-sg-sst/estandares', this.grupoId, this.opcionId, 'nuevo'],
            { queryParams: { cliente: this.idCliente } }
        );
    }

    editar(registro: SgsstRegistro): void {
        this.router.navigate(
            ['/gestion-sg-sst/estandares', this.grupoId, this.opcionId, 'editar', registro.id_registro],
            { queryParams: { cliente: this.idCliente } }
        );
    }

    async verPdf(registro: SgsstRegistro): Promise<void> {
        if (!registro.id_registro) return;
        try {
            const observable = await this.estandaresService.generarPdf(registro.id_registro);
            observable.subscribe({
                next: blob => this.descargarBlob(blob, registro),
                error: () => Swal.fire('Error', 'No se pudo generar el PDF.', 'error')
            });
        } catch {
            Swal.fire('Error', 'No se pudo generar el PDF.', 'error');
        }
    }

    async eliminar(registro: SgsstRegistro): Promise<void> {
        if (!registro.id_registro) return;
        const confirmacion = await Swal.fire({
            title: 'Eliminar inspección',
            text: `¿Confirmas eliminar la inspección de ${this.mesLargo(registro.mes_registro)}? Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626'
        });
        if (!confirmacion.isConfirmed) return;

        try {
            const observable = await this.estandaresService.eliminarRegistro(registro.id_registro);
            await firstValueFrom(observable);
            Swal.fire('Eliminada', 'La inspección fue eliminada.', 'success');
            await this.cargarRegistros();
        } catch {
            Swal.fire('Error', 'No se pudo eliminar la inspección.', 'error');
        }
    }

    volverAlHub(): void {
        this.router.navigate(['/gestion-sg-sst/sg-sst']);
    }

    mesLargo(mesISO?: string | null): string {
        if (!mesISO) return 'Sin mes';
        const partes = mesISO.split('-');
        const mes = Number(partes[1]);
        if (!partes[0] || !mes) return mesISO;
        return `${InspeccionExtintoresListaComponent.MESES[mes - 1] || ''} ${partes[0]}`;
    }

    fechaCorta(fecha?: string | null): string {
        if (!fecha) return '—';
        const partes = fecha.slice(0, 10).split('-');
        if (partes.length !== 3) return fecha;
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    formatearPeso(bytes?: number | null): string {
        if (!bytes) return '0 KB';
        if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
        return `${Math.round(bytes / 1024)} KB`;
    }

    private descargarBlob(blob: Blob, registro: SgsstRegistro): void {
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        const fecha = (registro.fecha_inspeccion || '').replace(/-/g, '');
        enlace.href = url;
        enlace.download = `Inspeccion_Extintores_${fecha || registro.id_registro}.pdf`;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        URL.revokeObjectURL(url);
    }
}
