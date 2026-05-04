import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login/login.service';

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

    constructor(
        private form: FormBuilder,
        private router: Router,
        private loginService: LoginService
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
        const rememberedUser = localStorage.getItem('rememberedUser');
        const rememberedPass = localStorage.getItem('rememberedPass');
        if (rememberedUser && rememberedPass) {
            this.formLogin.patchValue({
                username: rememberedUser,
                password: rememberedPass
            });
            this.recordar = true;
        }
    }

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    iniciarSesion(): void {
        if (this.formLogin.invalid) {
            this.formLogin.markAllAsTouched();
            return;
        }

        this.loginService.login(this.formLogin.value).subscribe({
            next: (data) => {
                localStorage.setItem('token', data.token);
                localStorage.setItem('idUser', data.idUser);
                localStorage.setItem('idEmpresa', data.idEmpresa);
                localStorage.setItem('idRol', data.rol);

                if (this.recordar) {
                    localStorage.setItem('rememberedUser', this.formLogin.get('username')?.value);
                    localStorage.setItem('rememberedPass', this.formLogin.get('password')?.value);
                } else {
                    localStorage.removeItem('rememberedUser');
                    localStorage.removeItem('rememberedPass');
                }

                this.router.navigate(['/home']);
            },
            error: (error: HttpErrorResponse) => {
                Swal.fire(
                    'Información',
                    error.error.msg,
                    'warning'
                );
            },
            complete: () => {
                this.formLogin.reset();
            }
        });
    }

}
