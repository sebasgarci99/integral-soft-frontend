export interface Actividad {
    id_actividad?: number;
    titulo: string;
    descripcion?: string;
    tiposActividad?: TipoActividad[];
    fecha_inicio: string;
    fecha_fin?: string | null;
    tipo_periodicidad: string;
    dias_semana?: string;
    cada_n_dias?: number | null;
    intervalo_semanas?: number;
    hora_default?: string;
    duracion_minutos?: number;
    estado?: string;
    id_empresa?: number;
    id_usuario?: number;
    invitados?: ActividadInvitado[];
    instancias?: ActividadInstancia[];
}

export interface ActividadInvitado {
    id_invitado?: number;
    id_actividad?: number;
    id_usuario?: number;
    nombre_usuario?: string;
    estado_invite?: string;
    usuarioInvitado?: {
        id?: number;
        nombre?: string;
        apellido?: string;
        usuario?: string;
    };
}

export interface ActividadInstancia {
    id_instancia: number;
    id_actividad: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
    actividad?: Actividad;
}

export interface RegistroCumplimiento {
    id_registro: number;
    id_instancia: number;
    tipo_registro: 'inicio' | 'fin';
    fecha_hora: Date | string;
    observaciones?: string;
    evidencia?: EvidenciaItem[];
    nombre_usuario?: string;
}

export interface EvidenciaItem {
    tipo: string;
    url: string;
    descripcion?: string;
    base64?: string;
    tipos_realizados?: number[];
}

export interface TipoActividad {
    id_tipo?: number;
    nombre: string;
    descripcion?: string;
    id_empresa?: number;
}

export interface ActividadResponse {
    msg: string;
    state: 'OK' | 'NO_OK';
    body: any;
}

export interface Usuario {
    id: number;
    nombre?: string;
    apellido?: string;
    usuario: string;
    nombre_completo?: string;
}
