let currentGroupIdForInvite = null;
let localGroupsList = [];
let sentGroupInvites = new Set(); // Guarda los IDs de usuarios a quienes ya se les envió invitación

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = '../../index.html';
        return;
    }

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

    loadGroupsData();
});

function logout() {
    localStorage.clear();
    window.location.href = '../../index.html';
}

async function loadGroupsData() {
    await Promise.all([
        loadMyGroups(),
        loadGroupRequests()
    ]);
}

/* ==========================================================================
   1. GESTIÓN DE MIS GRUPOS (CON ACORDEÓN DE MIEMBROS)
   ========================================================================== */
async function loadMyGroups() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('groups-list-container');
    
    try {
        const res = await fetch('http://localhost:3000/api/grupos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok) {
            localGroupsList = data.data || [];
            renderGroupsList(localGroupsList);
        } else {
            throw new Error(data.error || 'Error al obtener grupos');
        }
    } catch (err) {
        console.error('Error al cargar grupos:', err);
        if (container) {
            container.innerHTML = `<div class="hud-card friend-row-card empty-msg">ERROR AL CONECTAR CON EL NODO DE GRUPOS.</div>`;
        }
    }
}

function renderGroupsList(groups = localGroupsList) {
    const container = document.getElementById('groups-list-container');
    if (!container) return;

    container.innerHTML = '';

    if (!groups || groups.length === 0) {
        const mensaje = localGroupsList.length === 0
            ? 'NO PERTENECES A NINGÚN GRUPO TODAVÍA.'
            : 'NO SE ENCONTRARON GRUPOS QUE COINCIDAN.';
        container.innerHTML = `<div class="hud-card friend-row-card empty-msg">${mensaje}</div>`;
        return;
    }

    groups.forEach(grupo => {
        const wrapper = document.createElement('div');
        wrapper.className = 'group-accordion-item';

        const esLider = (grupo.rol || '').toUpperCase() === 'LIDER' || (grupo.rol || '').toUpperCase() === 'LÍDER';
        const inviteBtnHTML = esLider ? `
            <button class="btn-hud-primary small" onclick="event.stopPropagation(); openInviteModal('${grupo.id_grupo}')" title="Invitar amigo">
                <i class="fa-solid fa-user-plus"></i> INVITAR
            </button>
        ` : '';

        // ✅ SE AGREGA LA CLASE 'hidden' INICIALMENTE Y EL ESTILO PARA QUE NO SE MUESTRE
        wrapper.innerHTML = `
            <div class="hud-card friend-row-card group-header-row" onclick="toggleGroupAccordion('${grupo.id_grupo}')">
                <div class="friend-col-info">
                    <span class="friend-name">
                        <i class="fa-solid fa-chevron-right accordion-icon" id="icon-${grupo.id_grupo}"></i>
                        ${grupo.nombre_grupo.toUpperCase()}
                    </span>
                    <span class="friend-tag">[TU ROL: ${grupo.rol.toUpperCase()}]</span>
                </div>
                <div class="friend-col-actions">
                    ${inviteBtnHTML}
                </div>
            </div>
            <div class="group-members-panel hidden" id="members-panel-${grupo.id_grupo}" style="display: none;">
                <p class="search-placeholder-msg">CARGANDO INTEGRANTES DEL GRUPO...</p>
            </div>
        `;
        container.appendChild(wrapper);
    });
}

/**
 * Controla el despliegue y cierre del acordeón
 */
