// URL de tu backend en Cloudflare Workers
const BACKEND_URL = "https://long-snowflake-81e2.jpgazza.workers.dev";

// Navegación por pestañas
const tabButtons = document.querySelectorAll('.tab-btn');
const tabs = document.querySelectorAll('.tab');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabs.forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Datos en memoria
let jugadores = { g1: [], g2: [], g3: [] };
let seleccionJornada = { g1: {}, g2: {}, g3: {} };
let partidosGenerados = [];
let resultadosSets = [];
let clasificacion = {};
let doblajes = {};

// Cargar jugadores guardados en localStorage
function cargarJugadoresGuardados() {
  ['g1','g2','g3'].forEach(g => {
    const saved = localStorage.getItem('jugadores_' + g);
    if (saved) {
      jugadores[g] = JSON.parse(saved);
      document.getElementById('jugadores-' + g).value = jugadores[g].join('\n');
    }
  });
}

// Guardar jugadores DEFINITIVAMENTE
function guardarJugadores(grupo) {
  const ta = document.getElementById('jugadores-' + grupo);
  jugadores[grupo] = ta.value
    .split('\n')
    .map(x => x.trim())
    .filter(x => x.length > 0);

  // Guardar en localStorage
  localStorage.setItem('jugadores_' + grupo, JSON.stringify(jugadores[grupo]));

  renderSeleccionJornada();
  alert('Jugadores ' + grupo.toUpperCase() + ' guardados.');
}

// Render selección JORNADA
function renderSeleccionJornada() {
  ['g1','g2','g3'].forEach(g => {
    const cont = document.getElementById('jornada-' + g + '-list');
    cont.innerHTML = '';
    seleccionJornada[g] = seleccionJornada[g] || {};
    jugadores[g].forEach(j => {
      if (!seleccionJornada[g][j]) {
        seleccionJornada[g][j] = { juega:false, dobla:false };
      }
      const row = document.createElement('div');
      row.innerHTML = `
        <label>
          <input type="checkbox" ${seleccionJornada[g][j].juega ? 'checked' : ''} 
            onchange="toggleJuega('${g}','${j.replace(/'/g,"\\'")}')"> Juega
        </label>
        <label style="margin-left:10px;">
          <input type="checkbox" ${seleccionJornada[g][j].dobla ? 'checked' : ''} 
            onchange="toggleDobla('${g}','${j.replace(/'/g,"\\'")}')"> Dobla
        </label>
        <span style="margin-left:10px;">${j}</span>
      `;
      cont.appendChild(row);
    });
  });
}

function toggleJuega(grupo, jugador) {
  seleccionJornada[grupo][jugador].juega = !seleccionJornada[grupo][jugador].juega;
}

function toggleDobla(grupo, jugador) {
  seleccionJornada[grupo][jugador].dobla = !seleccionJornada[grupo][jugador].dobla;
}

// GENERAR PARTIDOS → llama al backend
async function generarPartidos() {
  const fecha = document.getElementById('fecha-jornada').value || '';
  const condiciones = document.getElementById('prompt-condiciones').value || '';

  const payload = {
    fecha,
    jugadores,
    seleccionJornada,
    condiciones
  };

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    partidosGenerados = data.partidos || [];
    renderPartidos();
    alert('Partidos generados correctamente.');
  } catch (e) {
    console.error(e);
    alert('Error llamando al backend.');
  }
}

function renderPartidos() {
  const cont = document.getElementById('partidos-contenido');
  if (partidosGenerados.length === 0) {
    cont.innerHTML = '<p><em>Todavía no hay partidos generados.</em></p>';
    return;
  }
  let html = '';
  partidosGenerados.forEach((p, idx) => {
    html += `<div class="group-block">
      <strong>${p.grupo.toUpperCase()} - Partido ${idx+1}</strong><br>
      ${p.jugadores[0].nombre} &amp; ${p.jugadores[1].nombre}
      vs
      ${p.jugadores[2].nombre} &amp; ${p.jugadores[3].nombre}
    </div>`;
  });
  cont.innerHTML = html;
}

function editarPartidos() {
  alert('En una versión futura podrás editar los partidos manualmente.');
}

