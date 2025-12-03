// galeria_handler.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. OBTENER REFERENCIAS DE ELEMENTOS
    const galeriaScrollContainer = document.getElementById('galeria-scroll'); 
    const flechaIzquierda = document.getElementById('arrow-left');
    const flechaDerecha = document.getElementById('arrow-right');
    
    // Si no encuentra los elementos (por el 404), sale sin causar errores
    if (!galeriaScrollContainer || !flechaIzquierda || !flechaDerecha) {
        return;
    }

    // Cantidad de desplazamiento fijo
    const SCROLL_STEP = 750; 

    // --- 2. CONFIGURAR ESCUCHADORES DE EVENTOS ---
    
    // Flecha Izquierda
    flechaIzquierda.addEventListener('click', (event) => {
        // Detiene la propagación para evitar la selección de texto
        event.stopPropagation(); 
        
        galeriaScrollContainer.scrollBy({
            left: -SCROLL_STEP, // Izquierda
            behavior: 'smooth'
        });
    });

    // Flecha Derecha
    flechaDerecha.addEventListener('click', (event) => {
        // Detiene la propagación para evitar la selección de texto
        event.stopPropagation(); 
        
        galeriaScrollContainer.scrollBy({
            left: SCROLL_STEP, // Derecha
            behavior: 'smooth'
        });
    });
});