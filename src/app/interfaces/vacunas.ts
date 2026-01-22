export interface Vacunas {
    id: number;
    nombre_vacuna: string;
    presentacion_comercial: string;
    principio_activo: string;
    concentracion: number;
    unidad_medida: string;
    fecha_lote: Date;
    fecha_vencimiento: Date;
    id_laboratorio: number
    registro_sanitario: string;
    cantidad_dosis: number;
    estado: string;
    id_empresa: number;
    id_usuario: number;
}