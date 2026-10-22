export interface SgSstGrupo {
    id_tipo_grupo?: number;
    codigo: string;
    nombre: string;
    color?: string | null;
    icono?: string | null;
    descripcion?: string | null;
    prioridad: number;
    estado?: 'A' | 'I';
    id_cliente?: number | null;
    modulo?: string;
    id_empresa?: number;
    id_usuario?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface SgSstBitacora {
    id_bitacora?: number;
    fecha: string;
    id_tipo_grupo?: number | null;
    id_cliente?: number | null;
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
    origen?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SgSstEvidencia {
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

export interface SgSstTarea {
    id_tarea?: number;
    titulo: string;
    completada: boolean;
    fecha?: string | null;
    id_tipo_grupo?: number | null;
    id_cliente?: number | null;
}

export interface SgSstEjecucion {
    id_registro?: number;
    id_instancia?: number;
    tipo_registro?: string;
    fecha_hora?: string;
    observaciones?: string | null;
    evidencia?: SgSstEvidenciaActividad[] | null;
}

export interface SgSstEvidenciaActividad {
    tipo?: string;
    base64?: string;
    url?: string | null;
    descripcion?: string;
}

export interface SgSstInstancia {
    id_instancia: number;
    id_actividad: number;
    fecha: string;
    hora_inicio?: string | null;
    hora_fin?: string | null;
    estado: 'programada' | 'iniciada' | 'completada' | 'cancelada';
    actividad?: {
        id_actividad: number;
        titulo: string;
        descripcion?: string | null;
        duracion_minutos?: number;
        tipoGrupo?: SgSstGrupo;
    };
    registros?: SgSstEjecucion[];
}

export interface SgSstDiaDiligenciado {
    fecha: string;
    estado: 'borrador' | 'cerrada';
    tiene_resumen: boolean;
    evidencias: number;
    tareas: number;
}

export interface SgSstKpis {
    tareas_total: number;
    tareas_completadas: number;
    tareas_pendientes: number;
    actividades_total: number;
    actividades_ejecutadas: number;
    actividades_pendientes: number;
    cumplimiento: number;
}

export interface SgSstPanel {
    fecha: string;
    bitacora: SgSstBitacora | null;
    tareas: SgSstTarea[];
    instancias: SgSstInstancia[];
    total_evidencias: number;
    kpis: SgSstKpis;
}

export interface SgSstBitacoraPayload {
    bitacora: SgSstBitacora | null;
    evidencias: SgSstEvidencia[];
    tareas: SgSstTarea[];
    instancias: SgSstInstancia[];
}

export interface SgSstResumen {
    texto: string;
    planificadas: number;
    cumplimiento: number;
    horas_campo: number;
    tareas_completadas: number;
    tareas_pendientes: number;
}
