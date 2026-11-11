import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';
import {
    FactRipsCatalogos,
    FactRipsCie10,
    FactRipsConfig,
    FactRipsCups,
    FactRipsDashboard,
    FactRipsEstadoConfiguracion,
    FactRipsFactura,
    FactRipsFacturaDetalleResponse,
    FactRipsMunicipio,
    FactRipsPaciente,
    FactRipsPacienteDetalle,
    FactRipsReporte,
    FactRipsValidacion
} from '../../interfaces/fact-rips';

interface FactRipsResponse<T> {
    msg: string;
    state: 'OK' | 'NO_OK';
    body: T;
    detalle?: string;
}

export interface FactRipsPaginaPacientes {
    total: number;
    page: number;
    rows: number;
    pacientes: FactRipsPaciente[];
}

export interface FactRipsPaginaFacturas {
    total: number;
    page: number;
    rows: number;
    facturas: FactRipsFactura[];
}

export interface FactRipsGuardado {
    factura: FactRipsFactura;
    detalles: any[];
    validacion: FactRipsValidacion;
}

export interface FactRipsImportacion {
    insertados: number;
    actualizados: number;
    rechazados: number;
    errores: string[];
}

@Injectable({ providedIn: 'root' })
export class FactRipsService {
    private readonly urlApp: string;
    private readonly urlAppAPI = 'api/facturacion_rips/';

    constructor(
        private http: HttpClient,
        private secureStorage: SecureStorageService
    ) {
        this.urlApp = enviroment.endpoint;
    }

    private async getAuthHeaders(): Promise<HttpHeaders> {
        const token = await this.secureStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    private async getBaseBody(): Promise<Record<string, unknown>> {
        const [idUser, idEmpresa] = await Promise.all([
            this.secureStorage.getItem('idUser'),
            this.secureStorage.getItem('idEmpresa')
        ]);
        return {
            id_usuario: Number(idUser),
            id_empresa: Number(idEmpresa)
        };
    }

    private async body(extra: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
        return { ...(await this.getBaseBody()), ...extra };
    }

    async getDashboard(): Promise<Observable<FactRipsDashboard>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body();
        return this.http.post<FactRipsResponse<FactRipsDashboard>>(
            this.urlApp + this.urlAppAPI + 'getDashboard', body, { headers }
        ).pipe(map(r => r.body));
    }

