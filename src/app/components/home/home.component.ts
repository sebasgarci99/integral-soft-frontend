import { Component, OnDestroy, OnInit, ViewChild, LOCALE_ID } from '@angular/core';
import { LoginService } from '../../services/login/login.service';
import { ReportesService } from '../../services/reportes/reportes.service';
import { SecureStorageService } from '../../services/secure-storage.service';

import { CommonModule, registerLocaleData } from '@angular/common';
import { Router } from '@angular/router';
import localeEs from '@angular/common/locales/es';

import { ChartModule, UIChart } from 'primeng/chart';
import { firstValueFrom } from 'rxjs';
import { GraficaUsuario } from '../../interfaces/GraficaUsuario';

registerLocaleData(localeEs);

@Component({
    selector: 'app-home',
    imports: [CommonModule, UIChart],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css',
    providers: [{ provide: LOCALE_ID, useValue: 'es' }]
})
export class HomeComponent implements OnInit, OnDestroy {

    // @ViewChild('graficaMesActualConsultorio') chartComponent: any;

    usuarioLogeado: boolean = false;
    datosUsuario: any = {};

    hoy: Date = new Date();

    chartData: any;
    chartOptions: any;

    chartDataMesActual: any;
    chartOptionsMesActual: any;

    chartDataMesActualConsultorio: any;
    chartOptionsMesActualConsultorio: any;

    graficaxUsuario: any = [];

    private readonly PALETA_GRAFICAS = [
        '#0d8aa6',
        '#3ba9c2',
        '#6cc3d5',
        '#1a5f7a',
        '#9ad8e5',
        '#2ecc71',
        '#34495e'
    ];

    menuVisible = false;

    constructor(
        private loginService: LoginService,
        public router: Router,
        private ReportesService: ReportesService,
        private secureStorage: SecureStorageService
    ) {
        console.log('Constructor del HOME');
    }

    async ngOnInit() {
        console.log('OnInit');
        await this.cargarDatosUsuario();

        // this.cargarGraficaResumenMes();
        // this.cargarGraficaPolarResumenMesActual();
        // this.cargarGraficaResumenMesConsultorio();
    }

    ngOnDestroy(): void {
        this.loginService.currentUserData.unsubscribe();
        this.loginService.currentUserLogin.unsubscribe();
    }

    // ngAfterViewInit() {
    //     const cantidadConsultorios = this.chartDataMesActualConsultorio?.labels?.length || 0;
    //     const altura = cantidadConsultorios * 0; // 60px por fila

    //     if (this.chartComponent?.chart) {
    //         const canvas = this.chartComponent.chart.canvas;
    //         if (canvas) {
    //         canvas.parentNode.style.height = `${altura}px`;
    //         }
    //         this.chartComponent.chart.resize();
    //     }
    // }

    toggleMenu() {
        this.menuVisible = !this.menuVisible;
    }

