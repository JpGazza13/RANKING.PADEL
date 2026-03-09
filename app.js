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

let jugadoresSeleccionados = [];          // [{nombre, juega, dobla}]
let jugadoresQueJuegan = [];             // nombres
let jugadoresDisponiblesParaDoblar = []; // nombres

let partidoActual = null;                // {jugA, jugB, jugC, jugD, dobladorReal}
let clasificacion = {};                  // {nombre: {puntos, setsGanados, setsPerdidos, juegos}}

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

        jugadoresG1 = g1.split("\n").map(x => x.trim()).filter(x => x);
        jugadoresG2 = g2.split("\n").map(x => x.trim()).filter(x => x);
        jugadoresG3 = g3.split("\n").map(x => x.trim()).filter(x => x);

        // Guardar en localStorage para carga rápida
        localStorage.setItem("jugadores_g1", JSON.stringify(jugadoresG1));
        localStorage.setItem("jugadores_g2", JSON.stringify(jugadoresG2));
        localStorage.setItem("jugadores_g3", JSON.stringify(jugadoresG3));

        // Mostrar en pantalla (si tienes textareas g1/g2/g3)
        const g1El = document.getElementById("g1");
        const g2El = document.getElementById("g2");
        const g3El = document.getElementById("g3");
        if (g1El) g1El.value = jugadoresG1.join("\n");
        if (g2El) g2El.value = jugadoresG2.join("\n");
        if (g3El) g3El.value = jugadoresG3.join("\n");

        console.log("Jugadores cargados desde GitHub.");
        inicializarClasificacion();
        renderSeleccionJugadores(); // para el grupo que uses por defecto (ej: G1)
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

document.getElementById("guardarG1")?.addEventListener("click", () => guardarGrupo("g1", "jugadores_g1"));
document.getElementById("guardarG2")?.addEventListener("click", () => guardarGrupo("g2", "jugadores_g2"));
document.getElementById("guardarG3")?.addEventListener("click", () => guardarGrupo("g3", "jugadores_g3"));

// =========================
// CLASIFICACIÓN: INICIALIZAR
// =========================
function inicializarClasificacion() {
    const guardada = localStorage.getItem("clasificacion_padel");
    if (guardada) {
        clasificacion = JSON.parse(guardada);
        return;
    }

    const todos = [...jugadoresG1, ...jugadoresG2, ...jugadoresG3];
    todos.forEach(nombre => {
        if (!clasificacion[nombre]) {
            clasificacion[nombre] = {
                puntos: 0,
                setsGanados: 0,
                setsPerdidos: 0,
                juegos: 0
            };
        }
    });
    guardarClasificacion();
}

function guardarClasificacion() {
    localStorage.setItem("clasificacion_padel", JSON.stringify(clasificacion));
}

// =========================
// SELECCIÓN DE JUGADORES (JUEGA / DOBLA)
// =========================

// Aquí puedes elegir de qué grupo tiras (ejemplo: G1)
function obtenerJugadoresGrupoActual() {
    // Por simplicidad, usamos G1. Si quieres, puedes añadir selector de grupo.
    return jugadoresG1;
}

function renderSeleccionJugadores() {
    const cont = document.getElementById("seleccion-jugadores");
    if (!cont) return;

    const lista = obtenerJugadoresGrupoActual();
    jugadoresSeleccionados = lista.map(nombre => ({
        nombre,
        juega: false,
        dobla: false
    }));

    cont.innerHTML = "";
    lista.forEach(nombre => {
        const fila = document.createElement("div");
        fila.className = "fila-jugador";

        const label = document.createElement("span");
        label.textContent = nombre;
        label.className = "nombre-jugador";

        const btnJuega = document.createElement("button");
        btnJuega.textContent = "JUEGA";
        btnJuega.className = "btn-juega";
        btnJuega.addEventListener("click", () => toggleJuega(nombre, btnJuega));

        const btnDobla = document.createElement("button");
        btnDobla.textContent = "DOBLA";
        btnDobla.className = "btn-dobla";
        btnDobla.addEventListener("click", () => toggleDobla(nombre, btnDobla));

        fila.appendChild(label);
        fila.appendChild(btnJuega);
        fila.appendChild(btnDobla);
        cont.appendChild(fila);
    });
}

function toggleJuega(nombre, boton) {
    const jug = jugadoresSeleccionados.find(j => j.nombre === nombre);
    if (!jug) return;
    jug.juega = !jug.juega;

    if (jug.juega) {
        boton.classList.add("activo");
    } else {
        boton.classList.remove("activo");
    }

    actualizarListasSeleccion();
}

function toggleDobla(nombre, boton) {
    const jug = jugadoresSeleccionados.find(j => j.nombre === nombre);
    if (!jug) return;
    jug.dobla = !jug.dobla;

    if (jug.dobla) {
        boton.classList.add("activo");
    } else {
        boton.classList.remove("activo");
    }

    actualizarListasSeleccion();
}

