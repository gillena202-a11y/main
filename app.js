const playerNameEl = document.getElementById('player-name');
const playerAgeEl = document.getElementById('player-age');
const playerBranchEl = document.getElementById('player-branch');
const playerRankEl = document.getElementById('player-rank');
const playerExpEl = document.getElementById('player-exp');
const playerMoraleEl = document.getElementById('player-morale');
const branchButtons = Array.from(document.querySelectorAll('.branch'));
const actionButtons = Array.from(document.querySelectorAll('.action'));
const logList = document.getElementById('log');
const statusPill = document.getElementById('game-status');
const restartBtn = document.getElementById('restart');
const actionHint = document.getElementById('action-hint');

const rankLadders = {
  Army: ['Private', 'Private First Class', 'Specialist', 'Sergeant', 'Staff Sergeant', 'Sergeant First Class'],
  Navy: ['Seaman Recruit', 'Seaman Apprentice', 'Petty Officer', 'Petty Officer First Class', 'Chief Petty Officer', 'Senior Chief'],
  'Air Force': ['Airman Basic', 'Airman', 'Senior Airman', 'Staff Sergeant', 'Technical Sergeant', 'Master Sergeant'],
  'Marine Corps': ['Private', 'Private First Class', 'Lance Corporal', 'Corporal', 'Sergeant', 'Staff Sergeant'],
  'Space Force': ['Specialist 1', 'Specialist 2', 'Specialist 3', 'Sergeant', 'Technical Sergeant', 'Master Sergeant'],
  'Coast Guard': ['Seaman Recruit', 'Seaman', 'Petty Officer', 'Petty Officer First Class', 'Chief Petty Officer', 'Senior Chief'],
};

const actionOutcomes = {
  train: {
    text: 'You crush morning PT, earning respect from your unit.',
    exp: [8, 12],
    morale: [-5, 2],
    health: [0, 0],
  },
  mission: {
    text: 'You deploy on a tough assignment and see real-world action.',
    exp: [15, 30],
    morale: [-10, 10],
    health: [-15, 5],
  },
  study: {
    text: 'You attend leadership school, sharpening your command voice.',
    exp: [10, 18],
    morale: [0, 5],
    health: [0, 0],
  },
  rest: {
    text: 'You take a breather, reconnect with family, and reset.',
    exp: [0, 4],
    morale: [8, 15],
    health: [5, 10],
  },
};

const initialState = () => ({
  name: 'Cadet',
  age: 18,
  branch: null,
  exp: 0,
  morale: 100,
  health: 100,
  rankIndex: -1,
  log: [
    'You are 18 and ready to serve. Choose a branch to begin your story.',
  ],
});

let state = initialState();

function randInRange([min, max]) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function appendLog(entry) {
  const item = document.createElement('li');
  item.textContent = entry;
  logList.prepend(item);
  while (logList.children.length > 10) {
    logList.removeChild(logList.lastChild);
  }
}

function updateProfile() {
  playerNameEl.textContent = state.name;
  playerAgeEl.textContent = `${state.age}`;
  playerBranchEl.textContent = state.branch ?? 'Undecided';
  playerRankEl.textContent = state.branch ? rankLadders[state.branch][Math.max(state.rankIndex, 0)] : 'N/A';
  playerExpEl.textContent = `${state.exp} XP`;
  playerMoraleEl.textContent = `${Math.max(0, Math.min(100, state.morale))}%`;
  statusPill.textContent = state.branch ? 'Active duty' : 'Awaiting enlistment';
  statusPill.classList.toggle('ghost', !state.branch);
  statusPill.classList.toggle('success', Boolean(state.branch));

  const actionsUnlocked = Boolean(state.branch);
  actionButtons.forEach((btn) => {
    btn.disabled = !actionsUnlocked;
    btn.classList.toggle('disabled', !actionsUnlocked);
  });
  actionHint.textContent = actionsUnlocked
    ? 'Actions consume time, earn experience, and can promote you.'
    : 'Pick a branch to unlock actions.';
}

function handleBranchSelect(branch) {
  if (state.branch) return;
  state.branch = branch;
  state.rankIndex = 0;
  appendLog(`You enlist in the ${branch} as a ${rankLadders[branch][0]}.`);
  updateProfile();
}

function evaluatePromotion() {
  const ladder = rankLadders[state.branch];
  const thresholds = [0, 20, 45, 75, 110, 150];
  const nextIndex = thresholds.findIndex((threshold) => state.exp < threshold) - 1;
  const targetIndex = Math.min(ladder.length - 1, Math.max(nextIndex, state.rankIndex));

  if (targetIndex > state.rankIndex) {
    state.rankIndex = targetIndex;
    const newRank = ladder[targetIndex];
    appendLog(`Promotion! You are now a ${newRank}.`);
  }
}

function ageUp() {
  if (state.exp % 35 === 0) {
    state.age += 1;
  }
}

function clampStats() {
  state.morale = Math.max(0, Math.min(120, state.morale));
  state.health = Math.max(0, Math.min(120, state.health));
}

function handleAction(actionKey) {
  if (!state.branch) return;
  const outcome = actionOutcomes[actionKey];
  const expGain = randInRange(outcome.exp);
  const moraleChange = randInRange(outcome.morale);
  const healthChange = randInRange(outcome.health);

  state.exp += expGain;
  state.morale += moraleChange;
  state.health += healthChange;
  clampStats();
  ageUp();

  const result = `${outcome.text} (+${expGain} XP, ${moraleChange >= 0 ? '+' : ''}${moraleChange} morale, ${healthChange >= 0 ? '+' : ''}${healthChange} health).`;
  appendLog(result);
  evaluatePromotion();
  updateProfile();
}

function resetGame() {
  state = initialState();
  logList.innerHTML = '';
  state.log.forEach((entry) => appendLog(entry));
  updateProfile();
}

branchButtons.forEach((button) => {
  button.addEventListener('click', () => handleBranchSelect(button.dataset.branch));
});

actionButtons.forEach((button) => {
  button.addEventListener('click', () => handleAction(button.dataset.action));
});

restartBtn.addEventListener('click', resetGame);

resetGame();
