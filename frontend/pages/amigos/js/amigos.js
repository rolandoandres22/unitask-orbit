// Detecta automáticamente si la app corre en local o en producción
const API_URL_AMIGOS = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'//ejecucion en local
    : '/api';//ejecucion en versel

//variables para almacenar la lista de amigos e historial de solicitudes
let myFriends = [];
let pendingRequests = [];

// INICIALIZACIÓN DE SESIÓN Y VISTA
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');// Validar Sesión Activa (Autenticación por Token)
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {//si no hay credenciales guardadas en el navegador redirige al Login
        window.location.href = '../../index.html';
        return;
    }

    try {// Renderizar Datos del Perfil del Usuario en el Header
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

    loadFriendsData();//cargar Amigos y Solicitudes al Iniciar el documento
});

//Destruye las variables de sesión guardadas en localStorage y redirige al Login.
function logout() {
    localStorage.clear();
    window.location.href = '../../index.html';
}

//controla la apertura y cierre del modal de agregar amigo.
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

//Consulta en paralelo los amigos confirmados y las solicitudes pendientes recibidas
async function loadFriendsData() {
    const token = localStorage.getItem('token');
    
    // Carga paralela para optimizar tiempos de respuesta de la API
    await Promise.all([
        loadFriendsList(token),
        loadPendingRequests(token)
    ]);
}

//Obtiene la lista de amigos confirmados desde el backend
async function loadFriendsList(token) {
    const container = document.getElementById('friends-list-container');
    try {
        const response = await fetch(`${API_URL_AMIGOS}/amigos`, {
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

//obtiene las solicitudes de amistad pendientes
async function loadPendingRequests(token) {
    const container = document.getElementById('requests-list-container');
    try {
        const response = await fetch(`${API_URL_AMIGOS}/amigos/solicitudes`, {
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

//Dibuja dinámicamente en el DOM la lista de tarjetas de amigos confirmados
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

//Filtra la lista local de amigos en tiempo real según el término ingresado en el buscador
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

//Dibuja en pantalla la lista de solicitudes de amistad pendientes con botones de Aceptar/Rechazar.
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

// BÚSQUEDA Y ACCIONES DE SOLICITUDES
//Maneja la búsqueda de nuevos usuarios por Nombre o Tag (#ID) mediante consulta HTTP.
async function handleSearchUser(event) {
    event.preventDefault();
    const queryInput = document.getElementById('search-query');
    const container = document.getElementById('search-results-container');
    const token = localStorage.getItem('token');
    
    const query = queryInput.value.trim();
    if (!query) return;

    try {
        container.innerHTML = `<p class="search-placeholder-msg">BUSCANDO EN EL NODO...</p>`;

        const response = await fetch(`${API_URL_AMIGOS}/usuarios/buscar?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error en la búsqueda');

        const results = await response.json();
        renderSearchResults(results);

    } catch (err) {
        container.innerHTML = `<p class="search-placeholder-msg" style="color: #f87171;">ERROR EN LA BÚSQUEDA DE USUARIOS</p>`;
    }
}

//Dibuja los resultados de búsqueda de usuarios
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

        // Evalúa el estado de la relación
        let actionBtnHTML = '';
        if (user.es_amigo) {
            actionBtnHTML = `<span class="badge-status-ok"><i class="fa-solid fa-check"></i> AMIGO</span>`;
        } else if (user.solicitud_enviada) {
            actionBtnHTML = `<span class="badge-status-pending"><i class="fa-solid fa-clock"></i> ENVIADA</span>`;
        } else {
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

//Envía una solicitud de amistad a un usuario objetivo.
async function sendFriendRequest(idDestino, btnElem) {
    const token = localStorage.getItem('token');
    try {
        if (btnElem) btnElem.disabled = true;

        const response = await fetch(`${API_URL_AMIGOS}/amigos/solicitud`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id_destino: idDestino })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al enviar solicitud');

        
        if (btnElem) {// reemplaza el botón por un cartel "ENVIADA"
            btnElem.outerHTML = `<span class="badge-status-pending"><i class="fa-solid fa-clock"></i> ENVIADA</span>`;
        }

    } catch (err) {
        alert(`NO SE PUDO ENVIAR LA SOLICITUD: ${err.message.toUpperCase()}`);
        if (btnElem) btnElem.disabled = false;
    }
}



//Responde a una solicitud de amistad pendiente Aceptar o Rechazar.
async function respondRequest(idSolicitud, accion) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL_AMIGOS}/amigos/solicitudes/${idSolicitud}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado: accion })
        });

        if (!response.ok) throw new Error('Error al responder solicitud');

        loadFriendsData(); // recarga la lista de amigos y solicitudes

    } catch (err) {
        alert(`ERROR AL PROCESAR SOLICITUD: ${err.message.toUpperCase()}`);
    }
}

//Elimina a un amigo de la lista de vínculos confirmados.
async function removeFriend(idAmigo) {
    if (!confirm('¿DESEAS ELIMINAR A ESTE ESTUDIANTE DE TU RED DE AMIGOS?')) return;

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL_AMIGOS}/amigos/${idAmigo}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al eliminar amigo');

        loadFriendsData();// Recarga la lista para actualizar la vista

    } catch (err) {
        alert(`NO SE PUDO ELIMINAR EL AMIGO: ${err.message.toUpperCase()}`);
    }
}