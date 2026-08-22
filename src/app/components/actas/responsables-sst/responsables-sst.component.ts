import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ActasService } from '../../../services/actas/actas.service';
import { ResponsableSST } from '../../../interfaces/acta';

@Component({
    selector: 'app-responsables-sst',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, InputTextModule, DialogModule, ToastModule, TooltipModule],
    providers: [MessageService],
    template: `
        <div class="container-fluid py-3">
            <div class="card shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                        <h3 class="m-0"><i class="fa fa-user-tie me-2 text-primary"></i>Configuración de responsables SG-SST</h3>
                        <div class="d-flex gap-2">
                            <button pButton type="button" label="Volver" icon="fa fa-arrow-left" class="p-button-secondary" (click)="volver()"></button>
                            <button pButton type="button" label="Nuevo responsable" icon="fa fa-plus" (click)="abrirDialogo()"></button>
                        </div>
                    </div>

                    <p-table [value]="responsables" responsiveLayout="scroll" styleClass="p-datatable-sm" [paginator]="true" [rows]="10">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Nombre</th>
                                <th>Cédula</th>
                                <th>Profesión</th>
                                <th>Licencia</th>
                                <th>ARL</th>
                                <th class="text-center" style="width: 120px;">Acciones</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-r>
                            <tr>
                                <td>{{ r.nombre }}</td>
                                <td>{{ r.cedula }}</td>
                                <td>{{ r.profesion }}</td>
                                <td>{{ r.licencia }}</td>
                                <td>{{ r.arl }}</td>
                                <td class="text-center">
                                    <button pButton type="button" icon="fa fa-pencil" class="p-button-text" (click)="editar(r)" pTooltip="Editar"></button>
                                    <button pButton type="button" icon="fa fa-trash" class="p-button-text p-button-danger" (click)="inactivar(r)" pTooltip="Inactivar"></button>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr><td colspan="6" class="text-center text-muted py-3">No hay responsables configurados</td></tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </div>

        <p-dialog [header]="responsableSeleccionado.id_responsable ? 'Editar responsable' : 'Nuevo responsable'" [(visible)]="mostrarDialogo" [modal]="true" [style]="{ width: '40rem' }" appendTo="body">
            <div class="row g-3">
                <div class="col-12">
                    <label class="form-label fw-semibold">Nombre completo *</label>
                    <input pInputText [(ngModel)]="responsableSeleccionado.nombre" class="w-100" placeholder="Nombre del responsable" />
                </div>
                <div class="col-12 col-md-6">
                    <label class="form-label fw-semibold">Cédula</label>
                    <input pInputText [(ngModel)]="responsableSeleccionado.cedula" class="w-100" placeholder="Cédula" />
                </div>
                <div class="col-12 col-md-6">
                    <label class="form-label fw-semibold">Profesión</label>
                    <input pInputText [(ngModel)]="responsableSeleccionado.profesion" class="w-100" placeholder="Profesión" />
                </div>
                <div class="col-12 col-md-6">
                    <label class="form-label fw-semibold">Licencia</label>
                    <input pInputText [(ngModel)]="responsableSeleccionado.licencia" class="w-100" placeholder="Licencia SST" />
                </div>
                <div class="col-12 col-md-6">
                    <label class="form-label fw-semibold">ARL</label>
                    <input pInputText [(ngModel)]="responsableSeleccionado.arl" class="w-100" placeholder="ARL" />
                </div>
                <div class="col-12">
                    <label class="form-label fw-semibold">Firma del responsable</label>
                    <input #firmaInput type="file" accept="image/*" style="display: none;" (change)="onFirmaSelected($event)" />
                    <div class="d-flex align-items-center gap-3 flex-wrap">
                        <button pButton type="button" icon="fa fa-upload" label="Seleccionar firma" severity="secondary" (click)="firmaInput.click()"></button>
                        <button *ngIf="responsableSeleccionado.firma_base64" pButton type="button" icon="fa fa-trash" label="Eliminar firma" severity="danger" (click)="eliminarFirma()"></button>
                    </div>
                    <div *ngIf="responsableSeleccionado.firma_base64" class="mt-2">
                        <img [src]="responsableSeleccionado.firma_base64" alt="Preview firma" style="max-height: 80px; max-width: 100%; border: 1px solid #dee2e6; border-radius: 4px; padding: 4px;" />
                    </div>
                </div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-4">
                <button pButton type="button" label="Cancelar" icon="fa fa-times" class="p-button-secondary" (click)="mostrarDialogo = false"></button>
                <button pButton type="button" label="Guardar" icon="fa fa-save" (click)="guardar()" [disabled]="!responsableSeleccionado.nombre"></button>
            </div>
        </p-dialog>

        <p-toast></p-toast>
    `
})
export class ResponsablesSstComponent implements OnInit {
    responsables: ResponsableSST[] = [];
    mostrarDialogo = false;
    responsableSeleccionado: ResponsableSST = this.nuevoResponsable();

    constructor(
        private actasService: ActasService,
        private router: Router,
        private messageService: MessageService
    ) {}

    async ngOnInit(): Promise<void> {
        await this.cargarResponsables();
    }

    nuevoResponsable(): ResponsableSST {
        return {
            nombre: '',
            cedula: '',
            profesion: '',
            licencia: '',
            arl: '',
            firma_base64: undefined
        };
    }

    async cargarResponsables(): Promise<void> {
        (await this.actasService.getResponsables()).subscribe({
            next: (data: ResponsableSST[]) => this.responsables = data || [],
            error: () => this.mostrarError('No se pudieron cargar los responsables')
        });
    }

    abrirDialogo(): void {
        this.responsableSeleccionado = this.nuevoResponsable();
        this.mostrarDialogo = true;
    }

    editar(responsable: ResponsableSST): void {
        this.responsableSeleccionado = { ...responsable };
        this.mostrarDialogo = true;
    }

    onFirmaSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        if (!file.type.startsWith('image/')) {
            this.mostrarError('Seleccione un archivo de imagen válido');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            this.responsableSeleccionado.firma_base64 = reader.result as string;
        };
        reader.readAsDataURL(file);
    }

    eliminarFirma(): void {
        this.responsableSeleccionado.firma_base64 = undefined;
    }

    async guardar(): Promise<void> {
        if (this.responsableSeleccionado.id_responsable) {
            (await this.actasService.actualizarResponsable(this.responsableSeleccionado)).subscribe({
                next: () => {
                    this.mostrarDialogo = false;
                    this.cargarResponsables();
                    this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Responsable actualizado correctamente' });
                },
                error: () => this.mostrarError('No se pudo actualizar el responsable')
            });
        } else {
            (await this.actasService.crearResponsable(this.responsableSeleccionado)).subscribe({
                next: () => {
                    this.mostrarDialogo = false;
                    this.cargarResponsables();
                    this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Responsable creado correctamente' });
                },
                error: () => this.mostrarError('No se pudo crear el responsable')
            });
        }
    }

    async inactivar(responsable: ResponsableSST): Promise<void> {
        if (!responsable.id_responsable) return;
        if (!confirm(`¿Está seguro de inactivar a ${responsable.nombre}?`)) return;

        (await this.actasService.inactivarResponsable(responsable.id_responsable)).subscribe({
            next: () => {
                this.cargarResponsables();
                this.messageService.add({ severity: 'success', summary: 'Inactivado', detail: 'Responsable inactivado correctamente' });
            },
            error: () => this.mostrarError('No se pudo inactivar el responsable')
        });
    }

    volver(): void {
        this.router.navigate(['/actas']);
    }

    private mostrarError(detail: string): void {
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
    }
}
