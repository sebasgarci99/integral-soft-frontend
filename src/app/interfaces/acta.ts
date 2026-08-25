import { EvidenciaItem } from './actividad';

export interface ResponsableSST {
    id_responsable?: number;
    id_empresa?: number;
    id_usuario?: number;
    nombre: string;
    cedula?: string;
    profesion?: string;
    licencia?: string;
    arl?: string;
    firma_base64?: string;
    estado?: string;
}

export interface CatalogoIndicador {
    id_catalogo_indicador?: number;
    id_empresa?: number;
    codigo: string;
    nombre: string;
    numero_posiciones: number;
    orden?: number;
}

export interface CatalogoCategoria {
    id_catalogo?: number;
    id_empresa?: number;
    nombre: string;
    orden?: number;
}

export interface ActaIndicador {
    id_indicador?: number;
    id_acta?: number;
    tipo_indicador: string;
    posicion: number;
    numerador?: number | null;
    denominador?: number | null;
    porcentaje?: string;
    observaciones?: string;
}

export interface ActaPendiente {
    id_pendiente?: number;
    id_acta?: number;
    categoria: string;
    descripcion: string;
    prioridad?: string;
    observaciones?: string;
    orden?: number;
    estado?: string;
}

export interface ActaActividadArchivo {
    id_archivo?: number;
    id_actividad_realizada?: number;
    nombre_original: string;
    mime_type: string;
    archivo_base64: string;
    es_imagen?: boolean;
    orden?: number;
}

export interface ActaActividadRealizada {
    id_actividad_realizada?: number;
    id_acta?: number;
    id_instancia?: number | null;
    sistema: 'SG-SST' | 'OTRAS_ACTIVIDADES' | 'INCIDENTES_ACCIDENTES';
    titulo_actividad?: string;
    descripcion: string;
    observaciones_ejecucion?: string;
    fecha_actividad?: string | null;
    orden?: number;
    estado?: string;
    archivos?: ActaActividadArchivo[];
}

export interface ActaPriorizacion {
    id_priorizacion?: number;
    id_acta?: number;
    categoria: string;
    descripcion: string;
    orden?: number;
}

export interface Acta {
    id_acta?: number;
    id_cliente?: number;
    id_empresa?: number;
    id_usuario?: number;
    id_responsable?: number | null;
    mes: string;
    fecha_acta?: string | null;
    empresa_nombre?: string;
    empresa_nit?: string;
    numero_personal_orientadores?: number;
    numero_personal_mantenimiento?: number;
    empresa_arl?: string;
    clasificacion_riesgo?: string;
    responsable_nombre?: string;
    responsable_cedula?: string;
    responsable_profesion?: string;
    responsable_licencia?: string;
    responsable_arl?: string;
    fundamento_legal?: string;
    objetivos?: string;
    version_documento?: string;
    estandar?: string;
    codigo?: string;
    estado?: string;
    version?: number;
    indicadores?: ActaIndicador[];
    pendientes?: ActaPendiente[];
    actividades_realizadas?: ActaActividadRealizada[];
    priorizaciones?: ActaPriorizacion[];
}

export interface InstanciaParaActa {
    id_instancia: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    actividad?: {
        id_actividad: number;
        titulo: string;
        descripcion?: string;
    };
    observaciones_ejecucion?: string;
    evidencia?: EvidenciaItem[];
}
