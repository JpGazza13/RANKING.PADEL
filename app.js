// =========================
// CONFIGURACIÓN DE RUTAS
// =========================
const URL_G1 = "https://raw.githubusercontent.com/jpgazza13/RANKING.PADEL/main/data/g1.txt";
const URL_G2 = "https://raw.githubusercontent.com/jpgazza13/RANKING.PADEL/main/data/g2.txt";
const URL_G3 = "https://raw.githubusercontent.com/jpgazza13/RANKING.PADEL/main/data/g3.txt";

// =========================
// CARGA DE JUGADORES DESDE GITHUB
// =========================
async function cargarJugadoresDesdeGitHub() {
    try {
        const [g1, g2, g3] = await Promise.all([
            fetch(URL_G1).then(r => r.text()),
            fetch(URL_G2).then(r => r.text()),
            fetch(URL_G3).then(r => r.text())
        ]);

        const listaG1 = g1.split("\n").map(x => x.trim()).filter(x => x);
        const listaG2 = g2.split("\n").map(x => x.trim()).filter(x => x);
        const listaG3 = g3.split("\n").map(x => x.trim()).filter(x => x);

        // Guardar en localStorage para carga rápida
        localStorage.setItem("jugadores_g1", JSON.stringify(listaG1));
        localStorage.setItem("jugadores_g2", JSON.stringify(listaG2));
        localStorage.setItem("jugadores_g3", JSON.stringify(listaG3));

        // Mostrar en pantalla
        document.getElementById("g1").value = listaG1.join("\n");
        document.getElementById("g2").value = listaG2.join("\n");
        document.getElementById("g3").value = listaG3.join("\n");

        console.log("Jugadores cargados desde GitHub.");
    } catch (error) {
        console.error("Error cargando desde GitHub:", error);
        alert("Error cargando jugadores desde GitHub.");
    }
}

// =========================
// GUARDAR MANUALMENTE (EDITABLE)
// =========================
function guardarGrupo(idTextarea, keyStorage) {
    const contenido = document.getElementById(idTextarea).value
        .split("\n")
        .map(x => x.trim())
        .filter(x => x);

    localStorage.setItem(keyStorage, JSON.stringify(contenido));
    alert("Grupo guardado correctamente.");
}

document.getElementById("guardarG1").addEventListener("click", () => guardarGrupo("g1", "jugadores_g1"));
document.getElementById("guardarG2").addEventListener("click", () => guardarGrupo("g2", "jugadores_g2"));
document.getElementById("guardarG3").addEventListener("click", () => guardarGrupo("g3", "jugadores_g3"));

// =========================
// FUNCIÓN PRINCIPAL AL CARGAR LA WEB
// =========================
window.addEventListener("load", () => {
    cargarJugadoresDesdeGitHub();
});

// =========================
// TODO EL RESTO DE TU LÓGICA (SETS, PUNTOS, PARTIDOS…)
// =========================
// Aquí mantienes exactamente tu código actual de:
// - Generación de partidos
// - Cálculo de sets
// - Puntuación
// - Clasificación
// - Doblajes
// - Botones
// - Renderizado
// - Etc.

// Si quieres, puedo integrarlo todo aquí dentro también.
// Solo pídemelo.
