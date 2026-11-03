export const PERIODICIDADES = [
    { label: 'Única', value: 'unica' },
    { label: 'Diaria', value: 'diaria' },
    { label: 'Semanal', value: 'semanal' },
    { label: 'Quincenal', value: 'quincenal' },
    { label: 'Mensual', value: 'mensual' },
    { label: 'Trimestral', value: 'trimestral' },
    { label: 'Cuatrimestral', value: 'cuatrimestral' },
    { label: 'Anual', value: 'anual' },
    { label: 'Personalizada', value: 'personalizada' }
];

const DIAS_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const esBisiesto = (anio: number): boolean =>
    (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;

const diasDelMes = (anio: number, mes: number): number => {
    if (mes === 1 && esBisiesto(anio)) return 29;
    return DIAS_MES[mes];
};

const parsearFecha = (valor: string | Date | null | undefined): Date | null => {
    if (!valor) return null;
    if (valor instanceof Date) {
        return Number.isNaN(valor.getTime()) ? null : new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(valor)) {
        const [anio, mes, dia] = valor.substring(0, 10).split('-').map(Number);
        return new Date(anio, mes - 1, dia);
    }
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
};

const hoyLocal = (): Date => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
};

const sumarMeses = (fecha: Date, meses: number, diaOriginal: number): Date => {
    const destino = new Date(fecha.getFullYear(), fecha.getMonth() + meses, 1);
    destino.setDate(Math.min(diaOriginal, diasDelMes(destino.getFullYear(), destino.getMonth())));
    return destino;
};

const formatearFecha = (fecha: Date): string => {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${fecha.getFullYear()}`;
};

export const etiquetaPeriodicidad = (periodicidad: string): string =>
    PERIODICIDADES.find(item => item.value === periodicidad)?.label || periodicidad;

export const requiereFechaFin = (periodicidad: string, periodicidadPorDefecto: string): boolean => {
    if (!periodicidad || periodicidad === 'unica') return false;
    return periodicidad === 'anual' || periodicidad !== periodicidadPorDefecto;
};

export const obtenerProximaFechaPeriodicidad = (
    fechaInicio: string | Date | null | undefined,
    periodicidad: string,
    fechaFin?: string | Date | null
): Date | null => {
    const inicio = parsearFecha(fechaInicio);
    if (!inicio) return null;

    const fin = parsearFecha(fechaFin);
    const hoy = hoyLocal();
    const desde = inicio < hoy ? hoy : inicio;

    if (periodicidad === 'unica') return inicio;

    if (periodicidad === 'diaria') {
        return desde;
    }

    if (periodicidad === 'semanal') {
        const cursor = new Date(inicio);
        while (cursor < desde) cursor.setDate(cursor.getDate() + 7);
        return cursor;
    }

    if (periodicidad === 'quincenal') {
        let anio = desde.getFullYear();
        let mes = desde.getMonth();
        while (true) {
            const candidatos = [new Date(anio, mes, 1), new Date(anio, mes, 15)];
            const siguiente = candidatos.find(f => f >= desde && f >= inicio);
            if (siguiente) return siguiente;
            mes++;
            if (mes > 11) {
                mes = 0;
                anio++;
            }
        }
    }

    if (['mensual', 'trimestral', 'cuatrimestral', 'anual', 'personalizada'].includes(periodicidad)) {
        if (periodicidad === 'personalizada') {
            return desde;
        }
        const intervalo = periodicidad === 'mensual' ? 1
            : periodicidad === 'trimestral' ? 3
                : periodicidad === 'cuatrimestral' ? 4 : 12;
        const diaOriginal = inicio.getDate();
        let paso = 0;
        let cursor = new Date(inicio);

        while (cursor < desde) {
            paso++;
            cursor = sumarMeses(inicio, paso * intervalo, diaOriginal);
        }

        if (fin && cursor > fin) {
            return null;
        }

        return cursor;
    }

    return inicio;
};

export const mensajeConfirmacionPeriodicidad = (
    periodicidad: string,
    fechaInicio: string | Date | null | undefined,
    fechaFin?: string | Date | null
): string => {
    const proxima = obtenerProximaFechaPeriodicidad(fechaInicio, periodicidad, fechaFin);
    const etiqueta = etiquetaPeriodicidad(periodicidad);
    return proxima
        ? `¿Estás seguro que deseas programar la actividad con periodicidad ${etiqueta}? La próxima fecha sería: ${formatearFecha(proxima)}.`
        : `¿Estás seguro que deseas programar la actividad con periodicidad ${etiqueta}?`;
};
