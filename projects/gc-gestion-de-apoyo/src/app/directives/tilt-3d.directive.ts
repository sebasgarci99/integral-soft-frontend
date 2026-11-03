import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy } from '@angular/core';

@Directive({
    selector: '[appTilt3d]',
    standalone: true
})
export class Tilt3dDirective implements AfterViewInit, OnDestroy {
    private readonly maxTilt = 9;
    private readonly listeners: Array<() => void> = [];

    constructor(
        private readonly elementRef: ElementRef<HTMLElement>,
        private readonly ngZone: NgZone
    ) {}

    ngAfterViewInit(): void {
        const elemento = this.elementRef.nativeElement;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        elemento.classList.add('tilt');

        this.ngZone.runOutsideAngular(() => {
            const onPointerMove = (event: PointerEvent): void => {
                const rect = elemento.getBoundingClientRect();
                const porcentajeX = (event.clientX - rect.left) / rect.width;
                const porcentajeY = (event.clientY - rect.top) / rect.height;
                const rotacionY = (porcentajeX - 0.5) * this.maxTilt * 2;
                const rotacionX = (0.5 - porcentajeY) * this.maxTilt * 2;

                elemento.classList.add('is-tilting');
                elemento.style.setProperty('--ry', `${rotacionY.toFixed(2)}deg`);
                elemento.style.setProperty('--rx', `${rotacionX.toFixed(2)}deg`);
                elemento.style.setProperty('--mx', `${(porcentajeX * 100).toFixed(1)}%`);
                elemento.style.setProperty('--my', `${(porcentajeY * 100).toFixed(1)}%`);
            };

            const onPointerLeave = (): void => {
                elemento.classList.remove('is-tilting');
                elemento.style.setProperty('--ry', '0deg');
                elemento.style.setProperty('--rx', '0deg');
            };

            elemento.addEventListener('pointermove', onPointerMove, { passive: true });
            elemento.addEventListener('pointerleave', onPointerLeave, { passive: true });
            elemento.addEventListener('pointercancel', onPointerLeave, { passive: true });

            this.listeners.push(
                () => elemento.removeEventListener('pointermove', onPointerMove),
                () => elemento.removeEventListener('pointerleave', onPointerLeave),
                () => elemento.removeEventListener('pointercancel', onPointerLeave)
            );
        });
    }

    ngOnDestroy(): void {
        for (const removeListener of this.listeners) {
            removeListener();
        }
    }
}
