// api_fetcher.js
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); 
const translate = require('translate-google'); 

const CACHE_FILE_SINOPSIS = path.join(__dirname, 'sinopsis_cache.json');
let sinopsisCache = {}; 

// --- Lógica de Caché en Disco (Sinopsis) ---

function cargarSinopsisCache() {
    try {
        if (fs.existsSync(CACHE_FILE_SINOPSIS)) {
            const data = fs.readFileSync(CACHE_FILE_SINOPSIS, 'utf8');
            sinopsisCache = JSON.parse(data);
            console.log("    [CACHE] Sinopsis cargadas desde sinopsis_cache.json.");
        }
    } catch (error) {
        console.error("    [CACHE] Error al cargar la caché de sinopsis:", error.message);
    }
}

function guardarSinopsisCache() {
    try {
        fs.writeFileSync(CACHE_FILE_SINOPSIS, JSON.stringify(sinopsisCache, null, 2), 'utf8');
        console.log("    [CACHE] Sinopsis guardadas en sinopsis_cache.json.");
    } catch (error) {
        console.error("    [CACHE] Error al guardar la caché de sinopsis:", error.message);
    }
}

cargarSinopsisCache();

// --- Lógica de Búsqueda y Traducción ---

const traducirTexto = async (texto) => {
    const destino = 'es';
    console.log(`    [API] Solicitando traducción (vía interfaz pública)...`);
    try {
        const resultado = await translate(texto, { from: 'en', to: destino });
        console.log("    [API] Traducción recibida con éxito.");
        return resultado;
    } catch (error) {
        console.error(`    [API] ERROR DE TRADUCCIÓN: ${error.message}`);
        return `[FALLO DE TRADUCCIÓN, MOSTRANDO ORIGINAL] ${texto}`; 
    }
}

async function buscarSinopsis(nombreAnime) {
    
    // 1. 🔍 REVISAR CACHÉ (La caché ahora guarda el objeto {sinopsis, posterUrl})
    if (sinopsisCache[nombreAnime]) {
        console.log(`    [CACHE] Sinopsis y Póster encontrados en caché para: ${nombreAnime}. Omitiendo API.`);
        return sinopsisCache[nombreAnime];
    }
    
    // Si no está en caché, continuamos con la búsqueda en la API
    const tag = encodeURIComponent(nombreAnime);
    const url = `https://kitsu.io/api/edge/anime?filter[text]=${tag}&page[limit]=1`;
    console.log(`    [API] Buscando sinopsis y póster en Kitsu para: ${nombreAnime}...`);

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`    [API] Error HTTP ${response.status} al buscar sinopsis.`);
            
            // *********** CORRECCIÓN: Devolver objeto con fallback ***********
            return {
                sinopsis: `Sinopsis no disponible (Error HTTP ${response.status}).`,
                posterUrl: 'default_poster.png'
            };
        }

        const data = await response.json();
        const animeData = data.data?.[0]?.attributes;

        if (animeData) {
            let sinopsisLimpia = animeData.synopsis || "Sinopsis no encontrada en Kitsu.";
            
            // *********** CORRECCIÓN: Extraer URL del Póster ***********
            const posterUrl = animeData.posterImage?.original || 'default_poster.png';
            
            // Limpieza de texto
            sinopsisLimpia = sinopsisLimpia.replace(/<[^>]*>/g, '').trim();
            sinopsisLimpia = sinopsisLimpia.replace(/\[Written by .*?\]/i, '').trim();
            sinopsisLimpia = sinopsisLimpia.replace(/\s*\([\s\S]*Source:[\s\S]*\)$/i, '').trim();
            
            // TRADUCIR
            const sinopsisTraducida = await traducirTexto(sinopsisLimpia);
            
            // 2. ✅ GUARDAR EN CACHÉ Y EN DISCO (Guardamos el objeto completo)
            const resultadoFinal = {
                sinopsis: sinopsisTraducida,
                posterUrl: posterUrl
            };

            sinopsisCache[nombreAnime] = resultadoFinal;
            guardarSinopsisCache();

            // *********** CORRECCIÓN: Devolver el objeto completo ***********
            return resultadoFinal;
            
        } else {
            console.log("    [API] Datos del anime no encontrados en Kitsu.");
            // *********** CORRECCIÓN: Devolver objeto con fallback ***********
            return {
                sinopsis: "Sinopsis no encontrada para este título en la base de datos de Kitsu.",
                posterUrl: 'default_poster.png'
            };
        }

    } catch (error) {
        console.error(`    [API] Error de conexión: ${error.message}`);
        // *********** CORRECCIÓN: Devolver objeto con fallback ***********
        return {
            sinopsis: "Sinopsis no disponible (FALLO DE CONEXIÓN LOCAL).",
            posterUrl: 'default_poster.png'
        };
    }
}

module.exports = {
    buscarSinopsis
};