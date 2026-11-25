export interface SgsstResponsable {
    id_responsable: number;
    nombre: string;
    cedula?: string | null;
    profesion?: string | null;
    licencia?: string | null;
    arl?: string | null;
    firma_base64?: string | null;
    id_usuario?: number | null;
}

export interface SgsstExtintorFoto {
    id_evidencia?: number;
    mime_type?: string | null;
    archivo_base64: string;
    thumb_base64?: string | null;
    peso_bytes?: number | null;
    nombre_original?: string | null;
}

export interface SgsstExtintor {
    id_extintor?: number;
    orden?: number;
    tipo: string;
    ubicacion: string;
    capacidad: string;
    unidad: string;
    fecha_proxima_recarga?: string | null;
    proveedor?: string | null;
    criterios: Record<string, string>;
    foto?: SgsstExtintorFoto | null;
    foto_nueva?: boolean;
}

export interface SgsstRegistro {
    id_registro?: number;
    opcion?: string;
    grupo_estandar?: string;
    codigo_formato?: string;
    version_formato?: string;
    mes_registro?: string | null;
    fecha_inspeccion?: string | null;
    nombre_inspector?: string;
    cargo_inspector?: string | null;
    ciudad?: string | null;
    direccion?: string | null;
    telefono?: string | null;
    observaciones?: string | null;
    id_responsable_sst?: number | null;
    responsable_nombre?: string | null;
    responsable_cedula?: string | null;
    responsable_profesion?: string | null;
    responsable_licencia?: string | null;
    responsable_arl?: string | null;
    firma_base64?: string | null;
    estado?: 'borrador' | 'cerrada';
    total_extintores?: number;
    total_fotos?: number;
    peso_bytes?: number;
    extintores?: SgsstExtintor[];
}

export interface SgsstRegistroPayload {
    id_registro?: number;
    id_cliente: number;
    mes_registro: string;
    fecha_inspeccion: string;
    nombre_inspector: string;
    cargo_inspector: string;
    ciudad: string;
    direccion: string;
    telefono: string;
    observaciones: string;
    id_responsable_sst: number | null;
    firma_base64: string | null;
    estado: 'borrador' | 'cerrada';
    extintores: SgsstExtintor[];
}