function actualizarListasSeleccion() {
    jugadoresQueJuegan = jugadoresSeleccionados
        .filter(j => j.juega)
        .map(j => j.nombre);

    jugadoresDisponiblesParaDoblar = jugadoresSeleccionados
        .filter(j => j.dobla)
        .map(j => j.nombre);

    console.log("Juegan:", jugadoresQueJuegan);
    console.log("Disponibles para doblar:", jugadoresDisponiblesParaDoblar);
}

// =========================
// GENERACIÓN DE PARTIDO (4 JUGADORES + DOBLADOR SI HACE FALTA)
// =========================
function generarPartido() {
    // Necesitamos 4 jugadores para un partido
    let base = [...jugadoresQueJuegan];

    if (base.length < 4) {
        // Tiramos de los disponibles para doblar
        const faltan = 4 - base.length;
        const candidatos = jugadoresDisponiblesParaDoblar.filter(n => !base.includes(n));
        if (candidatos.length < faltan) {
            alert("No hay suficientes jugadores (ni dobladores) para generar un partido.");
            return;
        }
        base = base.concat(candidatos.slice(0, faltan));
    }

    if (base.length < 4) {
        alert("No hay suficientes jugadores para un partido.");
        return;
    }

    // Tomamos los 4 primeros
    const [A, B, C, D] = base.slice(0, 4);

    // Determinar quién dobla realmente (solo si alguno de estos está en la lista de DOBLA
    // y si ha sido necesario usarlo para completar)
    let dobladorReal = null;
    // Regla simple: si para llegar a 4 hemos usado alguno de los "DOBLA", ese es dobladorReal.
    // Para simplificar, si hay varios, cogemos el primero que esté en jugadoresDisponiblesParaDoblar.
    for (const nombre of base) {
        if (jugadoresDisponiblesParaDoblar.includes(nombre) && !jugadoresQueJuegan.includes(nombre)) {
            dobladorReal = nombre;
            break;
        }
    }

    partidoActual = { jugA: A, jugB: B, jugC: C, jugD: D, dobladorReal };
    console.log("Partido generado:", partidoActual);
    renderResultadosPartido();
}

// =========================
// RENDERIZADO DE RESULTADOS (3 SETS: AB–CD, AC–BD, AD–BC)
// =========================
function renderResultadosPartido() {
    const cont = document.getElementById("resultados-contenido");
    if (!cont || !partidoActual) return;

    const { jugA, jugB, jugC, jugD } = partidoActual;

    cont.innerHTML = "";

    const tabla = document.createElement("table");
    tabla.className = "tabla-resultados";

    // Cabecera
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    ["Set", "Pareja Izq", "Pareja Dcha", "Juegos Izq", "Juegos Dcha"].forEach(txt => {
        const th = document.createElement("th");
        th.textContent = txt;
        trh.appendChild(th);
    });
    thead.appendChild(trh);
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");

    // Set 1: A+B vs C+D
    tbody.appendChild(crearFilaSet(1, `${jugA} + ${jugB}`, `${jugC} + ${jugD}`, "set1_izq", "set1_dcha"));

    // Set 2: A+C vs B+D
    tbody.appendChild(crearFilaSet(2, `${jugA} + ${jugC}`, `${jugB} + ${jugD}`, "set2_izq", "set2_dcha"));

    // Set 3: A+D vs B+C
    tbody.appendChild(crearFilaSet(3, `${jugA} + ${jugD}`, `${jugB} + ${jugC}`, "set3_izq", "set3_dcha"));

    tabla.appendChild(tbody);
    cont.appendChild(tabla);
}

function crearFilaSet(numSet, parejaIzq, parejaDcha, idIzq, idDcha) {
    const tr = document.createElement("tr");

    const tdSet = document.createElement("td");
    tdSet.textContent = `${numSet}º`;
    tr.appendChild(tdSet);

    const tdIzq = document.createElement("td");
    tdIzq.textContent = parejaIzq;
    tr.appendChild(tdIzq);

    const tdDcha = document.createElement("td");
    tdDcha.textContent = parejaDcha;
    tr.appendChild(tdDcha);

    const tdJIzq = document.createElement("td");
    const inputIzq = document.createElement("input");
    inputIzq.type = "number";
    inputIzq.min = "0";
    inputIzq.id = idIzq;
    tdJIzq.appendChild(inputIzq);
    tr.appendChild(tdJIzq);

    const tdJDcha = document.createElement("td");
    const inputDcha = document.createElement("input");
    inputDcha.type = "number";
    inputDcha.min = "0";
    inputDcha.id = idDcha;
    tdJDcha.appendChild(inputDcha);
    tr.appendChild(tdJDcha);

    return tr;
}

