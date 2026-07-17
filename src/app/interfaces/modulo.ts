export interface Modulo {
    id_modulo: number;
    modulo: string;
    icono: string;
    ruta: string | null;
    id_padre: number | null;
    orden: number;
    es_grupo: boolean;
}

export interface ModuloPadre {
    modulo: string;
    icono: string;
    hijos: Modulo[];
}
