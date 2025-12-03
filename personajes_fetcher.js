// personajes_fetcher.js
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const API_BASE_URL = 'https://api.jikan.moe/v4';
const CACHE_FILE_PERSONAJES = path.join(__dirname, 'personajes_cache.json');
let personajesCache = {};

// Pausa de 1 segundo (mínimo recomendado por Jikan)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Lógica de Caché en Disco ---

function cargarCache() {
    try {
        if (fs.existsSync(CACHE_FILE_PERSONAJES)) {
            const data = fs.readFileSync(CACHE_FILE_PERSONAJES, 'utf8');
            personajesCache = JSON.parse(data);
            console.log("    [CACHE] Personajes cargados desde personajes_cache.json.");
        }
    } catch (error) {
        console.error("    [CACHE] Error al cargar la caché de personajes:", error.message);
    }
}

function guardarCache() {
    try {
        fs.writeFileSync(CACHE_FILE_PERSONAJES, JSON.stringify(personajesCache, null, 2), 'utf8');
        console.log("    [CACHE] Personajes guardados en personajes_cache.json.");
    } catch (error) {
        console.error("    [CACHE] Error al guardar la caché de personajes:", error.message);
    }
}

cargarCache(); 

// --- Lógica de Búsqueda con Bucle de Reintento ---

async function buscarPersonajes(nombreAnime) {
    
    // 1. 🔍 REVISAR CACHÉ
    if (personajesCache[nombreAnime]) {
        console.log(`    [CACHE] Personajes encontrados en caché (JSON) para: ${nombreAnime}. Omitiendo API.`);
        return personajesCache[nombreAnime];
    }
    
    const maxRetries = 1;
    let attempts = 0;

    while (attempts <= maxRetries) {
        console.log(`    [API] Buscando personajes en Jikan (MyAnimeList) para: ${nombreAnime} (Intento ${attempts + 1})....`);
        
        try {
            // --- PASO 1: Buscar el ID del Anime ---
            const urlBusqueda = `${API_BASE_URL}/anime?q=${encodeURIComponent(nombreAnime)}&limit=1`;
            
            let response = await fetch(urlBusqueda);
            
            if (response.status === 429) {
                if (attempts < maxRetries) {
                    console.warn(`    [RETRY] 🚨 ERROR 429 detectado en Paso 1. Esperando 30s y reintentando para ${nombreAnime}...`);
                    await sleep(30000); 
                    attempts++;
                    continue; 
                } else {
                    console.error(`    [FINAL FAIL] Error HTTP 429 persistente en Paso 1 para ${nombreAnime}. Se omite.`);
                    return [];
                }
            }

            if (!response.ok) {
                console.error(`    [API] Error HTTP ${response.status} en Jikan (Paso 1: Buscar ID). Se omite.`);
                await sleep(1000); 
                return [];
            }

            let data = await response.json();
            const animeId = data.data?.[0]?.mal_id;

            if (!animeId) {
                console.log("    [API] ID del anime no encontrado en Jikan.");
                await sleep(1000); 
                return [];
            }

            // --- PASO 2: Buscar Personajes por ID ---
            const urlPersonajes = `${API_BASE_URL}/anime/${animeId}/characters`;
            
            response = await fetch(urlPersonajes);
            
            // 🚨 PAUSA OBLIGATORIA: 1 segundo después de CADA llamada real.
            console.log("    [WAIT] Pausa obligatoria de 1s para respetar límite de Jikan.");
            await sleep(1000); 
            
            if (response.status === 429) {
                if (attempts < maxRetries) {
                    console.warn(`    [RETRY] 🚨 ERROR 429 detectado en Paso 2. Esperando 30s y reintentando para ${nombreAnime}...`);
                    await sleep(30000); 
                    attempts++;
                    continue; 
                } else {
                    console.error(`    [FINAL FAIL] Error HTTP 429 persistente en Paso 2 para ${nombreAnime}. Se omite.`);
                    return [];
                }
            }

            if (!response.ok) {
                console.error(`    [API] Error HTTP ${response.status} en Jikan (Paso 2: Buscar Personajes). Se omite.`);
                return [];
            }

            // --- PROCESAMIENTO DE DATOS (ÉXITO) ---
            data = await response.json();
            const personajesData = data.data || [];

            const personajes = personajesData
                // Incluir 'Main' y 'Supporting' para variedad
                .filter(p => p.role === 'Main' || p.role === 'Supporting') 
                // Límite de 25 personajes
                .slice(0, 25) 
                .map(p => {
                    const seiyuu = p.voice_actors.find(va => va.language === 'Japanese')?.person?.name || 'Desconocido';
                    // Extraer la URL de la imagen y el rol
                    const imagen_url = p.character.images.jpg.image_url;
                    const rol = p.role;
                    
                    return { nombre: p.character.name, seiyuu: seiyuu, imagen_url: imagen_url, rol: rol };
                });
            
            console.log(`    [API] ÉXITO: Encontrados ${personajes.length} personajes principales/secundarios.`);
            
            // 2. ✅ GUARDAR EN CACHÉ Y EN DISCO
            personajesCache[nombreAnime] = personajes;
            guardarCache(); 

            return personajes; 

        } catch (error) {
            console.error(`    [API] Error de conexión/fetch al buscar personajes: ${error.message}`);
            return [];
        }
    }
    
    return []; 
}

module.exports = {
    buscarPersonajes
};