    async cargarGraficaResumenMes() {
        (await this.ReportesService.obtenerReporteResumenMes()).subscribe((data) => {
            const response = data;

            const meses = response.map((e: any) => e.nombre_mes);

            const categorias = [
                'no_aprovechables',
                'biosanitarios',
                'cortopunzantes_ng',
                'cortopunzantes_k',
                'anatomopatologicos',
                'farmacos',
                'chatarra_electronica',
                'pilas',
                'quimicos',
                'iluminarias'
            ];

            const datasets = data.map((mesItem: any) => {
                const valores = categorias.map(cat => parseFloat(mesItem[cat]));

                return {
                    label: mesItem.nombre_mes,
                    data: valores,
                    fill: false,
                    tension: 0.4, // líneas suavizadas
                    pointRadius: 4,
                    pointHoverRadius: 6
                    // sin color definido, Chart.js asignará automáticamente
                };
            });

            this.chartData = {
                labels: categorias.map(cat => this.formatCategoria(cat)),
                datasets
            };

            this.chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#444'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#666'
                        },
                        title: {
                            display: true,
                            text: 'Categorías',
                            color: '#444'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#666'
                        },
                        title: {
                            display: true,
                            text: 'Valor',
                            color: '#444'
                        }
                    }
                }
            };
        });
    }

    async cargarGraficaPolarResumenMesActual() {
        (await this.ReportesService.obtenerReporteResumenMesActual()).subscribe((response: any) => {

            const data = response[0];  // solo usamos el primer objeto
            const nombreMes = data.nombre_mes;

            const categorias = [
                'no_aprovechables',
                'biosanitarios',
                'cortopunzantes_ng',
                'cortopunzantes_k',
                'anatomopatologicos',
                'farmacos',
                'chatarra_electronica',
                'pilas',
                'quimicos',
                'iluminarias'
            ];

            const labels = categorias.map(cat => this.formatCategoria(cat));
            const valores = categorias.map(cat => parseFloat(data[cat]));

            this.chartDataMesActual = {
                labels: labels,
                datasets: [
                    {
                        label: `Resumen residuos - ${nombreMes}`,
                        data: valores
                        // No definas backgroundColor: Chart.js lo hará automático
                    }
                ]
            };

            this.chartOptionsMesActual = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#444'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context: any) {
                                return `${context.label}: ${context.parsed.r}`;
                            }
                        }
                    }
                }
            };
        });
    }

    async cargarGraficaResumenMesConsultorio() {
        (await this.ReportesService.obtenerReporteResumenMesActualConsultorio()).subscribe((response: any) => {
            const datos = response;
            const nombreMes = datos.nombre_mes;

            const labels = datos.map((e: any) => e.consultorio);
            const valores = datos.map((e: any) => parseFloat(e.total));

            this.chartDataMesActualConsultorio = {
                labels: labels,
                datasets: [
                    {
                        label: `∑ total de residuos`,
                        data: valores,
                        fill: false,
                        borderWidth: 1,
                        tension: 0.4,
                        pointRadius: 1,
                        pointHoverRadius: 7
                    }
                ]
            };

            this.chartOptionsMesActualConsultorio = {
                indexAxis: 'y', // ← Esto convierte la gráfica a horizontal
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#444'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context: any) {
                                return `Peso total: ${context.parsed.x}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Consultorio',
                            color: '#333'
                        },
                        ticks: {
                            color: '#444'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Total residuos (kg)',
                            color: '#333'
                        },
                        ticks: {
                            color: '#444'
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart'
                }
            };
        });
    }

    async cargarGraficasxUsuario(): Promise<void> {
        try {
            const graficas = await firstValueFrom(
                await this.ReportesService.obtenerReportesxUsuario()
            );

            this.graficaxUsuario = graficas.map((grafica: any) => {

                const config = grafica.configuracion || {};
                const categorias: string[] = config.categorias || [];
                let datos: any[] = [];

                if (Array.isArray(grafica.datos)) {
                    if (typeof grafica.datos[0] === 'number') {
                        datos = [{ total_pacientes: grafica.datos[0] }];
                    } else {
                        datos = grafica.datos;
                    }
                }

                const isSingleDataset = ['polarArea', 'doughnut', 'pie'].includes(
                    config.chartType
                );
                const esBarra = ['bar'].includes(config.chartType);
                const esLinea = ['line'].includes(config.chartType);
                const esCircular = ['doughnut', 'pie'].includes(config.chartType);

                const datasets = isSingleDataset
                    ? [{
                        data: categorias.map(cat => Number(datos[0]?.[cat] ?? 0)),
                        backgroundColor: this.generarColores(categorias.length, 0),
                        borderColor: '#ffffff',
                        borderWidth: 2,
                        hoverOffset: 8,
                        ...(esCircular ? { cutout: '65%' } : {})
                    }]
                    : datos.map((item: any, index: number) => {
                        const colorBase = this.PALETA_GRAFICAS[index % this.PALETA_GRAFICAS.length];
                        const fondo = esLinea
                            ? this.crearGradienteLinea(colorBase)
                            : this.generarColores(categorias.length, index);
                        return {
                            label: this.resolveDatasetLabel(item, index, grafica),
                            data: categorias.map(cat => Number(item?.[cat] ?? 0)),
                            fill: esLinea ? true : false,
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 8,
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: colorBase,
                            pointBorderWidth: 2,
                            borderWidth: esLinea ? 3 : 1,
                            backgroundColor: fondo,
                            borderColor: colorBase,
                            ...(esBarra ? {
                                borderRadius: 8,
                                borderSkipped: false,
                                barThickness: 'flex',
                                maxBarThickness: 40
                            } : {})
                        };
                    });

                const chartOptions = this.mejorarOpcionesGrafica(config.chartType, config.chartOptions || {});

                return {
                    ...grafica,
                    chartData: {
                        labels: categorias.map(cat => this.formatCategoria(cat)),
                        datasets
                    },
                    configOptions: chartOptions
                };
            });

        } catch (error) {
            console.error('Error cargando gráficas por usuario', error);
            this.graficaxUsuario = [];
        }
    }


    formatCategoria(cat: string): string {
        return cat
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    async cargarDatosUsuario() {
        const [idEmpresa, idRol, moduloRegPeso] = await Promise.all([
            this.secureStorage.getItem('idEmpresa'),
            this.secureStorage.getItem('idRol'),
            this.secureStorage.getItem('moduloRegPeso')
        ]);
        this.datosUsuario = {
            "idEmpresa": idEmpresa,
            "idRol": idRol,
            "tieneModuloRegPeso": moduloRegPeso
        }

        await this.cargarGraficasxUsuario();
    }

    getGraficasEnFilas(): any[][] {
        const filas: any[][] = [];

        for (let i = 0; i < this.graficaxUsuario.length; i += 2) {
            filas.push(this.graficaxUsuario.slice(i, i + 2));
        }

        return filas;
    }

    private resolveDatasetLabel(
        item: any,
        index: number,
        grafica: any
    ): string {

        const labelField = grafica?.configuracion?.labelField;

        if (labelField && item?.[labelField] !== undefined) {
            return String(item[labelField]);
        }

        return `Serie ${index + 1}`;
    }

    private generarColores(cantidad: number, serieIndex: number = 0, soloBorde: boolean = false): string[] {
        const colores: string[] = [];
        for (let i = 0; i < cantidad; i++) {
            const base = this.PALETA_GRAFICAS[(serieIndex + i) % this.PALETA_GRAFICAS.length];
            colores.push(soloBorde ? base : `${base}cc`);
        }
        return colores;
    }

    private crearGradienteLinea(colorBase: string): any {
        return (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return colorBase;
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, `${colorBase}10`);
            gradient.addColorStop(1, `${colorBase}60`);
            return gradient;
        };
    }

    private mejorarOpcionesGrafica(tipo: string, opciones: any): any {
        const mejoradas: any = {
            responsive: true,
            maintainAspectRatio: false,
            ...opciones
        };

        const pluginsBase = {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    color: '#1a3a4c',
                    font: {
                        family: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                        size: 12
                    },
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    pointRadius: 6
                }
            },
            tooltip: {
                backgroundColor: '#ffffff',
                titleColor: '#1a3a4c',
                bodyColor: '#5a7a8a',
                borderColor: 'rgba(13, 138, 166, 0.2)',
                borderWidth: 1,
                cornerRadius: 10,
                padding: 12,
                displayColors: true,
                boxPadding: 4,
                usePointStyle: true,
                titleFont: {
                    family: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                    size: 13,
                    weight: '600'
                },
                bodyFont: {
                    family: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                    size: 12
                }
            }
        };

        mejoradas.plugins = {
            ...pluginsBase,
            ...(opciones.plugins || {})
        };

        if (['line', 'bar'].includes(tipo)) {
            mejoradas.scales = mejoradas.scales || {};
            ['x', 'y'].forEach(eje => {
                if (!mejoradas.scales[eje]) mejoradas.scales[eje] = {};
                mejoradas.scales[eje] = {
                    ...mejoradas.scales[eje],
                    grid: {
                        ...mejoradas.scales[eje].grid,
                        color: '#e5f0f4',
                        drawBorder: false
                    },
                    ticks: {
                        ...mejoradas.scales[eje].ticks,
                        color: '#5a7a8a',
                        font: {
                            family: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                            size: 11
                        }
                    }
                };
            });
        }

        return mejoradas;
    }
}
