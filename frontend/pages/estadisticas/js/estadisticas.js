// Detecta automáticamente si el backend se encuentra en entorno local o producción
const API_URL_ESTADISTICAS = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'//para entorno local
    : '/api';//para que funcione en versel

// Referencias globales para destruir e instanciar nuevamente los gráficos sin superposiciones de canvas
let chartEstadoInstance = null;
let chartPrioridadInstance = null;
let chartEvolucionInstance = null;

// INICIALIZACIÓN DE LA VISTA Y VALIDACIÓN DE SESIÓN
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');// Validar presencia de token en localStorage
    if (!token) {
        window.location.href = '../../index.html';
        return;
    }

    
    loadHeaderData();//cargar perfil y datos de las métricas
    loadEstadisticas();
});

//Cierra la sesión activa borrando el localStorage y redirigiendo al inicio
function logout() {
    localStorage.clear();
    window.location.href = '../../index.html';
}

//Renderiza el Nombre Completo y el ID Tag del usuario autenticado en la barra superior
function loadHeaderData() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const nameElem = document.getElementById('user-name');
            if (nameElem) nameElem.textContent = (user.nombre_completo || 'ESTUDIANTE').toUpperCase();
            
            const tagElem = document.getElementById('user-tag');
            if (tagElem) tagElem.textContent = user.user_tag || '000000';
        } catch (e) {
            console.error('Error al parsear el usuario:', e);
        }
    }
}

//Consulta el endpoint `/estadisticas` y distribuye la información en los KPIs y gráficos de Chart.js
async function loadEstadisticas() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL_ESTADISTICAS}/estadisticas`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error en respuesta del servidor: Status ${response.status}`);
        }

        const data = await response.json();
        console.log('[DEBUG ESTADISTICAS FRONTEND] JSON Recibido:', data);

        const res = data.resumen || {};
        const prio = data.distribucion_prioridad || { ALTA: 0, MEDIA: 0, BAJA: 0 };
        const evolucion = data.evolucion_actividad || [];

        // CARGAR CARDS SUPERIORES
        const elemCompletadas = document.getElementById('kpi-completadas');
        if (elemCompletadas) elemCompletadas.textContent = res.completadas ?? 0;

        const elemEfectividad = document.getElementById('kpi-efectividad');
        if (elemEfectividad) elemEfectividad.textContent = `${res.porcentaje_efectividad ?? 0}%`;

        const elemRacha = document.getElementById('kpi-racha');
        if (elemRacha) elemRacha.textContent = `${res.racha_dias ?? 0} DÍAS`;

        const elemXp = document.getElementById('kpi-xp');
        if (elemXp) elemXp.textContent = `${res.xp_total ?? 0} XP`;

        // CARGAR MINI CARDS INFERIORES
        const elemRango = document.getElementById('card-rango-nombre');
        if (elemRango) elemRango.textContent = (res.rango_nombre || 'RANGO E').toUpperCase();

        const progressBarFill = document.getElementById('card-rango-progress');
        if (progressBarFill) {
            progressBarFill.style.width = `${res.rango_porcentaje ?? 0}%`;
        }

        const elemDiarias = document.getElementById('card-tareas-diarias');
        if (elemDiarias) elemDiarias.textContent = res.completadas_hoy ?? 0;

        const elemMes = document.getElementById('card-tareas-mes');
        if (elemMes) elemMes.textContent = res.completadas_mes ?? 0;

        //RENDERIZAR GRÁFICOS DE CHART.JS
        renderChartEstado(res.completadas ?? 0, res.pendientes ?? 0);
        renderChartPrioridad(prio.ALTA ?? 0, prio.MEDIA ?? 0, prio.BAJA ?? 0);
        renderChartEvolucion(evolucion);

    } catch (err) {
        console.error('Error al cargar estadísticas en JS:', err.message);
    }
}

// FUNCIONES DE DIBUJO DE CHART.JS
//Renderiza el gráfico de dona con el balance de tareas completadas vs pendientes
function renderChartEstado(completadas, pendientes) {
    const canvas = document.getElementById('chartEstado');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    if (chartEstadoInstance) chartEstadoInstance.destroy();// Si ya existía un gráfico previo se limpia

    const total = completadas + pendientes;
    const dataValues = total === 0 ? [1] : [completadas, pendientes];
    const bgColors = total === 0 ? ['rgba(181, 34, 255, 0.2)'] : ['#4ade80', '#f87171'];
    const labels = total === 0 ? ['Sin Misiones'] : ['Completadas', 'Pendientes'];

    chartEstadoInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: bgColors,
                borderColor: '#120920',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#f3d0ff', font: { family: 'Share Tech Mono' } }
                }
            }
        }
    });
}

//Renderiza el gráfico de barras con la distribución de misiones según su nivel de prioridad
function renderChartPrioridad(alta, media, baja) {
    const canvas = document.getElementById('chartPrioridad');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (chartPrioridadInstance) chartPrioridadInstance.destroy();

    chartPrioridadInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['ALTA', 'MEDIA', 'BAJA'],
            datasets: [{
                label: 'Misiones Completadas',
                data: [alta, media, baja],
                backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
                borderColor: '#b522ff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#f3d0ff', stepSize: 1, font: { family: 'Share Tech Mono' } },
                    grid: { color: 'rgba(181, 34, 255, 0.15)' }
                },
                x: {
                    ticks: { color: '#f3d0ff', font: { family: 'Orbitron' } },
                    grid: { color: 'transparent' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

//Renderiza el gráfico de línea con la evolución mensual de actividad
function renderChartEvolucion(datosEvolucion) {
    const canvas = document.getElementById('chartEvolucion');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (chartEvolucionInstance) chartEvolucionInstance.destroy();

    const labels = datosEvolucion.map(d => d.mes.toUpperCase());
    const dataValues = datosEvolucion.map(d => d.total);

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);// Gradiente Cyberpunk Neón 
    gradient.addColorStop(0, 'rgba(181, 34, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(181, 34, 255, 0.0)');

    chartEvolucionInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['SIN REGISTROS'],
            datasets: [{
                label: 'Tareas Completadas',
                data: dataValues.length > 0 ? dataValues : [0],
                borderColor: '#b522ff',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#00f0ff',
                pointBorderColor: '#120920',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#f3d0ff', stepSize: 1, font: { family: 'Share Tech Mono' } },
                    grid: { color: 'rgba(181, 34, 255, 0.15)' }
                },
                x: {
                    ticks: { color: '#f3d0ff', font: { family: 'Orbitron' } },
                    grid: { color: 'rgba(181, 34, 255, 0.1)' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}