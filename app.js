const STORAGE_KEY = 'rifapp-collections-v1';
const ACCESS_KEY_STORAGE = 'rifapp-cloud-access-key';
const API_URL = 'https://rif-app-github-io-ixxu.vercel.app/api/raffles';
const emptyStore = { raffles: [], activeRaffleId: null };
let store = loadStore();
let selectedNumber = null;
let cloudSyncInProgress = false;

const $ = (selector) => document.querySelector(selector);
const money = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value) || 0);
const numberText = (value) => String(value).padStart(2, '0');
const ruleLabels = { last2: 'Dos últimas cifras', first2: 'Dos primeras cifras', middle2: 'Cifras del medio', full: 'Coincidencia total' };

function loadStore() {
  try { return { ...emptyStore, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }; } catch { return structuredClone(emptyStore); }
}
function saveStore(forceCloud = false) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  syncStoreToCloud(forceCloud);
}
function getAccessKey() { return localStorage.getItem(ACCESS_KEY_STORAGE) || window.prompt('Ingresa tu APP_ACCESS_KEY para sincronizar RifApp:'); }
function rememberAccessKey(key) { if (key) localStorage.setItem(ACCESS_KEY_STORAGE, key.trim()); return key?.trim(); }
async function syncStoreToCloud(forceCloud = false) {
  if (cloudSyncInProgress || (!store.raffles.length && !forceCloud)) return;
  const key = rememberAccessKey(getAccessKey());
  if (!key) return;
  cloudSyncInProgress = true;
  try {
    const response = await fetch(API_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-App-Key': key }, body: JSON.stringify(store) });
    if (response.status === 401) { localStorage.removeItem(ACCESS_KEY_STORAGE); window.alert('La APP_ACCESS_KEY no es válida.'); }
    if (!response.ok) throw new Error(`Cloud save failed: ${response.status}`);
  } catch (error) { console.error(error); }
  cloudSyncInProgress = false;
}
async function syncStoreFromCloud() {
  const key = rememberAccessKey(getAccessKey());
  if (!key) return;
  try {
    const response = await fetch(API_URL, { headers: { 'X-App-Key': key } });
    if (response.status === 401) { localStorage.removeItem(ACCESS_KEY_STORAGE); window.alert('La APP_ACCESS_KEY no es válida.'); return; }
    if (!response.ok) throw new Error(`Cloud load failed: ${response.status}`);
    const cloudStore = await response.json();
    if (Array.isArray(cloudStore.raffles)) { store = cloudStore; localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); renderDashboard(); renderHeader(); }
  } catch (error) { console.error(error); }
}
function activeRaffle() { return store.raffles.find((raffle) => raffle.id === store.activeRaffleId) || null; }
function activeTickets() { return activeRaffle()?.tickets || {}; }
function ticket(number) { return activeTickets()[number] || { status: 'available', customer: '', paid: 0 }; }
function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value || ''; return div.innerHTML; }
function formatDate(value) { return value ? new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : 'Fecha por definir'; }
function setText(selector, value) { const element = $(selector); if (element) element.textContent = value; }

