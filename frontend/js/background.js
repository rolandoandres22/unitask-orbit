// CANVAS DE PARTÍCULAS (SCI-FI BACKGROUND)
const canvas = document.getElementById('crackCanvas');//busca el elemento crackCanvas en el documento
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];//crea un arreglo
let angleOffset = 0;//crea la variable para el angulo acumulativo de los anillos orbitales

function resizeCanvas() {//ajusta la resolución del canvas al tamaño actual de su contenedor
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;//asigna el ancho del contenedor
    canvas.height = canvas.offsetHeight;//asigna el alto del contenedor
    initParticles();//inicia las articulas
}

function initParticles() {//Puebla el arreglo "particles" creando 40 partículas con sus posiciones
    if (!canvas) return;
    particles = [];//limpia el arreglo
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: Math.random() * canvas.width,// Posición X aleatoria dentro de los límites del canvas
            y: Math.random() * canvas.height,// Posición Y aleatoria dentro de los límites del canvas
            vx: (Math.random() - 0.5) * 1.2,// velocidades de movimiento en X
            vy: (Math.random() - 0.5) * 1.2,// velocidades de movimiento en Y
            radius: Math.random() * 2 + 1,//radio de cada partícula (entre 1px y 3px)
            color: Math.random() > 0.4 ? '#c084fc' : '#e9d5ff'//color entre el rango de esos 2 
        });
    }
}

function renderSciFiCanvas() {//dibuja los arcos rotativos en el centro, desplaza las partículas
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);//limpia la pantalla
    const w = canvas.width;
    const h = canvas.height;

    // CAPA 1: ANILLOS ORBITALES CENTRALES (Efecto HUD Sci-Fi)
    ctx.save();
    ctx.translate(w / 2, h / 2);// Traslada los anillos al centro exacto del canvas
    angleOffset += 0.005;
    //Anillo exterior (gira a la derecha)
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(w, h) * 0.3, angleOffset, angleOffset + Math.PI * 1.2);
    ctx.stroke();
    //Anillo interior (gira más rápido hacia la izquierda)
    ctx.strokeStyle = 'rgba(233, 213, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(w, h) * 0.22, -angleOffset * 1.5, -angleOffset * 1.5 + Math.PI * 0.8);
    ctx.stroke();
    ctx.restore();//restaura el origen de coordenadas

    // CAPA 2: RED DE PARTÍCULAS Y CONEXIONES (Constelación/Nodos)
    ctx.lineWidth = 0.8;
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;// Mueve la partícula en x
        p.y += p.vy;// Mueve la partícula en y

        if (p.x < 0 || p.x > w) p.vx *= -1;// Rebote en las paredes
        if (p.y < 0 || p.y > h) p.vy *= -1;// Rebote en las paredes
        // Dibujo del punto/nodo
        ctx.fillStyle = p.color;
        ctx.shadowColor = '#b522ff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let j = i + 1; j < particles.length; j++) {// Conexiones: Compara la distancia con las otras partículas
            const p2 = particles[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);// Calcula la distancia
            if (dist < 130) {//si la distancia es menor a 130px dibuja la línea de una a la otra
                const alpha = 1 - (dist / 130);
                ctx.strokeStyle = `rgba(192, 132, 252, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(renderSciFiCanvas);
}

// EVENT LISTENERS E INICIALIZACIÓN
window.addEventListener('resize', resizeCanvas);//recalcula el tamaño y reubica las partículas
window.addEventListener('load', () => {// Inicia la animación cuando la pagina cargue
    if (canvas) {
        resizeCanvas();
        renderSciFiCanvas();
    }
});