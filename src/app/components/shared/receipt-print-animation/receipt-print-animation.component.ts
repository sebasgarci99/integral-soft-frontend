import { CommonModule } from '@angular/common';
import {
    Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild
} from '@angular/core';

@Component({
    selector: 'app-receipt-print-animation',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './receipt-print-animation.component.html',
    styleUrl: './receipt-print-animation.component.css'
})
export class ReceiptPrintAnimationComponent implements OnChanges, OnDestroy {
    @Input() html = '';
    @Input() active = false;
    @Output() closed = new EventEmitter<void>();

    @ViewChild('frame') frameRef?: ElementRef<HTMLIFrameElement>;

    progreso = 0;
    docAncho = 0;
    docAlto = 0;

    private rafId: number | null = null;
    private fallbackId: ReturnType<typeof setTimeout> | null = null;
    private animIniciada = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['active'] && this.active) this.iniciar();
    }

    ngOnDestroy(): void {
        this.limpiarTemporizadores();
    }

    private limpiarTemporizadores(): void {
        if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
        if (this.fallbackId) { clearTimeout(this.fallbackId); this.fallbackId = null; }
    }

    private iniciar(): void {
        this.limpiarTemporizadores();
        this.animIniciada = false;
        this.progreso = 0;
        this.docAncho = 0;
        this.docAlto = 0;
        this.fallbackId = setTimeout(() => this.arrancar(), 900);
        this.cargarDocumento();
    }

    /**
     * Escribe el HTML de la factura directamente en el iframe.
     * Se evita el binding [srcdoc] porque Angular lo sanitiza (SecurityContext.HTML)
     * y elimina los <style>, dejando la factura sin diseño.
     */
    private cargarDocumento(intentos = 12): void {
        const iframe = this.frameRef?.nativeElement;
        if (!iframe) {
            if (intentos > 0) setTimeout(() => this.cargarDocumento(intentos - 1), 30);
            return;
        }
        if (iframe.getAttribute('srcdoc') !== this.html) {
            iframe.setAttribute('srcdoc', this.html);
        }
    }

    onDocLoad(event: Event): void {
        const iframe = event.target as HTMLIFrameElement;
        // Ignora la carga inicial de about:blank antes de inyectar la factura.
        if (!iframe.getAttribute('srcdoc')) return;

        try {
            const doc = iframe.contentDocument;
            if (doc) {
                this.aplicarSkin(doc);

                iframe.style.width = '302px';
                iframe.style.height = '10px';
                const naturalWidth = Math.max(200, doc.documentElement.scrollWidth || 302);
                const naturalHeight = Math.max(200, doc.documentElement.scrollHeight || 500);

                const targetWidth = Math.min(320, window.innerWidth * 0.82);
                const maxHeight = window.innerHeight * 0.6;

                let scale = targetWidth / naturalWidth;
                if (naturalHeight * scale > maxHeight) scale = maxHeight / naturalHeight;

                iframe.style.width = naturalWidth + 'px';
                iframe.style.height = naturalHeight + 'px';
                iframe.style.transform = `scale(${scale})`;

                this.docAncho = Math.round(naturalWidth * scale);
                this.docAlto = Math.round(naturalHeight * scale);
            }
        } catch {
            /* documento no accesible */
        }

        requestAnimationFrame(() => this.arrancar());
    }

    /** Da aspecto de tirilla térmica real al documento (solo en la animación, no en la impresión). */
    private aplicarSkin(doc: Document): void {
        if (doc.getElementById('rpa-receipt-skin')) return;

        const style = doc.createElement('style');
        style.id = 'rpa-receipt-skin';
        style.textContent = `
            body { padding: 0 !important; background: transparent !important; color: #111 !important;
                   font-family: 'Courier New', ui-monospace, 'Segoe UI', monospace !important; }
            .contenedor { width: 100% !important; max-width: 100% !important; padding: 8px 9px 4px !important; }
            .cabecera { flex-direction: column !important; align-items: center !important; text-align: center !important;
                        border-bottom: 1px dashed #a3a3a3 !important; gap: 5px; }
            .negocio { text-align: center !important; width: 100%; }
            .negocio h1 { font-size: 15px !important; text-transform: uppercase; letter-spacing: .5px; }
            .negocio p { font-size: 10px !important; margin: 1px 0 !important; }
            .logo { max-height: 50px !important; max-width: 120px !important; margin-bottom: 4px; }
            .doc { text-align: center !important; width: 100%; }
            .doc h2 { font-size: 12px !important; text-transform: uppercase; }
            .doc p { font-size: 10px !important; margin: 1px 0 !important; }
            .cliente { font-size: 10px !important; text-align: center; border-bottom: 1px dashed #a3a3a3;
                       padding-bottom: 6px; margin-top: 8px !important; }
            table { font-size: 10px !important; }
            thead th { font-size: 9px !important; border-bottom: 1px dashed #a3a3a3 !important; text-transform: uppercase; }
            tbody tr { border-bottom: 1px dotted #cfcfcf !important; }
            .totales td { font-size: 10px !important; }
            .totales .total { font-size: 13px !important; border-top: 1px dashed #a3a3a3 !important; }
            .footer { font-size: 9px !important; }
        `;
        (doc.head || doc.documentElement).appendChild(style);
    }

    private arrancar(): void {
        if (this.animIniciada || !this.active) return;
        this.animIniciada = true;

        const duracion = 5200;
        const inicio = performance.now();

        const tick = (now: number) => {
            const t = Math.min(1, (now - inicio) / duracion);
            this.progreso = Math.round(this.easeInOutCubic(t) * 100);

            if (t < 1) {
                this.rafId = requestAnimationFrame(tick);
                return;
            }

            setTimeout(() => this.finalizar(), 900);
        };

        this.rafId = requestAnimationFrame(tick);
    }

    private finalizar(): void {
        this.closed.emit();
    }

    private easeInOutCubic(t: number): number {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}
