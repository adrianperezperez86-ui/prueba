// watcher.js
const fs = require('fs');
const path = require('path');
// Importa funciones: buscarSinopsis ahora debe devolver { sinopsis, posterUrl }
const { buscarSinopsis } = require('./api_fetcher.js');
const { buscarPersonajes } = require('./personajes_fetcher.js'); 

const CARPETA_PROYECTO = __dirname;
const INDEX_FILE = path.join(CARPETA_PROYECTO, 'index.html');
let isGenerating = false;

// --- Funciones de Utilidad ---

function nombreASlug(nombre) {
    return nombre
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
}

// Genera el HTML. Ahora acepta 'posterUrl'
function generarHTML(nombreAnime, sinopsis, personajes, posterUrl) {
    const slug = nombreASlug(nombreAnime);

    // Galería de personajes dinámica
    let galeriaPersonajesHTML = personajes.length > 0
        ? personajes.map((p) => 
            `<div class="personaje-galeria-wrapper">
                <img src="${p.imagen_url}" alt="Imagen de ${p.nombre}">
                <div class="personaje-tooltip">
                    <h4>${p.nombre}</h4>
                    <p>Rol: ${p.rol || 'Principal/Secundario'}</p>
                    <p>Voz: ${p.seiyuu}</p>
                </div>
            </div>`
          ).join('')
        : '<p>Galería de personajes no disponible.</p>';
        
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${nombreAnime} - Anime</title>
    <link rel="stylesheet" href="stylesheet.css">
    <link rel="stylesheet" href="${slug}.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>

<body>
    <div>
        <div class="titulos">
            <h1>${nombreAnime}</h1>
            <a href="index.html" style="color: yellow; text-decoration: none; margin-left: 20px;">← Volver</a>
        </div>

        <div class="anime-details">
            
            <div class="pelicula">
                <img id="${slug}-poster" src="${posterUrl}" alt="Póster de ${nombreAnime}">
            </div>
            
            <div class="contenido-sinopsis">
                <h2>Sinopsis/Resumen</h2>
                <p>${sinopsis}</p>
            </div>
        </div>
        
        <div class="galeria-seccion">
            <div class="titulos">
                <h1>Galería de Personajes</h1> 
            </div>

            <div class="galeria-wrapper">
                <button class="nav-arrow left" id="arrow-left"><i class="fas fa-chevron-left"></i></button>
                <section class="section-container" id="galeria-scroll">
                    ${galeriaPersonajesHTML}
                </section>
                <button class="nav-arrow right" id="arrow-right"><i class="fas fa-chevron-right"></i></button>
            </div>
            <br><br><br><br><br>
        </div>

    </div>

    <script src="galeria_handler.js"></script> 
</body>
</html>`;
}

// Genera el CSS con las correcciones de la galería
function generarCSS(nombreAnime) {
    return `/* Estilos personalizados para ${nombreAnime} */
/* Generado automáticamente por watcher.js */

/* CONTENEDOR PRINCIPAL: ALINEA IMAGEN Y SINOPSIS (Flexbox) */
.anime-details {
    display: flex;
    gap: 40px; 
    padding: 40px 50px;
    align-items: flex-start; 
    flex-wrap: nowrap;
}

/* LA IMAGEN (div.pelicula) */
.anime-details .pelicula {
    flex-basis: 350px; 
    flex-shrink: 0; 
    padding: 0;
    margin: 0; 
    box-shadow: none;
    border: none;
    cursor: default; 
}

/* Ocultamos elementos redundantes */
.anime-details .pelicula h1, 
.anime-details .pelicula p {
    display: none; 
}

/* LA SINOPSIS (div.contenido-sinopsis) */
.contenido-sinopsis {
    flex-grow: 1; 
    background-color: #1a1a1a;
    border: 1px solid #333;
    border-radius: 10px;
    padding: 30px;
    color: #f0f0f0;
}

.contenido-sinopsis h2 {
    color: yellow;
    font-size: 40px;
    margin-bottom: 15px;
    text-shadow: 0 0 10px rgba(255, 255, 0, 0.3);
}

.contenido-sinopsis p {
    font-size: 16px;
    line-height: 1.6;
    color: #ddd;
    text-align: justify;
}

/* ------------------------------------------- */
/* --- ESTILOS DE LA GALERÍA DE PERSONAJES --- */
/* ------------------------------------------- */

.galeria-seccion {
    padding: 20px 0; 
    display: flex; 
    flex-direction: column;
    align-items: center;
}

/* Nuevo contenedor para envolver la galería y las flechas */
.galeria-wrapper {
    position: relative;
    display: flex; /* Para alinear flechas y contenedor de scroll */
    align-items: center;
    width: 95vw; /* Más ancho para que quepan las flechas */
    margin: auto;
}

/* El contenedor que define el área de visualización */
.section-container {
    display: flex;
    flex-grow: 1; 
    width: 100%; 
    height: 50vh;
    gap: 25px; /* Más espacio entre imágenes */
    overflow-x: scroll; 
    overflow-y: hidden;
    border-radius: 18px;
    background-color: #111; 
    padding: 20px;
    white-space: nowrap; 
    scroll-behavior: smooth;
    justify-content: flex-start;
    
    /* MEJORA VISUAL: Borde y sombra */
    border: 1px solid rgba(255, 255, 0, 0.3);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 255, 0, 0.1); 

    /* OCULTAR BARRA DE SCROLL */
    -ms-overflow-style: none;
    scrollbar-width: none;
}

