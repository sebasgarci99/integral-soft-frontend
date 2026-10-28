import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { firstValueFrom } from 'rxjs';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';
import { SgSstService } from '../../../services/sg-sst/sg-sst.service';
import { Cliente } from '../../../interfaces/cliente';
import { SgSstGrupo, SgSstReportePreview } from '../../../interfaces/sg-sst';

@Component({
    selector: 'app-sgsst-reportes',
    standalone: true,
    imports: [CommonModule, FormsModule, DropdownModule, CalendarModule],
    templateUrl: './reportes.component.html',
    styleUrl: './reportes.component.css'
})
export class SgSstReportesComponent implements OnInit, OnChanges {

    @Input() clientes: Cliente[] = [];
    @Input() idCliente: number | null = null;
    @Input() idTipoGrupo: number | null = null;
    @Input() nombreCliente = '';
    @Output() clienteChange = new EventEmitter<number | null>();

    grupos: SgSstGrupo[] = [];
    filtroGrupo: number | null = null;
    fechaInicio = '';
    fechaFin = '';
    fechaInicioDate: Date | null = null;
    fechaFinDate: Date | null = null;
    preview: SgSstReportePreview | null = null;

    cargandoGrupos = false;
    cargandoPreview = false;
    generandoPdf = false;
    generandoDocx = false;

    constructor(private sgSstService: SgSstService) {}

