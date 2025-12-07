const queueList = document.getElementById('queue-list');
const queueEmpty = document.getElementById('queue-empty');
const queueCount = document.getElementById('queue-count');
const filterEls = {
  name: document.getElementById('filter-name'),
  price: document.getElementById('filter-price'),
  ovr: document.getElementById('filter-ovr'),
  window: document.getElementById('filter-window'),
  position: document.getElementById('filter-position'),
  team: document.getElementById('filter-team'),
};
const refreshButton = document.getElementById('refresh');
const clearFilters = document.getElementById('clear-filters');
const autoToggle = document.getElementById('toggle-auto');
const planner = document.getElementById('planner');
const autoStatus = document.getElementById('auto-status');
const nextTarget = document.getElementById('next-target');
const countScheduled = document.getElementById('count-scheduled');
const countWindow = document.getElementById('count-window');
const countAutosnipe = document.getElementById('count-autosnipe');
const countInside = document.getElementById('count-inside');
const countManual = document.getElementById('count-manual');
const activityList = document.getElementById('activity-list');

let autoEnabled = false;
let targets = [
  {
    id: crypto.randomUUID(),
    name: 'Patrick Mahomes',
    position: 'QB',
    team: 'Chiefs',
    ovr: 92,
    price: 42000,
    window: 20,
    timeLeft: 48,
    notes: 'Gunslinger archetype, Kansas City chemistry.',
    autosnipe: true,
  },
  {
    id: crypto.randomUUID(),
    name: 'Micah Parsons',
    position: 'EDGE',
    team: 'Cowboys',
    ovr: 93,
    price: 51500,
    window: 25,
    timeLeft: 32,
    notes: 'Lurker + Edge Threat elite combo.',
    autosnipe: true,
  },
  {
    id: crypto.randomUUID(),
    name: 'Justin Jefferson',
    position: 'WR',
    team: 'Vikings',
    ovr: 94,
    price: 58000,
    window: 30,
    timeLeft: 76,
    notes: 'Slot-O-Matic + Route Tech on 1 AP build.',
    autosnipe: false,
  },
];

let activityLog = [
  { label: 'Queue seeded with priority targets', time: 'Just now', tone: 'info' },
  { label: 'Auto-snipe standing by — enable to arm bids', time: 'Ready', tone: 'warn' },
];

const statuses = {
  ready: 'Inside your snipe window',
  waiting: 'Watching until window hits',
  closed: 'Expired or over bid cap',
};

function fmtCoins(value) {
  return `${value.toLocaleString()} coins`;
}

function renderRow(target) {
  const { content } = document.getElementById('target-row').cloneNode(true);
  const row = content.querySelector('.list-row');
  row.dataset.id = target.id;
  row.querySelector('.ovr').textContent = target.ovr;
  row.querySelector('.name').textContent = target.name;
  row.querySelector('.meta').textContent = `${target.position} · ${target.team}`;
  row.querySelector('.notes').textContent = target.notes || 'No notes added yet.';
  row.querySelector('.price').textContent = fmtCoins(target.price);
  row.querySelector('.remaining').textContent = `${Math.max(0, target.timeLeft)}s`;
  row.querySelector('.bar span').style.width = `${Math.min(100, (target.timeLeft / 90) * 100)}%`;

  const cta = row.querySelector('.cta');
  const button = row.querySelector('button');
  const status = row.querySelector('.status');
  const insideWindow = target.timeLeft <= target.window;

  if (target.timeLeft <= 0) {
    status.textContent = statuses.closed;
    status.classList.add('status-closed');
    button.disabled = true;
    button.textContent = 'Expired';
  } else if (insideWindow) {
    status.textContent = statuses.ready;
    status.classList.add('status-ready');
    button.textContent = 'Place snipe';
  } else {
    status.textContent = `${statuses.waiting} (${target.window}s)`;
    status.classList.add('status-wait');
    button.textContent = 'Arm snipe';
  }

  button.addEventListener('click', () => handleSnipe(target.id));
  cta.appendChild(button);
  return row;
}

function applyFilters(list) {
  const name = filterEls.name.value.trim().toLowerCase();
  const price = Number(filterEls.price.value || Infinity);
  const ovr = Number(filterEls.ovr.value || 0);
  const position = filterEls.position.value;
  const team = filterEls.team.value;
  const window = Number(filterEls.window.value || 0);

  return list.filter((target) => {
    const matchesName = !name || target.name.toLowerCase().includes(name);
    const matchesPrice = !filterEls.price.value || target.price <= price;
    const matchesOvr = target.ovr >= ovr;
    const matchesPosition = !position || target.position === position;
    const matchesTeam = !team || target.team === team;
    const matchesWindow = !window || target.timeLeft <= window;
    return matchesName && matchesPrice && matchesOvr && matchesPosition && matchesTeam && matchesWindow;
  });
}

