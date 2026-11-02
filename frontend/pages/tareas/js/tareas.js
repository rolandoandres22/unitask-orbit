let allTasks = [];
let currentFilter = 'PENDIENTE';
let selectedTaskType = 'INDIVIDUAL';
let myLeaderGroups = []; // Cache de grupos donde el usuario es LÍDER

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

    // 3. Cargar Tareas desde el Servidor
    loadTasks();
});

/**
 * Cierra la sesión activa
 */
function logout() {
    localStorage.clear();
    window.location.href = '../../index.html';
}

/**
 * Control del Modal (Abrir/Cerrar)
 */
function toggleTaskModal(show) {
    const modal = document.getElementById('task-modal');
    if (!modal) return;

    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
        const form = document.getElementById('create-task-form');
        if (form) {
            form.reset();
            delete form.dataset.editId;
        }
        setTaskType('INDIVIDUAL'); // Resetear a individual
        const msgElem = document.getElementById('task-form-msg');
        if (msgElem) msgElem.textContent = '';
    }
}

/**
 * Conmuta entre tipo Individual y Grupal (DESHABILITA AMBOS SELECTS SI ES INDIVIDUAL)
 */
async function setTaskType(type) {
    selectedTaskType = type;
    const btnInd = document.getElementById('btn-type-individual');
    const btnGrup = document.getElementById('btn-type-grupal');
    const selectGroup = document.getElementById('task-group-select');
    const selectAssign = document.getElementById('task-group-assign');

    if (type === 'INDIVIDUAL') {
        btnInd?.classList.add('active');
        btnGrup?.classList.remove('active');

        // DESHABILITADOS EN MODO INDIVIDUAL
        if (selectGroup) {
            selectGroup.disabled = true;
            selectGroup.innerHTML = '<option value="">No aplica (Tarea individual)</option>';
        }
        if (selectAssign) {
            selectAssign.disabled = true;
            selectAssign.innerHTML = '<option value="">No aplica (Tarea individual)</option>';
        }
    } else {
        btnGrup?.classList.add('active');
        btnInd?.classList.remove('active');

        // HABILITA SELECT DE GRUPOS Y CARGA GRUPOS DONDE ES LÍDER
        if (selectGroup) {
            selectGroup.disabled = false;
            selectGroup.innerHTML = '<option value="">CARGANDO GRUPOS...</option>';
        }
        if (selectAssign) {
            selectAssign.disabled = true;
            selectAssign.innerHTML = '<option value="">Selecciona un grupo primero...</option>';
        }

        await loadLeaderGroups();
    }
}

/**
 * Carga los grupos donde el usuario activo tiene rol de LÍDER
 */
async function loadLeaderGroups() {
    const token = localStorage.getItem('token');
    const selectGroup = document.getElementById('task-group-select');
    if (!selectGroup) return;

    try {
        const response = await fetch('http://localhost:3000/api/grupos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al consultar grupos');

        const result = await response.json();
        const groups = result.data || (Array.isArray(result) ? result : []);

        // Filtrar exclusivamente los grupos donde el usuario es LÍDER
        myLeaderGroups = groups.filter(g => (g.rol || '').toUpperCase() === 'LIDER' || (g.rol || '').toUpperCase() === 'LÍDER');

        if (myLeaderGroups.length === 0) {
            selectGroup.innerHTML = '<option value="">No lideras ningún grupo de estudio</option>';
            selectGroup.disabled = true;
            return;
        }

        selectGroup.disabled = false;
        selectGroup.innerHTML = '<option value="">Seleccionar grupo...</option>' + 
            myLeaderGroups.map(g => `<option value="${g.id_grupo}">${g.nombre_grupo.toUpperCase()}</option>`).join('');

    } catch (err) {
        console.error('Error al cargar grupos:', err);
        selectGroup.innerHTML = '<option value="">ERROR AL OBTENER GRUPOS</option>';
        selectGroup.disabled = true;
    }
}

