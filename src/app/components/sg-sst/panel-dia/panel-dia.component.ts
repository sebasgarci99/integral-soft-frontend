import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { SgSstService } from '../../../services/sg-sst/sg-sst.service';
import { SgSstPanel } from '../../../interfaces/sg-sst';

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
        return this.panel.bitacora.estado === 'cerrada' ? 'Cerrada' : 'En borrador';
    }

    get claseEstadoBitacora(): string {
        if (!this.panel?.bitacora) return 'pendiente';
        return this.panel.bitacora.estado === 'cerrada' ? 'cerrada' : 'borrador';
    }

    get proximaActividad(): any | null {
        if (!this.panel) return null;
        return this.panel.instancias.find(i => i.estado !== 'completada') || null;
    }

    get tareasVencidas(): number {
        if (!this.panel) return 0;
        return this.panel.tareas.filter(t => !t.completada && !!t.fecha && t.fecha < this.fecha).length;
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

    estadoActividad(estado: string): string {
        return estado === 'completada' ? 'Ejecutado' : 'Pendiente';
    }

    formatearHora(hora?: string | null): string {
        if (!hora) return '';
        const [h, m] = hora.split(':').map(Number);
        const sufijo = h >= 12 ? 'PM' : 'AM';
        const hora12 = h % 12 === 0 ? 12 : h % 12;
        return `${hora12}:${String(m || 0).padStart(2, '0')} ${sufijo}`;
    }

    private parseFecha(fecha: string): Date {
        const [anio, mes, dia] = fecha.split('-').map(Number);
        return new Date(anio, mes - 1, dia);
    }
}
