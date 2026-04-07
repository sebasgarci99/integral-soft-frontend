export interface TipoArchivoAdjunto {
    id_tipo_archivo?: number;
    nombre_tipo: string;
    descripcion: string;
    activo?: boolean;
    tiene_archivo?: boolean;
    nombre_archivo?: string | null;
    fecha_carga?: string | null;
}

export interface ArchivoAdjunto {
    id_archivo: number;
    id_tipo_archivo: number;
    nombre_tipo: string;
    descripcion_tipo: string;
    nombre_original: string;
    mime_type: string;
    fecha_carga: string;
}

export interface TipoArchivoResponse {
    msg: string;
    state: string;
    body: TipoArchivoAdjunto | TipoArchivoAdjunto[];
}

export interface ArchivoResponse {
    msg: string;
    state: string;
    body: ArchivoAdjunto | ArchivoAdjunto[];
}