    async getPacientes(extra: Record<string, unknown> = {}): Promise<Observable<FactRipsPaginaPacientes>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body(extra);
        return this.http.post<FactRipsResponse<FactRipsPaginaPacientes>>(
            this.urlApp + this.urlAppAPI + 'getPacientesFacturacion', body, { headers }
        ).pipe(map(r => r.body));
    }

    async getPaciente(idPaciente: number): Promise<Observable<FactRipsPacienteDetalle>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ id_paciente: idPaciente });
        return this.http.post<FactRipsResponse<FactRipsPacienteDetalle>>(
            this.urlApp + this.urlAppAPI + 'getPacienteFacturacion', body, { headers }
        ).pipe(map(r => r.body));
    }

    async getCatalogos(): Promise<Observable<FactRipsCatalogos>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body();
        return this.http.post<FactRipsResponse<FactRipsCatalogos>>(
            this.urlApp + this.urlAppAPI + 'getCatalogos', body, { headers }
        ).pipe(map(r => r.body));
    }

    async buscarCups(q: string, tipo?: string): Promise<Observable<FactRipsCups[]>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ q, tipo });
        return this.http.post<FactRipsResponse<FactRipsCups[]>>(
            this.urlApp + this.urlAppAPI + 'buscarCups', body, { headers }
        ).pipe(map(r => r.body || []));
    }

    async buscarCie10(q: string): Promise<Observable<FactRipsCie10[]>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ q });
        return this.http.post<FactRipsResponse<FactRipsCie10[]>>(
            this.urlApp + this.urlAppAPI + 'buscarCie10', body, { headers }
        ).pipe(map(r => r.body || []));
    }

    async buscarMunicipios(q: string): Promise<Observable<FactRipsMunicipio[]>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ q });
        return this.http.post<FactRipsResponse<FactRipsMunicipio[]>>(
            this.urlApp + this.urlAppAPI + 'buscarMunicipios', body, { headers }
        ).pipe(map(r => r.body || []));
    }

    async getConfiguracion(): Promise<Observable<{ config: FactRipsConfig; estado: FactRipsEstadoConfiguracion }>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body();
        return this.http.post<FactRipsResponse<{ config: FactRipsConfig; estado: FactRipsEstadoConfiguracion }>>(
            this.urlApp + this.urlAppAPI + 'getConfiguracion', body, { headers }
        ).pipe(map(r => r.body));
    }

    async guardarPaso(paso: number, datos: Record<string, unknown>): Promise<Observable<{ config: FactRipsConfig; estado: FactRipsEstadoConfiguracion }>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ paso, datos });
        return this.http.post<FactRipsResponse<{ config: FactRipsConfig; estado: FactRipsEstadoConfiguracion }>>(
            this.urlApp + this.urlAppAPI + 'guardarPasoConfiguracion', body, { headers }
        ).pipe(map(r => r.body));
    }

    async importarCatalogo(tipo: string, rows: string[][]): Promise<Observable<FactRipsImportacion>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ tipo, rows });
        return this.http.post<FactRipsResponse<FactRipsImportacion>>(
            this.urlApp + this.urlAppAPI + 'importarCatalogo', body, { headers }
        ).pipe(map(r => r.body));
    }

    async importarTarifario(rows: string[][]): Promise<Observable<FactRipsImportacion>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ rows });
        return this.http.post<FactRipsResponse<FactRipsImportacion>>(
            this.urlApp + this.urlAppAPI + 'importarTarifario', body, { headers }
        ).pipe(map(r => r.body));
    }

    async getCatalogo(tipo: string, buscar = ''): Promise<Observable<any[]>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ tipo, buscar, limit: 500 });
        return this.http.post<FactRipsResponse<any[]>>(
            this.urlApp + this.urlAppAPI + 'getCatalogo', body, { headers }
        ).pipe(map(r => r.body || []));
    }

    async getTarifario(buscar = ''): Promise<Observable<any[]>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ buscar, limit: 500 });
        return this.http.post<FactRipsResponse<any[]>>(
            this.urlApp + this.urlAppAPI + 'getTarifario', body, { headers }
        ).pipe(map(r => r.body || []));
    }

    async validar(input: Record<string, unknown>): Promise<Observable<FactRipsValidacion>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body(input);
        return this.http.post<FactRipsResponse<FactRipsValidacion>>(
            this.urlApp + this.urlAppAPI + 'validarFactura', body, { headers }
        ).pipe(map(r => r.body));
    }

    async guardar(input: Record<string, unknown>, modo: 'BORRADOR' | 'EMITIR'): Promise<Observable<FactRipsGuardado>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ ...input, modo });
        return this.http.post<FactRipsResponse<FactRipsGuardado>>(
            this.urlApp + this.urlAppAPI + 'guardarFactura', body, { headers }
        ).pipe(map(r => r.body));
    }

    async getFactura(idFactura: number): Promise<Observable<FactRipsFacturaDetalleResponse>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ id_factura: idFactura });
        return this.http.post<FactRipsResponse<FactRipsFacturaDetalleResponse>>(
            this.urlApp + this.urlAppAPI + 'getFactura', body, { headers }
        ).pipe(map(r => r.body));
    }

    async getFacturas(extra: Record<string, unknown> = {}): Promise<Observable<FactRipsPaginaFacturas>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body(extra);
        return this.http.post<FactRipsResponse<FactRipsPaginaFacturas>>(
            this.urlApp + this.urlAppAPI + 'getFacturas', body, { headers }
        ).pipe(map(r => r.body));
    }

    async anular(idFactura: number, motivo: string): Promise<Observable<FactRipsFactura>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ id_factura: idFactura, motivo });
        return this.http.post<FactRipsResponse<FactRipsFactura>>(
            this.urlApp + this.urlAppAPI + 'anularFactura', body, { headers }
        ).pipe(map(r => r.body));
    }

    async generarPdf(idFactura: number, formato: 'A4' | 'TICKET' = 'A4'): Promise<Observable<{ pdf_base64: string; nombre_archivo: string }>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ id_factura: idFactura, formato });
        return this.http.post<FactRipsResponse<{ pdf_base64: string; nombre_archivo: string }>>(
            this.urlApp + this.urlAppAPI + 'generarPdf', body, { headers }
        ).pipe(map(r => r.body));
    }

    async generarJson(idFactura: number): Promise<Observable<{ json: any; nombre_archivo: string }>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ id_factura: idFactura });
        return this.http.post<FactRipsResponse<{ json: any; nombre_archivo: string }>>(
            this.urlApp + this.urlAppAPI + 'generarJson', body, { headers }
        ).pipe(map(r => r.body));
    }

    async enviarCorreo(idFactura: number, correo: string): Promise<Observable<FactRipsResponse<unknown>>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ id_factura: idFactura, correo_destino: correo });
        return this.http.post<FactRipsResponse<unknown>>(
            this.urlApp + this.urlAppAPI + 'enviarCorreo', body, { headers }
        );
    }

    async obtenerEnlaceWhatsapp(idFactura: number): Promise<Observable<{
        whatsapp_url: string;
        whatsapp_texto: string;
        whatsapp_telefono: string;
        url_factura: string;
        expira_en: string;
    }>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ id_factura: idFactura });
        return this.http.post<FactRipsResponse<{
            whatsapp_url: string;
            whatsapp_texto: string;
            whatsapp_telefono: string;
            url_factura: string;
            expira_en: string;
        }>>(
            this.urlApp + this.urlAppAPI + 'obtenerEnlaceWhatsapp', body, { headers }
        ).pipe(map(r => r.body));
    }

    async getReporte(tipo: string, desde: string, hasta: string): Promise<Observable<FactRipsReporte>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ tipo, desde, hasta });
        return this.http.post<FactRipsResponse<FactRipsReporte>>(
            this.urlApp + this.urlAppAPI + 'getReporteFacturacion', body, { headers }
        ).pipe(map(r => r.body));
    }

    async descargarConsentimiento(idConsentimiento: number): Promise<Observable<{ pdf_base64: string; nombre_archivo: string }>> {
        const headers = await this.getAuthHeaders();
        const body = await this.body({ id_consentimiento: idConsentimiento });
        return this.http.post<FactRipsResponse<{ pdf_base64: string; nombre_archivo: string }>>(
            this.urlApp + 'api/gestion_pacientes/descargarConsentimientoById', body, { headers }
        ).pipe(map(r => r.body));
    }
}
