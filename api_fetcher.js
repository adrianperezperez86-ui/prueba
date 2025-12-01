// api_fetcher.js (Usando la librería de traducción gratuita)
const fetch = require('node-fetch'); 
const translate = require('translate-google'); // <<-- NUEVA LIBRERÍA

/**
 * Traduce el texto al idioma destino (es) usando la interfaz pública de Google Translate.
 * @param {string} texto - El texto a traducir.
 * @returns {Promise<string>} El texto traducido.
 */
async function traducirTexto(texto) {
    const destino = 'es';
    console.log(`    [API] Solicitando traducción (vía interfaz pública)...`);
    try {
        // La librería translate-google gestiona la conexión gratuita
        const resultado = await translate(texto, { from: 'en', to: destino });
        console.log("    [API] Traducción recibida con éxito.");
        return resultado;
    } catch (error) {
        console.error(`    [API] ERROR DE TRADUCCIÓN: ${error.message}`);
        // Devolvemos el texto original si la traducción falla
        return `[FALLO DE TRADUCCIÓN, MOSTRANDO ORIGINAL] ${texto}`; 
    }
}

/**
 * Busca la sinopsis de un anime, la limpia, y la traduce.
 */
async function buscarSinopsis(nombreAnime) {
    const tag = encodeURIComponent(nombreAnime);
    const url = `https://kitsu.io/api/edge/anime?filter[text]=${tag}&page[limit]=1`;
    console.log(`    [API] Buscando sinopsis en Kitsu para: ${nombreAnime}...`);

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`    [API] Error HTTP ${response.status} al buscar sinopsis.`);
            return `Sinopsis no disponible (Error HTTP ${response.status}).`;
        }

        const data = await response.json();
        const sinopsis = data.data?.[0]?.attributes?.synopsis;

        if (sinopsis) {
            let sinopsisLimpia = sinopsis;
            
            // 1. Limpieza de texto
            sinopsisLimpia = sinopsisLimpia.replace(/<[^>]*>/g, '').trim();
            sinopsisLimpia = sinopsisLimpia.replace(/\[Written by .*?\]/i, '').trim();
            sinopsisLimpia = sinopsisLimpia.replace(/\s*\([\s\S]*Source:[\s\S]*\)$/i, '').trim();
            
            // 2. TRADUCIR SIN NECESIDAD DE PAGAR
            const sinopsisTraducida = await traducirTexto(sinopsisLimpia);

            return sinopsisTraducida;
        } else {
            console.log("    [API] Sinopsis no encontrada en Kitsu.");
            return "Sinopsis no encontrada para este título en la base de datos de Kitsu.";
        }

    } catch (error) {
        console.error(`    [API] Error de conexión: ${error.message}`);
        return "Sinopsis no disponible (FALLO DE CONEXIÓN LOCAL)."; 
    }
}

module.exports = {
    buscarSinopsis
};