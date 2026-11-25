import { EstandarGrupo, EstandarOpcion } from '../interfaces/sg-sst-estandares';

const OPCIONES_AMENAZAS: EstandarOpcion[] = [
    {
        id: 'inspeccion-extintores',
        nombre: 'Inspección de extintores',
        icono: 'fa fa-fire-extinguisher',
        descripcion: 'Ubicación, señalización, presión, vencimiento y estado general de los extintores.'
    },
    {
        id: 'inspeccion-botiquines',
        nombre: 'Inspección de botiquines',
        icono: 'fa fa-briefcase-medical',
        descripcion: 'Dotación, fechas de vencimiento y condiciones de almacenamiento del botiquín.'
    },
    {
        id: 'inspeccion-seguridad',
        nombre: 'Inspección de seguridad',
        icono: 'fa fa-list-check',
        descripcion: 'Recorrido de instalaciones, rutas de evacuación y condiciones seguras de trabajo.'
    },
    {
        id: 'plan-emergencias',
        nombre: 'Plan de emergencias',
        icono: 'fa fa-truck-medical',
        descripcion: 'Revisión y actualización del plan de emergencias, brigadas y simulacros.'
    }
];

export const ESTANDARES_SG_SST: EstandarGrupo[] = [
    {
        id: 'recursos',
        nombre: 'Gestión de Recursos',
        icono: 'fa fa-boxes-stacked',
        colorDesde: '#1e3a8a',
        colorHasta: '#2563eb',
        descripcion: 'Recursos humanos, físicos y financieros asignados al Sistema de Gestión de la Seguridad.',
        opciones: []
    },
    {
        id: 'sistema-gestion',
        nombre: 'Gestión Integral del Sistema de Gestión de la Seguridad',
        icono: 'fa fa-shield-heart',
        colorDesde: '#0f766e',
        colorHasta: '#15803d',
        descripcion: 'Política, objetivos, roles, responsabilidades y documentación del SG-SST.',
        opciones: []
    },
    {
        id: 'salud',
        nombre: 'Gestión de la Salud',
        icono: 'fa fa-heart-pulse',
        colorDesde: '#9f1239',
        colorHasta: '#be123c',
        descripcion: 'Vigilancia de la salud, exámenes médicos y promoción de estilos de vida saludables.',
        opciones: []
    },
    {
        id: 'peligros-riesgos',
        nombre: 'Gestión de Peligros y Riesgos',
        icono: 'fa fa-triangle-exclamation',
        colorDesde: '#b45309',
        colorHasta: '#d97706',
        descripcion: 'Identificación de peligros, evaluación, valoración y control de los riesgos.',
        opciones: []
    },
    {
        id: 'amenazas',
        nombre: 'Gestión de Amenazas',
        icono: 'fa fa-fire-extinguisher',
        colorDesde: '#6d28d9',
        colorHasta: '#7c3aed',
        descripcion: 'Prevención, preparación y respuesta ante amenazas y emergencias.',
        opciones: OPCIONES_AMENAZAS
    },
    {
        id: 'verificacion',
        nombre: 'Verificación del SG-SST',
        icono: 'fa fa-clipboard-check',
        colorDesde: '#0369a1',
        colorHasta: '#0891b2',
        descripcion: 'Evaluación del cumplimiento, auditorías e indicadores del sistema.',
        opciones: []
    },
    {
        id: 'mejoramiento',
        nombre: 'Mejoramiento',
        icono: 'fa fa-arrow-trend-up',
        colorDesde: '#047857',
        colorHasta: '#059669',
        descripcion: 'Acciones correctivas, preventivas y de mejora continua del SG-SST.',
        opciones: []
    }
];

export function buscarGrupo(id: string): EstandarGrupo | undefined {
    return ESTANDARES_SG_SST.find(grupo => grupo.id === id);
}

export function buscarOpcion(grupoId: string, opcionId: string): EstandarOpcion | undefined {
    return buscarGrupo(grupoId)?.opciones.find(opcion => opcion.id === opcionId);
}
