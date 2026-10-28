import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { SgSstService } from '../../../services/sg-sst/sg-sst.service';
import { SgSstActividadCreada, SgSstPanel, SgSstTarea } from '../../../interfaces/sg-sst';

interface GrupoTareas {
    fecha: string;
    etiqueta: string;
    tareas: SgSstTarea[];
    esHoy: boolean;
    pendientes: number;
}

@Component({
    selector: 'app-sgsst-panel-dia',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './panel-dia.component.html',
    styleUrl: './panel-dia.component.css'
})
export class SgSstPanelDiaComponent implements OnChanges {

    @Input() fecha = '';
    @Input() idCliente: number | null = null;
    @Input() idTipoGrupo: number | null = null;
    @Output() datosActualizados = new EventEmitter<void>();

    panel: SgSstPanel | null = null;
    cargando = false;

    constructor(private sgSstService: SgSstService) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['fecha'] || changes['idCliente'] || changes['idTipoGrupo']) {
            this.cargar();
        }
    }

    get fechaLarga(): string {
        return this.parseFecha(this.fecha).toLocaleDateString('es-CO', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    get estadoBitacora(): string {
        if (!this.panel?.bitacora) return 'Sin iniciar';
        if (this.panel.bitacora.estado === 'cerrada') return 'Cerrada';
        if (this.panel.bitacora.estado === 'reabierta') return 'Reabierta';
        return 'En borrador';
    }

    get claseEstadoBitacora(): string {
        if (!this.panel?.bitacora) return 'pendiente';
        if (this.panel.bitacora.estado === 'cerrada') return 'cerrada';
        if (this.panel.bitacora.estado === 'reabierta') return 'reabierta';
        return 'borrador';
    }

    get actividadesCreadas(): SgSstActividadCreada[] {
        return this.panel?.actividades_creadas || [];
    }

    get totalTareas(): number {
        return this.panel?.tareas?.length || 0;
    }

    get tareasCompletadas(): number {
        return (this.panel?.tareas || []).filter(t => t.completada).length;
    }

    get gruposTareas(): GrupoTareas[] {
        const mapa = new Map<string, SgSstTarea[]>();
        (this.panel?.tareas || []).forEach(tarea => {
            const fecha = tarea.fecha || this.fecha;
            const lista = mapa.get(fecha) || [];
            lista.push(tarea);
            mapa.set(fecha, lista);
        });

        return Array.from(mapa.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([fecha, tareas]) => ({
                fecha,
                etiqueta: this.etiquetaFecha(fecha),
                tareas,
                esHoy: fecha === this.fecha,
                pendientes: tareas.filter(t => !t.completada).length
            }));
    }

    async cargar(): Promise<void> {
        if (!this.idCliente || !this.idTipoGrupo || !this.fecha) return;
        this.cargando = true;
        try {
            const observable = await this.sgSstService.getPanelDia(this.idCliente, this.idTipoGrupo, this.fecha);
            const res = await firstValueFrom(observable);
            this.panel = res.state === 'OK' ? res.body : null;
        } catch {
            this.panel = null;
        } finally {
            this.cargando = false;
        }
    }

    etiquetaFecha(fecha: string): string {
        if (!fecha) return '';
        if (fecha === this.fecha) return 'Hoy';
        const hoy = this.formatearISO(new Date());
        if (fecha === hoy) return 'Hoy';
        const diff = this.diferenciaDias(fecha, hoy);
        if (diff === 1) return 'Ayer';
        if (diff > 1 && diff <= 6) return `Hace ${diff} días`;

        const date = this.parseFecha(fecha);
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const anio = date.getFullYear() !== new Date().getFullYear() ? ` ${date.getFullYear()}` : '';
        return `${date.getDate()} De ${meses[date.getMonth()]}${anio}`;
    }

    formatearHora(hora?: string | null): string {
        if (!hora) return '';
        const [h, m] = hora.split(':').map(Number);
        const sufijo = h >= 12 ? 'PM' : 'AM';
        const hora12 = h % 12 === 0 ? 12 : h % 12;
        return `${hora12}:${String(m || 0).padStart(2, '0')} ${sufijo}`;
    }

    horaCreacion(actividad: SgSstActividadCreada): string {
        if (!actividad.createdAt) return '';
        const fecha = new Date(actividad.createdAt);
        return fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    }

    estadoActividad(estado: string): string {
        return estado === 'completada' ? 'Ejecutado' : 'Pendiente';
    }

    private diferenciaDias(desde: string, hasta: string): number {
        const a = this.parseFecha(desde).getTime();
        const b = this.parseFecha(hasta).getTime();
        return Math.round((b - a) / 86400000);
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
