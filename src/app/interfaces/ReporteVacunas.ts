export interface VacunacionDetalle {
    mes_vacunacion: number;
    fecha_vacunacion: Date;
    lote_vacuna_aplicada: string;
    dosis_aplicada: number;
}

export interface VacunaGrupo {
    key: string;
    nombre_vacuna: string;
    nombre_laboratorio: string;
    cantidad_dosis_parametrizada: number;
    detalle: VacunacionDetalle[];
}

export interface VacunacionAnioGrupo {
    anio: number;
    vacunas: VacunaGrupo[];
}