import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login/login.service';
import { MenuService } from '../../services/menu/menu.service';
import { SecureStorageService } from '../../services/secure-storage.service';

import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

    formLogin: FormGroup;
    showPassword: boolean = false;
    recordar: boolean = false;
    cargando: boolean = false;
    anio: number = new Date().getFullYear();

    constructor(
        private form: FormBuilder,
        private router: Router,
        private loginService: LoginService,
        private menuService: MenuService,
        private secureStorage: SecureStorageService
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
                Swal.fire(
                    'Información',
                    error.error.msg,
                    'warning'
                );
            },
            complete: () => {
                this.cargando = false;
                this.formLogin.reset();
            }
        });
    }

}
