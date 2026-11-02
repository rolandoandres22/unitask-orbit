document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar sesión activa mediante localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        // Si no hay sesión, reorientar al index principal
        window.location.href = '../../index.html';
        return;
    }

    // 2. Extraer y mostrar los datos del usuario autenticado
    try {
        const user = JSON.parse(userStr);

        // Renderizar Nombre Completo
        const userNameDisplay = document.getElementById('user-name');
        if (userNameDisplay) {
            const nombre = user.nombre_completo || user.user_metadata?.nombre_completo || user.email || 'ESTUDIANTE';
            userNameDisplay.textContent = nombre.toUpperCase();
        }

        // Renderizar User ID Tag (6 dígitos)
        const userTagDisplay = document.getElementById('user-tag');
        if (userTagDisplay) {
            const tag = user.user_tag || user.user_metadata?.user_tag || user.app_metadata?.user_tag || '000000';
            userTagDisplay.textContent = tag;
        }

        // 3. Cargar las estadísticas del Dashboard e XP desde la BD
        loadDashboardStats();

    } catch (e) {
        console.error('Error al parsear la sesión del usuario:', e);
    }
});

// Cierra la sesión activa y redirige al index.html
function logout() {
    localStorage.clear();
    window.location.href = '../../index.html';
}

// Consulta el endpoint del backend para obtener el perfil, rango, XP y misiones prioritarias (máx 4)
async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('token');
        
        if (!token) return;

        // Petición al endpoint singular autenticado vía JWT
        const response = await fetch('http://localhost:3000/api/usuario/perfil', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorJson = await response.json().catch(() => ({}));
            throw new Error(errorJson.error || `Error del servidor HTTP ${response.status}`);
        }

        const data = await response.json();
        const perfil = data.perfil;

        // 1. Renderizar Rango y Contador de XP Dinámico
        const rankCodeElem = document.getElementById('user-rank-code');
        if (rankCodeElem && perfil.rango) {
            rankCodeElem.textContent = perfil.rango;
        }

        const xpCounterElem = document.getElementById('xp-text-counter');
        if (xpCounterElem) {
            const xpMax = perfil.xp_maximo !== undefined ? perfil.xp_maximo : '--';
            xpCounterElem.textContent = `${perfil.xp_acumulado || 0} / ${xpMax} XP`;
        }
        
        // Animación suave de llenado de la barra de energía
        setTimeout(() => {
            const xpFillElem = document.getElementById('xp-progress-fill');
            if (xpFillElem && perfil.porcentaje_progreso !== undefined) {
                xpFillElem.style.width = `${perfil.porcentaje_progreso}%`;
            }
        }, 150);

        // 2. Renderizar Resumen Rápido (Quick Stats)
        const tasksElem = document.getElementById('stat-tasks');
        if (tasksElem && data.resumen) {
            tasksElem.textContent = data.resumen.tareas_pendientes_hoy ?? 0;
        }

        const streakElem = document.getElementById('stat-streak');
        if (streakElem && data.resumen) {
            streakElem.textContent = `${data.resumen.racha_dias ?? 0} 🔥`;
        }

        // 3. Renderizar Tarjetas de Misiones Prioritarias (Top 4)
        const missionsContainer = document.getElementById('missions-container');
        if (missionsContainer) {
            missionsContainer.innerHTML = '';

            if (!data.misiones_prioritarias || data.misiones_prioritarias.length === 0) {
                missionsContainer.innerHTML = `
                    <div class="hud-card mission-card skeleton">
                        NO HAY MISIONES PENDIENTES. SISTEMA EN REPOSO.
                    </div>
                `;
                return;
            }

            // Aseguramos renderizar un máximo de 4 misiones
            const misionesAMostrar = data.misiones_prioritarias.slice(0, 4);

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

// Función para marcar misión como completada
 
async function completarMision(misionId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/tareas/${misionId}/completar`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Recargar datos para refrescar la barra de XP y la lista
            loadDashboardStats();
        } else {
            console.error('Error al completar la misión');
        }
    } catch (err) {
        console.error('Error de conexión al completar la misión:', err);
    }
}