/* Regla para ocultar la barra de scroll en Chrome/Safari */
.section-container::-webkit-scrollbar {
    display: none;
}

/* Estilos para las flechas de navegación */
.nav-arrow {
    background-color: rgba(0, 0, 0, 0.7);
    color: yellow;
    border: none;
    padding: 15px 10px;
    font-size: 24px;
    cursor: pointer;
    z-index: 20;
    transition: background-color 0.3s, transform 0.3s;
    outline: none;
    height: 120px; /* Un poco más grandes */
    border-radius: 12px;
    margin: 0 15px;
    flex-shrink: 0;
    box-shadow: 0 0 15px rgba(255, 255, 0, 0.2); /* Sombra suave */
}

.nav-arrow:hover {
    background-color: rgba(0, 0, 0, 0.95);
    transform: scale(1.1);
}

/* Contenedor individual de la imagen y el tooltip */
.personaje-galeria-wrapper {
    position: relative; 
    width: 180px; /* Imágenes un poco más anchas */
    height: 100%;
    flex-shrink: 0;
    /* Esto es clave: si el elemento padre no tiene overflow:hidden, el hijo que se mueve NO se recorta */
    overflow: visible; 
    transition: transform 0.4s ease, box-shadow 0.4s ease;
    border-radius: 12px;
}

/* Estilos de la imagen */
.personaje-galeria-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.9;
    border-radius: 12px;
    flex-shrink: 0;
    /* Tono artístico inicial */
    filter: sepia(60%) contrast(1.1); 
    transition: all 0.4s ease;
    border: 2px solid #333; /* Borde interior sutil */
}

/* *** CORRECCIÓN DEL HOVER (SUAVE Y SIN RECORTE) *** */
.personaje-galeria-wrapper:hover {
    cursor: pointer;
    /* Solo levanta 5px (menos agresivo que 10px y no escala) */
    transform: translateY(-5px); 
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 255, 0, 0.3); 
    z-index: 10;
}
.personaje-galeria-wrapper:hover img {
    opacity: 1;
    /* Restaura color y satura ligeramente */
    filter: grayscale(0%) saturate(1.2) contrast(1);
    border-color: yellow; /* Destaca el borde */
}
/* *** FIN CORRECCIÓN DEL HOVER *** */


/* Estilos del Tooltip Desplegable (Información) */
.personaje-tooltip {
    position: absolute;
    top: 50%; 
    left: 100%; 
    /* Efecto de movimiento al aparecer */
    transform: translateY(-50%) translateX(25px); 
    width: 250px; 
    background-color: #2c2c2c;
    border: 2px solid #4CAF50;
    border-radius: 10px;
    padding: 15px;
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.4); 
    opacity: 0; 
    visibility: hidden;
    transition: opacity 0.3s ease, transform 0.3s ease;
    z-index: 15; 
    color: #fff;
    pointer-events: none; 
}

.personaje-tooltip h4 {
    margin: 0 0 8px 0;
    color: yellow;
    font-size: 20px; 
    text-shadow: 0 0 5px rgba(255, 255, 0, 0.3);
}

.personaje-tooltip p {
    margin: 0;
    font-size: 15px;
    color: #ccc;
    line-height: 1.4;
}

