export interface Grupo {
    id_grupo_producto: number;
    nombre: string;
    descripcion: string;
    icono?: string;
    cantidad_productos?: number;
    estado: string;
}

export interface Categoria {
    id_categoria_producto: number;
    nombre: string;
    descripcion: string;
    id_grupo_producto: number;
    Grupo?: Grupo;
    estado: string;
}

export interface UnidadMedida {
    id_unidad_medida: number;
    nombre: string;
    abreviatura: string;
    estado: string;
}

export interface Producto {
    id_producto: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    id_categoria_producto: number;
    id_unidad_medida: number;
    stock_minimo: number;
    stock_maximo: number;
    maneja_lote: boolean;
    maneja_vencimiento: boolean;
    perfil_normativo: 'MEDICAMENTO' | 'DISPOSITIVO_MEDICO' | 'REACTIVO' | 'OTRO';
    principio_activo?: string;
    forma_farmaceutica?: string;
    concentracion?: string;
    presentacion_comercial?: string;
    registro_sanitario_invima?: string;
    marca?: string;
    serie?: string;
    clasificacion_riesgo?: string;
    vida_util_meses?: number;
    estado: string;
    Categoria?: Categoria;
    UnidadMedida?: UnidadMedida;
    color_semaforo?: string;
    cantidad_total?: number;
    stock_bajo?: boolean;
}

export interface TipoMovimiento {
    id_tipo_movimiento: number;
    codigo: string;
    nombre: string;
    signo: number;
    estado: string;
}

export interface DetalleMovimiento {
    id_detalle_movimiento?: number;
    id_movimiento?: number;
    id_producto: number;
    cantidad: number;
    costo_unitario?: number;
    lote?: string;
    fecha_vencimiento?: string;
    Producto?: Producto;
    estado?: string;
}

export interface Movimiento {
    id_movimiento: number;
    numero_documento: string;
    id_tipo_movimiento: number;
    id_sede: number;
    id_sede_destino?: number;
    fecha_movimiento: string;
    observacion: string;
    documento_referencia: string;
    id_usuario: number;
    estado: string;
    TipoMovimiento?: TipoMovimiento;
    Sede?: Sede;
    SedeDestino?: Sede;
    Detalles?: DetalleMovimiento[];
}

export interface Stock {
    id_stock: number;
    id_producto: number;
    id_sede: number;
    cantidad: number;
    lote?: string;
    fecha_vencimiento?: string;
    Producto?: Producto;
    Sede?: Sede;
    dias_vencimiento?: number;
    color_semaforo?: string;
    stock_bajo?: boolean;
}

export interface Semaforo {
    id_config_semaforo: number;
    nombre: string;
    dias_minimo: number;
    dias_maximo: number;
    color: string;
    orden: number;
    estado: string;
}

export interface Sede {
    id_sede: number;
    nombre: string;
}

export interface KardexRow {
    id_movimiento: number;
    numero_documento: string;
    fecha_movimiento: string;
    tipo_codigo: string;
    tipo_nombre: string;
    documento_referencia: string;
    observacion: string;
    entrada_cantidad: number | null;
    entrada_costo_unitario: number | null;
    entrada_costo_total: number | null;
    salida_cantidad: number | null;
    salida_costo_unitario: number | null;
    salida_costo_total: number | null;
    saldo_cantidad: number;
    saldo_costo_unitario: number | null;
    saldo_costo_total: number;
    lote: string | null;
    fecha_vencimiento: string | null;
}

export interface KardexResponse {
    producto: { id_producto: number; codigo: string; nombre: string };
    saldo_actual: { cantidad: number; costo_total: number; costo_unitario: number | null };
    movimientos: KardexRow[];
}

export interface StockBajo {
    id_producto: number;
    codigo: string;
    nombre: string;
    unidad: string;
    stock_minimo: number;
    stock_maximo: number;
    cantidad_total: number;
    sedes: { id_sede: number; nombre_sede: string; cantidad: number }[];
}

export interface StockConsolidado extends Producto {
    Stocks?: Stock[];
    cantidad_total: number;
}

export interface ApiResponse<T> {
    msg: string;
    state: string;
    body: T;
}