    ngOnInit(): void {
        this.inicializarFechas();
        this.filtroGrupo = this.idTipoGrupo;
        this.cargarGrupos();
        this.actualizarPreview();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['idCliente'] && !changes['idCliente'].firstChange) {
            this.filtroGrupo = this.idTipoGrupo;
            this.cargarGrupos();
            this.actualizarPreview();
        }
        if (changes['idTipoGrupo'] && !changes['idTipoGrupo'].firstChange) {
            this.filtroGrupo = this.idTipoGrupo;
            this.actualizarPreview();
        }
    }

    get clientesOpciones(): { id_cliente: number; label: string }[] {
        return this.clientes
            .filter(cliente => cliente.estado !== 'I')
            .map(cliente => ({
                id_cliente: cliente.id_cliente,
                label: `${cliente.tipo_identificacion} ${cliente.numero_identificacion} - ${cliente.nombre_razon_social}`
            }));
    }

    get gruposOpciones(): { id_tipo_grupo: number | null; label: string }[] {
        return [
            { id_tipo_grupo: null, label: 'Todos los grupos' },
            ...this.grupos
                .filter(grupo => grupo.estado !== 'I')
                .map(grupo => ({
                    id_tipo_grupo: grupo.id_tipo_grupo ?? null,
                    label: `${grupo.codigo} - ${grupo.nombre}`
                }))
        ];
    }

    get rangoValido(): boolean {
        return !!this.fechaInicio && !!this.fechaFin && this.fechaInicio <= this.fechaFin;
    }

    get etiquetaGrupo(): string {
        if (this.filtroGrupo) {
            const grupo = this.grupos.find(g => g.id_tipo_grupo === this.filtroGrupo);
            return grupo ? `${grupo.codigo} - ${grupo.nombre}` : 'Grupo seleccionado';
        }
        return 'Todos los grupos';
    }

    async cargarGrupos(): Promise<void> {
        if (!this.idCliente) {
            this.grupos = [];
            return;
        }
        this.cargandoGrupos = true;
        try {
            const observable = await this.sgSstService.getGrupos(this.idCliente);
            const res = await firstValueFrom(observable);
            this.grupos = res.state === 'OK' ? (res.body || []) : [];
        } catch {
            this.grupos = [];
        } finally {
            this.cargandoGrupos = false;
        }
    }

    async actualizarPreview(): Promise<void> {
        if (!this.idCliente || !this.rangoValido) {
            this.preview = null;
            return;
        }
        this.cargandoPreview = true;
        try {
            const observable = await this.sgSstService.getReportePreview(
                this.idCliente, this.filtroGrupo, this.fechaInicio, this.fechaFin
            );
            const res = await firstValueFrom(observable);
            this.preview = res.state === 'OK' ? res.body : null;
        } catch {
            this.preview = null;
        } finally {
            this.cargandoPreview = false;
        }
    }

    onClienteChange(idCliente: number | null): void {
        this.filtroGrupo = null;
        this.grupos = [];
        this.preview = null;
        this.clienteChange.emit(idCliente ? Number(idCliente) : null);
    }

    onFechaInicioChange(fecha: Date | null): void {
        this.fechaInicioDate = fecha;
        this.fechaInicio = fecha ? this.formatearISO(fecha) : '';
        this.onFiltroChange();
    }

    onFechaFinChange(fecha: Date | null): void {
        this.fechaFinDate = fecha;
        this.fechaFin = fecha ? this.formatearISO(fecha) : '';
        this.onFiltroChange();
    }

    onFiltroChange(): void {
        this.actualizarPreview();
    }

    aplicarRango(tipo: 'hoy' | 'semana' | 'mes' | 'mes-anterior'): void {
        const hoy = new Date();
        if (tipo === 'hoy') {
            this.fechaInicio = this.formatearISO(hoy);
            this.fechaFin = this.formatearISO(hoy);
        } else if (tipo === 'semana') {
            const dia = hoy.getDay();
            const offset = dia === 0 ? -6 : 1 - dia;
            const inicio = new Date(hoy);
            inicio.setDate(hoy.getDate() + offset);
            const fin = new Date(inicio);
            fin.setDate(inicio.getDate() + 6);
            this.fechaInicio = this.formatearISO(inicio);
            this.fechaFin = this.formatearISO(fin);
        } else if (tipo === 'mes') {
            this.fechaInicio = this.formatearISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
            this.fechaFin = this.formatearISO(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
        } else {
            this.fechaInicio = this.formatearISO(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1));
            this.fechaFin = this.formatearISO(new Date(hoy.getFullYear(), hoy.getMonth(), 0));
        }
        this.fechaInicioDate = this.parseFechaISO(this.fechaInicio);
        this.fechaFinDate = this.parseFechaISO(this.fechaFin);
        this.actualizarPreview();
    }

    async generar(tipo: 'pdf' | 'docx'): Promise<void> {
        if (!this.idCliente || !this.rangoValido) {
            Swal.fire('Filtros incompletos', 'Selecciona un rango de fechas válido.', 'warning');
            return;
        }
        if (tipo === 'pdf' ? this.generandoPdf : this.generandoDocx) return;

        if (tipo === 'pdf') this.generandoPdf = true;
        else this.generandoDocx = true;

        try {
            const observable = tipo === 'pdf'
                ? await this.sgSstService.descargarReportePdf(this.idCliente, this.filtroGrupo, this.fechaInicio, this.fechaFin)
                : await this.sgSstService.descargarReporteDocx(this.idCliente, this.filtroGrupo, this.fechaInicio, this.fechaFin);

            const blob = await firstValueFrom(observable);
            const nombre = `Reporte_SG-SST_${this.fechaInicio}_${this.fechaFin}.${tipo}`;
            saveAs(blob, nombre);
        } catch {
            Swal.fire('Error', `No se pudo generar el ${tipo.toUpperCase()}.`, 'error');
        } finally {
            if (tipo === 'pdf') this.generandoPdf = false;
            else this.generandoDocx = false;
        }
    }

    private inicializarFechas(): void {
        const hoy = new Date();
        this.fechaInicioDate = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.fechaFinDate = hoy;
        this.fechaInicio = this.formatearISO(this.fechaInicioDate);
        this.fechaFin = this.formatearISO(this.fechaFinDate);
    }

    private parseFechaISO(fecha: string): Date | null {
        if (!fecha) return null;
        const [anio, mes, dia] = fecha.split('-').map(Number);
        return new Date(anio, mes - 1, dia);
    }

    private formatearISO(date: Date): string {
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const dia = String(date.getDate()).padStart(2, '0');
        return `${date.getFullYear()}-${mes}-${dia}`;
    }
}
