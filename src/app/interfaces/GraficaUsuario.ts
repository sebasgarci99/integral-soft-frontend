export interface GraficaUsuario {
    idGrafica: number;
    tituloGrafica: string;
    tipoGrafica: string;
    configuracion: {
        categorias: string[];
        chartOptions: any;
    };
    datos: any[];
    chartData?: any;
}