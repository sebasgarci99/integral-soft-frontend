import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../services/login/login.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebar',
  imports: [
	RouterModule,
	CommonModule 
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {

	logo: string | null | undefined;
	datosUsuario:any = {};

	constructor(
		private router: Router,
		private LoginService : LoginService
	) {
		// Inicializamos en vacio
		this.datosUsuario = {
			nombre_completo : ''
		}
	}

	async ngOnInit() {
		// Cargamos la data
		await this.cargarInfoUsuario();
	}

    cerrarSesion() {
		localStorage.removeItem('token');
		localStorage.removeItem('idUser');
		localStorage.removeItem('idEmpresa');
		localStorage.removeItem('idRol');
		this.router.navigate(['/login'])
	}

	async cargarInfoUsuario() {
		try {
            await this.LoginService.obtenerInformacionUsuario().subscribe((data) => {
                this.datosUsuario = data[0];

				// Si se modifico algun item, se procederá nuevamente a ajustarlo con el del token
				this.datosUsuario.id_usuario != localStorage.getItem('idUser') ? localStorage.setItem('idUser', this.datosUsuario.id_usuario) : null;
				this.datosUsuario.id_rol != localStorage.getItem('idRol') ? localStorage.setItem('idRol', this.datosUsuario.id_rol) : null;
				this.datosUsuario.id_empresa != localStorage.getItem('idEmpresa') ? localStorage.setItem('idEmpresa', this.datosUsuario.id_empresa) : null;
				
				!this.datosUsuario.modulos.some((e:any)=> e.modulo === "Registros de peso") != true ? localStorage.setItem('moduloRegPeso', 'S') : null;

				// Cargamos el logo despues de 0.2 segundos ya que es un blob
				setTimeout(() => {
                    this.logo = 'data:image/png;base64,' + this.datosUsuario.blob_foto_perfil;
                }, 200);
				
            });		
        } catch(e) {
			Swal.fire({
				icon: 'error',
				title: 'Token de sesión modificado',
				text: 'El token de sesión ha sido modificado o invalidado, se cerrará la sesión.',
				confirmButtonText: 'OK'
			}).then(() => {
				this.cerrarSesion();
			});
            
        }
	}
}