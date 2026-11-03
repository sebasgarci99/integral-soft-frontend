export interface Contacto {
    nombre: string;
    rol: string;
    telefono: string;
    whatsappUrl: string;
    iniciales: string;
}

export interface Servicio {
    id: string;
    titulo: string;
    descripcion: string;
    items: string[];
    iconPath: string;
    acento: string;
    imagen: string;
    altImagen: string;
}

export interface Paso {
    numero: string;
    titulo: string;
    descripcion: string;
}

const construirWhatsapp = (numero: string, mensaje: string): string =>
    `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

export const SITE = {
    marca: {
        nombre: 'GC Gestión de Apoyo',
        corto: 'GC',
        descripcion:
            'Consultoría certificada en SG-SST, gestión ambiental, calidad en salud y mejora de procesos.',
        logoCompleto: 'assets/gc-logo.png',
        logoMarca: 'assets/gc-mark.png'
    },
    software: {
        nombre: 'Integral Soft',
        autor: 'Juan Sebastián García',
        descripcion:
            'Software a la medida para empresas que necesitan orden, trazabilidad y agilidad.',
        url: 'https://integral-soft.com.co',
        logo: 'assets/integral-soft.png',
        imagen: 'assets/photos/strategy.jpg'
    },
    fotos: {
        hero: 'assets/photos/consulting.jpg',
        consultoria: 'assets/photos/training.jpg',
        equipo: 'assets/photos/team-meeting.jpg',
        reunion: 'assets/photos/meeting.jpg',
        proceso: 'assets/photos/engineer-2.jpg',
        contacto: 'assets/photos/collaboration.jpg'
    },
    correo: 'gcgestiondeapoyo@gmail.com',
    ciudad: 'Colombia',
    atencion: 'Acompañamiento presencial y remoto',
    contacts: [
        {
            nombre: 'Carlos Andrés García',
            rol: 'Consultoría y acompañamiento',
            telefono: '300 404 7809',
            whatsappUrl: construirWhatsapp(
                '573004047809',
                'Hola Carlos, quiero agendar un diagnóstico de GC Gestión de Apoyo.'
            ),
            iniciales: 'CG'
        },
        {
            nombre: 'Juan Sebastián García',
            rol: 'Desarrollo de software',
            telefono: '310 385 1296',
            whatsappUrl: construirWhatsapp(
                '573103851296',
                'Hola Sebastián, quiero información sobre las soluciones de Integral Soft.'
            ),
            iniciales: 'SG'
        }
    ] as Contacto[],
    servicios: [
        {
            id: 'sg-sst',
            titulo: 'Asesoría en SG-SST',
            descripcion:
                'Asesoría integral, personalizada y adecuada al tipo de empresa y a los recursos disponibles.',
            items: [
                'Diseño e implementación del SG-SST',
                'Matriz de riesgos y plan de acción',
                'Capacitaciones y acompañamiento',
                'Auditorías y seguimiento'
            ],
            iconPath:
                'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3zM9 12l2 2 4-4',
            acento: '#0b4f9c',
            imagen: 'assets/photos/safety.jpg',
            altImagen: 'Trabajador industrial usando protección y herramientas'
        },
        {
            id: 'ambiental',
            titulo: 'Asesoría ambiental',
            descripcion:
                'Gestión ambiental con enfoque técnico, cumplimiento normativo y manejo responsable de residuos.',
            items: [
                'PGIRS residencial y comercial',
                'PGIRASA para servicios de salud',
                'Vertimientos y permisos ambientales',
                'Capacitaciones y manejo de residuos'
            ],
            iconPath: 'M5 19c8 1 14-5 14-14-9 0-15 6-14 14zM5 19c3-4 6-7 10-9',
            acento: '#2f8f46',
            imagen: 'assets/photos/nature.jpg',
            altImagen: 'Bosque y entorno natural como símbolo de gestión ambiental'
        },
        {
            id: 'calidad-salud',
            titulo: 'Calidad en salud',
            descripcion:
                'Procesos más seguros, servicios habilitados y una experiencia centrada en el usuario.',
            items: [
                'Habilitación de servicios de salud',
                'Mejoramiento de procesos',
                'Autoevaluación y planes de mejora',
                'Preparación para visitas y auditorías'
            ],
            iconPath:
                'M12 21s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.5-7 10-7 10zM3 12h4l2-3 3 7 2-4h4',
            acento: '#1877c9',
            imagen: 'assets/photos/health.jpg',
            altImagen: 'Profesional de la salud revisando información en su teléfono'
        },
        {
            id: 'procesos',
            titulo: 'Mejora de procesos internos',
            descripcion:
                'Reorganizamos el flujo de trabajo para que la operación sea clara, medible y sostenible.',
            items: [
                'Diagnóstico organizacional',
                'Rediseño de procesos y roles',
                'Indicadores y control de gestión',
                'Acompañamiento en la implementación'
            ],
            iconPath: 'M4 6h6v5H4zM14 13h6v5h-6zM10 8.5h4M17 11v2',
            acento: '#5b6b7c',
            imagen: 'assets/photos/engineer.jpg',
            altImagen: 'Persona revisando planos técnicos y midiendo un proceso'
        },
        {
            id: 'software',
            titulo: 'Software a la medida',
            descripcion:
                'Tecnología que aterriza los procesos en herramientas reales, ágiles y fáciles de usar.',
            items: [
                'Soluciones para propiedades horizontales',
                'Plataformas para el sector salud',
                'Inventario, POS y trazabilidad',
                'PQRS, SG-SST y automatización'
            ],
            iconPath: 'M8 9l-3 3 3 3M16 9l3 3-3 3M13 7l-2 10',
            acento: '#1877c9',
            imagen: 'assets/photos/team-meeting.jpg',
            altImagen: 'Equipo de personas trabajando con computadores'
        }
    ] as Servicio[],
    pasos: [
        {
            numero: '01',
            titulo: 'Diagnóstico',
            descripcion:
                'Escuchamos, revisamos documentos y priorizamos lo que realmente necesita tu empresa.'
        },
        {
            numero: '02',
            titulo: 'Plan de trabajo',
            descripcion:
                'Definimos una ruta medible, con responsables y alcance ajustado a tus recursos.'
        },
        {
            numero: '03',
            titulo: 'Implementación',
            descripcion:
                'Acompañamos en campo, documentamos y capacitamos a tu equipo paso a paso.'
        },
        {
            numero: '04',
            titulo: 'Seguimiento',
            descripcion:
                'Medimos indicadores, auditamos y ajustamos para que la mejora se sostenga.'
        }
    ] as Paso[],
    sectores: [
        'Propiedades horizontales',
        'Sector salud',
        'Empresas y comercios',
        'Obras y servicios'
    ],
    softwareFeatures: [
        {
            titulo: 'Aplicaciones web a la medida',
            descripcion: 'Sistemas que se adaptan a tu operación y no al contrario.'
        },
        {
            titulo: 'Automatización de procesos',
            descripcion: 'Menos tareas manuales, más tiempo para lo importante.'
        },
        {
            titulo: 'Trazabilidad y reportes',
            descripcion: 'Información clara para decidir con datos, no con suposiciones.'
        },
        {
            titulo: 'Soporte y evolución',
            descripcion: 'Acompañamiento continuo para que la herramienta crezca contigo.'
        }
    ],
    correoUrl: `mailto:gcgestiondeapoyo@gmail.com?subject=${encodeURIComponent(
        'Solicitud de asesoría - GC Gestión de Apoyo'
    )}`
} as const;
