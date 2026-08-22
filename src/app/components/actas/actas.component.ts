import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { ClienteService } from '../../services/cliente/cliente.service';
import { ActasService } from '../../services/actas/actas.service';
import { Cliente } from '../../interfaces/cliente';
import { Acta } from '../../interfaces/acta';

interface ClienteOpcion extends Cliente {
    labelCompleto: string;
}

@Component({
    selector: 'app-actas',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TableModule, DropdownModule, DialogModule,
        CardModule, InputTextModule, FloatLabelModule, AutoCompleteModule, TooltipModule
    ],
    template: `
        <div class="container-fluid py-3 dashboard">
            <div class="card shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                        <h3 class="m-0"><i class="fa fa-file-alt me-2 text-primary"></i>Actas SST</h3>
                        <button pButton type="button" label="Configurar responsables" icon="fa fa-user-tie" class="p-button-secondary" (click)="configurarResponsables()"></button>
                    </div>

                    <div class="row g-3 mb-4">
                        <div class="col-12 col-md-8 col-lg-6 col-xl-4">
                            <p-floatlabel variant="on">
                                <p-autoComplete
                                    inputId="cliente"
                                    [(ngModel)]="clienteSeleccionado"
                                    [suggestions]="clientesFiltrados"
                                    (completeMethod)="filtrarClientes($event)"
                                    field="labelCompleto"
                                    [dropdown]="true"
                                    (onSelect)="onClienteSeleccionado()"
                                    [style]="{ width: '100%' }"
                                    class="w-100" />
                                <label for="cliente">Buscar cliente (NIT / nombre)</label>
                            </p-floatlabel>
                        </div>
                    </div>

                    <div *ngIf="clienteSeleccionado" class="row mb-4">
                        <div class="col-12 col-lg-6">
                            <p-card styleClass="shadow-2">
                                <ng-template pTemplate="title">
                                    <div class="d-flex align-items-center gap-2">
                                        <i class="fa fa-history text-primary"></i>
                                        <span>Última acta registrada</span>
                                    </div>
                                </ng-template>
                                <ng-template pTemplate="content">
                                    <div *ngIf="ultimaActa; else sinActas" class="d-flex flex-column gap-2">
                                        <div><strong>Cliente:</strong> {{ clienteSeleccionado.nombre_razon_social }}</div>
                                        <div><strong>Documento:</strong> {{ clienteSeleccionado.tipo_identificacion }} {{ clienteSeleccionado.numero_identificacion }}</div>
                                        <div><strong>Último mes:</strong> {{ ultimaActa.mes }} <span class="ms-2 badge" [ngClass]="ultimaActa.estado === 'CERRADA' ? 'bg-success' : 'bg-warning text-dark'">{{ ultimaActa.estado }}</span></div>
                                        <div *ngIf="ultimaActa.fecha_acta"><strong>Fecha acta:</strong> {{ ultimaActa.fecha_acta | date:'dd/MM/yyyy' }}</div>
                                        <div class="d-flex gap-2 mt-3">
                                            <button pButton type="button" label="Crear nueva acta" icon="fa fa-plus" (click)="nuevaActa()"></button>
                                            <button pButton type="button" label="Editar última acta" icon="fa fa-pencil" class="p-button-secondary" (click)="editarUltima()" [disabled]="!ultimaActa"></button>
                                        </div>
                                    </div>
                                    <ng-template #sinActas>
                                        <div class="d-flex flex-column gap-2">
                                            <p class="mb-0">El cliente no tiene actas registradas.</p>
                                            <button pButton type="button" label="Crear primera acta" icon="fa fa-plus" (click)="nuevaActa()"></button>
                                        </div>
                                    </ng-template>
                                </ng-template>
                            </p-card>
                        </div>
                    </div>

                    <h5 *ngIf="clienteSeleccionado" class="mb-3"><i class="fa fa-list me-2 text-secondary"></i>Historial de actas</h5>
                    <p-table *ngIf="clienteSeleccionado" [value]="actas" [paginator]="true" [rows]="10" responsiveLayout="scroll" stripedRows>
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Mes</th>
                                <th>Empresa</th>
                                <th>Responsable</th>
                                <th>Estado</th>
                                <th class="text-center">Acciones</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-acta>
                            <tr>
                                <td>{{ acta.mes }}</td>
                                <td>{{ acta.empresa_nombre }}</td>
                                <td>{{ acta.responsable_nombre }}</td>
                                <td><span class="badge" [ngClass]="acta.estado === 'CERRADA' ? 'bg-success' : 'bg-warning text-dark'">{{ acta.estado }}</span></td>
                                <td class="text-center">
                                    <button pButton type="button" icon="fa fa-pencil" class="p-button-text" (click)="editarActa(acta.id_acta)" [disabled]="acta.estado !== 'BORRADOR'" pTooltip="Editar"></button>
                                    <button pButton type="button" icon="fa fa-copy" class="p-button-text p-button-secondary" (click)="clonarActa(acta)" pTooltip="Usar como base"></button>
                                    <button pButton type="button" icon="fa fa-file-word" class="p-button-text p-button-info" (click)="descargarDocx(acta.id_acta)" pTooltip="DOCX"></button>
                                    <button pButton type="button" icon="fa fa-file-pdf" class="p-button-text p-button-danger" (click)="descargarPdf(acta.id_acta)" pTooltip="PDF"></button>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr><td colspan="5" class="text-center py-3">No hay actas registradas para este cliente.</td></tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </div>
    `
})
export class ActasComponent implements OnInit {
    clientes: ClienteOpcion[] = [];
    clientesFiltrados: ClienteOpcion[] = [];
    clienteSeleccionado: ClienteOpcion | null = null;
    actas: Acta[] = [];
    ultimaActa: Acta | null = null;

