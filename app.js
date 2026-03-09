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