/* Mostrar el tooltip al hacer hover en el wrapper */
.personaje-galeria-wrapper:hover .personaje-tooltip {
    opacity: 1;
    visibility: visible;
    /* Vuelve a la posición estándar (efecto de movimiento) */
    transform: translateY(-50%) translateX(15px); 
}
`;
}


// --- Lógica Principal de Generación ---

function extraerAnimesDesdeIndex() {
    try {
        const contenidoIndex = fs.readFileSync(INDEX_FILE, 'utf8');
        // Regex para buscar el texto dentro de las etiquetas <h1>
        const regex = /<h1>(.*?)<\/h1>/gs;
        let match;
        const animes = new Set();
        
        while ((match = regex.exec(contenidoIndex)) !== null) {
            const nombre = match[1].trim(); 
            if (nombre && nombre !== 'Animes') { // Evita el <h1>Animes</h1> principal
                animes.add(nombre);
            }
        }
        return Array.from(animes);
    } catch (error) {
        console.error(`✗ Error leyendo ${INDEX_FILE}. Asegúrate de que existe.`, error.message);
        return [];
    }
}


async function generarArchivosFaltantes() {
    if (isGenerating) return; 
    isGenerating = true;

    const animesEnIndex = extraerAnimesDesdeIndex();
    
    if (animesEnIndex.length === 0) {
        console.log("[WATCHER] No se encontraron animes en index.html.");
        isGenerating = false;
        return;
    }

    let creados = 0;
    let omitidos = 0;

    console.log(`[WATCHER] Iniciando búsqueda de datos y generación para ${animesEnIndex.length} animes...`);

    for (const nombreAnime of animesEnIndex) {
        const slug = nombreASlug(nombreAnime);
        const rutaHTML = path.join(CARPETA_PROYECTO, `${slug}.html`);
        const rutaCSS = path.join(CARPETA_PROYECTO, `${slug}.css`);

        // Si el archivo ya existe, lo omitimos (optimización)
        if (fs.existsSync(rutaHTML) && fs.existsSync(rutaCSS)) {
            omitidos++;
            continue;
        }

        try {
            // 1. LLAMADA A LA API DE SINOPSIS (Espera un OBJETO)
            const dataAnime = await buscarSinopsis(nombreAnime); 
            
            // Asume que dataAnime es { sinopsis: '...', posterUrl: '...' }
            const sinopsisEncontrada = dataAnime.sinopsis || 'Sinopsis no disponible.';
            const posterUrl = dataAnime.posterUrl || 'default_poster.png'; // Fallback
            
            // 2. LLAMADA A LA API DE PERSONAJES
            const personajesEncontrados = await buscarPersonajes(nombreAnime);
            
            // 3. Generar contenido (Pasa la URL del póster)
            const html = generarHTML(nombreAnime, sinopsisEncontrada, personajesEncontrados, posterUrl);
            const css = generarCSS(nombreAnime); 
            
            fs.writeFileSync(rutaHTML, html, 'utf8');
            fs.writeFileSync(rutaCSS, css, 'utf8');
            
            console.log(`    ✓ ARCHIVOS CREADOS: ${nombreAnime}`);
            creados++;

        } catch (err) {
            console.error(`    ✗ Error al crear archivos para ${nombreAnime}:`, err.message);
        }
    }

    console.log(`[WATCHER] Resumen: ${creados} nuevos creados, ${omitidos} omitidos.`);
    isGenerating = false;
}

// --- Lógica del Vigilante (fs.watch) ---

// Variable para almacenar el ID del temporizador
let debounceTimer; 
// Tiempo de espera en milisegundos (2 segundos)
const DEBOUNCE_DELAY = 2000; 

fs.watch(INDEX_FILE, async (eventType, filename) => {
    if (eventType === 'change') {
        // 1. Limpia cualquier temporizador pendiente (si hubo un guardado hace poco)
        clearTimeout(debounceTimer); 

        // 2. Establece un nuevo temporizador
        // Esto solo se ejecutará si no hay más eventos 'change' durante DEBOUNCE_DELAY
        debounceTimer = setTimeout(async () => {
            
            console.log("\n================================================================");
            console.log(`[WATCHER] 💾 Cambio detectado en index.html. Espera de ${DEBOUNCE_DELAY / 1000}s completada. Iniciando generación...`);
            
            await generarArchivosFaltantes();
        }, DEBOUNCE_DELAY); 
    }
});

console.log(`PS ${CARPETA_PROYECTO}> node ./watcher.js`);
console.log(`👀 [WATCHER] Escuchando cambios en index.html...`);
console.log(`\t(Deja esta terminal abierta. La generación será automática al guardar)`);