// =========================
// CONFIGURACIÓN DE RUTAS
// =========================
const URL_G1 = "https://raw.githubusercontent.com/jpgazza13/RANKING.PADEL/main/data/g1.txt";
const URL_G2 = "https://raw.githubusercontent.com/jpgazza13/RANKING.PADEL/main/data/g2.txt";
const URL_G3 = "https://raw.githubusercontent.com/jpgazza13/RANKING.PADEL/main/data/g3.txt";

// =========================
// ESTADO GLOBAL
// =========================
let jugadoresG1 = [];
let jugadoresG2 = [];
let jugadoresG3 = [];

let jugadoresSeleccionados = [];
let jugadoresQueJuegan = [];
let jugadoresDisponiblesParaDoblar = [];

let partidoActual = null;
let clasificacion = {};

// =========================
// CAMBIO DE TABS
// =========================
function mostrarTab(id) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// =========================
// CARGA DE JUGADORES
// =========================
async function cargarJugadores() {
    const [g1, g2, g3] = await Promise.all([
        fetch(URL_G1).then(r => r.text()),
        fetch(URL_G2).then(r => r.text()),
        fetch(URL_G3).then(r => r.text())
    ]);

    jugadoresG1 = g1.split("\n").map(x => x.trim()).filter(x => x);
    jugadoresG2 = g2.split("\n").map(x => x.trim()).filter(x => x);
    jugadoresG3 = g3.split("\n").map(x => x.trim()).filter(x => x);

    document.getElementById("jugadores-g1").value = jugadoresG1.join("\n");
    document.getElementById("jugadores-g2").value = jugadoresG2.join("\n");
    document.getElementById("jugadores-g3").value = jugadoresG3.join("\n");

    inicializarClasificacion();
    renderSeleccionJugadores();
    renderClasificacion();
}

function guardarJugadores(grupo) {
    const id = "jugadores-" + grupo;
    const lista = document.getElementById(id).value.split("\n").map(x => x.trim()).filter(x => x);

    if (grupo === "g1") jugadoresG1 = lista;
    if (grupo === "g2") jugadoresG2 = lista;
    if (grupo === "g3") jugadoresG3 = lista;

    alert("Grupo guardado.");
}

// =========================
// CLASIFICACIÓN
// =========================
function inicializarClasificacion() {
    const guardada = localStorage.getItem("clasificacion_padel");
    if (guardada) {
        clasificacion = JSON.parse(guardada);
        return;
    }

    [...jugadoresG1, ...jugadoresG2, ...jugadoresG3].forEach(nombre => {
        clasificacion[nombre] = { puntos: 0, setsGanados: 0, setsPerdidos: 0, juegos: 0 };
    });

    guardarClasificacion();
}

function guardarClasificacion() {
    localStorage.setItem("clasificacion_padel", JSON.stringify(clasificacion));
}

function renderClasificacion() {
    const cont = document.getElementById("clasificacion-contenido");
    cont.innerHTML = "";

    const lista = Object.entries(clasificacion).map(([nombre, d]) => ({ nombre, ...d }));

    lista.sort((a, b) =>
        b.puntos - a.puntos ||
        b.setsGanados - a.setsGanados ||
        b.juegos - a.juegos
    );

    let html = `<table><thead><tr>
        <th>Jugador</th><th>Puntos</th><th>Sets G</th><th>Sets P</th><th>Juegos</th>
    </tr></thead><tbody>`;

    lista.forEach(j => {
        html += `<tr>
            <td>${j.nombre}</td>
            <td>${j.puntos}</td>
            <td>${j.setsGanados}</td>
            <td>${j.setsPerdidos}</td>
            <td>${j.juegos}</td>
        </tr>`;
    });

    html += "</tbody></table>";
    cont.innerHTML = html;
}

// =========================
// SELECCIÓN JUEGA / DOBLA
// =========================
function renderSeleccionJugadores() {
    const cont = document.getElementById("seleccion-jugadores");
    cont.innerHTML = "";

    jugadoresSeleccionados = jugadoresG1.map(nombre => ({
        nombre,
        juega: false,
        dobla: false
    }));

    jugadoresG1.forEach(nombre => {
        const fila = document.createElement("div");
        fila.className = "fila-jugador";

        const label = document.createElement("span");
        label.textContent = nombre;
        label.className = "nombre-jugador";

        const btnJ = document.createElement("button");
        btnJ.textContent = "JUEGA";
        btnJ.className = "btn-juega";
        btnJ.onclick = () => toggleJuega(nombre, btnJ);

        const btnD = document.createElement("button");
        btnD.textContent = "DOBLA";
        btnD.className = "btn-dobla";
        btnD.onclick = () => toggleDobla(nombre, btnD);

        fila.appendChild(label);
        fila.appendChild(btnJ);
        fila.appendChild(btnD);
        cont.appendChild(fila);
    });
}

