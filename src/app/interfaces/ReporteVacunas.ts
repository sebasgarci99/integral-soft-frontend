export interface VacunacionDetalle {
    numRegistro: number;
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

export interface VacunaPorEdad {
    numRegistro: number;
    fecha_vacuna: Date | string;
    vacuna_aplicada: string;
    lote: string;
    paciente: string;
    documento: string;
    edad: number;
    eps: string;
    sexo: string;
    email: string;
}

export interface RangoEdad {
    label: string;
    edadMin: number;
    edadMax: number | null;
}