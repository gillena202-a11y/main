const playerNameEl = document.getElementById('player-name');
const playerAgeEl = document.getElementById('player-age');
const playerBranchEl = document.getElementById('player-branch');
const playerRankEl = document.getElementById('player-rank');
const playerExpEl = document.getElementById('player-exp');
const playerFinancesEl = document.getElementById('player-finances');
const playerHealthEl = document.getElementById('player-health');
const playerHappinessEl = document.getElementById('player-happiness');
const playerMoraleEl = document.getElementById('player-morale');
const branchButtons = Array.from(document.querySelectorAll('.branch'));
const actionButtons = Array.from(document.querySelectorAll('.action'));
const logList = document.getElementById('log');
const statusPill = document.getElementById('game-status');
const restartBtn = document.getElementById('restart');
const actionHint = document.getElementById('action-hint');
const tabs = Array.from(document.querySelectorAll('.tab'));
const panels = Array.from(document.querySelectorAll('.tab-panel'));

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
    happiness: [-3, 4],
    health: [0, 0],
    finances: [40, 60],
  },
  mission: {
    text: 'You deploy on a tough assignment and see real-world action.',
    exp: [15, 30],
    morale: [-10, 10],
    happiness: [-12, 8],
    health: [-15, 5],
    finances: [120, 200],
  },
  study: {
    text: 'You attend leadership school, sharpening your command voice.',
    exp: [10, 18],
    morale: [0, 5],
    happiness: [0, 6],
    health: [0, 0],
    finances: [60, 90],
  },
  rest: {
    text: 'You take a breather, reconnect with family, and reset.',
    exp: [0, 4],
    morale: [8, 15],
    happiness: [10, 18],
    health: [5, 12],
    finances: [-20, 10],
  },
  sideGig: {
    text: 'You pick up a weekend side gig, earning cash but tiring yourself out.',
    exp: [4, 8],
    morale: [-4, 2],
    happiness: [-6, 4],
    health: [-8, 2],
    finances: [180, 260],
  },
};

const initialState = () => ({
  name: 'Cadet',
  age: 18,
  branch: null,
  exp: 0,
  morale: 100,
  happiness: 100,
  health: 100,
  finances: 500,
  rankIndex: -1,
  log: [
    'You are 18 and ready to serve. Choose a branch to begin your story.',
    'A small enlistment bonus of $500 helps you settle in.',
  ],
});

let state = initialState();

function randInRange([min, max]) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatMoney(amount) {
  return `$${amount.toLocaleString('en-US')}`;
}

function appendLog(entry) {
  const item = document.createElement('li');
  item.textContent = entry;
  logList.prepend(item);
  while (logList.children.length > 12) {
    logList.removeChild(logList.lastChild);
  }
}

function updateProfile() {
  playerNameEl.textContent = state.name;
  playerAgeEl.textContent = `${state.age}`;
  playerBranchEl.textContent = state.branch ?? 'Undecided';
  playerRankEl.textContent = state.branch ? rankLadders[state.branch][Math.max(state.rankIndex, 0)] : 'N/A';
  playerExpEl.textContent = `${state.exp} XP`;
  playerFinancesEl.textContent = formatMoney(Math.max(0, state.finances));
  playerHealthEl.textContent = `${Math.max(0, Math.min(120, state.health))}%`;
  playerHappinessEl.textContent = `${Math.max(0, Math.min(120, state.happiness))}%`;
  playerMoraleEl.textContent = `${Math.max(0, Math.min(120, state.morale))}%`;
  statusPill.textContent = state.branch ? 'Active duty' : 'Awaiting enlistment';
  statusPill.classList.toggle('ghost', !state.branch);
  statusPill.classList.toggle('success', Boolean(state.branch));

  const actionsUnlocked = Boolean(state.branch);
  actionButtons.forEach((btn) => {
    btn.disabled = !actionsUnlocked;
    btn.classList.toggle('disabled', !actionsUnlocked);
  });
  actionHint.textContent = actionsUnlocked
    ? 'Actions consume time, affect your finances, and can promote you.'
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
    const bonus = 200 + targetIndex * 75;
    state.finances += bonus;
    appendLog(`Promotion! You are now a ${newRank} and receive a $${bonus} bonus.`);
  }
}

function ageUp() {
  if (state.exp % 35 === 0) {
    state.age += 1;
  }
}

function clampStats() {
  state.morale = Math.max(0, Math.min(130, state.morale));
  state.happiness = Math.max(0, Math.min(130, state.happiness));
  state.health = Math.max(0, Math.min(130, state.health));
}

function handleAction(actionKey) {
  if (!state.branch) return;
  const outcome = actionOutcomes[actionKey];
  const expGain = randInRange(outcome.exp);
  const moraleChange = randInRange(outcome.morale);
  const happinessChange = randInRange(outcome.happiness);
  const healthChange = randInRange(outcome.health);
  const financeChange = randInRange(outcome.finances);

  state.exp += expGain;
  state.morale += moraleChange;
  state.happiness += happinessChange;
  state.health += healthChange;
  state.finances += financeChange;
  clampStats();
  ageUp();

  const result = `${outcome.text} (+${expGain} XP, ${moraleChange >= 0 ? '+' : ''}${moraleChange} morale, ${happinessChange >= 0 ? '+' : ''}${happinessChange} happiness, ${healthChange >= 0 ? '+' : ''}${healthChange} health, ${financeChange >= 0 ? '+' : ''}${formatMoney(financeChange)}).`;
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

function handleTabChange(tabName) {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  panels.forEach((panel) => {
    const isActive = panel.dataset.tabPanel === tabName;
    panel.classList.toggle('active', isActive);
    panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  });
}

branchButtons.forEach((button) => {
  button.addEventListener('click', () => handleBranchSelect(button.dataset.branch));
});

actionButtons.forEach((button) => {
  button.addEventListener('click', () => handleAction(button.dataset.action));
});

restartBtn.addEventListener('click', resetGame);

tabs.forEach((tab) => {
  tab.addEventListener('click', () => handleTabChange(tab.dataset.tab));
});

resetGame();
