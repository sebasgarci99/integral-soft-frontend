import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputOtpModule } from 'primeng/inputotp';
import { TagModule } from 'primeng/tag';
import { HistoriasClinicasService } from '../../../services/historias-clinicas/historias-clinicas.service';

@Component({
    selector: 'app-hc-privacidad-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputOtpModule, TagModule],
    templateUrl: './hc-privacidad-dialog.component.html',
    styleUrl: './hc-privacidad-dialog.component.css'
})
export class HcPrivacidadDialogComponent implements OnChanges, OnDestroy {
    @Input() visible = false;
    @Input() idPaciente: number | null = null;
    @Input() idHistoria: number | null = null;
    @Input() correo: string | null = null;
    @Input() correoConfigurado = false;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() accesoConcedido = new EventEmitter<{ access_token: string; id_paciente: number; id_historia: number | null }>();

    paso: 'solicitud' | 'verificacion' = 'solicitud';
    codigo = '';
    idOtp: number | null = null;
    codigoDesarrollo = '';
    destino = '';
    error = '';
    cargando = false;
    segundosRestantes = 0;
    private timerId: any = null;

    constructor(private hcService: HistoriasClinicasService) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible']?.currentValue === true) {
            this.reiniciar();
        }
        if (changes['visible']?.currentValue === false) {
            this.detenerTimer();
        }
    }

    ngOnDestroy(): void {
        this.detenerTimer();
    }

    reiniciar(): void {
        this.paso = 'solicitud';
        this.codigo = '';
        this.idOtp = null;
        this.codigoDesarrollo = '';
        this.destino = this.correo || '';
        this.error = '';
        this.cargando = false;
        this.detenerTimer();
    }

    cerrar(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    async solicitar(): Promise<void> {
        if (!this.idPaciente) {
            this.error = 'No se encontró el paciente.';
            return;
        }
        if (!this.correoConfigurado) {
            this.error = 'El usuario no tiene correo configurado. Actualiza el perfil antes de solicitar el código.';
            return;
        }
        this.cargando = true;
        this.error = '';
        (await this.hcService.solicitarAccesoPrivado(this.idPaciente, this.idHistoria)).subscribe({
            next: response => {
                this.cargando = false;
                if (response.state === 'OK' && response.body) {
                    this.idOtp = response.body.id_otp;
                    this.destino = response.body.destino;
                    this.codigoDesarrollo = response.body.codigo_desarrollo || '';
                    this.paso = 'verificacion';
                    this.iniciarTimer(response.body.expira_en || 300);
                } else {
                    this.error = response.msg || 'No se pudo generar el código.';
                }
            },
            error: err => {
                this.cargando = false;
                this.error = err?.error?.msg || 'No se pudo enviar el código de acceso.';
            }
        });
    }

    async verificar(): Promise<void> {
        if (!this.idOtp) return;
        if (String(this.codigo || '').length !== 6) {
            this.error = 'Ingresa los 6 dígitos del código.';
            return;
        }
        this.cargando = true;
        this.error = '';
        (await this.hcService.verificarAccesoPrivado(this.idOtp, this.codigo)).subscribe({
            next: response => {
                this.cargando = false;
                if (response.state === 'OK' && response.body) {
                    this.accesoConcedido.emit({
                        access_token: response.body.access_token,
                        id_paciente: this.idPaciente as number,
                        id_historia: this.idHistoria
                    });
                    this.cerrar();
                } else {
                    this.error = response.msg || 'Código incorrecto.';
                }
            },
            error: err => {
                this.cargando = false;
                this.error = err?.error?.msg || 'No se pudo verificar el código.';
            }
        });
    }

    volverASolicitud(): void {
        this.paso = 'solicitud';
        this.codigo = '';
        this.idOtp = null;
        this.codigoDesarrollo = '';
        this.error = '';
        this.detenerTimer();
    }

    private iniciarTimer(segundos: number): void {
        this.detenerTimer();
        this.segundosRestantes = segundos;
        this.timerId = setInterval(() => {
            this.segundosRestantes = Math.max(0, this.segundosRestantes - 1);
            if (this.segundosRestantes <= 0) {
                this.detenerTimer();
                this.error = 'El código expiró. Solicita uno nuevo.';
            }
        }, 1000);
    }

    private detenerTimer(): void {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    get tiempoTexto(): string {
        const minutos = Math.floor(this.segundosRestantes / 60);
        const segundos = this.segundosRestantes % 60;
        return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
    }
}
