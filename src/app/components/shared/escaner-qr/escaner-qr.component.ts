import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-escaner-qr',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    templateUrl: './escaner-qr.component.html',
    styleUrls: ['./escaner-qr.component.css']
})
export class EscanerQrComponent implements OnInit, OnDestroy {

    @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;
    @Output() codigoDetectado = new EventEmitter<string>();
    @Output() cerrar = new EventEmitter<void>();

    iniciando = true;
    error = '';

    private controls: any = null;
    private detenido = false;

    ngOnInit(): void {
        this.iniciarCamara();
    }

    async iniciarCamara() {
        try {
            // Import dinámico: la librería queda en un chunk aparte
            const { BrowserMultiFormatReader } = await import('@zxing/browser');

            const reader = new BrowserMultiFormatReader();

            this.controls = await reader.decodeFromConstraints(
                { video: { facingMode: { ideal: 'environment' } } },
                this.videoRef!.nativeElement,
                (result: any) => {
                    if (result && !this.detenido) {
                        const texto = result.getText();
                        if (texto) this.onDetectado(texto);
                    }
                }
            );

            this.iniciando = false;
        } catch (err: any) {
            this.iniciando = false;
            this.error = this.describirError(err);
        }
    }

    private describirError(err: any): string {
        const nombre = err?.name || '';
        if (nombre === 'NotAllowedError' || nombre === 'SecurityError') {
            return 'Permiso de cámara denegado. Habilítalo en el navegador e inténtalo de nuevo.';
        }
        if (nombre === 'NotFoundError' || nombre === 'DevicesNotFoundError') {
            return 'No se encontró una cámara disponible en este dispositivo.';
        }
        if (nombre === 'NotReadableError') {
            return 'La cámara está siendo usada por otra aplicación.';
        }
        return 'No se pudo iniciar la cámara. Verifica que el sitio use HTTPS.';
    }

    private onDetectado(texto: string) {
        this.detenido = true;
        this.detenerCamara();
        this.codigoDetectado.emit(texto);
        this.cerrar.emit();
    }

    private detenerCamara() {
        try {
            this.controls?.stop();
        } catch { /* ignore */ }
        this.controls = null;
    }

    cancelar() {
        this.detenido = true;
        this.detenerCamara();
        this.cerrar.emit();
    }

    ngOnDestroy(): void {
        this.detenido = true;
        this.detenerCamara();
    }
}
