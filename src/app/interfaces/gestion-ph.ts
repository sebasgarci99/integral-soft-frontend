export interface TipoGrupo {
    id_tipo_grupo?: number;
    codigo: string;
    nombre: string;
    color?: string | null;
    icono?: string | null;
    descripcion?: string | null;
    prioridad: number;
    estado?: 'A' | 'I';
    id_empresa?: number;
    id_usuario?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface BitacoraDiaria {
    id_bitacora?: number;
    fecha: string;
    id_tipo_grupo?: number | null;
    id_responsable?: number | null;
    resumen?: string | null;
    planificadas: number;
    cumplimiento: number;
    horas_campo: number;
    total_novedades: number;
    estado: 'borrador' | 'cerrada';
    firma_base64?: string | null;
    id_usuario_cierre?: number | null;
    fecha_cierre?: string | null;
    id_empresa?: number;
    id_usuario?: number;
}

export interface BitacoraNovedad {
    id_novedad?: number;
    id_bitacora: number;
    descripcion: string;
    estado: 'pendiente' | 'atendido';
}

export interface BitacoraEvidencia {
    id_evidencia?: number;
    id_bitacora?: number;
    nombre_original?: string | null;
    mime_type?: string | null;
    archivo_base64?: string;
    thumb_base64?: string | null;
    peso_bytes?: number | null;
    descripcion?: string | null;
    orden?: number | null;
}

export interface AgendaTodo {
    id_tarea?: number;
    titulo: string;
    completada: boolean;
    fecha?: string | null;
    id_tipo_grupo?: number | null;
}

export interface BitacoraPayload {
    bitacora: BitacoraDiaria | null;
    novedades: BitacoraNovedad[];
    evidencias: BitacoraEvidencia[];
    tareas: AgendaTodo[];
}

export interface ResumenBitacora {
    texto: string;
    planificadas: number;
    cumplimiento: number;
    horas_campo: number;
    total_novedades: number;
    tareas_completadas: number;
    tareas_pendientes: number;
}
