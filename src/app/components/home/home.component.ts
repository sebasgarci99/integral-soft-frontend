import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { LoginService } from '../../services/login/login.service';
import { ReportesService } from '../../services/reportes/reportes.service';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ChartModule, UIChart } from 'primeng/chart';
import { firstValueFrom } from 'rxjs';
import { GraficaUsuario } from '../../interfaces/GraficaUsuario';

@Component({
    selector: 'app-home',
    imports: [SidebarComponent, CommonModule, UIChart],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {

    // @ViewChild('graficaMesActualConsultorio') chartComponent: any;

    usuarioLogeado: boolean = false;
    datosUsuario: any;

    chartData: any;
    chartOptions: any;

    chartDataMesActual: any;
    chartOptionsMesActual: any;

    chartDataMesActualConsultorio: any;
    chartOptionsMesActualConsultorio: any;

    graficaxUsuario: any;

    menuVisible = false;

    constructor(
        private loginService: LoginService,
        public router: Router,
        private ReportesService: ReportesService
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

    cargarGraficaResumenMes() {
        this.ReportesService.obtenerReporteResumenMes().subscribe((data) => {
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

    cargarGraficaPolarResumenMesActual() {
        this.ReportesService.obtenerReporteResumenMesActual().subscribe((response: any) => {

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

    cargarGraficaResumenMesConsultorio() {
        this.ReportesService.obtenerReporteResumenMesActualConsultorio().subscribe((response: any) => {
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
            const graficas = await firstValueFrom(this.ReportesService.obtenerReportesxUsuario());

            this.graficaxUsuario = graficas.map((grafica: any) => {
                console.log(grafica);
                const categorias: string[] = grafica.configuracion?.categorias || [];
                const datos: any[] = grafica.datos || [];

                const datasets = datos.map((item: any) => ({
                    label: item.nombre_mes,
                    data: categorias.map(cat => Number(item?.[cat] ?? 0)),
                    fill: false,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }));

                return {
                    ...grafica,
                    chartData: {
                        labels: categorias.map(cat => this.formatCategoria(cat)),
                        datasets
                    }
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
        this.datosUsuario = {
            "idEmpresa": localStorage.getItem('idEmpresa'),
            "idRol": localStorage.getItem('idRol'),
            "tieneModuloRegPeso": localStorage.getItem('moduloRegPeso')
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
}
