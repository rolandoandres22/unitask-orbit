let myFriends = [];
let pendingRequests = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Validar Sesión Activa
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. Renderizar Datos del Usuario
    try {
        const user = JSON.parse(userStr);
        const userNameDisplay = document.getElementById('user-name');
        if (userNameDisplay) {
            userNameDisplay.textContent = (user.nombre_completo || user.email || 'ESTUDIANTE').toUpperCase();
        }

        const userTagDisplay = document.getElementById('user-tag');
        if (userTagDisplay) {
            userTagDisplay.textContent = user.user_tag || '000000';
        }
    } catch (e) {
        console.error('Error al cargar la sesión:', e);
    }

    // 3. Cargar Amigos y Solicitudes al Iniciar
    loadFriendsData();
});

/**
 * Cierra la sesión activa
 */
function logout() {
    localStorage.clear();
    window.location.href = '../../index.html';
}

/**
 * Control del Modal de Agregar Amigo (Abrir/Cerrar)
 */
function toggleAddFriendModal(show) {
    const modal = document.getElementById('add-friend-modal');
    if (!modal) return;

    if (show) {
        modal.classList.remove('hidden');
        document.getElementById('search-query')?.focus();
    } else {
        modal.classList.add('hidden');
        const form = document.getElementById('search-friend-form');
        if (form) form.reset();
        
        const resultsContainer = document.getElementById('search-results-container');
        if (resultsContainer) {
            resultsContainer.innerHTML = `<p class="search-placeholder-msg">Ingresa un nombre o ID de usuario para iniciar la búsqueda en el nodo.</p>`;
        }
    }
}

/**
 * Consulta la red de amigos y las solicitudes pendientes
 */
async function loadFriendsData() {
    const token = localStorage.getItem('token');
    
    // Cargar Lista de Amigos y Solicitudes en paralelo
    await Promise.all([
        loadFriendsList(token),
        loadPendingRequests(token)
    ]);
}

/**
 * Obtiene los amigos confirmados desde el backend
 */
async function loadFriendsList(token) {
    const container = document.getElementById('friends-list-container');
    try {
        const response = await fetch('http://localhost:3000/api/amigos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar red de amigos');

        myFriends = await response.json();
        renderFriendsList(myFriends);

    } catch (err) {
        console.error('Error:', err.message);
        if (container) {
            container.innerHTML = `<div class="hud-card friend-card">ERROR AL CONECTAR CON EL NODO DE AMIGOS.</div>`;
        }
    }
}

/**
 * Obtiene las solicitudes de amistad recibidas
 */
async function loadPendingRequests(token) {
    const container = document.getElementById('requests-list-container');
    try {
        const response = await fetch('http://localhost:3000/api/amigos/solicitudes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar solicitudes');

        pendingRequests = await response.json();
        renderPendingRequests();

    } catch (err) {
        console.error('Error:', err.message);
        if (container) {
            container.innerHTML = `<div class="hud-card friend-card">ERROR AL OBTENER SOLICITUDES.</div>`;
        }
    }
}

/**
 * Dibuja las tarjetas de los amigos en formato de fila/tabla
 */
function renderFriendsList(friendsToRender = myFriends) {
    const container = document.getElementById('friends-list-container');
    if (!container) return;

    container.innerHTML = '';

    if (friendsToRender.length === 0) {
        const mensaje = myFriends.length === 0 
            ? 'NO TIENES VÍNCULOS REGISTRADOS EN TU RED.' 
            : 'NO SE ENCONTRARON AMIGOS QUE COINCIDAN.';
        container.innerHTML = `<div class="hud-card friend-row-card empty-msg">${mensaje}</div>`;
        return;
    }

    friendsToRender.forEach(amigo => {
        const row = document.createElement('div');
        row.className = 'hud-card friend-row-card';

        row.innerHTML = `
            <div class="friend-col-info">
                <span class="friend-name">${amigo.nombre_completo.toUpperCase()}</span>
                <span class="friend-tag">#${amigo.user_tag}</span>
            </div>
            <div class="friend-col-rank">
                <span class="friend-rank-badge">[ ${(amigo.rango || 'RANGO E').toUpperCase()} ]</span>
            </div>
            <div class="friend-col-actions">
                <button class="btn-hud-secondary danger small" onclick="removeFriend('${amigo.id_usuario}')" title="Eliminar amigo">
                    <i class="fa-solid fa-user-minus"></i> ELIMINAR
                </button>
            </div>
        `;
        container.appendChild(row);
    });
}

/**
 * Filtra dinámicamente la lista local de amigos en tiempo real
 */
function filterLocalFriends(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
        renderFriendsList(myFriends);
        return;
    }

    const filtered = myFriends.filter(amigo => 
        (amigo.nombre_completo && amigo.nombre_completo.toLowerCase().includes(term)) ||
        (amigo.user_tag && amigo.user_tag.toLowerCase().includes(term))
    );

    renderFriendsList(filtered);
}

/**
 * Dibuja las solicitudes pendientes recibidas en formato de fila/tabla
 */
