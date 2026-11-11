export interface FactRipsConfig {
    id_configuracion?: number;
    id_empresa?: number;
    empresa?: string;
    nit?: string;
    cod_prestador?: string;
    direccion?: string;
    ciudad?: string;
    telefono?: string;
    email?: string;
    logo_base64?: string;
    prefijo?: string;
    consecutivo_actual?: number;
    rango_desde?: number;
    rango_hasta?: number;
    vigencia_desde?: string;
    vigencia_hasta?: string;
    modo_salida?: string;
    formato_default?: string;
    permitir_sin_consentimiento?: boolean;
    exigir_aceptacion?: boolean;
    alerta_consentimiento?: string;
    tipo_usuario_default?: string;
    modalidad_default?: string;
    finalidad_default?: string;
    causa_default?: string;
    ambito_default?: string;
    concepto_recaudo_default?: string;
    municipio_default?: string;
    zona_default?: string;
    pais_default?: string;
    plantilla_correo?: string;
    plantilla_whatsapp?: string;
    paso_actual?: number;
    configuracion_completada?: boolean;
}

export interface FactRipsCatalogoItem {
    codigo: string;
    descripcion: string;
}

export interface FactRipsCatalogos {
    config: FactRipsConfig;
    catalogos: Record<string, FactRipsCatalogoItem[]>;
    tiposCliente: FactRipsCatalogoItem[];
    modalidadesPago: FactRipsCatalogoItem[];
    tiposUsuario: FactRipsCatalogoItem[];
    modalidades: FactRipsCatalogoItem[];
    finalidades: FactRipsCatalogoItem[];
    causas: FactRipsCatalogoItem[];
    tiposDiagnostico: FactRipsCatalogoItem[];
    gruposServicio: FactRipsCatalogoItem[];
    conceptosRecaudo: FactRipsCatalogoItem[];
    especialidades: FactRipsCatalogoItem[];
}

export interface FactRipsEstadoConfiguracion {
    configuracion_completada: boolean;
    paso_actual: number;
    pasos: { numero: number; completado: boolean; opcional: boolean }[];
}

export interface FactRipsCups {
    codigo: string;
    descripcion: string;
    tipo: string;
    grupo_servicio?: string;
    cod_servicio?: string;
    modalidad_sugerida?: string;
    finalidad_sugerida?: string;
    ambito_sugerido?: string;
    valor: number;
    requiere_autorizacion?: boolean;
}

export interface FactRipsCie10 {
    codigo: string;
    descripcion: string;
    capitulo?: string;
}

export interface FactRipsMunicipio {
    codigo: string;
    nombre: string;
    departamento?: string;
}

export interface FactRipsPaciente {
    id_paciente: number;
    nombres: string;
    apellidos: string;
    tipo_documento: string;
    numero_documento: string;
    fecha_nacimiento?: string;
    sexo?: string;
    telefono_contacto?: string;
    correo_electronico?: string;
    municipio_residencia?: string;
    eps?: string;
    regimen?: string;
    id_cita?: number;
    fecha_cita?: string;
    tipo_cita?: string;
    estado_cita?: string;
    id_consentimiento?: number;
    tipo_consentimiento?: string;
    fecha_consentimiento?: string;
    id_factura_cita?: number;
    numero_factura_cita?: string;
    estado_factura_cita?: string;
    total_factura_cita?: number;
    total_facturas?: number;
    ultima_factura?: string;
    ultima_fecha_factura?: string;
    ultima_estado_factura?: string;
    ultima_total_factura?: number;
    total_registros?: number;
}

export interface FactRipsCita {
    id_cita: number;
    fecha_cita: string;
    tipo_cita?: string;
    estado_cita?: string;
    motivo?: string;
    id_consentimiento?: number;
    tipo_consentimiento?: string;
    fecha_consentimiento?: string;
    id_factura?: number;
    numero_factura?: string;
    estado_factura?: string;
    total_factura?: number;
}

export interface FactRipsConsentimiento {
    id_consentimiento: number;
    id_paciente?: number;
    id_cita?: number;
    tipo_consentimiento?: string;
    fecha_registro?: string;
    nombre_paciente?: string;
}

