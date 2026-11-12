export interface HcEspecialidadUsuario {
    id_especialidad: number;
    codigo: string;
    nombre: string;
    codigo_rips?: string;
    registro_profesional?: string;
    documento_profesional?: string;
    tipo_documento_profesional?: string;
    es_principal?: boolean;
    puede_datos_privados?: boolean;
}

export interface HcPermisos {
    habilitado: boolean;
    especialidades: HcEspecialidadUsuario[];
    especialidad_principal: HcEspecialidadUsuario | null;
    correo_configurado: boolean;
    correo: string | null;
    usuario?: { id?: number; usuario?: string; nombre_completo?: string; documento?: string | null };
    rol: number;
    puede_privado: boolean;
}

export interface HcPacienteResumen {
    id_paciente: number;
    nombres: string;
    apellidos: string;
    tipo_documento: string;
    numero_documento: string;
    fecha_nacimiento?: string | Date;
    sexo?: string;
    correo_electronico?: string;
    eps?: string;
    regimen?: string;
    id_empresa?: number;
}

export interface HcHistoria {
    id_historia: number;
    id_paciente: number;
    id_cita?: number | null;
    id_empresa: number;
    id_especialidad: number;
    id_usuario_crea: number;
    id_usuario_edita?: number | null;
    id_historia_origen?: number | null;
    fecha_atencion: string;
    tipo_registro: string;
    motivo: string;
    estado: 'BORRADOR' | 'FINALIZADA' | 'ANULADA' | string;
    diagnostico_principal: string;
    paciente_nombre_snapshot?: string;
    paciente_documento_snapshot?: string;
    paciente_edad_snapshot?: number;
    empresa_snapshot?: string;
    profesional_nombre_snapshot?: string;
    profesional_documento_snapshot?: string;
    profesional_registro_snapshot?: string;
    hash_integridad?: string | null;
    finalizada_at?: string | null;
    anulada_at?: string | null;
    motivo_anulacion?: string | null;
    created_at?: string;
    updated_at?: string;
    especialidad: string;
    especialidad_codigo: string;
    usuario_nombre?: string;
    usuario_apellido?: string;
    puede_editar?: boolean;
    es_creador?: boolean;
}

export interface HcHistoriaPacienteResponse {
    paciente: HcPacienteResumen;
    historias: HcHistoria[];
}

export interface HcHistoriaDetalle {
    historia: HcHistoria;
    datos: Record<string, any>;
}

export interface HcRegistroPayload {
    id_paciente: number;
    id_cita?: number | null;
    id_especialidad: number;
    fecha_atencion: string;
    tipo_registro: string;
    motivo: string;
    diagnostico_principal?: string;
    datos: Record<string, any>;
    id_historia_origen?: number | null;
}

export interface HcSolicitudOtp {
    id_otp: number;
    destino: string;
    expira_en: number;
    enviado: boolean;
    simulado: boolean;
    codigo_desarrollo?: string;
}

export interface HcVerificacionOtp {
    access_token: string;
    expira_en: number;
}

export interface HcEntradaPrivada {
    id_privado: number;
    id_historia: number;
    fecha: string;
    tipo_registro: string;
    profesional: string;
    especialidad?: string;
    created_by: number;
    es_creador: boolean;
    datos: Record<string, any>;
}

export interface HcDatosPrivadosResponse {
    entradas: HcEntradaPrivada[];
}

export interface HcAuditoriaPrivada {
    id_acceso: number;
    id_usuario: number;
    id_historia: number | null;
    accion: string;
    canal?: string;
    ip?: string;
    detalle?: string;
    created_at: string;
    usuario?: string;
}

export interface HcApiResponse<T = any> {
    msg: string;
    state: 'OK' | 'NO_OK';
    body: T;
}
