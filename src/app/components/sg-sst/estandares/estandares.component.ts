import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { ESTANDARES_SG_SST } from '../../../data/sg-sst-estandares';
import { EstandarGrupo, EstandarOpcion } from '../../../interfaces/sg-sst-estandares';

@Component({
    selector: 'app-sgsst-estandares',
    standalone: true,
    imports: [CommonModule, DrawerModule],
    templateUrl: './estandares.component.html',
    styleUrl: './estandares.component.css'
})
export class SgSstEstandaresComponent implements OnInit {

    @Input() idCliente: number | null = null;

    readonly grupos = ESTANDARES_SG_SST;
    readonly totalOpciones = ESTANDARES_SG_SST.reduce((total, grupo) => total + grupo.opciones.length, 0);

    drawerVisible = false;
    grupoActivo: EstandarGrupo | null = null;
    opcionSeleccionadaId: string | null = null;
    esMovil = false;

    constructor(private router: Router) {}

    ngOnInit(): void {
        this.actualizarVista();
    }

    @HostListener('window:resize')
    onResize(): void {
        this.actualizarVista();
    }

    get opcionSeleccionada(): EstandarOpcion | null {
        return this.grupoActivo?.opciones.find(opcion => opcion.id === this.opcionSeleccionadaId) || null;
    }

    abrirGrupo(grupo: EstandarGrupo): void {
        if (!this.idCliente) return;
        this.grupoActivo = grupo;
        this.opcionSeleccionadaId = null;
        this.drawerVisible = true;
    }

    cerrarDrawer(): void {
        this.drawerVisible = false;
    }

    seleccionarOpcion(opcion: EstandarOpcion): void {
        this.opcionSeleccionadaId = opcion.id;
    }

    ir(): void {
        if (!this.grupoActivo || !this.opcionSeleccionadaId) return;
        this.router.navigate(
            ['/gestion-sg-sst/estandares', this.grupoActivo.id, this.opcionSeleccionadaId],
            { queryParams: { cliente: this.idCliente } }
        );
    }

    numeroOpciones(grupo: EstandarGrupo): string {
        return grupo.opciones.length === 1 ? '1 opción' : `${grupo.opciones.length} opciones`;
    }

    private actualizarVista(): void {
        this.esMovil = window.innerWidth <= 720;
    }
}