async function toggleGroupAccordion(idGrupo) {
    const panel = document.getElementById(`members-panel-${idGrupo}`);
    const icon = document.getElementById(`icon-${idGrupo}`);

    if (!panel) return;

    // Verificar si el panel está visible
    const isHidden = panel.style.display === 'none' || panel.classList.contains('hidden');

    if (isHidden) {
        // ABRIR ACORDEÓN
        panel.classList.remove('hidden');
        panel.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(90deg)';
        await loadGroupMembers(idGrupo);
    } else {
        // CERRAR ACORDEÓN
        panel.classList.add('hidden');
        panel.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
}

/**
 * Consulta y renderiza los integrantes de un grupo en el acordeón
 */
async function loadGroupMembers(idGrupo) {
    const token = localStorage.getItem('token');
    const panel = document.getElementById(`members-panel-${idGrupo}`);
    if (!panel) return;

    try {
        const res = await fetch(`http://localhost:3000/api/grupos/${idGrupo}/miembros`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        const miembros = data.data || data;

        if (!res.ok || !miembros || miembros.length === 0) {
            panel.innerHTML = `<div class="member-subrow empty">SIN INTEGRANTES REGISTRADOS</div>`;
            return;
        }

        panel.innerHTML = '';
        miembros.forEach(m => {
            const esLider = (m.rol || '').toUpperCase() === 'LIDER' || (m.rol || '').toUpperCase() === 'LÍDER';
            const badgeClass = esLider ? 'badge-status-ok' : 'badge-status-pending';

            const memberRow = document.createElement('div');
            memberRow.className = 'member-subrow';
            memberRow.innerHTML = `
                <div class="member-info">
                    <i class="fa-solid fa-user"></i>
                    <span class="member-name">${(m.nombre_completo || m.nombre || 'ESTUDIANTE').toUpperCase()}</span>
                    <span class="member-tag">#${m.user_tag || '000000'}</span>
                </div>
                <div class="member-role">
                    <span class="${badgeClass}">[ ${m.rol.toUpperCase()} ]</span>
                </div>
            `;
            panel.appendChild(memberRow);
        });

    } catch (err) {
        console.error('Error al cargar integrantes:', err);
        panel.innerHTML = `<div class="member-subrow empty" style="color: #f87171;">ERROR AL OBTENER INTEGRANTES</div>`;
    }
}

/* ==========================================================================
   2. SOLICITUDES PENDIENTES DE GRUPO
   ========================================================================== */
async function loadGroupRequests() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('group-requests-container');

    try {
        const res = await fetch('http://localhost:3000/api/grupos/invitaciones/pendientes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (!container) return;
        container.innerHTML = '';

        if (!res.ok || !data.data || data.data.length === 0) {
            container.innerHTML = `<div class="hud-card friend-row-card empty-msg">SIN INVITACIONES PENDIENTES</div>`;
            return;
        }

        data.data.forEach(req => {
            const row = document.createElement('div');
            row.className = 'hud-card friend-row-card request-row';
            row.innerHTML = `
                <div class="friend-col-info">
                    <span class="friend-name">${req.nombre_grupo.toUpperCase()}</span>
                    <span class="friend-tag">LÍDER: ${req.lider_nombre}</span>
                </div>
                <div class="request-actions">
                    <button class="btn-hud-primary small" onclick="respondGroupInvite(${req.id_grupo_miembro}, 'ACEPTADA')" title="Aceptar invitación">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    <button class="btn-hud-secondary danger small" onclick="respondGroupInvite(${req.id_grupo_miembro}, 'RECHAZADA')" title="Rechazar invitación">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;
            container.appendChild(row);
        });
    } catch (err) {
        console.error('Error al cargar invitaciones de grupo:', err);
        if (container) {
            container.innerHTML = `<div class="hud-card friend-row-card empty-msg">ERROR AL OBTENER INVITACIONES.</div>`;
        }
    }
}

async function respondGroupInvite(idGrupoMiembro, estado) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:3000/api/grupos/responder-invitacion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id_grupo_miembro: idGrupoMiembro, estado })
        });

        if (!res.ok) throw new Error('Error al responder invitación');

        loadGroupsData();

    } catch (err) {
        alert(`ERROR AL PROCESAR INVITACIÓN: ${err.message.toUpperCase()}`);
    }
}

/* ==========================================================================
   3. MODAL DE CREAR GRUPO
   ========================================================================== */
function toggleCreateGroupModal(show) {
    const modal = document.getElementById('create-group-modal');
    if (!modal) return;

    if (show) {
        modal.classList.remove('hidden');
        document.getElementById('group-name-input')?.focus();
    } else {
        modal.classList.add('hidden');
        const form = document.getElementById('create-group-form');
        if (form) form.reset();
    }
}

async function handleCreateGroup(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const nombre_grupo = document.getElementById('group-name-input').value.trim();
    const descripcion = document.getElementById('group-desc-input').value.trim();

    if (!nombre_grupo) return;

    try {
        const res = await fetch('http://localhost:3000/api/grupos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre_grupo, descripcion })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al crear el grupo');

        toggleCreateGroupModal(false);
        loadMyGroups();

    } catch (err) {
        alert(`NO SE PUDO CREAR EL GRUPO: ${err.message.toUpperCase()}`);
    }
}

/* ==========================================================================
   4. MODAL INVITAR AMIGOS (CON INDICADOR DE "ENVIADA")
   ========================================================================== */
function toggleInviteModal(show) {
    const modal = document.getElementById('invite-friend-modal');
    if (!modal) return;

    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
        currentGroupIdForInvite = null;
        sentGroupInvites.clear();
    }
}

async function openInviteModal(idGrupo) {
    currentGroupIdForInvite = idGrupo;
    sentGroupInvites.clear();
    toggleInviteModal(true);

    const token = localStorage.getItem('token');
    const container = document.getElementById('friends-to-invite-container');
    container.innerHTML = '<p class="search-placeholder-msg">CARGANDO LISTA DE ALIADOS...</p>';

    try {
        // 1. Obtener la lista de amigos del usuario y la lista de integrantes del grupo en paralelo
        const [resAmigos, resMiembros] = await Promise.all([
            fetch('http://localhost:3000/api/amigos', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`http://localhost:3000/api/grupos/${idGrupo}/miembros`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        if (!resAmigos.ok) throw new Error('Error al obtener lista de amigos');

        const friends = await resAmigos.json();
        
        let miembrosGrupoIds = new Set();
        if (resMiembros.ok) {
            const dataMiembros = await resMiembros.json();
            const miembrosList = dataMiembros.data || (Array.isArray(dataMiembros) ? dataMiembros : []);
            miembrosList.forEach(m => miembrosGrupoIds.add(m.id_usuario));
        }

        container.innerHTML = '';

        if (!friends || friends.length === 0) {
            container.innerHTML = `<p class="search-placeholder-msg">NO TIENES VÍNCULOS REGISTRADOS PARA INVITAR.</p>`;
            return;
        }

        // 2. Clasificar los amigos en 3 categorías
        const disponibles = [];
        const enviadas = [];
        const yaMiembros = [];

        friends.forEach(amigo => {
            const esMiembro = miembrosGrupoIds.has(amigo.id_usuario);
            const yaInvitado = amigo.invitacion_enviada || sentGroupInvites.has(amigo.id_usuario);

            if (esMiembro) {
                yaMiembros.push(amigo);
            } else if (yaInvitado) {
                enviadas.push(amigo);
            } else {
                disponibles.push(amigo);
            }
        });

        // 3. Unir los amigos en el orden deseado: Disponibles -> Enviadas -> Ya miembros
        const sortedFriends = [...disponibles, ...enviadas, ...yaMiembros];

        // 4. Renderizar la lista
        sortedFriends.forEach(amigo => {
            const row = document.createElement('div');
            row.className = 'hud-card friend-row-card search-row';

            const esMiembro = miembrosGrupoIds.has(amigo.id_usuario);
            const yaInvitado = amigo.invitacion_enviada || sentGroupInvites.has(amigo.id_usuario);

            let actionBtnHTML = '';
            if (esMiembro) {
                actionBtnHTML = `<span class="badge-status-ok"><i class="fa-solid fa-check"></i> EN EL GRUPO</span>`;
            } else if (yaInvitado) {
                actionBtnHTML = `<span class="badge-status-pending"><i class="fa-solid fa-clock"></i> ENVIADA</span>`;
            } else {
                actionBtnHTML = `
                    <button class="btn-hud-primary small" onclick="sendGroupInvite('${amigo.id_usuario}', this)">
                        <i class="fa-solid fa-paper-plane"></i> INVITAR
                    </button>
                `;
            }

            row.innerHTML = `
                <div class="friend-col-info">
                    <span class="friend-name">${amigo.nombre_completo.toUpperCase()}</span>
                    <span class="friend-tag">#${amigo.user_tag}</span>
                </div>
                <div class="friend-col-actions">
                    ${actionBtnHTML}
                </div>
            `;
            container.appendChild(row);
        });

    } catch (err) {
        console.error('Error:', err.message);
        container.innerHTML = `<p class="search-placeholder-msg" style="color: #f87171;">ERROR AL CARGAR AMIGOS</p>`;
    }
}

async function sendGroupInvite(idUsuarioInvitado, btnElem) {
    if (!currentGroupIdForInvite) return;
    const token = localStorage.getItem('token');

    try {
        if (btnElem) btnElem.disabled = true;

        const res = await fetch('http://localhost:3000/api/grupos/invitar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                id_grupo: currentGroupIdForInvite,
                id_usuario_invitado: idUsuarioInvitado
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al enviar la invitación');

        // Agregar al set local de invitaciones enviadas
        sentGroupInvites.add(idUsuarioInvitado);

        // Reemplazar botón por la etiqueta de estado ENVIADA
        if (btnElem) {
            btnElem.outerHTML = `<span class="badge-status-pending"><i class="fa-solid fa-clock"></i> ENVIADA</span>`;
        }

    } catch (err) {
        alert(`NO SE PUDO ENVIAR LA INVITACIÓN: ${err.message.toUpperCase()}`);
        if (btnElem) btnElem.disabled = false;
    }
}