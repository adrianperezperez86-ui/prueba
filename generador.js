// generador.js
function nombreASlug(nombre) {
    return nombre
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
}

/**
 * Genera el HTML de la página individual con la sinopsis incluida.
 */
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
                <p>${sinopsis}</p> </div>
        </div>

    </div>

    <script src="api_handler.js"></script>
</body>
</html>`;
}

/**
 * Genera el CSS para el layout horizontal forzado.
 */
function generarCSS(nombreAnime) {
    return `/* Estilos personalizados para ${nombreAnime} */
/* Generado automáticamente por servidor.js */

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
    
    /* Reseteamos estilos de tarjeta */
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

module.exports = {
    nombreASlug,
    generarHTML,
    generarCSS
};