import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SecureStorageService } from './secure-storage.service';
import { LoginService } from './login/login.service';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class TokenMonitorService implements OnDestroy {

    private intervalId: ReturnType<typeof setInterval> | null = null;
    private swalInstance: typeof Swal | null = null;
    private renovando = false;

    constructor(
        private secureStorage: SecureStorageService,
        private loginService: LoginService,
        private router: Router
    ) {}

    start(): void {
        this.stop();
        this.intervalId = setInterval(() => this.verificar(), 30000);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        Swal.close();
    }

    private async verificar(): Promise<void> {
        if (this.renovando) return;

        const token = await this.secureStorage.getItem('token');
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000;
            const msRestantes = exp - Date.now();

            if (msRestantes > 0 && msRestantes <= 90000 && !Swal.isVisible()) {
                this.mostrarDialogo(Math.ceil(msRestantes / 1000));
            }
        } catch {
            // token inválido, ignorar
        }
    }

    private mostrarDialogo(segundosRestantes: number): void {
        let segundos = segundosRestantes;

        Swal.fire({
            title: 'Sesión por expirar',
            html: this.buildCountdownHtml(segundos),
            icon: 'warning',
            showConfirmButton: true,
            showCancelButton: true,
            confirmButtonText: 'Sí, renovar',
            cancelButtonText: 'Cerrar sesión',
            confirmButtonColor: '#3da1b8',
            cancelButtonColor: '#dc3545',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                const timer = setInterval(() => {
                    segundos--;
                    const content = Swal.getHtmlContainer();
                    if (content) {
                        content.innerHTML = this.buildCountdownHtml(segundos);
                    }
                    if (segundos <= 0) {
                        clearInterval(timer);
                        this.cerrarSesion();
                    }
                }, 1000);
                Swal.getHtmlContainer()?.setAttribute('data-timer', String(timer));
            },
            willClose: () => {
                const timerStr = Swal.getHtmlContainer()?.getAttribute('data-timer');
                if (timerStr) clearInterval(Number(timerStr));
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.renovar();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                this.cerrarSesion();
            }
        });
    }

    private buildCountdownHtml(segundos: number): string {
        const pct = Math.max(0, Math.min(100, (segundos / 90) * 100));
        return `
            <p style="margin-bottom:0.5rem;">Tu sesión expirará en:</p>
            <div style="
                font-size: 2.5rem; font-weight: 700; color: #1e293b;
                margin-bottom: 0.75rem; font-variant-numeric: tabular-nums;
            ">${segundos}s</div>
            <div style="
                width: 100%; height: 8px; background: #e9ecef;
                border-radius: 4px; overflow: hidden;
            ">
                <div style="
                    width: ${pct}%; height: 100%;
                    background: ${segundos > 30 ? '#3da1b8' : segundos > 15 ? '#f59e0b' : '#dc3545'};
                    border-radius: 4px; transition: width 1s linear, background 0.3s;
                "></div>
            </div>
        `;
    }

    private async renovar(): Promise<void> {
        this.renovando = true;
        Swal.close();

        const token = await this.secureStorage.getItem('token');
        if (!token) {
            this.renovando = false;
            this.cerrarSesion();
            return;
        }

        this.loginService.renovarToken(token).subscribe({
            next: (res: any) => {
                if (res?.token) {
                    this.secureStorage.setItem('token', res.token);
                }
                this.renovando = false;
            },
            error: () => {
                this.renovando = false;
                this.cerrarSesion();
            }
        });
    }

    private cerrarSesion(): void {
        Swal.close();
        this.secureStorage.removeItem('token');
        this.secureStorage.removeItem('idUser');
        this.secureStorage.removeItem('idEmpresa');
        this.secureStorage.removeItem('idRol');
        this.stop();
        this.router.navigate(['/login']);
    }

    ngOnDestroy(): void {
        this.stop();
    }
}
