import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';

import { EquipoService } from '../../services/equipo/equipo.service';
import { Equipo } from '../../interfaces/equipo';
import { Sede } from '../../interfaces/sede';
import { Area } from '../../interfaces/area';

@Component({
    selector: 'app-equipos',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        ToastModule,
        ConfirmDialogModule,
        FloatLabelModule,
        DropdownModule,
        TooltipModule
    ],
    templateUrl: './equipos.component.html',
    styleUrl: './equipos.component.css',
    providers: [MessageService, ConfirmationService]
})
export class EquiposComponent implements OnInit {

    equipos: Equipo[] = [];
    sedes: Sede[] = [];
    areas: Area[] = [];

    displayDialog: boolean = false;
    isEdit: boolean = false;

    formData: Equipo = this.resetForm();

    constructor(
        private equipoService: EquipoService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.cargarSedes();
        this.cargarEquipos();
    }

    resetForm(): Equipo {
        return {
            id_equipo: 0,
            nombre: '',
            tipo_equipo: '',
            marca: '',
            id_sede: 0,
            id_area: 0,
            id_empresa: 0,
            estado: 'A'
        };
    }

    async cargarSedes() {
        (await this.equipoService.obtenerSedes()).subscribe({
            next: (sedes) => {
                this.sedes = sedes;
            }
        });
    }

    async cargarAreasPorSede(idSede: number) {
        if (!idSede) {
            this.areas = [];
            return;
        }
        (await this.equipoService.obtenerAreas(idSede)).subscribe({
            next: (areas) => {
                this.areas = areas;
            }
        });
    }

    onChangeSedeForm(idSede: number) {
        this.formData.id_sede = idSede;
        this.formData.id_area = 0;
        this.cargarAreasPorSede(idSede);
    }

    async cargarEquipos() {
        (await this.equipoService.obtenerEquipos()).subscribe({
            next: (equipos) => {
                this.equipos = equipos;
            }
        });
    }

    getNombreSede(idSede: number): string {
        const sede = this.sedes.find(s => s.id_sede === idSede);
        return sede ? sede.nombre : '';
    }

    getNombreArea(idArea: number): string {
        const area = this.areas.find(a => a.id_area === idArea);
        return area ? area.nombre : '';
    }

    abrirFormulario() {
        this.isEdit = false;
        this.formData = this.resetForm();
        this.areas = [];
        this.displayDialog = true;
    }

    editarEquipo(equipo: Equipo) {
        this.isEdit = true;
        this.formData = { ...equipo };
        this.cargarAreasPorSede(equipo.id_sede);
        this.displayDialog = true;
    }

    inactivarEquipo(id: number) {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Inactivar equipo',
            message: '¿Está seguro de inactivar este equipo?',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                (await this.equipoService.inactivarEquipo(id)).subscribe(() => {
                    this.cargarEquipos();
                    this.messageService.add({ severity: 'success', summary: 'Equipo inactivado.' });
                });
            }
        });
    }

    async guardarEquipo() {
        if (!this.validarCampos()) return;

        if (this.isEdit) {
            (await this.equipoService.editarEquipo(this.formData)).subscribe((res) => {
                if (res.state === 'OK') {
                    this.cargarEquipos();
                    this.displayDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Equipo actualizado correctamente.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Ocurrió un problema: ' + res.body });
                }
            });
        } else {
            (await this.equipoService.crearEquipo(this.formData)).subscribe((res) => {
                if (res.state === 'OK') {
                    this.cargarEquipos();
                    this.displayDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Equipo creado correctamente.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Ocurrió un problema: ' + res.body });
                }
            });
        }
    }

    validarCampos(): boolean {
        if (!this.formData.nombre || this.formData.nombre.trim() === '') {
            this.messageService.add({ severity: 'warn', summary: 'El nombre es obligatorio.' });
            return false;
        }
        if (!this.formData.tipo_equipo || this.formData.tipo_equipo.trim() === '') {
            this.messageService.add({ severity: 'warn', summary: 'El tipo de equipo es obligatorio.' });
            return false;
        }
        if (!this.formData.marca || this.formData.marca.trim() === '') {
            this.messageService.add({ severity: 'warn', summary: 'La marca es obligatoria.' });
            return false;
        }
        if (!this.formData.id_sede) {
            this.messageService.add({ severity: 'warn', summary: 'La sede es obligatoria.' });
            return false;
        }
        if (!this.formData.id_area) {
            this.messageService.add({ severity: 'warn', summary: 'El área es obligatoria.' });
            return false;
        }
        return true;
    }
}
