import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';
import {
    Producto, Grupo, Categoria, UnidadMedida, TipoMovimiento,
    Movimiento, Stock, Semaforo, Sede,
    KardexResponse, StockBajo, StockConsolidado, ApiResponse
} from '../../interfaces/inventario';

@Injectable({ providedIn: 'root' })
export class InventarioService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/inventario/';
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

    async getProductos(filtros: Record<string, unknown> = {}): Promise<Observable<ApiResponse<Producto[]>>> {
        return this.post<ApiResponse<Producto[]>>('getProductos', filtros);
    }

    async getProductoPorId(id_producto: number): Promise<Observable<ApiResponse<Producto>>> {
        return this.post<ApiResponse<Producto>>('getProductoPorId', { id_producto });
    }

    async crearProducto(data: Partial<Producto>): Promise<Observable<ApiResponse<Producto>>> {
        return this.post<ApiResponse<Producto>>('crearProducto', data);
    }

    async actualizarProducto(data: Partial<Producto>): Promise<Observable<ApiResponse<Producto>>> {
        return this.post<ApiResponse<Producto>>('actualizarProducto', data);
    }

    async inactivarProducto(id_producto: number): Promise<Observable<ApiResponse<string>>> {
        return this.post<ApiResponse<string>>('inactivarProducto', { id_producto });
    }

    async crearMovimiento(data: any): Promise<Observable<ApiResponse<{ id_movimiento: number; numero_documento: string }>>> {
        return this.post('crearMovimiento', data);
    }

    async anularMovimiento(id_movimiento: number): Promise<Observable<ApiResponse<string>>> {
        return this.post<ApiResponse<string>>('anularMovimiento', { id_movimiento });
    }

    async getMovimientos(filtros: Record<string, unknown> = {}): Promise<Observable<ApiResponse<Movimiento[]>>> {
        return this.post<ApiResponse<Movimiento[]>>('getMovimientos', filtros);
    }

    async getMovimientoPorId(id_movimiento: number): Promise<Observable<ApiResponse<Movimiento>>> {
        return this.post<ApiResponse<Movimiento>>('getMovimientoPorId', { id_movimiento });
    }

    async getKardexProducto(id_producto: number, id_sede?: number, fecha_inicio?: string, fecha_fin?: string): Promise<Observable<ApiResponse<KardexResponse>>> {
        return this.post<ApiResponse<KardexResponse>>('getKardexProducto', { id_producto, id_sede, fecha_inicio, fecha_fin });
    }

    async getStockPorSede(filtros: Record<string, unknown> = {}): Promise<Observable<ApiResponse<Stock[]>>> {
        return this.post<ApiResponse<Stock[]>>('getStockPorSede', filtros);
    }

    async getStockConsolidado(filtros: Record<string, unknown> = {}): Promise<Observable<ApiResponse<StockConsolidado[]>>> {
        return this.post<ApiResponse<StockConsolidado[]>>('getStockConsolidado', filtros);
    }

    async getProductosStockBajo(id_sede?: number): Promise<Observable<ApiResponse<StockBajo[]>>> {
        return this.post<ApiResponse<StockBajo[]>>('getProductosStockBajo', { id_sede });
    }

    async getProductosProximosVencer(id_sede?: number, dias_aviso?: number): Promise<Observable<ApiResponse<Stock[]>>> {
        return this.post<ApiResponse<Stock[]>>('getProductosProximosVencer', { id_sede, dias_aviso });
    }

    async getGrupos(): Promise<Observable<ApiResponse<Grupo[]>>> {
        return this.post<ApiResponse<Grupo[]>>('getGrupos');
    }

    async crearGrupo(data: Partial<Grupo>): Promise<Observable<ApiResponse<Grupo>>> {
        return this.post<ApiResponse<Grupo>>('crearGrupo', data);
    }

    async actualizarGrupo(data: Partial<Grupo>): Promise<Observable<ApiResponse<Grupo>>> {
        return this.post<ApiResponse<Grupo>>('actualizarGrupo', data);
    }

    async inactivarGrupo(id_grupo_producto: number): Promise<Observable<ApiResponse<string>>> {
        return this.post<ApiResponse<string>>('inactivarGrupo', { id_grupo_producto });
    }

    async getCategorias(id_grupo_producto?: number): Promise<Observable<ApiResponse<Categoria[]>>> {
        return this.post<ApiResponse<Categoria[]>>('getCategorias', { id_grupo_producto });
    }

    async crearCategoria(data: Partial<Categoria>): Promise<Observable<ApiResponse<Categoria>>> {
        return this.post<ApiResponse<Categoria>>('crearCategoria', data);
    }

    async actualizarCategoria(data: Partial<Categoria>): Promise<Observable<ApiResponse<Categoria>>> {
        return this.post<ApiResponse<Categoria>>('actualizarCategoria', data);
    }

    async inactivarCategoria(id_categoria_producto: number): Promise<Observable<ApiResponse<string>>> {
        return this.post<ApiResponse<string>>('inactivarCategoria', { id_categoria_producto });
    }

    async getUnidadesMedida(): Promise<Observable<ApiResponse<UnidadMedida[]>>> {
        return this.post<ApiResponse<UnidadMedida[]>>('getUnidadesMedida');
    }

    async crearUnidadMedida(data: Partial<UnidadMedida>): Promise<Observable<ApiResponse<UnidadMedida>>> {
        return this.post<ApiResponse<UnidadMedida>>('crearUnidadMedida', data);
    }

    async actualizarUnidadMedida(data: Partial<UnidadMedida>): Promise<Observable<ApiResponse<UnidadMedida>>> {
        return this.post<ApiResponse<UnidadMedida>>('actualizarUnidadMedida', data);
    }

    async inactivarUnidadMedida(id_unidad_medida: number): Promise<Observable<ApiResponse<string>>> {
        return this.post<ApiResponse<string>>('inactivarUnidadMedida', { id_unidad_medida });
    }

    async getTiposMovimiento(): Promise<Observable<ApiResponse<TipoMovimiento[]>>> {
        return this.post<ApiResponse<TipoMovimiento[]>>('getTiposMovimiento');
    }

    async crearTipoMovimiento(data: Partial<TipoMovimiento>): Promise<Observable<ApiResponse<TipoMovimiento>>> {
        return this.post<ApiResponse<TipoMovimiento>>('crearTipoMovimiento', data);
    }

    async actualizarTipoMovimiento(data: Partial<TipoMovimiento>): Promise<Observable<ApiResponse<TipoMovimiento>>> {
        return this.post<ApiResponse<TipoMovimiento>>('actualizarTipoMovimiento', data);
    }

    async inactivarTipoMovimiento(id_tipo_movimiento: number): Promise<Observable<ApiResponse<string>>> {
        return this.post<ApiResponse<string>>('inactivarTipoMovimiento', { id_tipo_movimiento });
    }

    async getSemaforos(): Promise<Observable<ApiResponse<Semaforo[]>>> {
        return this.post<ApiResponse<Semaforo[]>>('getSemaforos');
    }

    async crearSemaforo(data: Partial<Semaforo>): Promise<Observable<ApiResponse<Semaforo>>> {
        return this.post<ApiResponse<Semaforo>>('crearSemaforo', data);
    }

    async actualizarSemaforo(data: Partial<Semaforo>): Promise<Observable<ApiResponse<Semaforo>>> {
        return this.post<ApiResponse<Semaforo>>('actualizarSemaforo', data);
    }

    async inactivarSemaforo(id_config_semaforo: number): Promise<Observable<ApiResponse<string>>> {
        return this.post<ApiResponse<string>>('inactivarSemaforo', { id_config_semaforo });
    }

    async inicializarConfigEmpresa(): Promise<Observable<ApiResponse<any>>> {
        return this.post<ApiResponse<any>>('inicializarConfigEmpresa');
    }

    async getSedes(): Promise<Observable<ApiResponse<Sede[]>>> {
        const headers = await this.getHeaders();
        const body = await this.getBody();
        return this.http.post<ApiResponse<Sede[]>>(
            this.urlApp + 'api/sede/getSedesByEmpresa',
            body,
            { headers }
        );
    }
}
