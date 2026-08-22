export interface DatosCalculoEmpleado {
    periodicidad: 'mensual' | 'quincenal';
    salarioBase: number;
    diasTrabajados: number;
    diasIncapacidad: number;
    aplicaAuxilioTransporte: boolean;
    smmlv: number;
    auxilioTransporte: number;
    uvt: number;
    tipoContrato: 'indefinido' | 'fijo' | 'prestacion_servicios' | 'obra_labor';
    claseRiesgo: 1 | 2 | 3 | 4 | 5;
    porcentajeSaludEmpleado: number;
    porcentajeSaludEmpresa: number;
    porcentajePensionEmpleado: number;
    porcentajePensionEmpresa: number;
    porcentajeSENA: number;
    porcentajeICBF: number;
    porcentajeCajas: number;
    horasExtrasDiurnas: number;
    horasExtrasNocturnas: number;
    recargoNocturno: number;
    recargoDominicalFestivo: number;
    horasExtrasDominicalDiurna: number;
    horasExtrasDominicalNocturna: number;
    aplicaFondoSolidaridad: boolean;
    porcentajeFondoSolidaridad: number;
    aplicaRetencionFuente: boolean;
    aplicaIndemnizacion: boolean;
    auxilioAutomatico?: boolean;
    salarioEnSmmlv?: boolean;
    cantidadSmmlv?: number;
    mesesContratoFijoRestantes?: number;
    anosTrabajados?: number;
}

export interface ResultadoCalculoEmpleado {
    devengados: {
        salario: number;
        auxilioTransporte: number;
        horasExtrasDiurnas: number;
        horasExtrasNocturnas: number;
        recargoNocturno: number;
        recargoDominicalFestivo: number;
        horasExtrasDominicalDiurna: number;
        horasExtrasDominicalNocturna: number;
        incapacidades: number;
        totalDevengados: number;
    };
    deducciones: {
        saludEmpleado: number;
        pensionEmpleado: number;
        fondoSolidaridad: number;
        retencionFuente: number;
        totalDeducciones: number;
    };
    aportesEmpresa: {
        salud: number;
        pension: number;
        arl: number;
        sena: number;
        icbf: number;
        cajasCompensacion: number;
        totalAportes: number;
    };
    provisiones: {
        prima: number;
        cesantias: number;
        interesesCesantias: number;
        vacaciones: number;
        totalProvisiones: number;
    };
    liquidacion?: {
        indemnizacion: number;
        vacacionesPendientes: number;
        primaPendiente: number;
        cesantiasPendientes: number;
        interesesPendientes: number;
        totalLiquidacion: number;
    };
    totales: {
        netoPagar: number;
        costoTotalEmpresa: number;
    };
}

export interface CalculoEmpleadoResponse {
    msg: string;
    state: string;
    body: ResultadoCalculoEmpleado;
}
