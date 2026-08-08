export interface ApiResponse<T> {
    msg: string;
    state: 'OK' | 'NO_OK';
    body: T;
}

export interface PropiedadHorizontal {
    id_propiedad_horizontal: number;
    id_empresa: number;
    nombre: string;
    nit?: string;
    direccion: string;
    ubicacion_maps?: string;
    pisos?: number;
    cantidad_aptos?: number;
    cantidad_consultorios?: number;
    cantidad_otros?: number;
    administrador_actual?: string;
    email_pqrs: string;
    telefono?: string;
    codigo_acceso: string;
    estado: string;
    id_usuario_crea?: number;
    createdAt?: string;
    updatedAt?: string;
    Categorias?: CategoriaPqrs[];
}

export interface CategoriaPqrs {
    id_categoria_pqrs: number;
    id_propiedad_horizontal: number;
    nombre: string;
    orden: number;
    estado: string;
    PropiedadHorizontal?: PropiedadHorizontal;
}

export type TipoPqr = 'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA';
export type EstadoPqr = 'RADICADO' | 'CATEGORIZADO' | 'EN_AVANCE' | 'FINALIZADO';

export interface AlertaConfigPqrs {
    id_alerta_config: number;
    id_propiedad_horizontal: number;
    nombre_condicion: string;
    tipo_alerta: 'ROJA' | 'VERDE' | 'AMARILLA';
    condicion: { tipo: 'RADICADO_SIN_CATEGORIZAR' | 'CON_AVANCES' | 'DIAS_SIN_MOVIMIENTO' };
    dias_umbral?: number;
    orden: number;
    estado: string;
}

export interface AvancePqrs {
    id_avance_pqrs: number;
    id_solicitud_pqrs: number;
    descripcion: string;
    avanza_a_finalizacion: boolean;
    id_usuario?: number;
    createdAt?: string;
    Archivos?: ArchivoPqrs[];
}

export interface ArchivoPqrs {
    id_archivo_pqrs: number;
    id_solicitud_pqrs: number;
    id_avance_pqrs?: number;
    tipo_archivo: 'FOTO1' | 'FOTO2' | 'DOCUMENTO';
    nombre_original: string;
    mime_type: string;
    archivo_base64: string;
    id_usuario?: number;
}

export interface SolicitudPqrs {
    id_solicitud_pqrs: number;
    id_propiedad_horizontal: number;
    codigo_radicado: string;
    nombre_solicitante: string;
    email_solicitante: string;
    documento_solicitante: string;
    piso?: string;
    ubicacion?: string;
    tipo_pqr: TipoPqr;
    pretensiones?: string;
    observaciones?: string;
    id_categoria?: number;
    estado: EstadoPqr;
    resumen_finalizacion?: string;
    id_usuario_gestor?: number;
    fecha_radicacion?: string;
    fecha_categorizacion?: string;
    fecha_ultimo_avance?: string;
    fecha_finalizacion?: string;
    PropiedadHorizontal?: PropiedadHorizontal;
    Categoria?: CategoriaPqrs;
    Archivos?: ArchivoPqrs[];
    Avances?: AvancePqrs[];
}