// Validar jornada → preparar RESULTADOS con sets correctos
function validarJornada() {
  if (partidosGenerados.length === 0) {
    alert('No hay partidos generados.');
    return;
  }
  resultadosSets = [];

  partidosGenerados.forEach((p, idx) => {

    // SET 1 — AB vs CD
    resultadosSets.push({
      partidoIndex: idx,
      set: 1,
      grupo: p.grupo,
      j1: p.jugadores[0],
      j2: p.jugadores[1],
      j3: p.jugadores[2],
      j4: p.jugadores[3],
      juegos12: '',
      juegos34: '',
      pts12: 0,
      pts34: 0
    });

    // SET 2 — AC vs BD
    resultadosSets.push({
      partidoIndex: idx,
      set: 2,
      grupo: p.grupo,
      j1: p.jugadores[0],
      j2: p.jugadores[2],
      j3: p.jugadores[1],
      j4: p.jugadores[3],
      juegos12: '',
      juegos34: '',
      pts12: 0,
      pts34: 0
    });

    // SET 3 — AD vs CB
    resultadosSets.push({
      partidoIndex: idx,
      set: 3,
      grupo: p.grupo,
      j1: p.jugadores[0],
      j2: p.jugadores[3],
      j3: p.jugadores[2],
      j4: p.jugadores[1],
      juegos12: '',
      juegos34: '',
      pts12: 0,
      pts34: 0
    });

  });

  renderResultados();
  alert('Jornada validada. Ahora puedes meter resultados.');
}

// Render RESULTADOS
function renderResultados() {
  const cont = document.getElementById('resultados-contenido');
  if (resultadosSets.length === 0) {
    cont.innerHTML = '<p><em>No hay sets cargados.</em></p>';
    return;
  }

  let html = '';
  let partidoActual = -1;
  resultadosSets.forEach((r, idx) => {
    if (r.partidoIndex !== partidoActual) {
      partidoActual = r.partidoIndex;
      const p = partidosGenerados[partidoActual];
      html += `<div class="group-block">
        <strong>${p.grupo.toUpperCase()} - Partido ${partidoActual+1}</strong><br>
        ${p.jugadores[0].nombre} &amp; ${p.jugadores[1].nombre}
        vs
        ${p.jugadores[2].nombre} &amp; ${p.jugadores[3].nombre}
        <table>
          <thead>
            <tr>
              <th>SET</th>
              <th>PTS</th>
              <th>JUG1</th>
              <th>JUG2</th>
              <th>J1-J2</th>
              <th>J3-J4</th>
              <th>JUG3</th>
              <th>JUG4</th>
              <th>PTS</th>
            </tr>
          </thead>
          <tbody>
      `;
    }

    html += `
      <tr>
        <td>${r.set}</td>
        <td id="pts12-${idx}">${r.pts12}</td>
        <td>${r.j1.nombre}</td>
        <td>${r.j2.nombre}</td>
        <td>
          <input type="text" value="${r.juegos12}" 
            onchange="cambiarResultado(${idx}, this.value, null)">
        </td>
        <td>
          <input type="text" value="${r.juegos34}" 
            onchange="cambiarResultado(${idx}, null, this.value)">
        </td>
        <td>${r.j3.nombre}</td>
        <td>${r.j4.nombre}</td>
        <td id="pts34-${idx}">${r.pts34}</td>
      </tr>
    `;

    const next = resultadosSets[idx+1];
    if (!next || next.partidoIndex !== partidoActual) {
      html += `
          </tbody>
        </table>
      </div>
      `;
    }
  });

  cont.innerHTML = html;
}

// NUEVA LÓGICA DE PUNTUACIÓN INDIVIDUAL POR SET
function cambiarResultado(idx, val12, val34) {
  const r = resultadosSets[idx];

  if (val12 !== null) r.juegos12 = val12;
  if (val34 !== null) r.juegos34 = val34;

  const j12 = parseInt(r.juegos12, 10);
  const j34 = parseInt(r.juegos34, 10);
  if (isNaN(j12) || isNaN(j34)) return;

  const gana12 = j12 > j34;
  const gana34 = j34 > j12;

  function puntosJugador(ganaSet, juegosPareja, dobla) {
    if (ganaSet) return dobla ? 2 : 7;
    return dobla ? 0 : juegosPareja;
  }

  r.pts12_j1 = puntosJugador(gana12, j12, r.j1.dobla);
  r.pts12_j2 = puntosJugador(gana12, j12, r.j2.dobla);

  r.pts34_j3 = puntosJugador(gana34, j34, r.j3.dobla);
  r.pts34_j4 = puntosJugador(gana34, j34, r.j4.dobla);

  r.pts12 = r.pts12_j1 + r.pts12_j2;
  r.pts34 = r.pts34_j3 + r.pts34_j4;

  document.getElementById('pts12-' + idx).textContent = r.pts12;
  document.getElementById('pts34-' + idx).textContent = r.pts34;
}

