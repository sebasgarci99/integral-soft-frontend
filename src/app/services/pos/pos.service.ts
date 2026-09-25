import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';
import { ApiResponse } from '../../interfaces/inventario';
import {
    PosConfiguracion, PosResolucion, Venta, DatosFactura, ResultadoVenta
} from '../../interfaces/pos';

@Injectable({ providedIn: 'root' })
export class PosService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/pos/';
    }

    private async getHeaders(): Promise<HttpHeaders> {
        const token = await this.secureStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    private async getBody(): Promise<{ id_usuario: number; id_empresa: number }> {
        const idUser = await this.secureStorage.getItem('idUser');
        const idEmpresa = await this.secureStorage.getItem('idEmpresa');
        return { id_usuario: Number(idUser), id_empresa: Number(idEmpresa) };
    }

    private async post<T>(endpoint: string, extraBody: Record<string, unknown> = {}): Promise<Observable<T>> {
        const headers = await this.getHeaders();
        const base = await this.getBody();
        return this.http.post<T>(
            this.urlApp + this.urlAppAPI + endpoint,
            { ...base, ...extraBody },
            { headers }
        );
    }

    async registrarVenta(data: Record<string, unknown>): Promise<Observable<ApiResponse<ResultadoVenta>>> {
        return this.post<ApiResponse<ResultadoVenta>>('registrarVenta', data);
    }

    async getVentas(filtros: Record<string, unknown> = {}): Promise<Observable<ApiResponse<Venta[]>>> {
        return this.post<ApiResponse<Venta[]>>('getVentas', filtros);
    }

    async getVentaPorId(id_venta: number): Promise<Observable<ApiResponse<DatosFactura>>> {
        return this.post<ApiResponse<DatosFactura>>('getVentaPorId', { id_venta });
    }

    async anularVenta(id_venta: number): Promise<Observable<ApiResponse<{ id_venta: number; estado: string }>>> {
        return this.post<ApiResponse<{ id_venta: number; estado: string }>>('anularVenta', { id_venta });
    }

    async cambiarEstadoPagoVenta(id_venta: number, estado_pago: 'PAGADA' | 'PENDIENTE'): Promise<Observable<ApiResponse<{ id_venta: number; estado_pago: string }>>> {
        return this.post<ApiResponse<{ id_venta: number; estado_pago: string }>>('cambiarEstadoPagoVenta', { id_venta, estado_pago });
    }

    async getResumenPos(filtros: Record<string, unknown> = {}): Promise<Observable<ApiResponse<{ cantidad_ventas: number; total_ventas: number }>>> {
        return this.post<ApiResponse<{ cantidad_ventas: number; total_ventas: number }>>('getResumenPos', filtros);
    }

    async getConfiguracion(): Promise<Observable<ApiResponse<PosConfiguracion>>> {
        return this.post<ApiResponse<PosConfiguracion>>('getConfiguracion');
    }

    async actualizarConfiguracion(data: Partial<PosConfiguracion>): Promise<Observable<ApiResponse<PosConfiguracion>>> {
        return this.post<ApiResponse<PosConfiguracion>>('actualizarConfiguracion', data);
    }

    async getResoluciones(): Promise<Observable<ApiResponse<PosResolucion[]>>> {
        return this.post<ApiResponse<PosResolucion[]>>('getResoluciones');
    }

    async crearResolucion(data: Partial<PosResolucion>): Promise<Observable<ApiResponse<PosResolucion>>> {
        return this.post<ApiResponse<PosResolucion>>('crearResolucion', data);
    }

    async activarResolucion(id_resolucion: number): Promise<Observable<ApiResponse<PosResolucion>>> {
        return this.post<ApiResponse<PosResolucion>>('activarResolucion', { id_resolucion });
    }

    async inactivarResolucion(id_resolucion: number): Promise<Observable<ApiResponse<PosResolucion>>> {
        return this.post<ApiResponse<PosResolucion>>('inactivarResolucion', { id_resolucion });
    }

    async generarFacturaHtml(id_venta: number, formato: 'A4' | 'TICKET' = 'A4'): Promise<Observable<ApiResponse<{ html: string }>>> {
        return this.post<ApiResponse<{ html: string }>>('generarFacturaHtml', { id_venta, formato });
    }

    async enviarFacturaCorreo(id_venta: number, correo?: string): Promise<Observable<ApiResponse<{ correo: string }>>> {
        return this.post<ApiResponse<{ correo: string }>>('enviarFacturaCorreo', { id_venta, correo });
    }

    async obtenerEnlaceWhatsapp(id_venta: number): Promise<Observable<ApiResponse<{
        whatsapp_url: string;
        whatsapp_texto: string;
        whatsapp_telefono: string;
        url_factura: string;
        expira_en: string;
    }>>> {
        return this.post('obtenerEnlaceWhatsapp', { id_venta });
    }
}
