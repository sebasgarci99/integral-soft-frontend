import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CalendarModule } from 'primeng/calendar';
import { Subscription } from 'rxjs';
import { TiposGrupoService } from '../../services/tipos-grupo/tipos-grupo.service';
import { TipoGrupo } from '../../interfaces/gestion-ph';
import { AgendaTodoComponent } from './agenda-todo/agenda-todo.component';
import { BitacoraDiariaComponent } from './bitacora-diaria/bitacora-diaria.component';
import { ProgramadorComponent } from './programador/programador.component';
import { TiposGruposComponent } from './tipos-grupos/tipos-grupos.component';

type TabGestionPh = 'agenda' | 'bitacora' | 'programador' | 'tipos-grupos';

const TABS_VALIDAS: TabGestionPh[] = ['agenda', 'bitacora', 'programador', 'tipos-grupos'];

@Component({
    selector: 'app-gestion-ph',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CalendarModule,
        AgendaTodoComponent,
        BitacoraDiariaComponent,
        ProgramadorComponent,
        TiposGruposComponent
    ],
    templateUrl: './gestion-ph.component.html',
    styleUrl: './gestion-ph.component.css'
})
export class GestionPhComponent implements OnInit, OnDestroy {

    tiposGrupo: TipoGrupo[] = [];
    idTipoGrupo: number | null = null;
    fecha: string = this.obtenerFechaHoy();
    fechaDate: Date = this.parseISO(this.fecha);
    tabActiva: TabGestionPh = 'agenda';
    cargandoGrupos = false;

    private sub: Subscription = new Subscription();

    constructor(
        private tiposGrupoService: TiposGrupoService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.sincronizarTabDesdeUrl();
        this.sub.add(
            this.route.paramMap.subscribe(params => {
                const tab = params.get('tab') as TabGestionPh | null;
                if (tab && TABS_VALIDAS.includes(tab)) {
                    this.tabActiva = tab;
                }
            })
        );
        this.cargarGrupos();
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    private sincronizarTabDesdeUrl(): void {
        const tab = this.route.snapshot.paramMap.get('tab') as TabGestionPh | null;
        if (tab && TABS_VALIDAS.includes(tab)) {
            this.tabActiva = tab;
        }
    }

    get nombreGrupoActual(): string {
        if (!this.idTipoGrupo) return 'TODOS LOS GRUPOS';
        const grupo = this.tiposGrupo.find(g => g.id_tipo_grupo === this.idTipoGrupo);
        return grupo ? `${grupo.codigo} - ${grupo.nombre}` : 'GRUPO ESPECÍFICO';
    }

    get fechaLarga(): string {
        const date = new Date(`${this.fecha}T00:00:00`);
        return date.toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    async cargarGrupos(): Promise<void> {
        this.cargandoGrupos = true;
        try {
            const respuesta = await this.tiposGrupoService.getTiposGrupo();
            respuesta.subscribe({
                next: (res) => {
                    if (res.state === 'OK') {
                        this.tiposGrupo = res.body || [];
                        if (this.idTipoGrupo && !this.tiposGrupo.some(g => g.id_tipo_grupo === this.idTipoGrupo)) {
                            this.idTipoGrupo = null;
                        }
                    }
                },
                error: () => { this.tiposGrupo = []; }
            });
        } finally {
            this.cargandoGrupos = false;
        }
    }

    cambiarTab(tab: TabGestionPh): void {
        this.tabActiva = tab;
        this.router.navigate(['/gestion_ph', tab]);
    }

    onFechaChange(fecha: string): void {
        this.fecha = fecha;
        this.fechaDate = this.parseISO(fecha);
    }

    /** Mantiene sincronizada la fecha cuando se selecciona en el calendario. */
    onFechaDate(date: Date | null): void {
        if (date) {
            this.fecha = this.formatearISO(date);
        }
    }

    onGrupoChange(valor: number | null): void {
        this.idTipoGrupo = (valor === null || valor === undefined) ? null : Number(valor);
    }

    private parseISO(fecha: string): Date {
        const [anio, mes, dia] = fecha.split('-').map(Number);
        return new Date(anio, mes - 1, dia);
    }

    private formatearISO(date: Date): string {
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const dia = String(date.getDate()).padStart(2, '0');
        return `${date.getFullYear()}-${mes}-${dia}`;
    }

    private obtenerFechaHoy(): string {
        return this.formatearISO(new Date());
    }
}
