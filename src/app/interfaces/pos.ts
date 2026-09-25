import { Cliente } from './cliente';

export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';

export interface PosConfiguracion {
    id_configuracion?: number;
    id_empresa?: number;
    tipo_numeracion: 'INTERNO' | 'DIAN';
    prefijo: string;
    consecutivo_actual?: number;
    numero_resolucion?: string | null;
    rango_desde?: number | null;
    rango_hasta?: number | null;
    vigencia_desde?: string | null;
    vigencia_hasta?: string | null;
    aplica_iva_default: boolean;
    porcentaje_iva_default: number;
    precio_incluye_iva_default: boolean;
    nombre_negocio?: string | null;
    nit?: string | null;
    direccion?: string | null;
    ciudad?: string | null;
    telefono?: string | null;
    email?: string | null;
    logo_base64?: string | null;
    mensaje_factura?: string | null;
    dias_validez_enlace: number;
    estado?: string;
}

export interface ItemCarrito {
    id_producto: number;
    codigo: string;
    nombre: string;
    precio_unitario: number;
    cantidad: number;
    descuento_linea: number;
    aplica_iva: boolean;
    porcentaje_iva: number;
    precio_incluye_iva: boolean;
    maneja_lote: boolean;
    maneja_vencimiento: boolean;
    lote?: string;
    fecha_vencimiento?: string;
    stock_sede?: number;
}

export interface PagoVenta {
    metodo_pago: MetodoPago;
    valor: number;
    referencia?: string;
}

export interface DetalleVenta {
    id_detalle_venta?: number;
    id_producto: number;
    descripcion_producto: string;
    cantidad: number;
    precio_unitario: number;
    descuento_linea: number;
    porcentaje_iva: number;
    base_gravada: number;
    impuesto_linea: number;
    total_linea: number;
    lote?: string | null;
    fecha_vencimiento?: string | null;
    estado?: string;
}

export interface PagoVentaRegistrado {
    id_pago?: number;
    metodo_pago: MetodoPago;
    valor: number;
    referencia?: string | null;
}

export interface PosResolucion {
    id_resolucion: number;
    tipo_numeracion: 'INTERNO' | 'DIAN';
    numero_resolucion?: string | null;
    prefijo: string;
    rango_desde: number;
    rango_hasta: number;
    consecutivo_actual: number;
    vigencia_desde?: string | null;
    vigencia_hasta?: string | null;
    estado: 'ACTIVA' | 'AGOTADA' | 'VENCIDA' | 'INACTIVA';
    fecha_activacion?: string | null;
    fecha_baja?: string | null;
    observacion?: string | null;
}

export interface Venta {
    id_venta: number;
    numero_factura: string;
    tipo_numeracion: string;
    fecha_venta: string;
    id_cliente?: number | null;
    id_sede: number;
    id_usuario: number;
    id_movimiento?: number | null;
    id_resolucion?: number | null;
    subtotal: number;
    descuento_total: number;
    impuesto_total: number;
    total: number;
    efectivo_recibido: number;
    cambio: number;
    observacion?: string | null;
    estado: string;
    estado_pago?: 'PAGADA' | 'PENDIENTE';
    Cliente?: Cliente | null;
    Sede?: { id_sede: number; nombre: string } | null;
}

export interface DatosFactura {
    venta: Venta;
    detalles: DetalleVenta[];
    pagos: PagoVentaRegistrado[];
    cliente: Cliente | null;
    sede: { id_sede: number; nombre: string } | null;
    negocio: {
        nombre: string;
        nit: string;
        direccion: string;
        ciudad: string;
        telefono: string;
        email: string;
        logo: string;
        mensaje: string;
    };
    esFiscal: boolean;
}

export interface ResultadoVenta {
    id_venta: number;
    numero_factura: string;
    subtotal: number;
    impuesto_total: number;
    descuento_total: number;
    total: number;
    cambio: number;
    id_movimiento: number;
}
