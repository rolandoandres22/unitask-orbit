// Detecta automáticamente si la aplicación se ejecuta localmente o en servidor desplegado
const API_URL_TAREAS = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'//para ejecucion desde servidor local
    : '/api';//para ejecucion desde Versel

// Cache local de misiones, filtro activo, tipo seleccionado y grupos donde el usuario es líder
let allTasks = [];
let currentFilter = 'PENDIENTE';
let selectedTaskType = 'INDIVIDUAL';
let myLeaderGroups = [];

// INICIALIZACIÓN DE LA VISTA Y VALIDACIÓN DE SESIÓN
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');// Verificar presencia de credenciales en el almacenamiento local
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = '../../index.html';
        return;
    }

    try {// Extraer y mostrar la identidad del usuario en la cabecera
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

    loadTasks();// Obtener el catálogo de tareas desde la API
});

function logout() {//Cierra la sesión activa borrando credenciales locales y redirigiendo al login
    localStorage.clear();
    window.location.href = '../../index.html';
}

//Controla la apertura y el cierre del modal de creación/edición de tareas
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
            delete form.dataset.editId; // Limpia la marca de edición si existía
        }
        setTaskType('INDIVIDUAL'); // Restablece por defecto a tarea individual
        const msgElem = document.getElementById('task-form-msg');
        if (msgElem) msgElem.textContent = '';
    }
}

//Alterna el tipo de tarea entre INDIVIDUAL y GRUPAL
async function setTaskType(type) {
    selectedTaskType = type;
    const btnInd = document.getElementById('btn-type-individual');
    const btnGrup = document.getElementById('btn-type-grupal');
    const selectGroup = document.getElementById('task-group-select');
    const selectAssign = document.getElementById('task-group-assign');

    if (type === 'INDIVIDUAL') {
        btnInd?.classList.add('active');
        btnGrup?.classList.remove('active');

        // Deshabilita selects grupales al estar en modo individual
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

        // Habilita el selector de grupos y consulta cuáles lidera el usuario
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

//Obtiene desde el servidor los grupos de estudio donde el usuario activo figura con rol de LÍDER
async function loadLeaderGroups() {
    const token = localStorage.getItem('token');
    const selectGroup = document.getElementById('task-group-select');
    if (!selectGroup) return;

    try {
        const response = await fetch(`${API_URL_TAREAS}/grupos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al consultar grupos');

        const result = await response.json();
        const groups = result.data || (Array.isArray(result) ? result : []);

        // Filtrado exclusivo de grupos bajo el liderazgo del usuario
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

//Carga los integrantes del grupo elegido para asignarles la responsabilidad de la tarea
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
        const response = await fetch(`${API_URL_TAREAS}/grupos/${idGrupo}/miembros`, {
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

//Pide al backend el listado completo de tareas pertenecientes al usuario
async function loadTasks() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL_TAREAS}/tareas`, {
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

//Calcula los puntos de XP que otorga una misión según su rango de prioridad
function calcularXP(prioridad) {
    switch (prioridad) {
        case 'ALTA': return 40;
        case 'MEDIA': return 25;
        case 'BAJA': return 10;
        default: return 10;
    }
}

//Formatea fechas 
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

//genera las tarjetas de misiones en pantalla según el filtro activo
function renderTasks() {
    const container = document.getElementById('tasks-list-container');
    if (!container) return;

    container.innerHTML = '';

    // Filtrado local según la categoría seleccionada en los botones
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

// Despliega o cierra el menú de opciones (tres puntos) de cada tarjeta de tarea
function toggleTaskMenu(event, idTarea) {
    event.stopPropagation();
    document.querySelectorAll('.task-dropdown-menu').forEach(menu => {
        if (menu.id !== `menu-${idTarea}`) menu.classList.add('hidden');
    });

    const menu = document.getElementById(`menu-${idTarea}`);
    if (menu) menu.classList.toggle('hidden');
}

document.addEventListener('click', () => {//cierra cualquier menú flotante abierto al hacer clic fuera
    document.querySelectorAll('.task-dropdown-menu').forEach(menu => menu.classList.add('hidden'));
});

//Cambia el filtro actual de tareas y actualiza el botón activo en la interfaz
function filterTasks(filter, buttonElem) {
    currentFilter = filter;
    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
    if (buttonElem) buttonElem.classList.add('active');
    renderTasks();
}

// ACCIONES DE FORMULARIO: CREACIÓN, EDICIÓN, ESTADOS Y ELIMINACIÓN
// Procesa la creación de una nueva tarea o guarda los cambios de una existente
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

    // 1. Validación de congruencia de fechas
    if (new Date(fecha_inicio) > new Date(fecha_limite)) {
        if (msgElem) {
            msgElem.style.color = '#f87171';
            msgElem.textContent = 'LA FECHA DE INICIO NO PUEDE SER MAYOR A LA LÍMITE';
        }
        return;
    }

    // 2. Validación de asignaciones en tareas grupales
    if (selectedTaskType === 'GRUPAL' && (!id_grupo || !id_usuario_asignado)) {
        if (msgElem) {
            msgElem.style.color = '#f87171';
            msgElem.textContent = 'DEBES SELECCIONAR UN GRUPO Y UN RESPONSABLE';
        }
        return;
    }

    // 3. Estructura de datos a enviar al backend
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
            ? `${API_URL_TAREAS}/tareas/${editId}` 
            : `${API_URL_TAREAS}/tareas`;

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

//Rellena el formulario con los datos de una tarea individual para proceder a editarla
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

//Envía la petición PATCH para marcar una tarea como COMPLETADA
async function completeTask(idTarea) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL_TAREAS}/tareas/${idTarea}/completar`, {
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

//Envía la petición PATCH para marcar una tarea como CANCELADA
async function cancelTask(idTarea) {
    if (!confirm('¿Deseas marcar esta misión como CANCELADA?')) return;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL_TAREAS}/tareas/${idTarea}/cancelar`, {
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

//Solicita la eliminación definitiva de una tarea en la base de datos
async function deleteTask(idTarea) {
    if (!confirm('¿CONFIRMAR ELIMINACIÓN PERMANENTE DE ESTA MISIÓN?')) return;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL_TAREAS}/tareas/${idTarea}`, {
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