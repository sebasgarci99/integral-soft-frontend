import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {

    private abiertoSubject = new BehaviorSubject<boolean>(false);
    abierto$: Observable<boolean> = this.abiertoSubject.asObservable();

    abrir(): void {
        this.abiertoSubject.next(true);
    }

    cerrar(): void {
        this.abiertoSubject.next(false);
    }

    toggle(): void {
        this.abiertoSubject.next(!this.abiertoSubject.value);
    }

    get estaAbierto(): boolean {
        return this.abiertoSubject.value;
    }
}