function toggleJuega(nombre, btn) {
    const j = jugadoresSeleccionados.find(x => x.nombre === nombre);
    j.juega = !j.juega;
    btn.classList.toggle("activo");
    actualizarListas();
}

function toggleDobla(nombre, btn) {
    const j = jugadoresSeleccionados.find(x => x.nombre === nombre);
    j.dobla = !j.dobla;
    btn.classList.toggle("activo");
    actualizarListas();
}

function actualizarListas() {
    jugadoresQueJuegan = jugadoresSeleccionados.filter(j => j.juega).map(j => j.nombre);
    jugadoresDisponiblesParaDoblar = jugadoresSeleccionados.filter(j => j.dobla).map(j => j.nombre);
}

// =========================
// GENERAR PARTIDO
// =========================
function generarPartido() {
    let base = [...jugadoresQueJuegan];

    if (base.length < 4) {
        const faltan = 4 - base.length;
        const candidatos = jugadoresDisponiblesParaDoblar.filter(n => !base.includes(n));

        if (candidatos.length < faltan) {
            alert("No hay suficientes jugadores ni dobladores.");
            return;
        }

        base = base.concat(candidatos.slice(0, faltan));
    }

    const [A, B, C, D] = base;

    let dobladorReal = null;
    base.forEach(n => {
        if (jugadoresDisponiblesParaDoblar.includes(n) && !jugadoresQueJuegan.includes(n)) {
            dobladorReal = n;
        }
    });

    partidoActual = { jugA: A, jugB: B, jugC: C, jugD: D, dobladorReal };

    renderResultadosPartido();
    mostrarTab("resultados");
}

// =========================
// RESULTADOS
// =========================
function renderResultadosPartido() {
    const cont = document.getElementById("resultados-contenido");
    const { jugA, jugB, jugC, jugD } = partidoActual;

    cont.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Set</th><th>Pareja Izq</th><th>Pareja Dcha</th><th>Izq</th><th>Dcha</th>
                </tr>
            </thead>
            <tbody>
                ${filaSet(1, `${jugA} + ${jugB}`, `${jugC} + ${jugD}`, "s1i", "s1d")}
                ${filaSet(2, `${jugA} + ${jugC}`, `${jugB} + ${jugD}`, "s2i", "s2d")}
                ${filaSet(3, `${jugA} + ${jugD}`, `${jugB} + ${jugC}`, "s3i", "s3d")}
            </tbody>
        </table>
    `;
}

function filaSet(n, izq, dcha, idI, idD) {
    return `
        <tr>
            <td>${n}</td>
            <td>${izq}</td>
            <td>${dcha}</td>
            <td><input id="${idI}" type="number" min="0"></td>
            <td><input id="${idD}" type="number" min="0"></td>
        </tr>
    `;
}

function guardarResultados() {
    const { jugA, jugB, jugC, jugD, dobladorReal } = partidoActual;

    const sets = [
        leer("s1i", "s1d"),
        leer("s2i", "s2d"),
        leer("s3i", "s3d")
    ];

    const parejas = [
        { izq: [jugA, jugB], dcha: [jugC, jugD] },
        { izq: [jugA, jugC], dcha: [jugB, jugD] },
        { izq: [jugA, jugD], dcha: [jugB, jugC] }
    ];

    sets.forEach((s, i) => {
        const { izq, dcha } = parejas[i];

        let ganadores, perdedores;
        if (s.i > s.d) {
            ganadores = izq;
            perdedores = dcha;
        } else {
            ganadores = dcha;
            perdedores = izq;
        }

        ganadores.forEach(n => {
            clasificacion[n].setsGanados++;
            clasificacion[n].juegos += Math.max(s.i, s.d);
            clasificacion[n].puntos += (n === dobladorReal ? 2 : 7);
        });

        perdedores.forEach(n => {
            clasificacion[n].setsPerdidos++;
            clasificacion[n].juegos += Math.min(s.i, s.d);
            clasificacion[n].puntos += (n === dobladorReal ? 0 : Math.min(s.i, s.d));
        });
    });

    guardarClasificacion();
    renderClasificacion();
    alert("Resultados guardados.");
}

function leer(i, d) {
    return {
        i: parseInt(document.getElementById(i).value),
        d: parseInt(document.getElementById(d).value)
    };
}

// =========================
// INICIO
// =========================
window.onload = cargarJugadores;
