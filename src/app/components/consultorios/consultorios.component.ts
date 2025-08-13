import { Component } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar.component";

import { OnInit } from '@angular/core';
import { ConsultorioService } from '../../services/consultorio/consultorio.service';
import { Consultorio } from '../../interfaces/consultorio';
import { ConfirmationService, MessageService } from 'primeng/api';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { HttpClientModule } from '@angular/common/http'; 
import { PaginatorModule } from 'primeng/paginator';
import { FloatLabelModule  } from 'primeng/floatlabel';
import Swal from 'sweetalert2';

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
  ] ,
    templateUrl: './consultorios.component.html',
    styleUrl: './consultorios.component.css',
    providers: [MessageService, ConfirmationService]
})
export class ConsultoriosComponent implements OnInit{
    consultorios: Consultorio[] = [];
    selectedConsultorio: Consultorio | null = null;
    displayDialog: boolean = false;
    isEdit: boolean = false;

    formData: Consultorio = this.variarCamposFormulario();

    constructor(
        private consultorioService: ConsultorioService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.cargarConsultorios();
    }

    variarCamposFormulario(): Consultorio {
        return {
            id: 0,
            codigo: '',
            descripcion: '',
            nombre_representante: '',
            info_recoleccion: '',
            piso_ubicacion: '',
            aforo: 0,
            correo: '',
            estado: 'A',
            id_usuario: 0
        };
    }

    cargarConsultorios() {
        this.consultorioService.obtenerDatosConsultorios().subscribe((data) => {
            // Mostrar los consultorios activos
            this.consultorios = data;
        });
    }

    abrirFormulario() {
        this.isEdit = false;
        this.formData = this.variarCamposFormulario();
        this.displayDialog = true;
    }

    editarDatosConsultorio(consultorio: Consultorio) {
        this.isEdit = true;
        this.formData = { ...consultorio };
        this.displayDialog = true;
    }

    borrarConsultorio(id: number) {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle', // <- Ícono de advertencia
            header: 'Eliminar consultorio',
            message: '¿Estás seguro de eliminar este consultorio?',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.consultorioService.borrarConsultorio(id).subscribe(() => {
                    this.cargarConsultorios();
                    this.messageService.add({ severity: 'success', summary: 'Consultorio inactivado.' });
                });
            }
        });
    }

    crearActualizarConsultorio() {
        if(!this.validarCampos()) {
            console.log("error")
            return;
        }

        if (this.isEdit) {
            this.consultorioService.actualizarConsultorio(this.formData.id, this.formData).subscribe((res) => {
                if(res.state == 'OK') {
                    this.cargarConsultorios();
                    this.displayDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Consultorio actualizado correctamente.' });
                } else {
                    console.log(res)
                    this.messageService.add({ severity: 'error', summary: 'Ocurrio un problema: '+res.body });
                }
            });
        } else {
            this.consultorioService.crearConsultorio(this.formData).subscribe((res) => {
                if(res.state == 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Consultorio creado correctamente.' });
                    this.cargarConsultorios();
                    this.displayDialog = false;
                } else {
                    console.log(res)
                    this.messageService.add({ severity: 'error', summary: 'Ocurrio un problema: '+res.body });
                }
                
            });
        }
    }

    validarCampos(): boolean {

        console.log(this.formData)

        if(
            this.formData.codigo == '' 
        ) {
            Swal.fire(
                'Información',
                'El código es obligatorio.',
                "warning"
            );
            return false;
        }

        return true;
    }
}
