import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login/login.service';

import Swal from 'sweetalert2'
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit{

	emailForm: string = '';
  	passwordForm: string = '';

	// Instanciamos la variable que construye el formulario
	formLogin: FormGroup;

	constructor(
		public form: FormBuilder,
		public router: Router,
		private loginService: LoginService
	) { 
		this.formLogin = this.form.group({
			username: [
				null,
				[
					Validators.required,
					Validators.pattern(/^[a-zA-Z0-9._@+-]+$/) // Solo letras, números y guiones bajos
				]
			],
			password: [
				null,
				[
					Validators.required,
					Validators.pattern(/^[a-zA-Z0-9._@+-]+$/) // Letras, números y algunos símbolos seguros
				]
			]
		})
	}

	ngOnInit(): void {
	}

	async iniciarSesion() {
		if (this.formLogin.invalid) {
			this.formLogin.markAllAsTouched();
			return;
		}

		// Aquí es donde manejarás la lógica de autenticación
		// console.log('Intento de login con:', this.formLogin.value);
		this.loginService.login(this.formLogin.value).subscribe({
			next: (data) => {
				localStorage.setItem('token', data.token);
				localStorage.setItem('idUser', data.idUser);
				localStorage.setItem('idEmpresa', data.idEmpresa);
				localStorage.setItem('idRol', data.rol);
				this.router.navigate(['/home']);
			},
			error: (error: HttpErrorResponse) => {				
				console.log(error);
				Swal.fire(
					'Información',
					error.error.msg,
					"warning"
				);
			},
			complete: () => {
				console.log("Login completo");
				this.formLogin.reset();
			}
		});
	}

}