function renderPendingRequests() {
    const container = document.getElementById('requests-list-container');
    if (!container) return;

    container.innerHTML = '';

    if (pendingRequests.length === 0) {
        container.innerHTML = `<div class="hud-card friend-row-card empty-msg">SIN SOLICITUDES PENDIENTES</div>`;
        return;
    }

    pendingRequests.forEach(req => {
        const row = document.createElement('div');
        row.className = 'hud-card friend-row-card request-row';

        row.innerHTML = `
            <div class="friend-col-info">
                <span class="friend-name">${req.solicitante_nombre.toUpperCase()}</span>
                <span class="friend-tag">#${req.solicitante_tag}</span>
            </div>
            <div class="friend-col-actions request-actions">
                <button class="btn-hud-primary small" onclick="respondRequest('${req.id_solicitud}', 'ACEPTAR')" title="Aceptar solicitud">
                    <i class="fa-solid fa-check"></i>
                </button>
                <button class="btn-hud-secondary danger small" onclick="respondRequest('${req.id_solicitud}', 'RECHAZAR')" title="Rechazar solicitud">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
        container.appendChild(row);
    });
}

/**
 * Búsqueda de usuarios por Nombre o Tag (#ID)
 */
async function handleSearchUser(event) {
    event.preventDefault();
    const queryInput = document.getElementById('search-query');
    const container = document.getElementById('search-results-container');
    const token = localStorage.getItem('token');
    
    const query = queryInput.value.trim();
    if (!query) return;

    try {
        container.innerHTML = `<p class="search-placeholder-msg">BUSCANDO EN EL NODO...</p>`;

        const response = await fetch(`http://localhost:3000/api/usuarios/buscar?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error en la búsqueda');

        const results = await response.json();
        renderSearchResults(results);

    } catch (err) {
        container.innerHTML = `<p class="search-placeholder-msg" style="color: #f87171;">ERROR EN LA BÚSQUEDA DE USUARIOS</p>`;
    }
}

/**
 * Dibuja los resultados de búsqueda de usuarios en formato de fila/tabla
 */
function renderSearchResults(results = []) {
    const container = document.getElementById('search-results-container');
    if (!container) return;

    container.innerHTML = '';

    if (results.length === 0) {
        container.innerHTML = `<div class="hud-card friend-row-card empty-msg">NO SE ENCONTRARON ESTUDIANTES</div>`;
        return;
    }

    results.forEach(user => {
        const row = document.createElement('div');
        row.className = 'hud-card friend-row-card search-row';

        // Determinamos el estado para el botón de acción
        let actionBtnHTML = '';
        if (user.es_amigo) {
            actionBtnHTML = `<span class="badge-status-ok"><i class="fa-solid fa-check"></i> AMIGO</span>`;
        } else if (user.solicitud_enviada) {
            actionBtnHTML = `<span class="badge-status-pending"><i class="fa-solid fa-clock"></i> ENVIADA</span>`;
        } else {
            // Se pasa `this` para enviar la referencia del elemento al handler
            actionBtnHTML = `
                <button class="btn-hud-primary small" onclick="sendFriendRequest('${user.id_usuario}', this)" title="Enviar solicitud">
                    <i class="fa-solid fa-user-plus"></i> AGREGAR
                </button>
            `;
        }

        row.innerHTML = `
            <div class="friend-col-info">
                <span class="friend-name">${user.nombre_completo.toUpperCase()}</span>
                <span class="friend-tag">#${user.user_tag}</span>
            </div>
            <div class="friend-col-actions">
                ${actionBtnHTML}
            </div>
        `;
        container.appendChild(row);
    });
}

/**
 * Envía una solicitud de amistad a otro usuario
 */
async function sendFriendRequest(idDestino, btnElem) {
    const token = localStorage.getItem('token');
    try {
        if (btnElem) btnElem.disabled = true;

        const response = await fetch('http://localhost:3000/api/amigos/solicitud', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id_destino: idDestino })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al enviar solicitud');

        if (btnElem) {
            btnElem.outerHTML = `<span class="badge-status-pending"><i class="fa-solid fa-clock"></i> ENVIADA</span>`;
        }

    } catch (err) {
        alert(`NO SE PUDO ENVIAR LA SOLICITUD: ${err.message.toUpperCase()}`);
        if (btnElem) btnElem.disabled = false;
    }
}

/**
 * Acepta o rechaza una solicitud de amistad
 */
async function respondRequest(idSolicitud, accion) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:3000/api/amigos/solicitudes/${idSolicitud}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado: accion }) // 'ACEPTAR' o 'RECHAZAR'
        });

        if (!response.ok) throw new Error('Error al responder solicitud');

        loadFriendsData();

    } catch (err) {
        alert(`ERROR AL PROCESAR SOLICITUD: ${err.message.toUpperCase()}`);
    }
}

/**
 * Elimina un amigo de la red
 */
async function removeFriend(idAmigo) {
    if (!confirm('¿DESEAS ELIMINAR A ESTE ESTUDIANTE DE TU RED DE AMIGOS?')) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:3000/api/amigos/${idAmigo}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al eliminar amigo');

        loadFriendsData();

    } catch (err) {
        alert(`NO SE PUDO ELIMINAR EL AMIGO: ${err.message.toUpperCase()}`);
    }
}