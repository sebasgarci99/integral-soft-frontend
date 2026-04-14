import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from "../sidebar/sidebar.component";

import { ClienteService } from '../../services/cliente/cliente.service';
import { Cliente } from '../../interfaces/cliente';
import { ConfirmationService, MessageService } from 'primeng/api';

import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { HttpClientModule } from '@angular/common/http';
import { PaginatorModule } from 'primeng/paginator';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';

@Component({
    selector: 'app-clientes',
    standalone: true,
    imports: [
        SidebarComponent,
        CommonModule,
        ReactiveFormsModule,
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
        SelectModule,
        InputTextarea,
        DropdownModule
    ],
    templateUrl: './clientes.component.html',
    styleUrls: ['./clientes.component.css'],
    providers: [MessageService, ConfirmationService]
})
export class ClientesComponent implements OnInit {
    clientes: Cliente[] = [];
    selectedCliente: Cliente | null = null;
    displayDialog: boolean = false;
    isEdit: boolean = false;
    clienteForm!: FormGroup;

    tiposIdentificacion = [
        { label: 'Cédula de Ciudadanía', value: 'CC' },
        { label: 'NIT', value: 'NIT' },
        { label: 'Cédula de Extranjería', value: 'CE' },
        { label: 'Pasaporte', value: 'PA' }
    ];

    constructor(
        private clienteService: ClienteService,
        private messageService: MessageService,
        private confirmService: ConfirmationService,
        private fb: FormBuilder
    ) {
        this.clienteForm = this.fb.group({
            id_cliente: [0],
            nombre_razon_social: ['', [Validators.required, Validators.maxLength(255)]],
            nombre_comercial: ['', [Validators.maxLength(255)]],
            tipo_identificacion: ['', [Validators.required]],
            numero_identificacion: ['', [Validators.required, Validators.maxLength(50)]],
            telefono: ['', [Validators.maxLength(50)]],
            pais: ['', [Validators.required, Validators.maxLength(100)]],
            ciudad: ['', [Validators.required, Validators.maxLength(100)]],
            direccion: ['', [Validators.required, Validators.maxLength(255)]],
            correo_electronico: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
            nombre_contacto: ['', [Validators.maxLength(255)]],
            comentarios_observaciones: ['', [Validators.maxLength(1000)]],
            estado: ['A']
        });
    }

    ngOnInit(): void {
        this.cargarClientes();
    }

    cargarClientes() {
        this.clienteService.obtenerDatosClientes().subscribe((data) => {
            if (data) {
                this.clientes = data;
            }
        });
    }

    abrirFormulario() {
        this.isEdit = false;
        this.clienteForm.reset();
        this.clienteForm.patchValue({ estado: 'A' });
        this.displayDialog = true;
    }

    editarDatosCliente(cliente: Cliente) {
        this.isEdit = true;
        this.clienteForm.patchValue(cliente);
        this.displayDialog = true;
    }

    borrarCliente(id: number) {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Eliminar cliente',
            message: '¿Estás seguro de eliminar este cliente?',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.clienteService.borrarCliente(id).subscribe(() => {
                    this.cargarClientes();
                    this.messageService.add({ severity: 'success', summary: 'Cliente inactivado.' });
                });
            }
        });
    }

    crearActualizarCliente() {
        if (this.clienteForm.invalid) {
            this.clienteForm.markAllAsTouched();
            return;
        }

        const clienteData = this.clienteForm.value;

        if (this.isEdit) {
            this.clienteService.actualizarCliente(clienteData.id_cliente, clienteData).subscribe((res) => {
                if (res.state == 'OK') {
                    this.cargarClientes();
                    this.displayDialog = false;
                    this.messageService.add({ severity: 'success', summary: 'Cliente actualizado correctamente.' });
                } else {
                    console.log(res)
                    this.messageService.add({ severity: 'error', summary: 'Ocurrio un problema: ' + res.body });
                }
            });
        } else {
            this.clienteService.crearCliente(clienteData).subscribe((res) => {
                if (res.state == 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Cliente creado correctamente.' });
                    this.cargarClientes();
                    this.displayDialog = false;
                } else {
                    console.log(res)
                    this.messageService.add({ severity: 'error', summary: 'Ocurrio un problema: ' + res.body });
                }
            });
        }
    }
}

