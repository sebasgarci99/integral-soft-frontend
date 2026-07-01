import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TabViewModule } from 'primeng/tabview';
import { InputMaskModule } from 'primeng/inputmask';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { InfoUsuarioService } from '../../services/info-usuario/info-usuario.service';

@Component({
    selector: 'app-info-usuario',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ToastModule,
        ButtonModule,
        InputTextModule,
        DropdownModule,
        TabViewModule,
        InputMaskModule,
        PasswordModule,
        ProgressSpinnerModule,
        SidebarComponent
    ],
    templateUrl: './info-usuario.component.html',
    styleUrl: './info-usuario.component.css',
    providers: [MessageService]
})
export class InfoUsuarioComponent implements OnInit {

    loader = false;
    idRol: number = 0;

    datosUsuario: any = {};
    empresa: any = {};
    infoAdicional: any = {};
    configCorreo: any = {};

    fotoPerfilBase64: string | null = null;
    firmaDigitalBase64: string | null = null;
    fotoPreview: string | null = null;
    firmaPreview: string | null = null;

    servicioOptions = [
        { label: 'Gmail', value: 'gmail' },
        { label: 'Otro', value: 'otro' }
    ];

    constructor(
        private infoUsuarioService: InfoUsuarioService,
        private messageService: MessageService,
        private router: Router
    ) {
        this.idRol = Number(localStorage.getItem('idRol'));
    }

    ngOnInit(): void {
        if (this.idRol !== 1) {
            this.messageService.add({ severity: 'error', summary: 'Acceso denegado', detail: 'No tienes permisos para acceder a esta secci\u00f3n.' });
            setTimeout(() => this.router.navigate(['/home']), 1500);
            return;
        }
        this.cargarDatos();
    }

    cargarDatos() {
        this.loader = true;
        this.infoUsuarioService.getFullUserInfo().subscribe({
            next: (data) => {
                this.datosUsuario = data.usuario || {};
                this.empresa = data.empresa || {};
                this.infoAdicional = data.info_adicional || {};
                this.configCorreo = data.config_correo || {};

                if (this.datosUsuario.blob_foto_perfil) {
                    this.fotoPerfilBase64 = this.datosUsuario.blob_foto_perfil;
                    this.fotoPreview = 'data:image/png;base64,' + this.datosUsuario.blob_foto_perfil;
                }
                console.log('[cargarDatos] data:', data);
                if (this.datosUsuario.firma_digital) {
                    this.firmaDigitalBase64 = this.datosUsuario.firma_digital;
                    const raw = this.datosUsuario.firma_digital;
                    this.firmaPreview = raw.startsWith('data:') ? raw : 'data:image/png;base64,' + raw;
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la informaci\u00f3n del usuario.' });
            },
            complete: () => { this.loader = false; }
        });
    }

    onFotoSelected(event: any) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            this.fotoPerfilBase64 = base64;
            this.fotoPreview = 'data:image/png;base64,' + base64;
        };
        reader.readAsDataURL(file);
    }

    onFirmaSelected(event: any) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            this.firmaDigitalBase64 = base64;
            this.firmaPreview = 'data:image/png;base64,' + base64;
        };
        reader.readAsDataURL(file);
    }

    guardarInfoBasica() {
        if (this.firmaDigitalBase64) {
            this.firmaPreview = this.firmaDigitalBase64.startsWith('data:')
                ? this.firmaDigitalBase64
                : 'data:image/png;base64,' + this.firmaDigitalBase64;
        } else {
            this.firmaPreview = null;
        }
        this.loader = true;
        this.infoUsuarioService.updateUserInfo({
            nombre: this.datosUsuario.nombre,
            apellido: this.datosUsuario.apellido,
            foto_perfil: this.fotoPerfilBase64 || undefined,
            firma_digital: this.firmaDigitalBase64 || undefined
        }).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Informaci\u00f3n b\u00e1sica actualizada correctamente.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: res.body || 'No se pudo guardar.' });
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar informaci\u00f3n b\u00e1sica.' });
            },
            complete: () => { this.loader = false; }
        });
    }

    guardarInfoAdicional() {
        this.loader = true;
        this.infoUsuarioService.updateInfoAdicional({
            nombre_completo: this.infoAdicional.nombre_completo,
            numero_documento: this.infoAdicional.numero_documento,
            banco: this.infoAdicional.banco,
            tipo_cuenta: this.infoAdicional.tipo_cuenta,
            numero_cuenta: this.infoAdicional.numero_cuenta
        }).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Informaci\u00f3n adicional actualizada correctamente.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: res.body || 'No se pudo guardar.' });
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar informaci\u00f3n adicional.' });
            },
            complete: () => { this.loader = false; }
        });
    }

    guardarConfigCorreo() {
        this.loader = true;
        this.infoUsuarioService.updateCorreoSmtp({
            correo_electronico: this.configCorreo.correo_electronico,
            password: this.configCorreo.password,
            host: this.configCorreo.host,
            puerto: this.configCorreo.puerto,
            servicio: this.configCorreo.servicio
        }).subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Configuraci\u00f3n de correo actualizada correctamente.' });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: res.body || 'No se pudo guardar.' });
                }
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al guardar configuraci\u00f3n de correo.' });
            },
            complete: () => { this.loader = false; }
        });
    }
}
