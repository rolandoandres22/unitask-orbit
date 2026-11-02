// ==========================================
// CANVAS DE PARTÍCULAS (SCI-FI BACKGROUND)
// ==========================================
const canvas = document.getElementById('crackCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];
let angleOffset = 0;

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    initParticles();
}

function initParticles() {
    if (!canvas) return;
    particles = [];
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            radius: Math.random() * 2 + 1,
            color: Math.random() > 0.4 ? '#c084fc' : '#e9d5ff'
        });
    }
}

function renderSciFiCanvas() {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    // Anillos Orbitales Centrales
    ctx.save();
    ctx.translate(w / 2, h / 2);
    angleOffset += 0.005;

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(w, h) * 0.3, angleOffset, angleOffset + Math.PI * 1.2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(233, 213, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(w, h) * 0.22, -angleOffset * 1.5, -angleOffset * 1.5 + Math.PI * 0.8);
    ctx.stroke();
    ctx.restore();

    // Red de Partículas y Nodos
    ctx.lineWidth = 0.8;
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.fillStyle = p.color;
        ctx.shadowColor = '#b522ff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 130) {
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

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
    if (canvas) {
        resizeCanvas();
        renderSciFiCanvas();
    }
});