// Guardar resultados y actualizar clasificación/doblajes
function guardarResultados() {
  ['g1','g2','g3'].forEach(g => {
    jugadores[g].forEach(j => {
      if (!clasificacion[j]) {
        clasificacion[j] = { grupo:g, puntos:0, pj:0, setsG:0, setsP:0 };
      }
      if (!doblajes[j]) {
        doblajes[j] = { grupo:g, total:0, jornadas:[] };
      }
    });
  });

  resultadosSets.forEach(r => {
    const j12 = parseInt(r.juegos12, 10);
    const j34 = parseInt(r.juegos34, 10);
    if (isNaN(j12) || isNaN(j34)) return;

    const gana12 = j12 > j34;
    const gana34 = j34 > j12;

    // Sumar puntos INDIVIDUALES
    clasificacion[r.j1.nombre].puntos += r.pts12_j1;
    clasificacion[r.j2.nombre].puntos += r.pts12_j2;
    clasificacion[r.j3.nombre].puntos += r.pts34_j3;
    clasificacion[r.j4.nombre].puntos += r.pts34_j4;

    // Sets ganados/perdidos
    if (gana12) {
      clasificacion[r.j1.nombre].setsG++;
      clasificacion[r.j2.nombre].setsG++;
      clasificacion[r.j3.nombre].setsP++;
      clasificacion[r.j4.nombre].setsP++;
    } else if (gana34) {
      clasificacion[r.j3.nombre].setsG++;
      clasificacion[r.j4.nombre].setsG++;
      clasificacion[r.j1.nombre].setsP++;
      clasificacion[r.j2.nombre].setsP++;
    }

    // PJ (1/3 por set)
    [r.j1.nombre, r.j2.nombre, r.j3.nombre, r.j4.nombre].forEach(n => {
      clasificacion[n].pj += 1/3;
    });

    // Doblajes
    const fecha = document.getElementById('fecha-jornada').value || 'Jornada';
    [r.j1, r.j2, r.j3, r.j4].forEach(j => {
      if (j.dobla) {
        doblajes[j.nombre].total += 1/3;
        if (!doblajes[j.nombre].jornadas.includes(fecha)) {
          doblajes[j.nombre].jornadas.push(fecha);
        }
      }
    });
  });

  renderClasificacion();
  renderDoblajes();
  alert('Resultados guardados.');
}

function renderClasificacion() {
  ['g1','g2','g3'].forEach(g => {
    const tbody = document.querySelector('#tabla-clasificacion-' + g + ' tbody');
    tbody.innerHTML = '';
    const lista = Object.entries(clasificacion)
      .filter(([n,dat]) => dat.grupo === g)
      .sort((a,b) => b[1].puntos - a[1].puntos);

    lista.forEach(([nombre,dat], idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx+1}</td>
        <td>${nombre}</td>
        <td>${dat.puntos.toFixed(0)}</td>
        <td>${dat.pj.toFixed(1)}</td>
        <td>${dat.setsG}</td>
        <td>${dat.setsP}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function renderDoblajes() {
  ['g1','g2','g3'].forEach(g => {
    const tbody = document.querySelector('#tabla-doblajes-' + g + ' tbody');
    tbody.innerHTML = '';
    const lista = Object.entries(doblajes)
      .filter(([n,dat]) => dat.grupo === g)
      .sort((a,b) => b[1].total - a[1].total);

    lista.forEach(([nombre,dat]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${nombre}</td>
        <td>${dat.total.toFixed(1)}</td>
        <td>${dat.jornadas.join(', ')}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// Inicializar
cargarJugadoresGuardados();
renderSeleccionJornada();