function renderHeader() {
  const activeView = document.querySelector('.view.active')?.id;
  setText('#pageTitle', activeView === 'dashboardView' ? 'Inventario de boletas' : activeView === 'setupView' ? 'Crear una rifa' : 'Liquidar premios');
  setText('#rifaCode', activeRaffle() ? activeRaffle().code : 'SIN RIFA');
}
function renderDashboard() {
  const raffle = activeRaffle();
  const dashboard = $('#dashboardView');
  if (!raffle) {
    dashboard.innerHTML = `<div class="empty-dashboard"><span class="empty-dashboard-mark">＋</span><p class="eyebrow">Tu espacio de trabajo</p><h2>Aún no tienes rifas creadas</h2><p>Configura tu primera rifa para empezar a gestionar números, clientes, abonos y premios.</p><button class="primary-button" type="button" data-view="setup">Crear mi primera rifa <span>→</span></button></div><section class="raffles-section"><div class="card-header"><div><p class="eyebrow">Tus rifas</p><h2>Historial de rifas</h2></div><span class="muted">0 creadas</span></div><div class="empty-list">Las rifas que crees aparecerán aquí.</div></section>`;
    dashboard.querySelector('[data-view="setup"]').addEventListener('click', () => switchView('setup'));
    return;
  }
  dashboard.innerHTML = `<div class="event-banner"><div><span class="banner-kicker">Rifa activa</span><h2>${escapeHtml(raffle.name)}</h2><p>${escapeHtml(raffle.reference)} · juega el <strong>${formatDate(raffle.date)}</strong></p></div><button class="outline-button" type="button" id="editRaffleButton">Editar configuración</button></div><div class="stats-grid"><article class="stat-card"><span>Disponibles</span><strong class="green-text" id="availableStat">100</strong><small>casillas libres</small></article><article class="stat-card"><span>Pagadas</span><strong class="blue-text" id="paidStat">0</strong><small>venta completada</small></article><article class="stat-card"><span>Pendientes</span><strong class="red-text" id="pendingStat">0</strong><small>con saldo por cobrar</small></article><article class="stat-card dark-stat"><span>Recaudo</span><strong id="revenueStat">$0</strong><small>de ${money(raffle.price * 100)} proyectado</small></article></div><div class="dashboard-grid"><section class="card grid-card"><div class="card-header"><div><p class="eyebrow">01 / Inventario</p><h2>Matriz de números <span class="subtle">00 — 99</span></h2></div><div class="legend"><span><i class="legend-dot available"></i>Disponible</span><span><i class="legend-dot paid"></i>Pagado</span><span><i class="legend-dot pending"></i>Pendiente</span></div></div><div class="number-grid" id="numberGrid"></div><p class="grid-help">Selecciona una casilla para registrar o actualizar su reserva.</p></section><aside class="card detail-card" id="ticketDetail"></aside></div><section class="raffles-section card"><div class="card-header"><div><p class="eyebrow">Tus rifas</p><h2>Rifas creadas</h2></div><span class="muted">${store.raffles.length} ${store.raffles.length === 1 ? 'creada' : 'creadas'}</span></div><div class="raffle-list" id="raffleList"></div></section>`;
  $('#editRaffleButton').addEventListener('click', () => switchView('setup'));
  const values = Object.values(raffle.tickets); const paid = values.filter((item) => item.status === 'paid').length; const pending = values.filter((item) => item.status === 'pending').length; const revenue = values.reduce((sum, item) => sum + Number(item.paid || 0), 0);
  setText('#availableStat', 100 - values.length); setText('#paidStat', paid); setText('#pendingStat', pending); setText('#revenueStat', money(revenue));
  const grid = $('#numberGrid'); for (let number = 0; number < 100; number += 1) { const item = ticket(number); const button = document.createElement('button'); button.className = `number-cell ${item.status} ${selectedNumber === number ? 'selected' : ''}`; button.textContent = numberText(number); button.title = item.status === 'available' ? 'Disponible' : `${item.customer || 'Sin cliente'} · ${item.status === 'paid' ? 'Pagado' : 'Pendiente'}`; button.addEventListener('click', () => { selectedNumber = number; renderDashboard(); }); grid.append(button); }
  renderDetail(); renderRaffleList();
}
function renderDetail() { const container = $('#ticketDetail'); if (!container) return; if (selectedNumber === null) { container.innerHTML = '<div class="empty-detail"><span class="detail-symbol">⌁</span><h3>Selecciona un número</h3><p>Consulta el estado, asigna un cliente y registra sus abonos.</p></div>'; return; } const raffle = activeRaffle(); const item = ticket(selectedNumber); const balance = Math.max(0, Number(raffle.price) - Number(item.paid || 0)); container.innerHTML = `<div class="detail-heading"><div class="detail-number"><span class="large-chip">${numberText(selectedNumber)}</span><h3>Número ${numberText(selectedNumber)}</h3></div><span class="status-label ${item.status}">${item.status === 'available' ? 'Disponible' : item.status === 'paid' ? 'Pagado' : 'Pendiente'}</span></div><form class="detail-form" id="ticketForm"><label>Cliente<input id="customerInput" required maxlength="60" value="${escapeHtml(item.customer)}" placeholder="Nombre completo"></label><div class="amount-row"><label>Valor boleta<input value="${money(raffle.price)}" disabled></label><label>Abono acumulado<input id="paidInput" type="number" min="0" max="${raffle.price}" value="${item.paid || 0}"></label></div><div class="detail-actions"><button type="submit" class="primary-button">Guardar boleta</button><button type="button" class="secondary-button" id="releaseButton">Liberar</button></div>${item.status !== 'available' ? `<p class="balance-note">Saldo restante: <strong>${money(balance)}</strong></p>` : ''}</form>`; $('#ticketForm').addEventListener('submit', saveTicket); $('#releaseButton').addEventListener('click', releaseTicket); }
function saveTicket(event) { event.preventDefault(); const raffle = activeRaffle(); const paid = Math.max(0, Math.min(Number(raffle.price), Number($('#paidInput').value) || 0)); raffle.tickets[selectedNumber] = { customer: $('#customerInput').value.trim(), paid, status: paid >= Number(raffle.price) ? 'paid' : 'pending' }; saveStore(); renderDashboard(); }
function releaseTicket() { delete activeRaffle().tickets[selectedNumber]; saveStore(); renderDashboard(); }
function renderRaffleList() { const list = $('#raffleList'); if (!list) return; list.innerHTML = ''; store.raffles.forEach((raffle) => { const item = document.createElement('div'); item.className = `raffle-list-item ${raffle.id === store.activeRaffleId ? 'current' : ''}`; item.innerHTML = `<div><strong></strong><small>${escapeHtml(raffle.reference)} · ${formatDate(raffle.date)}</small></div><button class="secondary-button" type="button">${raffle.id === store.activeRaffleId ? 'Abierta' : 'Abrir rifa'}</button>`; item.querySelector('strong').textContent = raffle.name; item.querySelector('button').addEventListener('click', () => { store.activeRaffleId = raffle.id; selectedNumber = null; saveStore(); switchView('dashboard'); }); list.append(item); }); }
function renderPrizes(prizes = [{ name: 'Primer premio', rule: 'last2', amount: 0 }]) { const list = $('#prizesList'); if (!list) return; list.innerHTML = ''; prizes.forEach((prize, index) => { const row = document.createElement('div'); row.className = 'prize-row'; row.innerHTML = `<span class="prize-index">${index + 1}</span><label>Nombre del premio<input class="prize-name" required value="${escapeHtml(prize.name)}"></label><label>Regla<select class="prize-rule"><option value="last2">Dos últimas cifras</option><option value="first2">Dos primeras cifras</option><option value="middle2">Cifras del medio</option><option value="full">Coincidencia total</option></select></label><label>Valor del premio<input class="prize-amount" type="number" min="0" value="${prize.amount}"></label><button class="remove-prize" type="button" aria-label="Eliminar premio">×</button>`; row.querySelector('.prize-rule').value = prize.rule; row.querySelector('.remove-prize').addEventListener('click', () => { row.remove(); }); list.append(row); }); }
function readPrizes() { return [...document.querySelectorAll('.prize-row')].map((row, index) => ({ id: crypto.randomUUID(), name: row.querySelector('.prize-name').value.trim() || `Premio ${index + 1}`, rule: row.querySelector('.prize-rule').value, amount: Number(row.querySelector('.prize-amount').value) || 0 })); }
function saveSetup(event) { event.preventDefault(); const raffle = { id: crypto.randomUUID(), code: `RIFA-${String(store.raffles.length + 1).padStart(3, '0')}`, name: $('#raffleName').value.trim(), date: $('#raffleDate').value, reference: $('#raffleReference').value.trim(), price: Number($('#ticketPrice').value), owner: $('#ownerName').value.trim(), phone: $('#ownerPhone').value.trim(), prizes: readPrizes(), tickets: {}, officialResult: '' }; store.raffles.push(raffle); store.activeRaffleId = raffle.id; selectedNumber = null; saveStore(); $('#setupMessage').textContent = 'Rifa creada correctamente.'; switchView('dashboard'); }
function syncSetupForm() { const raffle = activeRaffle(); $('#raffleForm').reset(); if (!raffle) { renderPrizes(); return; } $('#raffleName').value = raffle.name; $('#raffleDate').value = raffle.date; $('#raffleReference').value = raffle.reference; $('#ticketPrice').value = raffle.price; $('#ownerName').value = raffle.owner; $('#ownerPhone').value = raffle.phone; renderPrizes(raffle.prizes); }
function verifyResult() { const result = $('#officialResult').value.replace(/\D/g, ''); const raffle = activeRaffle(); if (result.length !== 4 || !raffle) { setText('#verifiedBadge', 'Ingresa 4 cifras'); return; } raffle.officialResult = result; saveStore(); $('#verifiedBadge').textContent = 'Verificado'; $('#verifiedBadge').classList.add('success'); const winners = $('#winnerResults'); winners.innerHTML = ''; raffle.prizes.forEach((prize, index) => { const winningNumber = prize.rule === 'full' ? result : prize.rule === 'first2' ? result.slice(0, 2) : prize.rule === 'middle2' ? result.slice(1, 3) : result.slice(-2); const match = raffle.tickets[Number(winningNumber)]; const row = document.createElement('div'); row.className = 'winner-result'; row.innerHTML = `<span class="prize-index">${index + 1}</span><div><h4>${escapeHtml(prize.name)}</h4><p>${ruleLabels[prize.rule]} · ${money(prize.amount)}</p></div><div><strong>${winningNumber}</strong><p class="${match ? 'match' : 'no-match'}">${match ? `✓ ${escapeHtml(match.customer)}` : 'Sin boleta registrada'}</p></div>`; winners.append(row); }); }
function switchView(viewName) { document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === `${viewName}View`)); document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === viewName)); if (viewName === 'setup') syncSetupForm(); if (viewName === 'settlement' && activeRaffle()) $('#officialResult').value = activeRaffle().officialResult; renderHeader(); if (viewName === 'dashboard') renderDashboard(); }

document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
$('#raffleForm').addEventListener('submit', saveSetup); $('#addPrizeButton').addEventListener('click', () => { const prizes = readPrizes(); prizes.push({ name: `Premio ${prizes.length + 1}`, rule: 'last2', amount: 0 }); renderPrizes(prizes); }); $('#verifyButton').addEventListener('click', verifyResult);
$('#resetButton').addEventListener('click', () => { if (window.confirm('¿Borrar todas las rifas creadas?')) { store = structuredClone(emptyStore); saveStore(true); selectedNumber = null; switchView('dashboard'); } });
renderDashboard(); renderHeader(); syncStoreFromCloud();
