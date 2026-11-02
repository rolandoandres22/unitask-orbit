const API_URL = 'http://localhost:3000/api';
let currentMode = 'login';

// Redirigir automáticamente si la sesión ya está activa
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
        window.location.href = './pages/dashboard/dashboard.html';
    }
});

// Cambiar de pestaña entre Acceso y Registro
function switchAuthMode(mode) {
    currentMode = mode;
    const isLogin = mode === 'login';
    
    document.getElementById('tab-login')?.classList.toggle('active', isLogin);
    document.getElementById('tab-register')?.classList.toggle('active', !isLogin);
    
    document.getElementById('group-nombre')?.classList.toggle('hidden', isLogin);
    document.getElementById('group-repeat-password')?.classList.toggle('hidden', isLogin);
    
    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) {
        submitBtn.textContent = isLogin ? 'INICIAR SESIÓN' : 'CONFIRMAR REGISTRO';
    }

    const messageEl = document.getElementById('auth-message');
    if (messageEl) {
        messageEl.textContent = '';
    }
}

// Procesar autenticación
async function handleAuth(event) {
    event.preventDefault();
    const email = document.getElementById('email')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    const nombre = document.getElementById('nombre')?.value.trim() || '';
    const repeatPassword = document.getElementById('repeat-password')?.value || '';
    const messageEl = document.getElementById('auth-message');
    const submitBtn = document.getElementById('btn-submit');

    if (!messageEl) return;
    messageEl.textContent = '';

    // Validaciones en Registro
    if (currentMode === 'register') {
        if (password !== repeatPassword) {
            messageEl.style.color = '#f87171';
            messageEl.textContent = 'LAS CONTRASEÑAS NO COINCIDEN';
            return;
        }

        // Validación de complejidad (8+ caracteres, Mayúscula, Minúscula, Número, Especial)
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
        if (submitBtn) submitBtn.disabled = true;
        messageEl.style.color = '#d8b4fe';
        messageEl.textContent = 'PROCESANDO SOLICITUD...';

        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'ERROR EN LA AUTENTICACIÓN');
        }

        if (currentMode === 'register') {
            messageEl.style.color = '#4ade80';
            messageEl.textContent = 'REGISTRO EXITOSO :) !! REDIRIGIENDO AL INICIO DE SESIÓN...';
            
            setTimeout(() => {
                if (submitBtn) submitBtn.disabled = false;
                document.getElementById('auth-form')?.reset();
                switchAuthMode('login');
            }, 2500);

        } else {
            // LOGIN EXITOSO: Guardar credenciales y redirigir
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            messageEl.style.color = '#4ade80';
            messageEl.textContent = 'ACCESO CONCEDIDO: CARGANDO NODO...';

            setTimeout(() => {
                window.location.href = './pages/dashboard/dashboard.html';
            }, 1200);
        }
    } catch (err) {
        if (submitBtn) submitBtn.disabled = false;
        messageEl.style.color = '#f87171';
        messageEl.textContent = `RECHAZADO: ${err.message.toUpperCase()}`;
    }
}