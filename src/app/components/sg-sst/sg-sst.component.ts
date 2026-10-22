import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { Subscription, firstValueFrom } from 'rxjs';
import { ClienteService } from '../../services/cliente/cliente.service';
import { SgSstService } from '../../services/sg-sst/sg-sst.service';
import { Cliente } from '../../interfaces/cliente';
import { SgSstDiaDiligenciado, SgSstGrupo } from '../../interfaces/sg-sst';
import { SgSstPanelDiaComponent } from './panel-dia/panel-dia.component';
import { SgSstBitacoraComponent } from './bitacora/bitacora.component';
import { SgSstProgramadorComponent } from './programador/programador.component';
import { SgSstTiposGruposComponent } from './tipos-grupos/tipos-grupos.component';

type TabSgSst = 'panel' | 'bitacora' | 'programador' | 'tipos-grupos';

const TABS: TabSgSst[] = ['panel', 'bitacora', 'programador', 'tipos-grupos'];

interface DiaCalendario {
    fecha: string;
    dia: number;
    esMesActual: boolean;
    esHoy: boolean;
    esSeleccionado: boolean;
}

@Component({
    selector: 'app-sg-sst',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DropdownModule,
        SgSstPanelDiaComponent,
        SgSstBitacoraComponent,
        SgSstProgramadorComponent,
        SgSstTiposGruposComponent
    ],
    templateUrl: './sg-sst.component.html',
    styleUrl: './sg-sst.component.css'
})
export class SgSstComponent implements OnInit, OnDestroy {

    clientes: Cliente[] = [];
    grupos: SgSstGrupo[] = [];
    idCliente: number | null = null;
    idTipoGrupo: number | null = null;
    fecha: string = this.formatearISO(new Date());
    tabActiva: TabSgSst = 'panel';

    calendarioAbierto = false;
    mesCalendario: Date = new Date();
    diasCalendario: DiaCalendario[] = [];
    diasDiligenciados: SgSstDiaDiligenciado[] = [];

    cargandoClientes = false;
    cargandoGrupos = false;
    cargandoCalendario = false;

    private sub = new Subscription();