    constructor(
        private clienteService: ClienteService,
        private actasService: ActasService,
        private router: Router
    ) {}

    async ngOnInit(): Promise<void> {
        (await this.clienteService.obtenerDatosClientes()).subscribe({
            next: (data) => {
                this.clientes = (data || []).map(c => ({
                    ...c,
                    labelCompleto: `${c.tipo_identificacion} ${c.numero_identificacion} - ${c.nombre_razon_social}`
                }));
            }
        });
    }

    filtrarClientes(event: any): void {
        const query = (event.query || '').toLowerCase();
        this.clientesFiltrados = this.clientes.filter(c =>
            c.labelCompleto.toLowerCase().includes(query)
        );
    }

    onClienteSeleccionado(): void {
        this.actas = [];
        this.ultimaActa = null;
        if (!this.clienteSeleccionado) return;
        this.cargarActas();
        this.cargarUltimaActa();
    }

    async cargarActas(): Promise<void> {
        if (!this.clienteSeleccionado) return;
        (await this.actasService.getActasPorCliente(this.clienteSeleccionado.id_cliente)).subscribe({
            next: (data) => this.actas = data || []
        });
    }

    async cargarUltimaActa(): Promise<void> {
        if (!this.clienteSeleccionado) return;
        (await this.actasService.getUltimaActaCliente(this.clienteSeleccionado.id_cliente)).subscribe({
            next: (acta) => this.ultimaActa = acta,
            error: () => this.ultimaActa = null
        });
    }

    nuevaActa(): void {
        if (!this.clienteSeleccionado) return;
        if (this.ultimaActa && this.ultimaActa.estado === 'CERRADA') {
            this.router.navigate(['/actas/nueva'], { queryParams: { id_cliente: this.clienteSeleccionado.id_cliente }, state: { actaBase: this.ultimaActa } });
        } else {
            this.router.navigate(['/actas/nueva'], { queryParams: { id_cliente: this.clienteSeleccionado.id_cliente } });
        }
    }

    async editarUltima(): Promise<void> {
        if (!this.clienteSeleccionado || !this.ultimaActa) return;
        if (this.ultimaActa.estado === 'CERRADA') {
            this.router.navigate(['/actas/nueva'], { queryParams: { id_cliente: this.clienteSeleccionado.id_cliente }, state: { actaBase: this.ultimaActa } });
        } else {
            this.router.navigate(['/actas/editar', this.ultimaActa.id_acta]);
        }
    }

    clonarActa(acta: Acta): void {
        if (!acta.id_cliente) return;
        this.router.navigate(['/actas/nueva'], { queryParams: { id_cliente: acta.id_cliente }, state: { actaBase: acta } });
    }

    editarActa(id: number | undefined): void {
        if (!id) return;
        this.router.navigate(['/actas/editar', id]);
    }

    configurarResponsables(): void {
        this.router.navigate(['/actas/responsables']);
    }

    async descargarDocx(id_acta: number | undefined): Promise<void> {
        if (!id_acta) return;
        (await this.actasService.descargarDocx(id_acta)).subscribe({
            next: (blob) => this.descargarBlob(blob, `acta_${id_acta}.docx`)
        });
    }

    async descargarPdf(id_acta: number | undefined): Promise<void> {
        if (!id_acta) return;
        (await this.actasService.descargarPdf(id_acta)).subscribe({
            next: (blob) => this.descargarBlob(blob, `acta_${id_acta}.pdf`)
        });
    }

    private descargarBlob(blob: Blob, nombre: string): void {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombre;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}