/**
 * Evento al seleccionar un grupo: Carga sus miembros en el segundo select
 */
async function handleGroupChange(idGrupo) {
    const selectAssign = document.getElementById('task-group-assign');
    if (!selectAssign) return;

    if (!idGrupo) {
        selectAssign.disabled = true;
        selectAssign.innerHTML = '<option value="">Selecciona un grupo primero...</option>';
        return;
    }

    const token = localStorage.getItem('token');
    selectAssign.disabled = false;
    selectAssign.innerHTML = '<option value="">CARGANDO MIEMBROS...</option>';

    try {
        const response = await fetch(`http://localhost:3000/api/grupos/${idGrupo}/miembros`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar miembros del grupo');

        const result = await response.json();
        const miembros = result.data || (Array.isArray(result) ? result : []);

        if (!miembros || miembros.length === 0) {
            selectAssign.innerHTML = '<option value="">SIN MIEMBROS REGISTRADOS</option>';
            selectAssign.disabled = true;
            return;
        }

        selectAssign.disabled = false;
        selectAssign.innerHTML = '<option value="">Seleccionar responsable...</option>' +
            miembros.map(m => {
                const esLider = (m.rol || '').toUpperCase() === 'LIDER' || (m.rol || '').toUpperCase() === 'LÍDER';
                const rolTag = esLider ? '[LÍDER]' : '[MIEMBRO]';
                return `<option value="${m.id_usuario}">${(m.nombre_completo || 'ESTUDIANTE').toUpperCase()} ${rolTag}</option>`;
            }).join('');

    } catch (err) {
        console.error('Error al cargar miembros:', err);
        selectAssign.innerHTML = '<option value="">ERROR AL OBTENER INTEGRANTES</option>';
        selectAssign.disabled = true;
    }
}

/**
 * Consulta la lista completa de tareas
 */
async function loadTasks() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/tareas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al consultar misiones');

        allTasks = await response.json();
        renderTasks();

    } catch (err) {
        console.error('Error:', err.message);
        const container = document.getElementById('tasks-list-container');
        if (container) {
            container.innerHTML = `<div class="hud-card mission-card">ERROR AL CARGAR MISIONES DESDE EL NODO.</div>`;
        }
    }
}

/**
 * Función para calcular XP en base a la prioridad
 */
function calcularXP(prioridad) {
    switch (prioridad) {
        case 'ALTA': return 40;
        case 'MEDIA': return 25;
        case 'BAJA': return 10;
        default: return 10;
    }
}

/**
 * Auxiliar para formatear fecha con hora
 */