function renderQueue() {
  const filtered = applyFilters(targets);
  queueList.innerHTML = '';
  if (!filtered.length) {
    queueEmpty.style.display = 'block';
    queueCount.textContent = '0 items';
    return;
  }
  queueEmpty.style.display = 'none';
  queueCount.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;
  filtered
    .sort((a, b) => a.timeLeft - b.timeLeft)
    .forEach((target) => queueList.appendChild(renderRow(target)));
  updateDashboard(filtered);
}

function tickTimers() {
  targets = targets.map((t) => ({ ...t, timeLeft: Math.max(0, t.timeLeft - 1) }));
  if (autoEnabled) {
    autoSnipe();
  }
  renderQueue();
}

function handleSnipe(id) {
  targets = targets.map((t) => (t.id === id ? { ...t, status: 'sniped', timeLeft: 0 } : t));
  addActivity('Manual snipe placed', 'success');
  renderQueue();
}

function autoSnipe() {
  const windowLimit = Number(filterEls.window.value || 30);
  const priceLimit = Number(filterEls.price.value || Infinity);
  targets = targets.map((t) => {
    const eligible = t.autosnipe && t.timeLeft <= windowLimit && t.price <= priceLimit;
    if (eligible) {
      return { ...t, status: 'sniped', timeLeft: 0 };
    }
    return t;
  });
}

function seedFromPlanner(data) {
  targets = [
    {
      id: crypto.randomUUID(),
      timeLeft: Math.max(10, Number(data.window) + 10),
      price: Number(data.maxPrice),
      notes: data.notes,
      name: data.name,
      position: data.position,
      team: 'Custom',
      ovr: Number(data.ovr),
      window: Number(data.window),
      autosnipe: data.autosnipe,
    },
    ...targets,
  ];
  addActivity(`Added ${data.name} to the queue`, 'info');
  renderQueue();
}

function resetFilters() {
  Object.values(filterEls).forEach((input) => {
    if ('value' in input) input.value = '';
  });
  filterEls.window.value = 30;
  renderQueue();
}

function addActivity(label, tone = 'info') {
  activityLog = [
    { label, time: 'Just now', tone },
    ...activityLog.map((entry, index) => ({
      ...entry,
      time: index === 0 ? 'Moments ago' : entry.time,
    })),
  ].slice(0, 6);
  renderActivity();
}

function renderActivity() {
  if (!activityList) return;
  activityList.innerHTML = '';
  activityLog.forEach((entry) => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    const time = document.createElement('span');

    label.textContent = entry.label;
    label.className = `label ${entry.tone ? `tone-${entry.tone}` : ''}`;
    time.textContent = entry.time;
    time.className = 'time';

    item.appendChild(label);
    item.appendChild(time);
    activityList.appendChild(item);
  });
}

function updateDashboard(filteredList) {
  const openTargets = targets.filter((t) => t.timeLeft > 0);
  const insideWindow = openTargets.filter((t) => t.timeLeft <= t.window);
  const autosnipeReady = openTargets.filter((t) => t.autosnipe);
  const manualOnly = openTargets.filter((t) => !t.autosnipe);
  const soonest = openTargets.sort((a, b) => a.timeLeft - b.timeLeft)[0];

  if (autoStatus) {
    autoStatus.textContent = autoEnabled ? 'Enabled' : 'Disabled';
    autoStatus.classList.toggle('status-pulse', autoEnabled);
  }
  if (nextTarget) {
    nextTarget.textContent = soonest ? `${soonest.name} in ${soonest.timeLeft}s` : 'No targets yet';
  }
  if (countScheduled) countScheduled.textContent = targets.length;
  if (countWindow) countWindow.textContent = insideWindow.length;
  if (countAutosnipe) countAutosnipe.textContent = autosnipeReady.length;
  if (countInside) countInside.textContent = insideWindow.length;
  if (countManual) countManual.textContent = manualOnly.length;

  if (filteredList && !filteredList.length && nextTarget) {
    nextTarget.textContent = 'No visible targets';
  }
}

function wireEvents() {
  refreshButton?.addEventListener('click', () => {
    targets = targets.map((t) => ({ ...t, timeLeft: t.timeLeft + 45 }));
    renderQueue();
  });
  clearFilters?.addEventListener('click', resetFilters);
  Object.values(filterEls).forEach((input) => input?.addEventListener('input', renderQueue));
  planner?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(planner));
    data.autosnipe = Boolean(planner.elements.autosnipe.checked);
    seedFromPlanner(data);
    planner.reset();
  });
  autoToggle?.addEventListener('click', () => {
    autoEnabled = !autoEnabled;
    autoToggle.textContent = autoEnabled ? 'Auto-snipe enabled' : 'Enable auto-snipe';
    autoToggle.classList.toggle('primary', !autoEnabled);
    autoToggle.classList.toggle('ghost', autoEnabled);
    addActivity(autoEnabled ? 'Auto-snipe armed' : 'Auto-snipe disabled', autoEnabled ? 'success' : 'warn');
    updateDashboard();
  });
}

renderQueue();
wireEvents();
renderActivity();
setInterval(tickTimers, 1000);
