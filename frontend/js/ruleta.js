// WIDGET DE RULETA DE CONSEJOS (SCI-FI / CYBERPUNK)
// Detecta automáticamente si el backend está en local o en producción
const API_URL_RULETA = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'//local
    : '/api';//ruta dinamica para versel

// variables de control de estado para el giro de la ruleta y la acumulación de grados
let girandoRuleta = false;
let rotacionActualRuleta = 0;


// INICIALIZACIÓN EN EL DOM
if (document.readyState === 'loading') {// Si el HTML aún se está construyendo, espera al evento DOMContentLoaded
    document.addEventListener('DOMContentLoaded', inyectarRuletaHTML);
} else {
    inyectarRuletaHTML();// Si ya cargó, inyecta la ruleta directamente
}

//Crea e inyecta la ruleta y el modal.
function inyectarRuletaHTML() {
    if (document.getElementById('ruleta-widget-root')) return;// Evita duplicar la ruleta si ya fue inyectada previamente en la página

    const root = document.createElement('div');
    root.id = 'ruleta-widget-root';
    //inyecta el HTML de la ruleta
    root.innerHTML = `
        <!-- Botón Flotante / Widget de la Ruleta -->
        <div class="ruleta-widget-container" onclick="girarRuletaConsejo()" title="¡Girar para obtener un consejo!">
            <div class="ruleta-pointer"></div>
            <div id="ruleta-wheel" class="ruleta-wheel-box">
                <!-- Secciones visuales de la ruleta -->
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>

        <!-- Modal emergente para mostrar el resultado del consejo -->
        <div id="ruleta-modal" class="ruleta-modal-overlay">
            <div class="ruleta-modal-card">
                <h3 id="ruleta-modal-title" class="ruleta-modal-title">/// TRANSMISIÓN DE SISTEMA</h3>
                <p id="ruleta-consejo-texto" class="ruleta-modal-text">Cargando datos...</p>
                <button onclick="cerrarRuletaModal()" class="btn-ruleta-close">ENTENDIDO</button>
            </div>
        </div>
    `;

    // Añade el widget al final de la etiqueta <body> de la vista activa
    document.body.appendChild(root);
}


// LÓGICA DE GIRO Y PETICIÓN AL BACKEND
async function girarRuletaConsejo() {//Realiza la animación de giro
    if (girandoRuleta) return;// Si ya hay un giro en proceso bloquea clicks
    girandoRuleta = true;

    const token = localStorage.getItem('token');
    const wheel = document.getElementById('ruleta-wheel');
    
    // gira 6 vueltas completas de 360 grados
    const gradosExtra = Math.floor(Math.random() * 360);
    const girosTotales = (360 * 6) + gradosExtra;
    rotacionActualRuleta += girosTotales;

    if (wheel) {//aplica la rotación por CSS a la rueda
        wheel.style.transform = `rotate(${rotacionActualRuleta}deg)`;
    }

    try {
        // Petición HTTP GET al endpoint de consejos
        const response = await fetch(`${API_URL_RULETA}/consejos/aleatorio?t=${Date.now()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {// Control de errores de la respuesta HTTP
            throw new Error(data.error || `Error servidor: HTTP ${response.status}`);
        }

        setTimeout(() => {//Espera 3 segundos antes de abrir el modal
            const titleElem = document.getElementById('ruleta-modal-title');
            const textoElem = document.getElementById('ruleta-consejo-texto');

            if (data.consejo) {
                if (titleElem) {
                    titleElem.textContent = `/// ${data.consejo.categoria} - ${data.consejo.titulo.toUpperCase()}`;
                }
                if (textoElem) {
                    textoElem.textContent = `"${data.consejo.contenido_consejo}"`;
                }
            }

            const modal = document.getElementById('ruleta-modal');// Despliega el modal en pantalla
            if (modal) modal.classList.add('active');

            girandoRuleta = false;//libera el bloqueo del giro
        }, 3000);

    } catch (err) {
        console.error('Error al obtener consejo:', err);// Manejo de errores
        setTimeout(() => {
            const titleElem = document.getElementById('ruleta-modal-title');
            const textoElem = document.getElementById('ruleta-consejo-texto');

            if (titleElem) titleElem.textContent = '/// ERROR DE TRANSMISIÓN';
            if (textoElem) textoElem.textContent = `[FAIL]: ${err.message.toUpperCase()}`;

            const modal = document.getElementById('ruleta-modal');
            if (modal) modal.classList.add('active');
            
            girandoRuleta = false;
        }, 3000);
    }
}

// FUNCION DE MODAL
function cerrarRuletaModal() {//oculta el modal quitando la clase CSS "active"
    const modal = document.getElementById('ruleta-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}