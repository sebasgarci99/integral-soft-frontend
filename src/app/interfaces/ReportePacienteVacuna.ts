export interface ReportePacienteVacuna {
    anio: number;
    nombreCompleto: string;
    documento: string;
    fechaNacimiento: Date;
    sexo: string;
    telefono: string;
    email: string | null;
    vacuna: string;
    fechaVacuna: Date;
    lote: string;
    edad: number | string;
    dosis: string | null;

    mesVacunacion?: number;
    tipoDocumento?: string;
    aplicaAcudiente?: boolean;
    acudiente?: string | null;
}

export interface VacunaDetalle {
    vacuna: string;
    fechaVacuna: Date;
    lote: string;
    dosis: string;
    edad: string;
}

export interface PacienteGrupo {
    key: string;
    nombreCompleto: string;
    documento: string;
    sexo: string;
    telefono: string;
    email: string;
    vacunas: VacunaDetalle[];
}

export interface AnioGrupo {
    key: number;
    anio: number;
    pacientes: PacienteGrupo[];
}
