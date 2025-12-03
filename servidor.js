/**
 * Servidor Express para servir archivos y guardar HTMLs/CSSs generados
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // <--- 1. IMPORTAR CORS

const app = express();
const PORT = 3000;
const CARPETA_PROYECTO = __dirname; 

// Middleware
app.use(express.json());
app.use(express.static(CARPETA_PROYECTO));

// 2. CONFIGURACIÓN CORS: Permite peticiones desde el Live Server (http://127.0.0.1:5500)
// Esto soluciona el error "Access to fetch at ... has been blocked by CORS policy"
app.use(cors({
    origin: 'http://127.0.0.1:5500' 
}));

/**
 * Convierte un nombre a slug (ej: "Jujutsu Kaisen" -> "jujutsu-kaisen")
 */
function nombreASlug(nombre) {
    return nombre
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\\w-]/g, '');
}

/**
 * Genera el HTML de la página individual
 */
function generarHTML(nombreAnime) {
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
            <a href="index.html" style="color: yellow; text-decoration: none; margin-left: 20px; font-size: 20px;">← Volver a la Cartelera</a>
        </div>

        <div class="cartelera">
            <div class="pelicula">
                <h1>${nombreAnime}</h1>
                <p>Descripción del anime</p>
                <img id="${slug}-poster" src="" alt="Cargando imagen de ${nombreAnime}..." data-anime-tag="${nombreAnime}">
            </div>
        </div>

        <div class="contenido">
            <h2>Información</h2>
            <p>Aquí puedes añadir más información sobre el anime. Este es un párrafo de ejemplo.</p>
        </div>
    </div>

    <script src="api_handler.js"></script>
</body>
</html>`;
}

/**
 * Genera el CSS de la página individual
 */
function generarCSS(nombreAnime) {
    const slug = nombreASlug(nombreAnime);
    return `/* Estilos personalizados para ${nombreAnime} */
/* Archivo: ${slug}.css - Generado automáticamente */

.contenido {
    background-color: #1a1a1a;
    border: 1px solid #333;
    border-radius: 10px;
    padding: 30px;
    margin: 40px 50px;
    color: #f0f0f0;
}

.contenido h2 {
    color: yellow;
    font-size: 40px;
    margin-bottom: 15px;
    text-shadow: 0 0 10px rgba(255, 255, 0, 0.3);
}

.contenido p {
    font-size: 16px;
    line-height: 1.6;
    color: #ddd;
}

/* Nota: Los estilos de .pelicula y .titulos se heredan de stylesheet.css */
`;
}

/**
 * Endpoint POST para generar y guardar archivos
 */
app.post('/api/generar-anime', (req, res) => {
    const { nombreAnime } = req.body;

    if (!nombreAnime || nombreAnime.trim() === '') {
        return res.status(400).json({ error: 'El nombre del anime es requerido' });
    }

    const slug = nombreASlug(nombreAnime);
    const rutaHTML = path.join(CARPETA_PROYECTO, `${slug}.html`);
    const rutaCSS = path.join(CARPETA_PROYECTO, `${slug}.css`);

    // VERIFICACIÓN DE EXISTENCIA: Comprueba si el archivo ya existe en el disco
    if (fs.existsSync(rutaHTML)) {
         console.log(`ⓘ Omitiendo: ${nombreAnime} (${slug}.html ya existe)`);
         return res.json({
            success: true,
            mensaje: `Los archivos para ${nombreAnime} ya existen, se omiten.`,
            html: `${slug}.html`,
            css: `${slug}.css`,
            url: `http://localhost:${PORT}/${slug}.html`
        });
    }

    try {
        // Generar contenido
        const html = generarHTML(nombreAnime);
        const css = generarCSS(nombreAnime);

        // Guardar archivos
        fs.writeFileSync(rutaHTML, html, 'utf8');
        fs.writeFileSync(rutaCSS, css, 'utf8');

        console.log(`✓ Archivos creados para "${nombreAnime}"`);

        res.json({
            success: true,
            mensaje: `Archivos creados exitosamente`,
            html: `${slug}.html`,
            css: `${slug}.css`,
            url: `http://localhost:${PORT}/${slug}.html`
        });
    } catch (err) {
        console.error(`✗ Error al crear archivos:`, err.message);
        res.status(500).json({ error: 'Error al crear los archivos', detalles: err.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║      Servidor de Anime ejecutándose      ║`);
    console.log(`║      URL: http://localhost:${PORT}         ║`);
    console.log(`╚════════════════════════════════════════╝\n`);
});