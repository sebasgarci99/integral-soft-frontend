import { Injectable } from '@angular/core';
import { SecureStorageService } from '../secure-storage.service';

@Injectable({ providedIn: 'root' })
export class SgSstPermissionsService {

    private idRol = 0;
    private cargado = false;

    constructor(private secureStorage: SecureStorageService) {}

    async cargar(): Promise<number> {
        if (this.cargado) return this.idRol;
        const valor = await this.secureStorage.getItem('idRol');
        this.idRol = Number(valor) || 0;
        this.cargado = true;
        return this.idRol;
    }

    get rol(): number {
        return this.idRol;
    }

    get esAdministrador(): boolean {
        return this.idRol === 1;
    }

    get puedeAdministrarGrupos(): boolean {
        return this.idRol === 1;
    }

    get puedeReabrirBitacora(): boolean {
        return this.idRol === 1;
    }

    get puedeSolicitarReapertura(): boolean {
        return this.idRol === 2 || this.idRol === 3;
    }
}
