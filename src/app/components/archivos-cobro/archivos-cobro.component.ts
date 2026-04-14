import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';

import { ArchivosCobroService } from '../../services/archivos-cobro/archivos-cobro.service';
import { TipoArchivoAdjunto, ArchivoAdjunto } from '../../interfaces/archivo-adjunto';
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
import { InputTextarea } from 'primeng/inputtextarea';

@Component({
    selector: 'app-archivos-cobro',
    standalone: true,
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
        InputTextarea
    ],
    templateUrl: './archivos-cobro.component.html',
    styleUrl: './archivos-cobro.component.css',
    providers: [MessageService, ConfirmationService]
})
export class ArchivosCobroComponent implements OnInit {
    tiposArchivos: TipoArchivoAdjunto[] = [];
    displayDialog: boolean = false;
    displayUploadDialog: boolean = false;
    esEdicion: boolean = false;

    formData: any = {
        id_tipo_archivo: null,
        nombre_tipo: '',
        descripcion: ''
    };

    tipoSeleccionado: TipoArchivoAdjunto | null = null;
    archivoSeleccionado: File | null = null;

    constructor(
        private archivosCobroService: ArchivosCobroService,
        private messageService: MessageService,
        private confirmService: ConfirmationService
    ) { }

    ngOnInit(): void {
        this.cargarTiposArchivos();
    }

    cargarTiposArchivos() {
        this.archivosCobroService.getTiposArchivosAdjuntos().subscribe({
            next: (response) => {
                if (response.state === 'OK') {
                    this.tiposArchivos = response.body as TipoArchivoAdjunto[];
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: response.msg
                    });
                }
            },
            error: (err) => {
                console.error('Error al cargar tipos de archivos:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los tipos de archivos.'
                });
            }
        });
    }

    abrirDialogoCrear() {
        this.esEdicion = false;
        this.formData = {
            id_tipo_archivo: null,
            nombre_tipo: '',
            descripcion: ''
        };
        this.displayDialog = true;
    }

    abrirDialogoEditar(tipo: TipoArchivoAdjunto) {
        this.esEdicion = true;
        this.formData = {
            id_tipo_archivo: tipo.id_tipo_archivo,
            nombre_tipo: tipo.nombre_tipo,
            descripcion: tipo.descripcion
        };
        this.displayDialog = true;
    }

    guardarTipoArchivo() {
        if (!this.validarFormulario()) {
            return;
        }

        if (this.esEdicion) {
            this.archivosCobroService.actualizarTipoArchivoAdjunto(
                this.formData.id_tipo_archivo,
                this.formData
            ).subscribe({
                next: (response) => {
                    if (response.state === 'OK') {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Tipo de archivo actualizado correctamente.'
                        });
                        this.cargarTiposArchivos();
                        this.cerrarDialogo();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.msg
                        });
                    }
                },
                error: (err) => {
                    console.error('Error al actualizar tipo:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo actualizar el tipo de archivo.'
                    });
                }
            });
        } else {
            this.archivosCobroService.crearTipoArchivoAdjunto(this.formData).subscribe({
                next: (response) => {
                    if (response.state === 'OK') {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Tipo de archivo creado correctamente.'
                        });
                        this.cargarTiposArchivos();
                        this.cerrarDialogo();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.msg
                        });
                    }
                },
                error: (err) => {
                    console.error('Error al crear tipo:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo crear el tipo de archivo.'
                    });
                }
            });
        }
    }

    inactivarTipo(tipo: TipoArchivoAdjunto) {
        this.confirmService.confirm({
            icon: 'fa fa-exclamation-triangle',
            header: 'Eliminar tipo de archivo',
            message: '¿Está seguro de eliminar este tipo de archivo? Se eliminarán todos los archivos asociados.',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.archivosCobroService.inactivarTipoArchivoAdjunto(tipo.id_tipo_archivo!).subscribe({
                    next: (response) => {
                        if (response.state === 'OK') {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: 'Tipo de archivo eliminado correctamente.'
                            });
                            this.cargarTiposArchivos();
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: response.msg
                            });
                        }
                    },
                    error: (err) => {
                        console.error('Error al inactivar tipo:', err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo eliminar el tipo de archivo.'
                        });
                    }
                });
            }
        });
    }

    abrirDialogoSubir(tipo: TipoArchivoAdjunto) {
        this.tipoSeleccionado = tipo;
        this.archivoSeleccionado = null;
        this.displayUploadDialog = true;
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.archivoSeleccionado = file;
        }
    }

    subirArchivo() {
        if (!this.archivoSeleccionado) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Debe seleccionar un archivo.'
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            const data = {
                id_tipo_archivo: this.tipoSeleccionado!.id_tipo_archivo,
                archivo_base64: base64,
                nombre_original: this.archivoSeleccionado!.name,
                mime_type: this.archivoSeleccionado!.type
            };

            this.archivosCobroService.subirArchivoAdjunto(data).subscribe({
                next: (response) => {
                    if (response.state === 'OK') {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Archivo subido correctamente.'
                        });
                        this.cargarTiposArchivos();
                        this.cerrarDialogoSubir();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.msg
                        });
                    }
                },
                error: (err) => {
                    console.error('Error al subir archivo:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo subir el archivo.'
                    });
                }
            });
        };
        reader.readAsDataURL(this.archivoSeleccionado);
    }

    descargarArchivo(tipo: TipoArchivoAdjunto) {
        if (!tipo.tiene_archivo || !tipo.nombre_archivo) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No hay archivo para descargar.'
            });
            return;
        }

        this.archivosCobroService.getArchivosAdjuntos().subscribe({
            next: (response) => {
                if (response.state === 'OK') {
                    const archivos = response.body as ArchivoAdjunto[];
                    const archivo = archivos.find(a => a.id_tipo_archivo === tipo.id_tipo_archivo);
                    if (archivo) {
                        this.descargarArchivoPorTipo(archivo.id_archivo, archivo.nombre_original, archivo.mime_type);
                    }
                }
            },
            error: (err) => {
                console.error('Error al obtener archivos:', err);
            }
        });
    }

    private descargarArchivoPorTipo(idArchivo: number, nombre: string, mimeType: string) {
        this.archivosCobroService.descargarArchivo(idArchivo).subscribe({
            next: (blob) => {
                let data = blob.body;
                console.log(data)
                const link = document.createElement('a');
                link.href = `data:${data.mime_type};base64,${data.archivo_base64}`;
                link.download = data.nombre_original;
                link.click();
            },
            error: (err) => {
                console.error('Error al descargar:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo descargar el archivo.'
                });
            }
        });
    }

    validarFormulario(): boolean {
        if (!this.formData.nombre_tipo || this.formData.nombre_tipo.trim() === '') {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'El nombre del tipo es requerido.'
            });
            return false;
        }
        if (!this.formData.descripcion || this.formData.descripcion.trim() === '') {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'La descripción es requerida.'
            });
            return false;
        }
        return true;
    }

    cerrarDialogo() {
        this.displayDialog = false;
    }

    cerrarDialogoSubir() {
        this.displayUploadDialog = false;
        this.tipoSeleccionado = null;
        this.archivoSeleccionado = null;
    }

    formatearFecha(fecha: string | null): string {
        if (!fecha) return '-';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-CO');
    }
}
