/**
 * Gestor de entrenamientos SPA en JavaScript puro.
 * Maneja estados: inicio, preparación, entrenamiento, descanso y finalizado.
 */

const ROUTINES = {
  abs: {
    name: 'Rutina Abs',
    exercises: [
      { name: 'Dominadas Prono', series: 6, workSec: 80, restSec: 120 },
      { name: 'Dominadas Supino', series: 4, workSec: 80, restSec: 120 },
      { name: 'Flexiones de pecho', series: 6, workSec: 80, restSec: 120 },
      { name: 'Crunch abdominal', series: 4, workSec: 80, restSec: 120 },
      { name: 'Elevación de piernas', series: 4, workSec: 80, restSec: 120 },
      { name: 'Plancha', series: 3, workSec: 30, restSec: 0 }
    ]
  },
  futbol: {
    name: 'Rutina Fútbol',
    exercises: [
      { name: 'Dominadas Prono', series: 6, workSec: 80, restSec: 120 },
      { name: 'Dominadas Supino', series: 4, workSec: 80, restSec: 120 },
      { name: 'Flexiones de pecho', series: 6, workSec: 80, restSec: 120 },
      { name: 'Saltos explosivos', series: 3, workSec: 80, restSec: 120 },
      { name: 'Saltos a un pie lateral', series: 6, workSec: 80, restSec: 120 },
      { name: 'Saltos a un pie delante y atrás', series: 6, workSec: 80, restSec: 120 },
      { name: 'Salto alternado a un pie', series: 6, workSec: 80, restSec: 120 },
      { name: 'Sentadilla salto', series: 3, workSec: 80, restSec: 120 },
      { name: 'Escalonada', series: 3, workSec: 80, restSec: 120 },
      { name: 'Suelo / medio / sube', series: 3, workSec: 80, restSec: 120 }
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

function startCountdown(seconds, phase, onComplete) {
  clearActiveTimer();

  const durationMs = seconds * 1000;
  state.endTime = Date.now() + durationMs;

  const tick = () => {
    const remainingMs = Math.max(0, state.endTime - Date.now());
    const displaySeconds = Math.ceil(remainingMs / 1000);
    timerDisplay.textContent = formatMMSS(displaySeconds);

    if (remainingMs <= 0) {
      clearActiveTimer();
      onComplete();
    }
  };

  state.phase = phase;
  tick();
  state.timerId = setInterval(tick, 100);
}

function completeSeriesAndAdvance() {
  const exercise = getCurrentExercise();
  if (!exercise) return;

  if (state.currentSeries < exercise.series) {
    state.currentSeries += 1;
    state.phase = 'ready';
    updatePhaseUI('Listo para la siguiente serie', '#a3aab8');
    timerDisplay.textContent = formatMMSS(exercise.workSec);
    readyBtn.disabled = false;
    renderProgress();
    return;
  }

  // Ejercicio terminado: avanzar automáticamente al siguiente.
  const routine = getCurrentRoutine();
  if (state.exerciseIndex < routine.exercises.length - 1) {
    state.exerciseIndex += 1;
    state.currentSeries = 1;
    state.phase = 'ready';
    const nextExercise = getCurrentExercise();
    updatePhaseUI('Nuevo ejercicio: presiona Listo', '#a3aab8');
    timerDisplay.textContent = formatMMSS(nextExercise.workSec);
    readyBtn.disabled = false;
    renderProgress();
    return;
  }

  // Rutina completa.
  state.phase = 'completed';
  setScreen('completed');
}

function handleWorkStart() {
  const exercise = getCurrentExercise();
  if (!exercise) return;

  readyBtn.disabled = true;
  updatePhaseUI('Entrenamiento', '#22c55e');

  startCountdown(exercise.workSec, 'work', () => {
    // Si no hay descanso configurado, continuar de inmediato.
    if (exercise.restSec <= 0) {
      completeSeriesAndAdvance();
      return;
    }

    updatePhaseUI('Descanso', '#f59e0b');
    startCountdown(exercise.restSec, 'rest', () => {
      completeSeriesAndAdvance();
    });
  });
}

function resetRoutineProgress() {
  clearActiveTimer();
  state.exerciseIndex = 0;
  state.currentSeries = 1;
  state.phase = 'ready';

  const currentExercise = getCurrentExercise();
  if (currentExercise) {
    timerDisplay.textContent = formatMMSS(currentExercise.workSec);
  } else {
    timerDisplay.textContent = '00:00';
  }

  updatePhaseUI('Listo para empezar', '#a3aab8');
  readyBtn.disabled = false;
  renderProgress();
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
  setScreen('home');
}

// Eventos UI
Array.from(document.querySelectorAll('.btn-routine')).forEach((button) => {
  button.addEventListener('click', () => selectRoutine(button.dataset.routine));
});

readyBtn.addEventListener('click', handleWorkStart);
restartBtn.addEventListener('click', resetRoutineProgress);
homeBtn.addEventListener('click', goHome);
completedRestartBtn.addEventListener('click', () => {
  setScreen('training');
  resetRoutineProgress();
});
completedHomeBtn.addEventListener('click', goHome);

// Estado inicial
setScreen('home');