    constructor(
        private clienteService: ClienteService,
        private sgSstService: SgSstService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.sincronizarTab();
        this.sub.add(this.route.paramMap.subscribe(() => this.sincronizarTab()));
        this.cargarClientes();
        this.construirCalendario();
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    get clienteOpciones(): { id_cliente: number; label: string }[] {
        return this.clientes.map(c => ({
            id_cliente: c.id_cliente,
            label: `${c.tipo_identificacion} ${c.numero_identificacion} - ${c.nombre_razon_social}`
        }));
    }

    get grupoOpciones(): { id_tipo_grupo: number; label: string }[] {
        return this.grupos.map(g => ({
            id_tipo_grupo: g.id_tipo_grupo as number,
            label: `${g.codigo} - ${g.nombre}`
        }));
    }

    get nombreCliente(): string {
        const cliente = this.clientes.find(c => c.id_cliente === this.idCliente);
        return cliente?.nombre_razon_social || 'Sin cliente';
    }

    get nombreGrupo(): string {
        const grupo = this.grupos.find(g => g.id_tipo_grupo === this.idTipoGrupo);
        return grupo ? `${grupo.codigo} - ${grupo.nombre}` : 'Sin grupo';
    }

    get nombreMes(): string {
        return this.mesCalendario.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    }

    get fechaLarga(): string {
        return this.parseFecha(this.fecha).toLocaleDateString('es-CO', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    get contextoCompleto(): boolean {
        return !!this.idCliente && !!this.idTipoGrupo;
    }

    get contextoCliente(): boolean {
        return !!this.idCliente;
    }

    get tituloContexto(): string {
        return this.idCliente ? `${this.nombreCliente}` : 'Selecciona un cliente';
    }

    async cargarClientes(): Promise<void> {
        this.cargandoClientes = true;
        try {
            const observable = await this.clienteService.obtenerDatosClientes();
            const clientes = await firstValueFrom(observable);
            this.clientes = clientes || [];
        } catch {
            this.clientes = [];
        } finally {
            this.cargandoClientes = false;
        }
    }

    async cargarGrupos(): Promise<void> {
        if (!this.idCliente) {
            this.grupos = [];
            this.idTipoGrupo = null;
            return;
        }
        this.cargandoGrupos = true;
        try {
            const observable = await this.sgSstService.getGrupos(this.idCliente);
            const res = await firstValueFrom(observable);
            this.grupos = res.state === 'OK' ? (res.body || []) : [];
            if (this.idTipoGrupo && !this.grupos.some(g => g.id_tipo_grupo === this.idTipoGrupo)) {
                this.idTipoGrupo = null;
            }
        } catch {
            this.grupos = [];
            this.idTipoGrupo = null;
        } finally {
            this.cargandoGrupos = false;
        }
    }

    async onClienteChange(idCliente: number | null): Promise<void> {
        this.idCliente = idCliente ? Number(idCliente) : null;
        this.idTipoGrupo = null;
        this.diasDiligenciados = [];
        this.mesCalendario = new Date(this.parseFecha(this.fecha).getFullYear(), this.parseFecha(this.fecha).getMonth(), 1);
        await this.cargarGrupos();
        this.construirCalendario();
    }

    async onGrupoChange(idTipoGrupo: number | null): Promise<void> {
        this.idTipoGrupo = idTipoGrupo ? Number(idTipoGrupo) : null;
        await this.cargarDiasDiligenciados();
    }

    async cargarDiasDiligenciados(): Promise<void> {
        this.diasDiligenciados = [];
        if (!this.idCliente || !this.idTipoGrupo) {
            this.construirCalendario();
            return;
        }

        this.cargandoCalendario = true;
        try {
            const anio = this.mesCalendario.getFullYear();
            const mes = this.mesCalendario.getMonth() + 1;
            const observable = await this.sgSstService.getDiasDiligenciados(this.idCliente, this.idTipoGrupo, anio, mes);
            const res = await firstValueFrom(observable);
            this.diasDiligenciados = res.state === 'OK' ? (res.body || []) : [];
        } catch {
            this.diasDiligenciados = [];
        } finally {
            this.cargandoCalendario = false;
            this.construirCalendario();
        }
    }

    mesAnterior(): void {
        this.mesCalendario = new Date(this.mesCalendario.getFullYear(), this.mesCalendario.getMonth() - 1, 1);
        this.cargarDiasDiligenciados();
    }

    mesSiguiente(): void {
        this.mesCalendario = new Date(this.mesCalendario.getFullYear(), this.mesCalendario.getMonth() + 1, 1);
        this.cargarDiasDiligenciados();
    }

    toggleCalendario(): void {
        this.calendarioAbierto = !this.calendarioAbierto;
        if (this.calendarioAbierto && this.idCliente && this.idTipoGrupo) {
            this.cargarDiasDiligenciados();
        }
    }

    cerrarCalendario(): void {
        this.calendarioAbierto = false;
    }

    @HostListener('document:keydown.escape')
    onEscapeCalendario(): void {
        this.cerrarCalendario();
    }

    seleccionarFecha(dia: DiaCalendario): void {
        if (!dia.esMesActual) {
            this.mesCalendario = new Date(this.parseFecha(dia.fecha).getFullYear(), this.parseFecha(dia.fecha).getMonth(), 1);
            this.cargarDiasDiligenciados();
        }
        this.fecha = dia.fecha;
        this.cerrarCalendario();
        this.construirCalendario();
    }

    onFechaChange(fecha: string): void {
        if (!fecha) return;
        const nueva = this.parseFecha(fecha);
        this.fecha = fecha;
        this.cerrarCalendario();
        if (nueva.getFullYear() !== this.mesCalendario.getFullYear()
            || nueva.getMonth() !== this.mesCalendario.getMonth()) {
            this.mesCalendario = new Date(nueva.getFullYear(), nueva.getMonth(), 1);
            this.cargarDiasDiligenciados();
        } else {
            this.construirCalendario();
        }
    }

    informacionDia(fecha: string): SgSstDiaDiligenciado | undefined {
        return this.diasDiligenciados.find(d => d.fecha === fecha);
    }

    colorDia(dia: DiaCalendario): string {
        const info = this.informacionDia(dia.fecha);
        if (!info) return 'transparent';
        return info.estado === 'cerrada' ? '#16a34a' : '#f59e0b';
    }

    irHoy(): void {
        const hoy = new Date();
        this.fecha = this.formatearISO(hoy);
        this.mesCalendario = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.cerrarCalendario();
        this.cargarDiasDiligenciados();
    }

    cambiarTab(tab: TabSgSst): void {
        this.tabActiva = tab;
        this.router.navigate(['/gestion-sg-sst', tab]);
    }

    onDatosActualizados(): void {
        this.cargarDiasDiligenciados();
    }

    onGuardadoSilencioso(evento: { fecha: string; tieneResumen: boolean; estado: string }): void {
        const existente = this.diasDiligenciados.find(dia => dia.fecha === evento.fecha);

        if (evento.tieneResumen) {
            if (existente) {
                existente.tiene_resumen = true;
                existente.estado = evento.estado === 'cerrada' ? 'cerrada' : 'borrador';
            } else {
                this.diasDiligenciados = [
                    ...this.diasDiligenciados,
                    {
                        fecha: evento.fecha,
                        estado: evento.estado === 'cerrada' ? 'cerrada' : 'borrador',
                        tiene_resumen: true,
                        evidencias: 0,
                        tareas: 0
                    }
                ];
            }
            this.diasDiligenciados.sort((a, b) => a.fecha.localeCompare(b.fecha));
        } else if (existente && existente.evidencias === 0 && existente.tareas === 0) {
            this.diasDiligenciados = this.diasDiligenciados.filter(dia => dia.fecha !== evento.fecha);
        }

        this.construirCalendario();
    }

    onGruposCambiados(): void {
        this.cargarGrupos();
    }

    private sincronizarTab(): void {
        const tab = this.route.snapshot.paramMap.get('tab') as TabSgSst | null;
        if (tab && TABS.includes(tab)) {
            this.tabActiva = tab;
        }
    }

    private construirCalendario(): void {
        const anio = this.mesCalendario.getFullYear();
        const mes = this.mesCalendario.getMonth();
        const primerDia = new Date(anio, mes, 1);
        const ultimoDia = new Date(anio, mes + 1, 0);
        const offset = primerDia.getDay();
        const hoy = this.formatearISO(new Date());
        const dias: DiaCalendario[] = [];

        for (let i = offset; i > 0; i--) {
            dias.push(this.crearDia(new Date(anio, mes, 1 - i), false, hoy));
        }
        for (let d = 1; d <= ultimoDia.getDate(); d++) {
            dias.push(this.crearDia(new Date(anio, mes, d), true, hoy));
        }
        while (dias.length % 7 !== 0) {
            const ultimo = dias[dias.length - 1];
            const siguiente = this.parseFecha(ultimo.fecha);
            siguiente.setDate(siguiente.getDate() + 1);
            dias.push(this.crearDia(siguiente, false, hoy));
        }
        this.diasCalendario = dias;
    }

    private crearDia(fecha: Date, esMesActual: boolean, hoy: string): DiaCalendario {
        const iso = this.formatearISO(fecha);
        return {
            fecha: iso,
            dia: fecha.getDate(),
            esMesActual,
            esHoy: iso === hoy,
            esSeleccionado: iso === this.fecha
        };
    }

    private parseFecha(fecha: string): Date {
        const [anio, mes, dia] = fecha.split('-').map(Number);
        return new Date(anio, mes - 1, dia);
    }

    private formatearISO(date: Date): string {
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const dia = String(date.getDate()).padStart(2, '0');
        return `${date.getFullYear()}-${mes}-${dia}`;
    }
}
