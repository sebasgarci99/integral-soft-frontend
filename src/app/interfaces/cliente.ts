export interface Cliente {
    id_cliente: number;
    nombre_razon_social: string;
    nombre_comercial: string;
    tipo_identificacion: string;
    numero_identificacion: string;
    telefono: string;
    pais: string;
    ciudad: string;
    direccion: string;
    correo_electronico: string;
    nombre_contacto: string;
    comentarios_observaciones: string;
    logo_base64?: string;
    arl?: string | null;
    riesgo_arl?: number | null;
    rango_empleados?: string | null;
    estado: string;
    id_usuario?: number;
    id_empresa?: number;
}

export interface ClientesResponse {
    msg: string;
    state: string;
    body: Cliente[];
}
