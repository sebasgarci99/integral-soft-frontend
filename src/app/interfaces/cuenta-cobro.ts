export interface Periodicidad {
    id_config_periodicidad: number;
    id_cuenta_cobro: number;
    periodicidad: string;
    dia_del_mes: number | null;
    dia_semana: number | null;
    hora_ejecucion: number;
    ultima_ejecucion: string | null;
    activo: boolean;
}

export interface CuentaCobro {
    id_cuenta_cobro?: number;
    id_cliente: number;
    nombre_cliente?: string;
    descripcion_servicio: string;
    valor_cobrar: number;
    fecha_emision: string;
    estado?: string;
    configurar_periodicidad?: boolean;
    periodicidad?: string;
    dia_del_mes?: number;
    hora_ejecucion?: number;
    info_periodicidad?: Periodicidad;
}

export interface CuentasCobroResponse {
    msg: string;
    state: string;
    body: CuentaCobro[];
}

export interface Cliente {
    id_cliente: number;
    nombre_razon_social: string;
    nombre_comercial?: string;
    tipo_identificacion?: string;
    numero_identificacion?: string;
    telefono?: string;
    pais?: string;
    ciudad?: string;
    direccion?: string;
    correo_electronico?: string;
    nombre_contacto?: string;
    comentarios_observaciones?: string;
    estado?: string;
    id_usuario?: number;
    id_empresa?: number;
}
