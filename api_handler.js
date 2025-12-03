/**
 * Función central para cargar la imagen de un anime usando la API de Jikan/MyAnimeList.
 * @param {string} tag - El nombre del anime para buscar (ej. 'Jujutsu Kaisen').
 * @param {object} imageElement - La etiqueta <img> del DOM a actualizar.
 */
/**
 * Carga la imagen de un anime intentando 3 APIs en paralelo.
 * Usa la primera que devuelva una imagen válida.
 * @param {string} tag - El nombre del anime para buscar.
 * @param {HTMLImageElement} imageElement - Elemento <img> a actualizar.
 */
function cargarImagenAnime(tag, imageElement) {
    if (!imageElement) return;
    imageElement.alt = `Buscando ${tag}...`;

    // Intentar todas las APIs en paralelo y usar la primera que devuelva imagen
    Promise.allSettled([
        fetchDesdeKitsu(tag),
        fetchDesdeAniList(tag),
        fetchDesdeJikan(tag)
    ])
    .then(results => {
        // Buscar la primera imagen que se cargó exitosamente
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
                imageElement.src = result.value;
                imageElement.alt = tag;
                console.log(`✓ ${tag} cargado`);
                return;
            }
        }
        // Si ninguna API devolvió imagen
        imageElement.alt = `No encontrado: ${tag}`;
        console.warn(`✗ No se encontró imagen para ${tag}`);
    })
    .catch(err => {
        console.error(`✗ Error al cargar ${tag}:`, err.message);
        imageElement.alt = `Error: ${tag}`;
    });
}

/**
 * Fetch desde Kitsu.io con timeout de 5 segundos.
 */
function fetchDesdeKitsu(tag) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    return fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(tag)}&page[limit]=1`, {
        signal: controller.signal
    })
    .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`Kitsu HTTP ${res.status}`);
        return res.json();
    })
    .then(data => {
        const imageUrl = data.data?.[0]?.attributes?.posterImage?.large;
        if (!imageUrl) throw new Error('Sin imagen');
        return imageUrl;
    })
    .catch(err => {
        clearTimeout(timeoutId);
        console.debug(`Kitsu falló: ${err.message}`);
        throw err;
    });
}

/**
 * Fetch desde AniList GraphQL con timeout de 5 segundos.
 */
function fetchDesdeAniList(tag) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const query = `query ($search: String) { Media(search: $search, type: ANIME) { coverImage { large } } }`;
    const body = JSON.stringify({ query, variables: { search: tag } });

    return fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal
    })
    .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
        return res.json();
    })
    .then(json => {
        const imageUrl = json.data?.Media?.coverImage?.large;
        if (!imageUrl) throw new Error('Sin imagen');
        return imageUrl;
    })
    .catch(err => {
        clearTimeout(timeoutId);
        console.debug(`AniList falló: ${err.message}`);
        throw err;
    });
}

/**
 * Fetch desde Jikan con timeout de 5 segundos.
 */
function fetchDesdeJikan(tag) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    return fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(tag)}&limit=1`, {
        signal: controller.signal
    })
    .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`Jikan HTTP ${res.status}`);
        return res.json();
    })
    .then(data => {
        const imageUrl = data.data?.[0]?.images?.jpg?.large_image_url;
        if (!imageUrl) throw new Error('Sin imagen');
        return imageUrl;
    })
    .catch(err => {
        clearTimeout(timeoutId);
        console.debug(`Jikan falló: ${err.message}`);
        throw err;
    });
}

// ----------------------------------------------------------------------
// Lógica de Automatización con Retraso (MÁXIMA SEGURIDAD CONTRA 429)
// ----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const elementosAnime = document.querySelectorAll('img[data-anime-tag]');
    
    // Cargamos todas las imágenes en paralelo sin retraso
    elementosAnime.forEach((imgElement) => {
        const animeTag = imgElement.dataset.animeTag;
        if (animeTag) {
            cargarImagenAnime(animeTag, imgElement);
        }
    });
});