function formatDateTime(dateStr) {
    if (!dateStr) return '---';
    const dateObj = new Date(dateStr);
    const hoy = new Date();
    const esHoy = dateObj.toDateString() === hoy.toDateString();

    if (esHoy) {
        return `HOY ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return dateObj.toLocaleDateString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase();
}

/**
 * Renderiza las tarjetas de tareas
 */
function renderTasks() {
    const container = document.getElementById('tasks-list-container');
    if (!container) return;

    container.innerHTML = '';

    const filtered = allTasks.filter(t => {
        if (currentFilter === 'TODAS') return true;
        if (currentFilter === 'PENDIENTE' || currentFilter === 'COMPLETADA' || currentFilter === 'CANCELADA') {
            return t.estado === currentFilter;
        }
        if (currentFilter === 'INDIVIDUAL') {
            return !t.tipo || t.tipo === 'INDIVIDUAL';
        }
        if (currentFilter === 'GRUPAL') {
            return t.tipo === 'GRUPAL';
        }
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="hud-card mission-card">NO SE ENCONTRARON MISIONES BAJO EL FILTRO: ${currentFilter}</div>`;
        return;
    }

    filtered.forEach(mision => {
        const isCompleted = mision.estado === 'COMPLETADA';
        const isCanceled = mision.estado === 'CANCELADA';
        const isDisabled = isCompleted || isCanceled;
        const isIndividual = !mision.tipo || mision.tipo === 'INDIVIDUAL';

        const card = document.createElement('div');
        const statusClass = isCompleted ? 'task-completed-card' : (isCanceled ? 'task-canceled-card' : '');
        card.className = `hud-card mission-card ${statusClass}`;
        
        const inicioFormateado = formatDateTime(mision.fecha_inicio);
        const limiteFormateado = formatDateTime(mision.fecha_limite);
        const xpValor = calcularXP(mision.prioridad);

        card.innerHTML = `
            <div class="mission-top">
                <span>[ ${mision.tipo || 'INDIVIDUAL'} ]</span>
                <div class="mission-top-right">
                    <span class="mission-dates" title="Rango temporal: Inicio ➔ Límite">
                        ⏱ ${inicioFormateado} ➔ ${limiteFormateado}
                    </span>
                    
                    <div class="task-menu-wrapper">
                        <button class="btn-task-menu ${isDisabled ? 'btn-disabled' : ''}" 
                                ${isDisabled ? 'disabled' : ''} 
                                onclick="toggleTaskMenu(event, '${mision.id_tarea}')">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        ${!isDisabled ? `
                            <div id="menu-${mision.id_tarea}" class="task-dropdown-menu hidden">
                                ${isIndividual ? `
                                    <button onclick="openEditTaskModal('${mision.id_tarea}')">
                                        <i class="fa-solid fa-pen-to-square"></i> Editar
                                    </button>
                                    <button onclick="cancelTask('${mision.id_tarea}')">
                                        <i class="fa-solid fa-ban"></i> Cancelar
                                    </button>
                                    <button class="danger" onclick="deleteTask('${mision.id_tarea}')">
                                        <i class="fa-solid fa-trash-can"></i> Eliminar
                                    </button>
                                ` : `
                                    <span class="dropdown-disabled-msg">[ TAREA GRUPAL: SOLO LECCIÓN / LÍDER ]</span>
                                `}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <div class="mission-title">${mision.titulo}</div>
            
            ${mision.descripcion ? `<div class="mission-desc">${mision.descripcion}</div>` : ''}

            <div class="mission-bottom">
                <span class="mission-xp">${isCanceled ? '0 XP' : `+${xpValor} XP`}</span>
                ${isCompleted 
                    ? `<span class="badge-completed"><i class="fa-solid fa-check"></i> COMPLETADA</span>`
                    : (isCanceled 
                        ? `<span class="badge-canceled"><i class="fa-solid fa-ban"></i> CANCELADA</span>`
                        : `<button class="btn-mission-action" onclick="completeTask('${mision.id_tarea}')">COMPLETAR</button>`
                      )
                }
            </div>
        `;
        container.appendChild(card);
    });
}

function toggleTaskMenu(event, idTarea) {
    event.stopPropagation();
    document.querySelectorAll('.task-dropdown-menu').forEach(menu => {
        if (menu.id !== `menu-${idTarea}`) menu.classList.add('hidden');
    });

    const menu = document.getElementById(`menu-${idTarea}`);
    if (menu) menu.classList.toggle('hidden');
}

document.addEventListener('click', () => {
    document.querySelectorAll('.task-dropdown-menu').forEach(menu => menu.classList.add('hidden'));
});

function filterTasks(filter, buttonElem) {
    currentFilter = filter;
    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
    if (buttonElem) buttonElem.classList.add('active');
    renderTasks();
}

/**
 * Procesa la Creación o Edición de Tarea
 */
async function handleCreateTask(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const msgElem = document.getElementById('task-form-msg');
    const form = document.getElementById('create-task-form');
    const editId = form?.dataset.editId;

    const titulo = document.getElementById('task-title').value.trim();
    const descripcion = document.getElementById('task-desc').value.trim();
    const fecha_inicio = document.getElementById('task-start-date').value;
    const fecha_limite = document.getElementById('task-deadline').value;
    const prioridad = document.getElementById('task-priority').value;

    const id_grupo = selectedTaskType === 'GRUPAL' ? document.getElementById('task-group-select').value : null;
    const id_usuario_asignado = selectedTaskType === 'GRUPAL' ? document.getElementById('task-group-assign').value : null;

    // 1. Validación de Fechas
    if (new Date(fecha_inicio) > new Date(fecha_limite)) {
        if (msgElem) {
            msgElem.style.color = '#f87171';
            msgElem.textContent = 'LA FECHA DE INICIO NO PUEDE SER MAYOR A LA LÍMITE';
        }
        return;
    }

    // 2. Validación de Selección Grupal
    if (selectedTaskType === 'GRUPAL' && (!id_grupo || !id_usuario_asignado)) {
        if (msgElem) {
            msgElem.style.color = '#f87171';
            msgElem.textContent = 'DEBES SELECCIONAR UN GRUPO Y UN RESPONSABLE';
        }
        return;
    }

    // 3. Estructura completa del Body
    const bodyData = { 
        titulo, 
        descripcion, 
        fecha_inicio, 
        fecha_limite, 
        prioridad,
        tipo: selectedTaskType,
        id_grupo,
        id_usuario_asignado
    };

    try {
        if (msgElem) {
            msgElem.style.color = '#d8b4fe';
            msgElem.textContent = editId ? 'ACTUALIZANDO...' : 'GUARDANDO...';
        }

        const url = editId 
            ? `http://localhost:3000/api/tareas/${editId}` 
            : 'http://localhost:3000/api/tareas';

        const method = editId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bodyData)
        });

        const textResponse = await response.text();
        let data = {};
        try {
            data = JSON.parse(textResponse);
        } catch (e) {
            throw new Error(`Error en servidor (${response.status})`);
        }

        if (!response.ok) throw new Error(data.error || 'Error al procesar la tarea');

        if (msgElem) {
            msgElem.style.color = '#4ade80';
            msgElem.textContent = editId ? '¡TAREA ACTUALIZADA!' : '¡TAREA GUARDADA!';
        }

        loadTasks();
        setTimeout(() => {
            toggleTaskModal(false);
        }, 800);

    } catch (err) {
        if (msgElem) {
            msgElem.style.color = '#f87171';
            msgElem.textContent = `ERROR: ${err.message.toUpperCase()}`;
        }
    }
}

