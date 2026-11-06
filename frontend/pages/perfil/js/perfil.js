// Detecta automáticamente si el backend se ejecuta localmente o en producción
const API_URL_PERFIL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'// para ejecucion en servidor local
    : '/api';//para ejecucion desde Versel

// INICIALIZACIÓN DE LA VISTA Y VERIFICACIÓN DE SESIÓN
document.addEventListener('DOMContentLoaded', () => {
    // 1. Validar la presencia del token y los datos de usuario en localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {// Si no hay sesión activa, reorienta inmediatamente al login
        window.location.href = '../../index.html';
        return;
    }

    loadProfileData();// Cargar expedientes y datos de perfil desde la API
});

function logout() {// Destruye la sesión activa borrando el localStorage y redirigiendo al inicio
    localStorage.clear();
    window.location.href = '../../index.html';
}

// Consulta la API para obtener la información actualizada del usuario (XP, Rango, Tag y Nombre)
async function loadProfileData() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL_PERFIL}/usuario/perfil`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al obtener perfil');

        const data = await response.json();
        const perfil = data.perfil || {};

        // RENDERIZADO EN EL HEADER GENERAL
        const userNameElem = document.getElementById('user-name');
        if (userNameElem) userNameElem.textContent = (perfil.nombre || 'ESTUDIANTE').toUpperCase();

        const userTagElem = document.getElementById('user-tag');
        if (userTagElem) userTagElem.textContent = perfil.user_tag || '000000';

        // RENDERIZADO EN LA TARJETA LATERAL DE RESUMEN
        const displayNameElem = document.getElementById('profile-display-name');
        if (displayNameElem) displayNameElem.textContent = (perfil.nombre || 'ESTUDIANTE').toUpperCase();

        const displayTagElem = document.getElementById('profile-display-tag');
        if (displayTagElem) displayTagElem.textContent = perfil.user_tag || '000000';

        const rankBadgeElem = document.getElementById('profile-rank-badge');
        if (rankBadgeElem) rankBadgeElem.textContent = perfil.rango || 'RANGO -';

        const xpTotalElem = document.getElementById('profile-xp-total');
        if (xpTotalElem) xpTotalElem.textContent = `${perfil.xp_acumulado || 0} XP`;

        // AUTO-RECEPTÁCULO EN EL FORMULARIO DE EDICIÓN
        const inputName = document.getElementById('input-fullname');
        if (inputName) inputName.value = perfil.nombre || '';

    } catch (err) {
        console.error('Error al cargar perfil:', err.message);
    }
}

// Procesa la modificación del nombre completo del usuario y sincroniza la sesión local
async function handleUpdateProfile(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const msgElem = document.getElementById('profile-form-msg');
    const inputName = document.getElementById('input-fullname');
    const nombre_completo = inputName.value.trim();

    // Validar que el campo no esté vacío
    if (!nombre_completo) {
        if (msgElem) {
            msgElem.style.color = '#f87171';
            msgElem.textContent = 'EL NOMBRE COMPLETO NO PUEDE ESTAR VACÍO';
        }
        return;
    }

    try {
        if (msgElem) {
            msgElem.style.color = '#d8b4fe';
            msgElem.textContent = 'GUARDANDO CAMBIOS...';
        }

        // Petición HTTP PUT al endpoint del perfil
        const response = await fetch(`${API_URL_PERFIL}/usuario/perfil`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre_completo })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al actualizar perfil');

        
        const userStr = localStorage.getItem('user');// Sincronizar el nombre en la variable guardada en localStorage asi no hay que relogear
        if (userStr) {
            const userObj = JSON.parse(userStr);
            userObj.nombre_completo = nombre_completo;
            localStorage.setItem('user', JSON.stringify(userObj));
        }

        if (msgElem) {// Mostrar notificación de éxito al usuario
            msgElem.style.color = '#4ade80';
            msgElem.textContent = '¡PERFIL ACTUALIZADO CON ÉXITO!';

            // Limpiar la notificación tras 4 segundos
            setTimeout(() => {
                msgElem.textContent = '';
            }, 4000);
        }

        loadProfileData();// Recargar los datos del perfil

    } catch (err) {
        if (msgElem) {
            msgElem.style.color = '#f87171';
            msgElem.textContent = `ERROR: ${err.message.toUpperCase()}`;
        }
    }
}

// Valida la complejidad de la nueva clave (igual a la pantalla de registro) 
async function handleChangePassword(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const msgElem = document.getElementById('pass-form-msg');
    const submitBtn = document.getElementById('btn-submit-pass');

    const password = document.getElementById('input-new-pass')?.value || '';
    const repeatPassword = document.getElementById('input-repeat-pass')?.value || '';

    if (!msgElem) return;
    msgElem.textContent = '';

    if (password !== repeatPassword) {// Validación de coincidencia entre ambos campos de contraseña
        msgElem.style.color = '#f87171';
        msgElem.textContent = 'LAS CONTRASEÑAS NO COINCIDEN';
        return;
    }

    // Validación de reglas de seguridad/complejidad vía Expresión Regular:
    // (Mínimo 8 caracteres, al menos 1 Mayúscula, 1 Minúscula, 1 Número y 1 Carácter Especial)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#\-_])[A-Za-z\d@$!%*?&.#\-_]{8,}$/;
    if (!passwordRegex.test(password)) {
        msgElem.style.color = '#f87171';
        msgElem.textContent = 'LA CONTRASEÑA DEBE TENER 8+ CARACTERES, MAYÚSCULA, MINÚSCULA, NÚMERO Y CARÁCTER ESPECIAL';
        return;
    }

    try {
        if (submitBtn) submitBtn.disabled = true;
        msgElem.style.color = '#d8b4fe';
        msgElem.textContent = 'ACTUALIZANDO CREDENCIALES...';

        // Petición HTTP PUT para reestablecer la contraseña
        const response = await fetch(`${API_URL_PERFIL}/usuario/perfil/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nueva_password: password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'ERROR AL ACTUALIZAR LA CONTRASEÑA');

        msgElem.style.color = '#4ade80';
        msgElem.textContent = '¡CONTRASEÑA REESTABLECIDA! REDIRIGIENDO AL INICIO DE SESIÓN...';
        document.getElementById('change-password-form')?.reset();

        setTimeout(() => {// Pausa de 2 segundos para leer el mensaje
            logout(); // Borra las credenciales locales y fuerza el relogin
        }, 2000);

    } catch (err) {
        msgElem.style.color = '#f87171';
        msgElem.textContent = `RECHAZADO: ${err.message.toUpperCase()}`;
        if (submitBtn) submitBtn.disabled = false;
    }
}