import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { procesarImagenEvidencia } from '../../../utils/image-compress.util';

@Component({
    selector: 'app-evidencia-uploader',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './evidencia-uploader.component.html',
    styleUrl: './evidencia-uploader.component.css'
})
export class EvidenciaUploaderComponent {

    @Input() max = 2;
    @Input() evidencias: any[] = [];
    @Output() evidenciasChange = new EventEmitter<any[]>();

    arrastrando = false;
    procesando = false;

    get lleno(): boolean {
        return this.evidencias.length >= this.max;
    }

    onInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.procesar(Array.from(input.files));
        }
        input.value = '';
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.arrastrando = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.arrastrando = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.arrastrando = false;
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.procesar(Array.from(files));
        }
    }

    quitar(index: number): void {
        const copia = [...this.evidencias];
        copia.splice(index, 1);
        this.evidenciasChange.emit(copia);
    }

    formatearPeso(bytes?: number): string {
        if (!bytes) return '';
        return bytes > 1024 * 1024
            ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
            : `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    private async procesar(files: File[]): Promise<void> {
        if (this.lleno) {
            Swal.fire('Límite alcanzado', `Solo se permiten ${this.max} evidencias.`, 'info');
            return;
        }

        const nuevos = [...this.evidencias];
        this.procesando = true;

        for (const file of files) {
            if (nuevos.length >= this.max) {
                Swal.fire('Límite alcanzado', `Solo se permiten ${this.max} evidencias.`, 'info');
                break;
            }
            if (!file.type.startsWith('image/')) {
                Swal.fire('Archivo no válido', `${file.name} no es una imagen.`, 'warning');
                continue;
            }
            try {
                const procesada = await procesarImagenEvidencia(file, { maxWidth: 1600, calidad: 0.6 });
                nuevos.push({
                    tipo: 'image/jpeg',
                    url: file.name,
                    base64: procesada.base64,
                    peso_bytes: procesada.pesoBytes,
                    descripcion: ''
                });
            } catch {
                Swal.fire('Error', `No se pudo procesar la imagen ${file.name}.`, 'error');
            }
        }

        this.procesando = false;
        this.evidenciasChange.emit(nuevos);
    }
}
