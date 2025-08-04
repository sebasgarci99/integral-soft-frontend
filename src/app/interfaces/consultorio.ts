export interface Consultorio {
    id: number;
    codigo: string;
    descripcion: string;
    nombre_representante: string;
    info_recoleccion: string;
    piso_ubicacion: string;
    aforo: number;
    correo: string;
    estado: string;
    id_usuario: number;
}

export interface ConsultoriosResponse {
    msg: string;
    state: string;
    body: Consultorio[];
}