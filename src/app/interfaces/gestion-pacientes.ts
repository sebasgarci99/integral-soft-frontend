export interface GestionPaciente {
    id_paciente: number;
    nombres: string;
    apellidos: string;
    tipo_documento: string;
    numero_documento: string;
    fecha_nacimiento?: string | Date;
    sexo?: string;
    direccion_residencia?: string;
    municipio_residencia?: string;
    ciudad_expedicion_documento?: string;
    telefono_contacto?: string;
    correo_electronico?: string;
    estado?: string;

    // Cita activa
    id_cita?: number;
    fecha_cita?: string | Date;
    estado_cita?: string;

    // Última cita (para reagendar)
    id_ultima_cita?: number;
    fecha_ultima_cita?: string | Date;
    estado_ultima_cita?: string;

    // Antecedentes médicos
    enfermedades_actuales?: string;
    uso_medicamentos?: string;
    esta_embarazada?: boolean;
    esta_lactando?: boolean;
    reacciones_previas_vacunas?: string;
    alergias_graves?: string;
    tiene_enfermedad_actual?: boolean;
    es_alergico?: boolean;
    tiene_fiebre_actual?: boolean;
    padece_convulsiones?: boolean;
    reaccion_vacuna?: boolean;
    tenido_vacuna_ultsemanas?: boolean;

    // Datos admin
    eps?: string;
    tipo_poblacion?: string;
    nombre_acompanante?: string;
}

export interface GestionPacienteHistorico {
    id_historico?: number;
    id_paciente?: number;
    id_cita?: number;
    tipo_novedad?: string;
    descripcion?: string;
    id_usuario?: number;
    createdAt?: string;
    nombres?: string;
    apellidos?: string;
}

export interface GestionPacienteConsentimiento {
    id_consentimiento?: number;
    id_paciente?: number;
    id_cita?: number;
    tipo_consentimiento?: string;
    nombre_paciente?: string;
    num_documento_paciente?: string;
    nombre_acudiente?: string;
    num_documento_acudiente?: string;
    aplica_acudiente?: boolean;
    fecha_registro?: string;
    logo_empresa?: string;
    id_empresa?: number;
    id_usuario?: number;
    vacunas_aplicadas?: string;
    tipo_documento_acudiente?: string;
    ciudad_documento_acudiente?: string;
    tipo_documento_paciente?: string;
    procedimiento_realizar?: string;
    riesgos?: string;
    lugar_procedimiento?: string;
    relacion_acudiente?: string;
    ciudad?: string;
}

export interface GestionPacienteResponse {
    msg: string;
    state: 'OK' | 'NO_OK';
    body: any;
}

export interface TipoConsentimientoOption {
    key: string;
    label: string;
    borrador: string;
    oficial: string;
}

export interface ProcedimientoRiesgo {
    id: number;
    procedimiento: string;
    riesgos: string;
}
