// Detecta automáticamente si la web corre en servidor local o en producción
const API_URL_DASHBOARD = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'//servidor local
    : '/api';// para que funcione en versel


// INICIALIZACIÓN DE LA VISTA Y VALIDACIÓN DE SESIÓN
document.addEventListener('DOMContentLoaded', () => {
    
    const token = localStorage.getItem('token');//Verificar sesión activa
    const userStr = localStorage.getItem('user');

    
    if (!token || !userStr) {// Si no existen credenciales guardadas redirige al index
        window.location.href = '../../index.html';
        return;
    }

    
    try {// Extraer y mostrar los datos del usuario autenticado en la cabecera
        const user = JSON.parse(userStr);
        const userNameDisplay = document.getElementById('user-name');// Renderizar Nombre Completo
        if (userNameDisplay) {
            const nombre = user.nombre_completo || user.user_metadata?.nombre_completo || user.email || 'ESTUDIANTE';
            userNameDisplay.textContent = nombre.toUpperCase();
        }

        const userTagDisplay = document.getElementById('user-tag');// Renderizar User ID Tag (#000000)
        if (userTagDisplay) {
            const tag = user.user_tag || user.user_metadata?.user_tag || user.app_metadata?.user_tag || '000000';
            userTagDisplay.textContent = tag;
        }

        loadDashboardStats();//cargar métricas del Dashboard Rango, XP, Racha y Misiones Prioritarias

    } catch (e) {
        console.error('Error al parsear la sesión del usuario:', e);
    }
});

//cierra la sesión activa borrando el localStorage y redirigiendo al inicio.
function logout() {
    localStorage.clear();
    window.location.href = '../../index.html';
}

//Consulta el endpoint `/usuario/perfil` para obtener el nivel, XP, racha y misiones destacadas.
async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        // Petición HTTP GET autenticada mediante Bearer Token
        const response = await fetch(`${API_URL_DASHBOARD}/usuario/perfil`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorJson = await response.json().catch(() => ({}));
            throw new Error(errorJson.error || `Error del servidor HTTP ${response.status}`);
        }

        const data = await response.json();
        const perfil = data.perfil || {};

        // RANGO Y BARRA DE XP DINÁMICA
        const rankCodeElem = document.getElementById('user-rank-code');
        if (rankCodeElem && perfil.rango) {
            rankCodeElem.textContent = perfil.rango;
        }

        const xpCounterElem = document.getElementById('xp-text-counter');
        if (xpCounterElem) {
            const xpMax = perfil.xp_maximo !== undefined ? perfil.xp_maximo : '--';
            xpCounterElem.textContent = `${perfil.xp_acumulado || 0} / ${xpMax} XP`;
        }
        
        // Animación de llenado suave de la barra de progreso de energía XP
        setTimeout(() => {
            const xpFillElem = document.getElementById('xp-progress-fill');
            if (xpFillElem && perfil.porcentaje_progreso !== undefined) {
                xpFillElem.style.width = `${perfil.porcentaje_progreso}%`;
            }
        }, 150);

        // RESUMEN DE MÉTRICAS
        const tasksElem = document.getElementById('stat-tasks');
        if (tasksElem && data.resumen) {
            tasksElem.textContent = data.resumen.tareas_pendientes_hoy ?? 0;
        }

        const streakElem = document.getElementById('stat-streak');
        if (streakElem && data.resumen) {
            streakElem.textContent = `${data.resumen.racha_dias ?? 0} 🔥`;
        }

        // TARJETAS DE MISIONES PRIORITARIAS
        const missionsContainer = document.getElementById('missions-container');
        if (missionsContainer) {
            missionsContainer.innerHTML = '';

            // Si no existen misiones pendientes, muestra una tarjeta vacía de estado
            if (!data.misiones_prioritarias || data.misiones_prioritarias.length === 0) {
                missionsContainer.innerHTML = `
                    <div class="hud-card mission-card skeleton">
                        NO HAY MISIONES PENDIENTES. SISTEMA EN REPOSO.
                    </div>
                `;
                return;
            }

            const misionesAMostrar = data.misiones_prioritarias.slice(0, 4);// máximo de 4 misiones

            misionesAMostrar.forEach(mision => {
                const card = document.createElement('div');
                card.className = 'hud-card mission-card';
                card.innerHTML = `
                    <div class="mission-top">
                        <span>[ ${mision.tipo || 'INDIVIDUAL'} ]</span>
                        <span>⏱ ${mision.fecha}</span>
                    </div>
                    <div class="mission-title">${mision.titulo}</div>
                    
                    ${mision.descripcion ? `<div class="mission-desc">${mision.descripcion}</div>` : ''}

                    <div class="mission-bottom">
                        <span class="mission-xp">+${mision.xp} XP</span>
                        <button class="btn-mission-action" onclick="completarMision('${mision.id}')">COMPLETAR</button>
                    </div>
                `;
                missionsContainer.appendChild(card);
            });
        }

    } catch (err) {
        console.error('Error al cargar la vista Inicio:', err.message);
    }
}

//Envía una solicitud PATCH para marcar una tarea como completada y refresca la interfaz
async function completarMision(misionId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL_DASHBOARD}/tareas/${misionId}/completar`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            loadDashboardStats();// recarga en vivo XP, Racha y Misiones
        } else {
            console.error('Error al completar la misión');
        }
    } catch (err) {
        console.error('Error de conexión al completar la misión:', err);
    }
}