import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
    private activeRequests = 0;
    private loadingSubject = new BehaviorSubject<boolean>(false);
    public readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

    private timer: ReturnType<typeof setTimeout> | null = null;

    show(): void {
        this.activeRequests++;
        if (this.activeRequests === 1) {
            if (this.timer) clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                if (this.activeRequests > 0) {
                    this.loadingSubject.next(true);
                }
            }, 200);
        }
    }

    isLoading(): boolean {
        return this.loadingSubject.value;
    }

    hide(): void {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        if (this.activeRequests === 0) {
            if (this.timer) clearTimeout(this.timer);
            this.loadingSubject.next(false);
        }
    }
}