// =========================
// GUARDAR RESULTADOS: SISTEMA DE PUNTOS
// =========================
function guardarResultados() {
    if (!partidoActual) {
        alert("No hay partido generado.");
        return;
    }

    const { jugA, jugB, jugC, jugD, dobladorReal } = partidoActual;

    // Leemos los 3 sets
    const sets = [
        leerSet("set1_izq", "set1_dcha"),
        leerSet("set2_izq", "set2_dcha"),
        leerSet("set3_izq", "set3_dcha")
    ];

    if (sets.some(s => s == null)) {
        alert("Faltan resultados en algún set.");
        return;
    }

    // Estructura de parejas por set
    const setsParejas = [
        { izq: [jugA, jugB], dcha: [jugC, jugD] }, // Set 1
        { izq: [jugA, jugC], dcha: [jugB, jugD] }, // Set 2
        { izq: [jugA, jugD], dcha: [jugB, jugC] }  // Set 3
    ];

    // Inicializar en clasificación si falta alguien
    [jugA, jugB, jugC, jugD].forEach(nombre => {
        if (!clasificacion[nombre]) {
            clasificacion[nombre] = {
                puntos: 0,
                setsGanados: 0,
                setsPerdidos: 0,
                juegos: 0
            };
        }
    });

    // Recorremos los 3 sets y aplicamos tu sistema
    sets.forEach((set, idx) => {
        const { juegosIzq, juegosDcha } = set;
        const { izq, dcha } = setsParejas[idx];

        let ganadores, perdedores;
        let juegosGanadores, juegosPerdedores;

        if (juegosIzq > juegosDcha) {
            ganadores = izq;
            perdedores = dcha;
            juegosGanadores = juegosIzq;
            juegosPerdedores = juegosDcha;
        } else if (juegosDcha > juegosIzq) {
            ganadores = dcha;
            perdedores = izq;
            juegosGanadores = juegosDcha;
            juegosPerdedores = juegosIzq;
        } else {
            // Empate raro, puedes decidir qué hacer. De momento, no sumamos nada.
            return;
        }

        // Actualizar sets ganados/perdidos y juegos
        ganadores.forEach(nombre => {
            clasificacion[nombre].setsGanados += 1;
            clasificacion[nombre].juegos += juegosGanadores;
        });
        perdedores.forEach(nombre => {
            clasificacion[nombre].setsPerdidos += 1;
            clasificacion[nombre].juegos += juegosPerdedores;
        });

        // PUNTOS:
        // - Ganador: 7 puntos (normal)
        // - Perdedor: sus juegos conseguidos
        // - Doblador: si gana → 2, si pierde → 0
        ganadores.forEach(nombre => {
            if (nombre === dobladorReal) {
                clasificacion[nombre].puntos += 2;
            } else {
                clasificacion[nombre].puntos += 7;
            }
        });

        perdedores.forEach(nombre => {
            if (nombre === dobladorReal) {
                clasificacion[nombre].puntos += 0;
            } else {
                clasificacion[nombre].puntos += juegosPerdedores;
            }
        });
    });

    guardarClasificacion();
    alert("Resultados guardados y clasificación actualizada.");
    renderClasificacion();
}

function leerSet(idIzq, idDcha) {
    const izq = document.getElementById(idIzq);
    const dcha = document.getElementById(idDcha);
    if (!izq || !dcha) return null;

    const juegosIzq = parseInt(izq.value, 10);
    const juegosDcha = parseInt(dcha.value, 10);

    if (isNaN(juegosIzq) || isNaN(juegosDcha)) return null;

    return { juegosIzq, juegosDcha };
}

// =========================
// RENDER CLASIFICACIÓN
// =========================
function renderClasificacion() {
    const cont = document.getElementById("clasificacion-contenido");
    if (!cont) return;

    // Convertir a array y ordenar (ejemplo: por puntos, luego sets ganados, luego juegos)
    const lista = Object.entries(clasificacion).map(([nombre, data]) => ({
        nombre,
        ...data
    }));

    lista.sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.setsGanados !== a.setsGanados) return b.setsGanados - a.setsGanados;
        return b.juegos - a.juegos;
    });

    cont.innerHTML = "";

    const tabla = document.createElement("table");
    tabla.className = "tabla-clasificacion";

    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    ["Jugador", "Puntos", "Sets Ganados", "Sets Perdidos", "Juegos"].forEach(txt => {
        const th = document.createElement("th");
        th.textContent = txt;
        trh.appendChild(th);
    });
    thead.appendChild(trh);
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");
    lista.forEach(j => {
        const tr = document.createElement("tr");
        const cNombre = document.createElement("td");
        cNombre.textContent = j.nombre;
        const cPuntos = document.createElement("td");
        cPuntos.textContent = j.puntos;
        const cSG = document.createElement("td");
        cSG.textContent = j.setsGanados;
        const cSP = document.createElement("td");
        cSP.textContent = j.setsPerdidos;
        const cJ = document.createElement("td");
        cJ.textContent = j.juegos;

        tr.appendChild(cNombre);
        tr.appendChild(cPuntos);
        tr.appendChild(cSG);
        tr.appendChild(cSP);
        tr.appendChild(cJ);
        tbody.appendChild(tr);
    });

    tabla.appendChild(tbody);
    cont.appendChild(tabla);
}

// =========================
// INICIO
// =========================
window.addEventListener("load", () => {
    cargarJugadoresDesdeGitHub();

    // Si tienes un botón para generar partido:
    const btnGenerar = document.getElementById("btn-generar-partido");
    btnGenerar?.addEventListener("click", generarPartido);

    // Si quieres mostrar clasificación al entrar:
    renderClasificacion();
});

