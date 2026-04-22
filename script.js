/**
 * Gestor de entrenamientos SPA en JavaScript puro.
 * Maneja estados: inicio, en ejercicio, descanso, listo para continuar y finalizado.
 */

const REST_SECONDS = 80;
const beepSound = new Audio('beep.mp3');
const ROUTINES = {
  abs: {
    name: 'Rutina Abs',
    exercises: [
      { name: 'Dominadas Prono', series: 6, restSec: 10 },
      { name: 'Dominadas Supino', series: 4, restSec: 80 },
      { name: 'Flexiones de pecho', series: 6, restSec: 80 },
      { name: 'Crunch abdominal', series: 4, restSec: 80 },
      { name: 'Elevación de piernas', series: 4, restSec: 80 },
      { name: 'Plancha', series: 3, restSec: 80 }
    ]
  },
  futbol: {
    name: 'Rutina Fútbol',
    exercises: [
      { name: 'Dominadas Prono', series: 6, restSec: 80 },
      { name: 'Dominadas Supino', series: 4, restSec: 80 },
      { name: 'Flexiones de pecho', series: 6, restSec: 80 },
      { name: 'Saltos explosivos', series: 3, restSec: 25 },
      { name: 'Saltos a un pie lateral', series: 6, restSec: 25 },
      { name: 'Saltos a un pie delante y atrás', series: 6, restSec: 25 },
      { name: 'Salto alternado a un pie', series: 6, restSec: 25 },
      { name: 'Sentadilla salto', series: 3, restSec: 25 },
      { name: 'Escalonada', series: 3, restSec: 25 },
      { name: 'Suelo / medio / sube', series: 3, restSec: 25 }
    ]
  }
};

const state = {
  screen: 'home',
  phase: 'idle',
  selectedRoutineKey: null,
  exerciseIndex: 0,
  currentSeries: 1,
  timerId: null,
  endTime: null
};

const screens = {
  home: document.getElementById('home-screen'),
  training: document.getElementById('training-screen'),
  completed: document.getElementById('completed-screen')
};

const phaseLabel = document.getElementById('phase-label');
const timerDisplay = document.getElementById('timer-display');
const exerciseName = document.getElementById('exercise-name');
const seriesProgress = document.getElementById('series-progress');
const exerciseList = document.getElementById('exercise-list');
const readyBtn = document.getElementById('ready-btn');
const restartBtn = document.getElementById('restart-btn');
const homeBtn = document.getElementById('home-btn');
const completedRestartBtn = document.getElementById('completed-restart-btn');
const completedHomeBtn = document.getElementById('completed-home-btn');

/** Limpia un temporizador activo para evitar múltiples timers simultáneos. */
function clearActiveTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  state.endTime = null;
}

/** Formatea segundos a mm:ss. */
function formatMMSS(totalSec) {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getCurrentRoutine() {
  return ROUTINES[state.selectedRoutineKey];
}

function getCurrentExercise() {
  const routine = getCurrentRoutine();
  return routine?.exercises[state.exerciseIndex] ?? null;
}

function setScreen(name) {
  state.screen = name;
  Object.entries(screens).forEach(([key, element]) => {
    element.classList.toggle('active', key === name);
  });
}

function updatePhaseUI(text, color) {
  phaseLabel.textContent = text;
  phaseLabel.style.color = color;
}

function setTimerVisibility(isVisible) {
  timerDisplay.style.display = isVisible ? 'block' : 'none';
}

function renderExerciseList() {
  const routine = getCurrentRoutine();
  if (!routine) return;

  exerciseList.innerHTML = '';
  routine.exercises.forEach((exercise, index) => {
    const li = document.createElement('li');
    li.textContent = `${exercise.name} — ${exercise.series} series`;
    if (index === state.exerciseIndex) li.classList.add('current');
    exerciseList.appendChild(li);
  });
}

function renderProgress() {
  const exercise = getCurrentExercise();
  if (!exercise) return;

  exerciseName.textContent = exercise.name;
  seriesProgress.textContent = `Serie ${state.currentSeries} de ${exercise.series}`;
  renderExerciseList();
}

function setReadyState() {
  state.phase = 'ready';
  updatePhaseUI('Listo para continuar', '#a3aab8');
  setTimerVisibility(false);
  readyBtn.disabled = false;
}

function setExerciseState() {
  state.phase = 'exercise';
  updatePhaseUI('En ejercicio', '#22c55e');
  setTimerVisibility(false);
  readyBtn.disabled = false;
}

function startRestCountdown(onComplete) {
  clearActiveTimer();
  state.phase = 'rest';
  readyBtn.disabled = true;
  setTimerVisibility(true);

  const exercise = getCurrentExercise();
  const restSeconds = exercise?.restSec || REST_SECONDS;
  const durationMs = restSeconds * 1000;

  state.endTime = Date.now() + durationMs;

  const tick = () => {
    const remainingMs = Math.max(0, state.endTime - Date.now());
    const displaySeconds = Math.ceil(remainingMs / 1000);
    const formatted = formatMMSS(displaySeconds);

    timerDisplay.textContent = formatted;
    updatePhaseUI('Descanso', '#f59e0b');

    if (remainingMs <= 0) {
      clearActiveTimer();
      beepSound.currentTime = 0;
      beepSound.play();
      onComplete && onComplete();
    }
  };

  tick();
  state.timerId = setInterval(tick, 1000);
}

function completeSeriesAndAdvance() {
  const exercise = getCurrentExercise();
  if (!exercise) return false;

  // avanzar serie
  if (state.currentSeries < exercise.series) {
    state.currentSeries += 1;
    renderProgress();
    return true;
  }

  // pasar al siguiente ejercicio
  state.exerciseIndex += 1;
  state.currentSeries = 1;

  const nextExercise = getCurrentExercise();

  // si no hay más → rutina terminada
  if (!nextExercise) {
    return false;
  }
  
  // CLAVE: actualizar estado y UI
  updatePhaseUI(`Nuevo ejercicio: ${nextExercise.name}`, '#3aab8');
  setTimerVisibility(false);
  readyBtn.disabled = false;

  renderProgress();

  return true;
}

function handleSeriesCompleted() {
  const hasMoreWork = completeSeriesAndAdvance();
  if (!hasMoreWork) return;

  startRestCountdown(() => {
    setReadyState();
  });
}

function resetRoutineProgress() {
  clearActiveTimer();
  state.exerciseIndex = 0;
  state.currentSeries = 1;

  renderProgress();
  setExerciseState();
}

function selectRoutine(routineKey) {
  state.selectedRoutineKey = routineKey;
  setScreen('training');
  resetRoutineProgress();
}

function goHome() {
  clearActiveTimer();
  state.selectedRoutineKey = null;
  state.exerciseIndex = 0;
  state.currentSeries = 1;
  state.phase = 'idle';
  timerDisplay.textContent = '00:00';
  setTimerVisibility(false);
  setScreen('home');
}

// Eventos UI
Array.from(document.querySelectorAll('.btn-routine')).forEach((button) => {
  button.addEventListener('click', () => selectRoutine(button.dataset.routine));
});

readyBtn.addEventListener('click', handleSeriesCompleted);
restartBtn.addEventListener('click', resetRoutineProgress);
homeBtn.addEventListener('click', goHome);
completedRestartBtn.addEventListener('click', () => {
  setScreen('training');
  resetRoutineProgress();
});
completedHomeBtn.addEventListener('click', goHome);

// Estado inicial
setScreen('home');
setTimerVisibility(false);
