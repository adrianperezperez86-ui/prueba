// watcher.js (Sistema de generación local)
const fs = require('fs');
const path = require('path');
const { buscarSinopsis } = require('./api_fetcher.js'); // Importamos la API

const CARPETA_PROYECTO = __dirname;
const INDEX_FILE = path.join(CARPETA_PROYECTO, 'index.html');
let isGenerating = false;

// --- Funciones de Utilidad (Integradas) ---

function nombreASlug(nombre) {
    return nombre
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
}

function generarHTML(nombreAnime, sinopsis) {
    const slug = nombreASlug(nombreAnime);
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${nombreAnime} - Anime</title>
    <link rel="stylesheet" href="stylesheet.css">
    <link rel="stylesheet" href="${slug}.css">
</head>

<body>
    <div>
        <div class="titulos">
            <h1>${nombreAnime}</h1>
            <a href="index.html" style="color: yellow; text-decoration: none; margin-left: 20px;">← Volver</a>
        </div>

        <div class="anime-details">
            
            <div class="pelicula">
                <img id="${slug}-poster" src="" alt="Cargando imagen de ${nombreAnime}..." data-anime-tag="${nombreAnime}">
            </div>
            
            <div class="contenido-sinopsis">
                <h2>Sinopsis/Resumen</h2>
                <p>${sinopsis}</p>
            </div>
        </div>

    </div>

    <script src="api_handler.js"></script>
</body>
</html>`;
}

function generarCSS(nombreAnime) {
    return `/* Estilos personalizados para ${nombreAnime} */
/* Generado automáticamente por watcher.js */

/* CONTENEDOR PRINCIPAL: ALINEA IMAGEN Y SINOPSIS (Flexbox) */
.anime-details {
    display: flex;
    gap: 40px; 
    padding: 40px 50px;
    align-items: flex-start; 
    flex-wrap: nowrap; /* FUERZA EL LAYOUT HORIZONTAL */
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
`;
}


// --- Lógica Principal de Generación ---

function extraerAnimesDesdeIndex() {
    try {
        const contenidoIndex = fs.readFileSync(INDEX_FILE, 'utf8');
        const regex = /<h1>(.*?)<\/h1>/gs;
        let match;
        const animes = new Set();
        
        while ((match = regex.exec(contenidoIndex)) !== null) {
            const nombre = match[1].trim(); 
            if (nombre && nombre !== 'Animes') { 
                animes.add(nombre);
            }
        }
        return Array.from(animes);
    } catch (error) {
        console.error(`✗ Error leyendo ${INDEX_FILE}. Asegúrate de que existe.`, error.message);
        return [];
    }
}


/**
 * Busca sinopsis y genera archivos solo si faltan.
 */
async function generarArchivosFaltantes() {
    if (isGenerating) return; // Evita ejecuciones simultáneas
    isGenerating = true;

    const animesEnIndex = extraerAnimesDesdeIndex();
    
    if (animesEnIndex.length === 0) {
        console.log("[WATCHER] No se encontraron animes en index.html.");
        isGenerating = false;
        return;
    }

    let creados = 0;
    let omitidos = 0;

    console.log(`[WATCHER] Iniciando búsqueda de sinopsis y generación para ${animesEnIndex.length} animes...`);

    for (const nombreAnime of animesEnIndex) {
        const slug = nombreASlug(nombreAnime);
        const rutaHTML = path.join(CARPETA_PROYECTO, `${slug}.html`);
        const rutaCSS = path.join(CARPETA_PROYECTO, `${slug}.css`);

        // Si el archivo ya existe, lo omitimos para no sobrecargar la API de Kitsu
        if (fs.existsSync(rutaHTML) && fs.existsSync(rutaCSS)) {
            omitidos++;
            continue;
        }

        try {
            // LLAMADA ASÍNCRONA A LA API
            const sinopsisEncontrada = await buscarSinopsis(nombreAnime); 
            
            // Generar contenido
            const html = generarHTML(nombreAnime, sinopsisEncontrada);
            const css = generarCSS(nombreAnime);
            
            fs.writeFileSync(rutaHTML, html, 'utf8');
            fs.writeFileSync(rutaCSS, css, 'utf8');
            
            console.log(`    ✓ ARCHIVOS CREADOS: ${nombreAnime}`);
            creados++;

        } catch (err) {
            console.error(`    ✗ Error al crear archivos para ${nombreAnime}:`, err.message);
        }
    }

    console.log(`[WATCHER] Resumen: ${creados} nuevos creados, ${omitidos} omitidos.`);
    isGenerating = false;
}

// --- Lógica del Vigilante (fs.watch) ---

fs.watch(INDEX_FILE, async (eventType, filename) => {
    if (eventType === 'change') {
        console.log("\n================================================================");
        console.log("[WATCHER] 💾 Cambio detectado en index.html. Iniciando generación...");
        await generarArchivosFaltantes();
    }
});

console.log(`PS ${CARPETA_PROYECTO}> node ./watcher.js`);
console.log(`👀 [WATCHER] Escuchando cambios en index.html...`);
console.log(`\t(Deja esta terminal abierta. La generación será automática al guardar)`);