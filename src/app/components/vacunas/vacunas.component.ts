import { Component } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar.component";

import { OnInit } from '@angular/core';
import { VacunaService } from '../../services/vacunas/vacuna.service';
import { Vacunas } from '../../interfaces/vacunas';
import { ConfirmationService, MessageService } from 'primeng/api';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { HttpClientModule } from '@angular/common/http';
import { PaginatorModule } from 'primeng/paginator';
import { FloatLabelModule } from 'primeng/floatlabel';
import Swal from 'sweetalert2';
import { SelectItem } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';

import { localeEs } from '../../utils/locale-es';
import { CalendarModule } from 'primeng/calendar';

@Component({
    selector: 'app-consultorios',
    imports: [
        SidebarComponent,
        CommonModule,
        FormsModule,
        HttpClientModule,
        TableModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        ToastModule,
        ConfirmDialogModule,
        PaginatorModule,
        FloatLabelModule,
        InputTextModule,
        DropdownModule,
        ReactiveFormsModule,
        CalendarModule
    ],
    templateUrl: './vacunas.component.html',
    styleUrl: './vacunas.component.css',
    providers: [MessageService, ConfirmationService]
})
export class VacunasComponent implements OnInit {

    // Variable local de traducción del lenguaje de los calendar
    local_espaniol: any = null;

    vacunas: Vacunas[] = [];
    selectedVacuna: Vacunas | null = null;
    displayDialog: boolean = false;
    isEdit: boolean = false;

    formData: Vacunas = this.variarCamposFormulario();

    laboratorios: SelectItem[] = []; // para el dropdown de laboratorios

    constructor(
        private vacunaService: VacunaService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) { }

    ngOnInit(): void {
        this.local_espaniol = localeEs;

        this.cargarVacunas();
        this.cargarLaboratorios();
    }

    variarCamposFormulario(): Vacunas {
        return {
            id: 0,
            nombre_vacuna: '',
            presentacion_comercial: '',
            principio_activo: '',
            concentracion: 0,
            unidad_medida: 'Unidad',
            fecha_lote: new Date(),
            fecha_vencimiento: new Date(),
            id_laboratorio: 0,
            registro_sanitario: 'ABC0',
            cantidad_dosis: 0,
            estado: 'A',
            id_empresa: 0,   // backend lo puede rellenar
            id_usuario: 0    // backend lo puede rellenar
        };
    }

    cargarVacunas() {
        this.vacunaService.obtenerVacunas().subscribe((data) => {
            this.vacunas = data.filter(e => e.estado == 'A');
        });
    }

    cargarLaboratorios() {
        this.vacunaService.obtenerLaboratorios().subscribe((data) => {
            this.laboratorios = data;
        });
    }

    abrirFormulario() {
        this.isEdit = false;
        this.formData = this.variarCamposFormulario();
        this.displayDialog = true;
    }

    editarVacuna(vacuna: Vacunas) {
        this.isEdit = true;
        this.formData = {
            ...vacuna,
            fecha_lote: new Date(vacuna.fecha_lote + "T00:00:00"),
            fecha_vencimiento: new Date(vacuna.fecha_vencimiento + "T00:00:00")
        };
        this.displayDialog = true;
    }

    borrarVacuna(id: number) {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Eliminar vacuna',
            message: '¿Estás seguro de inactivar esta vacuna?',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.vacunaService.borrarVacuna(id).subscribe(() => {
                    this.cargarVacunas();
                    this.messageService.add({ severity: 'success', summary: 'Vacuna eliminada correctamente.' });
                });
            }
        });
    }

    crearActualizarVacuna() {
        if (!this.validarCampos()) {
            return;
        }

        if (this.isEdit) {
            this.vacunaService.actualizarVacuna(this.formData.id, this.formData).subscribe((res) => {
                if (res.state === 'OK') {
                    this.cargarVacunas();
                    this.displayDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Vacuna actualizada correctamente.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Ocurrió un problema: ' + res.body });
                }
            });
        } else {
            this.vacunaService.crearVacuna(this.formData).subscribe((res) => {
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Vacuna creada correctamente.' });
                    this.cargarVacunas();
                    this.displayDialog = false;
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Ocurrió un problema: ' + res.body });
                }
            });
        }
    }

    validarCampos(): boolean {
        if (!this.formData.nombre_vacuna || this.formData.nombre_vacuna.trim() === '') {
            Swal.fire('Información', 'El nombre de la vacuna es obligatorio.', 'warning');
            return false;
        }

        if (!this.formData.id_laboratorio || this.formData.id_laboratorio === 0) {
            Swal.fire('Información', 'Debe seleccionar un laboratorio.', 'warning');
            return false;
        }

        return true;
    }
}