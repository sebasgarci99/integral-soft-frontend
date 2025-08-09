import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-signature-canvas',
  standalone: true,
  template: `
    <!-- lienzo con borde PrimeFlex -->
    <canvas #canvas
            class="w-full border-1 surface-border border-round-2xl"
            style="touch-action:none; height:150px;background-color:lightgray;border-radius:10px"></canvas>
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

    /* ------------- ajustar tamaño al redimensionar ------------- */
    @HostListener('window:resize') resize(): void {
        const canvas = this.canvasRef.nativeElement;
        const ratio  = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width  = canvas.offsetWidth  * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d')!.scale(ratio, ratio);
        // mantener lo dibujado al escalar (opcional):
        this.pad?.clear();
    }
}
