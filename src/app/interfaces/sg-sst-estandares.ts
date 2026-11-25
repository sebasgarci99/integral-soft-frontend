export interface EstandarOpcion {
    id: string;
    nombre: string;
    icono: string;
    descripcion?: string;
}

export interface EstandarGrupo {
    id: string;
    nombre: string;
    icono: string;
    colorDesde: string;
    colorHasta: string;
    descripcion: string;
    opciones: EstandarOpcion[];
}