function openEditTaskModal(idTarea) {
    const tarea = allTasks.find(t => t.id_tarea === idTarea);
    if (!tarea) return;

    document.getElementById('task-title').value = tarea.titulo;
    document.getElementById('task-desc').value = tarea.descripcion || '';
    document.getElementById('task-priority').value = tarea.prioridad;

    if (tarea.fecha_inicio) {
        document.getElementById('task-start-date').value = new Date(tarea.fecha_inicio).toISOString().slice(0, 16);
    }
    if (tarea.fecha_limite) {
        document.getElementById('task-deadline').value = new Date(tarea.fecha_limite).toISOString().slice(0, 16);
    }

    const form = document.getElementById('create-task-form');
    if (form) form.dataset.editId = idTarea;

    toggleTaskModal(true);
}

async function completeTask(idTarea) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/tareas/${idTarea}/completar`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            loadTasks();
        }
    } catch (err) {
        console.error('Error al completar tarea:', err);
    }
}

async function cancelTask(idTarea) {
    if (!confirm('¿Deseas marcar esta misión como CANCELADA?')) return;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/tareas/${idTarea}/cancelar`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Error ${response.status}`);
        }

        loadTasks();
    } catch (err) {
        alert(`NO SE PUDO CANCELAR LA TAREA: ${err.message.toUpperCase()}`);
    }
}

async function deleteTask(idTarea) {
    if (!confirm('¿CONFIRMAR ELIMINACIÓN PERMANENTE DE ESTA MISIÓN?')) return;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/tareas/${idTarea}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Error ${response.status}`);
        }

        loadTasks();
    } catch (err) {
        alert(`NO SE PUDO ELIMINAR LA TAREA: ${err.message.toUpperCase()}`);
    }
}