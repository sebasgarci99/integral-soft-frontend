import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy } from '@angular/core';

@Directive({
    selector: '[appReveal]',
    standalone: true
})
export class RevealDirective implements AfterViewInit, OnDestroy {
    private observer?: IntersectionObserver;

    constructor(
        private readonly elementRef: ElementRef<HTMLElement>,
        private readonly ngZone: NgZone
    ) {}

    ngAfterViewInit(): void {
        const elemento = this.elementRef.nativeElement;

        if (typeof window === 'undefined') {
            return;
        }

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            elemento.classList.add('is-visible');
            return;
        }

        this.ngZone.runOutsideAngular(() => {
            this.observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            this.observer?.unobserve(entry.target);
                        }
                    }
                },
                { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
            );

            this.observer.observe(elemento);
        });
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
    }
}