export interface FactRipsDetalle {
    id_detalle?: number;
    id_factura?: number;
    orden?: number;
    tipo_servicio?: string;
    codigo_cups: string;
    descripcion?: string;
    cantidad: number;
    valor_unitario: number;
    descuento: number;
    copago: number;
    cuota_moderadora: number;
    valor_total?: number;
    concepto_recaudo?: string;
    valor_pago_moderador?: number;
    num_fev_pago_moderador?: string;
    cod_diagnostico_principal?: string;
    cod_diagnostico_relacionado1?: string;
    cod_diagnostico_relacionado2?: string;
    cod_diagnostico_relacionado3?: string;
    tipo_diagnostico_principal?: string;
    cod_complicacion?: string;
    ambito?: string;
    finalidad?: string;
    causa_externa?: string;
    modalidad?: string;
    grupo_servicio?: string;
    cod_servicio?: string;
    via_ingreso?: string;
    num_autorizacion?: string;
    id_mipres?: string;
    fecha_inicio_atencion?: string;
    consecutivo?: number;
    requiere_autorizacion?: boolean;
}

export interface FactRipsFactura {
    id_factura: number;
    id_empresa?: number;
    id_paciente?: number;
    id_cita?: number;
    id_consentimiento?: number;
    numero_factura?: string;
    prefijo?: string;
    consecutivo?: number;
    fecha_factura: string;
    fecha_atencion?: string;
    tipo_cliente?: string;
    entidad_nombre?: string;
    entidad_nit?: string;
    convenio?: string;
    modalidad_pago?: string;
    regimen?: string;
    tipo_usuario?: string;
    especialidad?: string;
    subtotal?: number;
    descuento_total?: number;
    copago_total?: number;
    cuota_moderadora_total?: number;
    total?: number;
    valor_paciente?: number;
    valor_entidad?: number;
    estado?: string;
    estado_pago?: string;
    facturado_sin_consentimiento?: boolean;
    aceptado_por_usuario?: boolean;
    observacion_consentimiento?: string;
    motivo_anulacion?: string;
    json_rips?: any;
    json_rips_hash?: string;
    createdAt?: string;
    updatedAt?: string;
    // Datos de paciente en listados
    nombres?: string;
    apellidos?: string;
    tipo_documento?: string;
    numero_documento?: string;
    correo_electronico?: string;
    telefono_contacto?: string;
    total_registros?: number;
}

export interface FactRipsDashboard {
    resumen: {
        total_pacientes: number;
        con_consentimiento: number;
        sin_consentimiento_hoy: number;
        listos: number;
        facturas_mes: number;
        total_mes: number | string;
        cartera: number | string;
    };
    alertas_hoy: FactRipsPaciente[];
    ultimas_facturas: FactRipsFactura[];
    configuracion: { configuracion_completada: boolean; paso_actual: number };
    hoy: string;
}

export interface FactRipsError {
    campo: string;
    mensaje: string;
    indice?: number;
    severidad?: 'ERROR' | 'ADVERTENCIA';
}

export interface FactRipsTotales {
    subtotal: number;
    descuento_total: number;
    copago_total: number;
    cuota_moderadora_total: number;
    total: number;
    valor_paciente: number;
    valor_entidad: number;
}

export interface FactRipsValidacion {
    valido: boolean;
    errores: FactRipsError[];
    advertencias: FactRipsError[];
    totales: FactRipsTotales;
}

export interface FactRipsReporteRow {
    label: string;
    cantidad: number;
    total: number;
}

export interface FactRipsReporte {
    tipo: string;
    desde: string;
    hasta: string;
    rows: any[];
    total: number;
}

export interface FactRipsPacienteDetalle {
    paciente: FactRipsPaciente;
    citas: FactRipsCita[];
    consentimientos: FactRipsConsentimiento[];
    facturas: FactRipsFactura[];
}

export interface FactRipsFacturaDetalleResponse {
    factura: FactRipsFactura;
    detalles: FactRipsDetalle[];
    paciente?: FactRipsPaciente;
    cita?: FactRipsCita;
    config?: FactRipsConfig;
}

export interface FactRipsServicioForm extends FactRipsDetalle {
    requiere_autorizacion?: boolean;
}

export interface FactRipsWizardForm {
    id_paciente: number;
    id_cita: number | null;
    id_consentimiento?: number | null;
    fecha_factura: string;
    fecha_atencion: string;
    tipo_cliente: string;
    entidad_nombre: string;
    entidad_nit: string;
    convenio: string;
    modalidad_pago: string;
    regimen: string;
    tipo_usuario: string;
    especialidad: string;
    aceptado_por_usuario: boolean;
    observacion_consentimiento?: string;
}
