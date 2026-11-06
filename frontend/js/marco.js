//Inyecta el marco SVG HUD Sci-Fi y el Loader dentro del contenedor #hud-frame-container
function loadHudFrame() {
    const container = document.getElementById('hud-frame-container');//Busca el contenedor por su ID "hud-frame-container"
    
    
    if (!container) return;// si no existe sale de la funcion

    // Inyecta la estructura completa del Marco SVG y del Loader
    container.innerHTML = `
        <!-- ============================================================ -->
        <!-- MARCO SVG NEÓN (1920x1080 - Estética Sci-Fi / Cyberpunk) -->
        <!-- ============================================================ -->
        <svg class="hud-svg-frame neon-glow-filter" viewBox="0 0 1920 1080" preserveAspectRatio="none">
            <defs>
                <!-- Gradiente lineal para darle el efecto neón púrpura a las líneas -->
                <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#f3d0ff" />
                    <stop offset="40%" stop-color="#b522ff" />
                    <stop offset="80%" stop-color="#8200ff" />
                    <stop offset="100%" stop-color="#d968ff" />
                </linearGradient>

                <!-- Patrón repetitivo para generar la textura de interferencia / Glitch Sci-Fi -->
                <pattern id="glitchTexture" width="20" height="20" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="2" x2="20" y2="2" stroke="#b522ff" stroke-width="1" opacity="0.6"/>
                    <line x1="0" y1="8" x2="15" y2="8" stroke="#f3d0ff" stroke-width="1.5" opacity="0.8"/>
                    <line x1="5" y1="14" x2="20" y2="14" stroke="#8200ff" stroke-width="1" opacity="0.5"/>
                    <rect x="2" y="4" width="3" height="3" fill="#f3d0ff" opacity="0.7"/>
                    <rect x="12" y="10" width="4" height="2" fill="#b522ff" opacity="0.9"/>
                </pattern>
            </defs>

            <!-- BORDES Y DETALLES DE LA PARTE SUPERIOR DEL MARCO -->
            <path d="M 40 10 L 400 10 L 450 45 L 1880 45" fill="none" stroke="url(#neonGrad)" stroke-width="4" stroke-linecap="square"/>
            <path d="M 50 0 L 390 0 L 435 32 L 1870 32" fill="none" stroke="#f3d0ff" stroke-width="1.5" opacity="0.8"/>
            <path d="M 60 -10 L 380 -10 L 420 20 L 1860 20" fill="none" stroke="#b522ff" stroke-width="1" opacity="0.5"/>

            <!-- Polígonos decorativos superiores (detalles angulares) -->
            <polygon points="45,-10 65,-10 65,12 45,12" fill="#f3d0ff" />
            <polygon points="75,-10 180,-10 170,0 75,0" fill="#b522ff" />

            <path d="M 1880 45 L 1895 30 L 1895 -5 L 1860 -5" fill="none" stroke="#b522ff" stroke-width="2"/>
            <line x1="1840" y1="5" x2="1880" y2="5" stroke="#f3d0ff" stroke-width="2"/>

            <!-- PANELES LATERALES (IZQUIERDA Y DERECHA) -->
            <!-- Trazo exterior e interior izquierdo con líneas punteadas y bloques de adorno -->
            <path d="M 60 90 L 60 480 L 90 510 L 90 540 L 60 570 L 60 970" fill="none" stroke="url(#neonGrad)" stroke-width="3.5"/>
            <path d="M 75 110 L 75 470 L 105 500 L 105 550 L 75 580 L 75 950" fill="none" stroke="#b522ff" stroke-width="1.5" opacity="0.7"/>
            <path d="M 45 120 L 45 460 L 75 490 L 75 560 L 45 590 L 45 930" fill="none" stroke="#f3d0ff" stroke-width="1" opacity="0.5" stroke-dasharray="15 5 2 5"/>

            <g fill="#b522ff">
                <rect x="50" y="200" width="6" height="40" />
                <rect x="50" y="250" width="6" height="15" />
                <rect x="50" y="272" width="6" height="8" />
                <polygon points="80,515 98,515 98,535 80,535" />
                <rect x="50" y="700" width="6" height="50" />
                <rect x="50" y="760" width="6" height="20" />
            </g>
            <line x1="90" y1="320" x2="90" y2="420" stroke="#f3d0ff" stroke-width="2" stroke-dasharray="4 4"/>
            <circle cx="90" cy="310" r="3" fill="#f3d0ff"/>
            <circle cx="90" cy="430" r="3" fill="#f3d0ff"/>

            <!-- Trazo exterior e interior derecho espejo -->
            <path d="M 1860 90 L 1860 480 L 1830 510 L 1830 540 L 1860 570 L 1860 970" fill="none" stroke="url(#neonGrad)" stroke-width="3.5"/>
            <path d="M 1845 110 L 1845 470 L 1815 500 L 1815 550 L 1845 580 L 1845 950" fill="none" stroke="#b522ff" stroke-width="1.5" opacity="0.7"/>
            <path d="M 1875 120 L 1875 460 L 1845 490 L 1845 560 L 1875 590 L 1875 930" fill="none" stroke="#f3d0ff" stroke-width="1" opacity="0.5" stroke-dasharray="15 5 2 5"/>

            <g fill="#b522ff">
                <rect x="1864" y="200" width="6" height="40" />
                <rect x="1864" y="250" width="6" height="15" />
                <polygon points="1822,515 1840,515 1840,535 1822,535" />
                <rect x="1864" y="700" width="6" height="50" />
            </g>
            <line x1="1830" y1="320" x2="1830" y2="420" stroke="#f3d0ff" stroke-width="2" stroke-dasharray="8 3 2 3"/>

            <!-- BASE Y BORDER INFERIOR DEL MARCO -->
            <path d="M 40 1075 L 120 1075 L 150 1040 L 1770 1040 L 1800 1075 L 1880 1075" fill="none" stroke="url(#neonGrad)" stroke-width="4" stroke-linecap="square"/>
            <path d="M 50 1087 L 110 1087 L 140 1053 L 1780 1053 L 1810 1087 L 1870 1087" fill="none" stroke="#f3d0ff" stroke-width="1.5" opacity="0.8"/>
            <path d="M 60 1099 L 100 1099 L 130 1065 L 1790 1065 L 1820 1099 L 1860 1099" fill="none" stroke="#b522ff" stroke-width="1" opacity="0.5"/>
        </svg>

        <!-- ============================================================ -->
        <!-- LOADER ANIMADO (Indicador de carga superior con máscara SVG) -->
        <!-- ============================================================ -->
        <div class="hud-loader">
            <div class="loader">
                <svg width="100" height="100" viewBox="0 0 100 100">
                    <defs>
                        <!-- Máscara geométrica formada por triángulos recortados -->
                        <mask id="clipping">
                            <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
                            <polygon points="25,25 75,25 50,75" fill="white"></polygon>
                            <polygon points="50,25 75,75 25,75" fill="white"></polygon>
                            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                        </mask>
                    </defs>
                </svg>
                <div class="box"></div>
            </div>
        </div>
    `;
}

// Ejecuta automáticamente loadHudFrame apenas el HTML termine de cargarse en el navegador
document.addEventListener('DOMContentLoaded', loadHudFrame);