export interface Recoleccion {
    id_registropeso: number | null;
    fecha: Date | null;
    consultorio: string | null;

    // Paso 1 – Residuos
    aprovechablesBlanco: number | null;
    noAprovechablesNegra: number | null;
    biosanitariosRoja: number | null;
    cortopunzantesK: number | null;
    cortopunzantesNG : number | null;
    anatomopatologicos: number | null;
    farmacos: number | null;
    chatarraElectronica: number | null;
    pilas: number | null;
    quimicos: number | null;
    iluminarias: number | null;
    aceitesUsados: number | null;

    // Paso 2 – Bolsas + horarios
    bolsasGuardianes: number | null;
    bolsasBlanco: number | null;
    bolsasNegra: number | null;
    bolsasRoja: number | null;
    pretratamiento: string | null;
    almacenamientoDias: number | null;
    tratamiento: string | null;
    horaRoja: Date | null;
    horaNegra: Date | null;

    // Paso 3 – Confirmación
    dotacionGenerador: string | null;
    dotacionPseg: string | null;
    firma: string | null;
}