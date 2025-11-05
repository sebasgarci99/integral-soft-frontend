import { Component } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar.component";

import { OnInit } from '@angular/core';
import { PacientesService } from '../../services/pacientes/pacientes.service';
import { Vacunas } from '../../interfaces/vacunas';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { HttpClient, HttpClientModule } from '@angular/common/http'; 
import { PaginatorModule } from 'primeng/paginator';
import { FloatLabelModule  } from 'primeng/floatlabel';
import { TabMenuModule } from 'primeng/tabmenu';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButton } from 'primeng/radiobutton';

import { localeEs } from '../../utils/locale-es';
import { CalendarModule } from 'primeng/calendar';
import { StepsModule } from "primeng/steps";

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
    CalendarModule,
    StepsModule,
    TabMenuModule,
    RadioButton
] ,
    templateUrl: './pacientes.component.html',
    styleUrl: './pacientes.component.css',
    providers: [MessageService, ConfirmationService]
})
export class PacientesComponent {
    activeItem: MenuItem | undefined;

    pacientes: any[] = [];
    displayDialog = false;
    isEdit = false;
    current = 0;
    steps = [
        { 
            label: 'Datos personales', 
            icon: 'fa-solid fa-id-card', 
            command: () => {
                this.current = 0;
            }
        },
        { 
            label: 'Antecedentes médicos', 
            icon: 'fa-solid fa-book-medical',
            command: () => {
                this.current = 1;
            }
        },
        { 
            label: 'Datos administrativos', 
            icon: 'fa-solid fa-circle-info',
             command: () => {
                this.current = 2;
            }
        }
    ];

    formData: any = {};
    local_espaniol = { firstDayOfWeek: 1, dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'], monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'] };

    constructor(
        private http: HttpClient,
        private messageService: MessageService,
        private confirmService: ConfirmationService,
        private pacientesService: PacientesService
    ) {}

    ngOnInit() {
        this.cargarPacientes();

        // Cargamos por defecto en el formulario de registro la opcion 1
        this.activeItem = this.steps[0];
    }

    // Función que carga los pacientes exclusivamente activos
    cargarPacientes() {
        this.pacientesService.obtenerPacientes().subscribe((data) => {
            this.pacientes = data.filter(e => e.estado == 'A');
        });
    }

    abrirFormulario(paciente?: any) {
        // Cargamos por defecto en el formulario de registro la opcion 1
        this.activeItem = this.steps[0];

        this.isEdit = !!paciente;
        this.displayDialog = true;
        this.current = 0;
        this.formData = paciente ? { ...paciente, ...paciente.t_antecedentes_medico, ...paciente.t_datos_admin_paciente } : {};
    }

    cerrar() {
        this.displayDialog = false;
        this.formData = {};

        // Cargamos por defecto en el formulario de registro la opcion 1
        this.activeItem = this.steps[0];
    }

    crearActualizarPaciente() {
        if(!this.validarFormulario()) return;

        if (this.isEdit) {
            this.pacientesService.actualizarPaciente(this.formData).subscribe((res) => {
                if (res.state === 'OK') {
                    this.cargarPacientes();
                    this.displayDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Paciente actualizado correctamente.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Ocurrió un problema: ' + res.body });
                }
            });
        } else {
            this.pacientesService.crearPaciente(this.formData).subscribe((res) => {
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Vacuna creada correctamente.' });
                    this.cargarPacientes();
                    this.displayDialog = false;
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Ocurrió un problema: ' + res.body });
                }
            });
        }
    }

    borrarPaciente(id: number) {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Eliminar paciente',
            message: '¿Estás seguro de inactivar este paciente?',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.pacientesService.borrarPaciente(id).subscribe(() => {
                    this.cargarPacientes();
                    this.messageService.add({ severity: 'success', summary: 'Paciente inactivado correctamente.' });
                });
            }
        });
    }
    
    validarFormulario():boolean {
        console.log(this.formData)

        // Validamos los campos obligatorios para crear el registro de pacientes
        if(this.formData.nombres == null || this.formData.nombres == '') {
            this.messageService.add({ severity: 'warning', summary: 'El nombre es obligatorio para la creación del paciente' });
            return false;
        }

        if(this.formData.apellidos == null || this.formData.apellidos == '') {
            this.messageService.add({ severity: 'warning', summary: 'El apellido es obligatorio para la creación del paciente' });
            return false;
        }

        if(this.formData.tipo_documento == null || this.formData.tipo_documento == '') {
            this.messageService.add({ severity: 'warning', summary: 'El tipo de documento es obligatorio para la creación del paciente' });
            return false;
        }

        if(this.formData.numero_documento == null || this.formData.numero_documento == '') {
            this.messageService.add({ severity: 'warning', summary: 'El número de documento es obligatorio para la creación del paciente' });
            return false;
        }

        if(this.formData.fecha_nacimiento == null || this.formData.fecha_nacimiento == '') {
            this.messageService.add({ severity: 'warning', summary: 'La fecha de nacimiento es obligatoria para la creación del paciente' });
            return false;
        }

        if(this.formData.telefono_contacto == null || this.formData.telefono_contacto == '') {
            this.messageService.add({ severity: 'warning', summary: 'La núm. de telefóno es obligatorio para la creación del paciente' });
            return false;
        }

        return true;
    }

    validarBotonGuardar():boolean{
        console.log(this.formData)

        if(this.formData.tiene_enfermedad_actual == true) {
            if(!this.formData.enfermedades_actuales || this.formData.enfermedades_actuales.trim() === '') {
                return true;
            }
        }

        if(this.formData.es_alergico == true) {
            if(!this.formData.uso_medicamentos || this.formData.uso_medicamentos.trim() === '') {
                return true;
            }
        }

        if(this.formData.reaccion_vacuna == true) {
            if(!this.formData.reacciones_previas_vacunas || this.formData.reacciones_previas_vacunas.trim() === '') {
                return true;
            }
        }

        if(!this.formData.alergias_graves || this.formData.alergias_graves.trim() === '') {
            return true;
        }
        
        if(!this.formData.eps || this.formData.eps.trim() === '') return true;
        if(!this.formData.tipo_poblacion || this.formData.tipo_poblacion.trim() === '') return true;
        if(!this.formData.nombre_acompanante || this.formData.nombre_acompanante.trim() === '') return true;

        
        return false;
    }
}
