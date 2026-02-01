import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import SignaturePad from 'signature_pad';

@Component({
    selector: 'app-signature-canvas',
    standalone: true,
    template: `
    <canvas #canvas 
            class="signature-canvas border-1 surface-border"
            style="touch-action: none; background-color: #f0f0f0; border-radius: 10px; width: 100%; height: 100%; display: block;">
    </canvas>
  `
})
export class SignatureCanvasComponent implements AfterViewInit {

    @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
    private pad!: SignaturePad;

    ngAfterViewInit(): void {
        this.resize();
        this.pad = new SignaturePad(this.canvasRef.nativeElement, {
            minWidth: 1,
            maxWidth: 3,
            penColor: 'black'
        });
    }

    /* ------------- API pública ------------- */
    /* ------------- API pública ------------- */
    clear(): void { this.pad.clear(); }
    isEmpty(): boolean { return this.pad.isEmpty(); }

    /**
     * Carga una firma desde base64 al canvas
     * @param base64 - String base64 (con o sin prefijo data:image)
     */
    fromDataBase64(base64: string): void {
        if (!base64) return;

        // Asegurarnos de que tenga el prefijo correcto
        const fullDataUrl = base64.startsWith('data:image')
            ? base64
            : `data:image/png;base64,${base64}`;

        // Crear una imagen temporal para cargar los datos
        const image = new Image();
        image.onload = () => {
            // Limpiar el canvas y dibujar la imagen
            const ctx = this.canvasRef.nativeElement.getContext('2d');
            if (ctx) {
                this.clear();
                ctx.drawImage(image, 0, 0);

                // Convertir la imagen a datos que SignaturePad pueda manejar
                const imageData = ctx.getImageData(
                    0,
                    0,
                    this.canvasRef.nativeElement.width,
                    this.canvasRef.nativeElement.height
                );

                // Cargar los datos en SignaturePad
                this.pad.fromDataURL(fullDataUrl);
            }
        };
        image.src = fullDataUrl;
    }

    /**
     * Devuelve solo la parte base64 (sin el prefijo data:image/png;base64)
     */
    toDataBase64(): string {
        if (this.isEmpty()) return '';
        const fullDataUrl = this.pad.toDataURL('image/png');
        return fullDataUrl.split(',')[1];
    }

    /* ------------- Para compatibilidad ------------- */
    toDataURL(): string {
        return this.pad.toDataURL('image/png');
    }

    public reinitPad() {
        const canvas = this.canvasRef.nativeElement;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);

        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d')!.scale(ratio, ratio);

        this.pad.clear();
    }

    @HostListener('window:resize')
    resize(): void {
        const canvas = this.canvasRef.nativeElement;
        // Usamos getBoundingClientRect para obtener el tamaño exacto en pantalla
        const rect = canvas.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) return;

        const ratio = Math.max(window.devicePixelRatio || 1, 1);

        // Guardamos la firma actual
        const data = this.pad ? this.pad.toData() : [];

        // Ajustamos el buffer interno
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;

        // Escalamos el contexto para que el dibujo coincida con los píxeles reales
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset primero
            ctx.scale(ratio, ratio);
        }

        // Restauramos la firma
        this.pad?.fromData(data);
    }

    // Añade este método para forzar el ajuste cuando abras el fullscreen
    public refresh(): void {
        setTimeout(() => {
            this.resize();
        }, 200); // Pequeño delay para esperar a que el CSS de la modal termine
    }
}
