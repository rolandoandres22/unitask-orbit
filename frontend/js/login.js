// Configuración dinámica de API (Local vs Vercel Production)
 const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'//usar esta ruta en local
    : '/api';//usar esta ruta en versel sino no funca
    
let currentMode = 'login';

// VERIFICACIÓN DE SESIÓN ACTIVA
    window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {// si ya existe un token y datos de usuario en localStorage te manda a l dashboard
        window.location.href = './pages/dashboard/dashboard.html';
    }
});

// CAMBIA DE PESTAÑAS (LOGIN / REGISTRO)
function switchAuthMode(mode) {
    currentMode = mode;
    const isLogin = mode === 'login';
    // Activa la pestaña seleccionada
    document.getElementById('tab-login')?.classList.toggle('active', isLogin);
    document.getElementById('tab-register')?.classList.toggle('active', !isLogin);
    // Muestra u oculta los campos
    document.getElementById('group-nombre')?.classList.toggle('hidden', isLogin);
    document.getElementById('group-repeat-password')?.classList.toggle('hidden', isLogin);
    
    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) {// Actualiza el texto del botón principal para login o registro
        submitBtn.textContent = isLogin ? 'INICIAR SESIÓN' : 'CONFIRMAR REGISTRO';
    }
    //limpia
    const messageEl = document.getElementById('auth-message');
    if (messageEl) {
        messageEl.textContent = '';
    }
}

// PROCESAMIENTO DE AUTENTICACIÓN (LOGIN & REGISTRO)
async function handleAuth(event) {
    event.preventDefault();//hace que no se recargue la pagina
    // Captura y limpia los valores de los inputs del formulario
    const email = document.getElementById('email')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    const nombre = document.getElementById('nombre')?.value.trim() || '';
    const repeatPassword = document.getElementById('repeat-password')?.value || '';
    const messageEl = document.getElementById('auth-message');
    const submitBtn = document.getElementById('btn-submit');

    if (!messageEl) return;//valida si tiene mennsaje
    messageEl.textContent = '';

    // VALIDACIONES DEL REGISTRO
    if (currentMode === 'register') {
        if (password !== repeatPassword) {// 1. Coincidencia de contraseñas
            messageEl.style.color = '#f87171';
            messageEl.textContent = 'LAS CONTRASEÑAS NO COINCIDEN';
            return;
        }

        // Validación de complejidad (8+ caracteres, Mayúscula, Minúscula, Número, caracter Especial)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#\-_])[A-Za-z\d@$!%*?&.#\-_]{8,}$/;
        if (!passwordRegex.test(password)) {
            messageEl.style.color = '#f87171';
            messageEl.textContent = 'LA CONTRASEÑA DEBE TENER 8+ CARACTERES, MAYÚSCULA, MINÚSCULA, NÚMERO Y CARÁCTER ESPECIAL';
            return;
        }
    }

    const endpoint = currentMode === 'login' ? '/auth/login' : '/auth/register';
    const payload = currentMode === 'login' 
        ? { email, password } 
        : { email, password, nombre_completo: nombre };

    try {
        if (submitBtn) submitBtn.disabled = true;//Deshabilita el botón si ya se le hizo un click
        messageEl.style.color = '#d8b4fe';
        messageEl.textContent = 'PROCESANDO SOLICITUD...';

        const res = await fetch(`${API_URL}${endpoint}`, {// Petición HTTP POST al servidor Express/Supabase
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {// Manejo de errores HTTP (status 400, 401, 500, etc.)
            throw new Error(data.error || 'ERROR EN LA AUTENTICACIÓN');
        }

        if (currentMode === 'register') {//Registro Exitoso: Notifica al usuario y redirige al dashboard
            messageEl.style.color = '#4ade80';
            messageEl.textContent = 'REGISTRO EXITOSO :) !! REDIRIGIENDO AL INICIO DE SESIÓN...';
            
            setTimeout(() => {
                if (submitBtn) submitBtn.disabled = false;
                document.getElementById('auth-form')?.reset();
                switchAuthMode('login');
            }, 2500);

        } else {//Login Exitoso: Almacena token JWT y perfil en el almacenamiento local
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            messageEl.style.color = '#4ade80';
            messageEl.textContent = 'ACCESO CONCEDIDO: CARGANDO NODO...';//muestra mensaje 1,2seg
            
            setTimeout(() => {//redirige al panel principal
                window.location.href = './pages/dashboard/dashboard.html';
            }, 1200);
        }
    } catch (err) {//captura de errores del backend
        if (submitBtn) submitBtn.disabled = false;
        messageEl.style.color = '#f87171';
        messageEl.textContent = `RECHAZADO: ${err.message.toUpperCase()}`;
    }
}