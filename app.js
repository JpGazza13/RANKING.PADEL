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

// Cargar jugadores iniciales desde textareas
function cargarJugadoresDesdeTextareas() {
  ['g1','g2','g3'].forEach(g => {
    const ta = document.getElementById('jugadores-' + g);
    jugadores[g] = ta.value
      .split('\n')
      .map(x => x.trim())
      .filter(x => x.length > 0);
  });
  renderSeleccionJornada();
}

function guardarJugadores(grupo) {
  const ta = document.getElementById('jugadores-' + grupo);
  jugadores[grupo] = ta.value
    .split('\n')
    .map(x => x.trim())
    .filter(x => x.length > 0);
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
