import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login/login.service';
import { MenuService } from '../../services/menu/menu.service';
import { SecureStorageService } from '../../services/secure-storage.service';

import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { NgxParticlesModule, NgParticlesService } from '@tsparticles/angular';
import { loadSlim } from '@tsparticles/slim';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, CommonModule, FormsModule, NgxParticlesModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

    formLogin: FormGroup;
    showPassword: boolean = false;
    recordar: boolean = false;
    cargando: boolean = false;
    anio: number = new Date().getFullYear();

    particlesOptions: any = {
        fullScreen: { enable: false },
        fpsLimit: 60,
        particles: {
            number: {
                value: 24,
                density: { enable: true, width: 800, height: 800 }
            },
            color: { value: ['#ffffff', '#e0f7fa'] },
            shape: { type: 'circle' },
            opacity: {
                value: { min: 0.15, max: 0.4 }
            },
            size: {
                value: { min: 1.5, max: 3 }
            },
            move: {
                enable: true,
                speed: 0.2,
                direction: 'none',
                random: true,
                straight: false,
                outModes: { default: 'bounce' }
            },
            links: {
                enable: true,
                distance: 140,
                color: '#ffffff',
                opacity: 0.12,
                width: 1
            }
        },
        interactivity: {
            events: {
                onHover: { enable: true, mode: 'grab' },
                onClick: { enable: false },
                resize: { enable: true }
            },
            modes: {
                grab: { distance: 140, links: { opacity: 0.3 } }
            }
        },
        detectRetina: true
    };

    constructor(
        private form: FormBuilder,
        private router: Router,
        private loginService: LoginService,
        private menuService: MenuService,
        private secureStorage: SecureStorageService,
        private particlesService: NgParticlesService
    ) {
        this.formLogin = this.form.group({
            username: [
                null,
                [
                    Validators.required,
                    Validators.pattern(/^[a-zA-Z0-9._@+-]+$/)
                ]
            ],
            password: [
                null,
                [
                    Validators.required,
                    Validators.pattern(/^[a-zA-Z0-9._@+-]+$/)
                ]
            ]
        });
    }

    ngOnInit(): void {
        this.particlesService.init(async (engine) => {
            await loadSlim(engine);
        });

        this.secureStorage.getItem('rememberedUser').then(rememberedUser => {
            if (rememberedUser && rememberedUser.toLowerCase() !== 'null' && rememberedUser.trim() !== '') {
                this.formLogin.patchValue({
                    username: rememberedUser
                });
                this.recordar = true;
            }
        });
    }

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    iniciarSesion(): void {
        if (this.cargando) {
            return;
        }

        if (this.formLogin.invalid) {
            this.formLogin.markAllAsTouched();
            return;
        }

        this.cargando = true;

        this.loginService.login(this.formLogin.value).subscribe({
            next: async (data) => {
                const username = this.formLogin.get('username')?.value;
                await this.secureStorage.setItem('token', data.token);
                await this.secureStorage.setItem('idUser', data.idUser);
                await this.secureStorage.setItem('idEmpresa', data.idEmpresa);
                await this.secureStorage.setItem('idRol', data.rol);

                if (this.recordar && username) {
                    await this.secureStorage.setItem('rememberedUser', username);
                } else {
                    this.secureStorage.removeItem('rememberedUser');
                }

                this.menuService.cargarModulos();
                this.router.navigate(['/home']);
            },
            error: (error: HttpErrorResponse) => {
                this.cargando = false;
                this.formLogin.reset();
                Swal.fire(
                    'Información',
                    error.error.msg,
                    'warning'
                );
            }
        });
    }

}
