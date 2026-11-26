/* ===================================================
   FASTO — ADMIN & KITCHEN DASHBOARD JAVASCRIPT
   POS Pin Lock Screen (Always locked on load/refresh),
   Real-Time Data, Auto-Lock & Audio Chime
   =================================================== */

let verifiedAdminPin = null; // PIN is only in-memory, resets on refresh/exit!
let adminOrders = [];
let adminWaiterCalls = [];
let currentFilter = 'all';
let soundEnabled = true;
let pollTimer = null;
let autoLockTimer = null;
let currentPinInput = '';

// Format currency
function formatSum(amount) {
  return new Intl.NumberFormat('uz-UZ').format(amount || 0) + ' so\'m';
}

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
  // Always lock screen on load / fresh visit to /admin!
  lockScreenNow();

  // Reset auto-lock timer on user interactions
  ['click', 'touchstart', 'mousemove', 'keydown'].forEach(evt => {
    document.addEventListener(evt, resetAutoLockTimer, { passive: true });
  });

  // Physical Keyboard input for lock screen
  document.addEventListener('keydown', (e) => {
    const lockOverlay = document.getElementById('lockOverlay');
    if (!lockOverlay || lockOverlay.classList.contains('unlocked')) return;

    if (e.key >= '0' && e.key <= '9') {
      lockInput(e.key);
    } else if (e.key === 'Backspace') {
      lockBackspace();
    } else if (e.key === 'Escape') {
      lockClear();
    }
  });
});

// ================= PIN LOCK SCREEN LOGIC =================
function lockInput(digit) {
  if (currentPinInput.length < 4) {
    currentPinInput += digit;
    updatePinDots();
    if (currentPinInput.length === 4) {
      setTimeout(verifyLockPin, 120);
    }
  }
}

function lockBackspace() {
  if (currentPinInput.length > 0) {
    currentPinInput = currentPinInput.slice(0, -1);
    updatePinDots();
  }
}

function lockClear() {
  currentPinInput = '';
  updatePinDots();
}

function updatePinDots() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById('pDot' + i);
    if (!dot) continue;
    if (i < currentPinInput.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled', 'error');
    }
  }
  const err = document.getElementById('lockErrorMsg');
  if (err) err.textContent = '';
}

async function verifyLockPin() {
  const errEl = document.getElementById('lockErrorMsg');
  const lockCard = document.getElementById('lockCard');

  try {
    const res = await fetch('/api/admin/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: currentPinInput })
    });

    const data = await res.json();
    if (data.success) {
      // PIN Correct! Unlock dashboard
      verifiedAdminPin = currentPinInput;
      currentPinInput = '';
      updatePinDots();

      const overlay = document.getElementById('lockOverlay');
      if (overlay) overlay.classList.add('unlocked');

      // Start fetching data and live polling
      fetchAdminData();
      if (!pollTimer) {
        pollTimer = setInterval(fetchAdminData, 3500);
      }
      resetAutoLockTimer();
    } else {
      // PIN Error
      if (lockCard) {
        lockCard.classList.add('shake');
        setTimeout(() => lockCard.classList.remove('shake'), 400);
      }

      for (let i = 0; i < 4; i++) {
        const dot = document.getElementById('pDot' + i);
        if (dot) dot.classList.add('error');
      }

      if (errEl) errEl.textContent = data.message || 'Noto\'g\'ri PIN-kod!';
      currentPinInput = '';
      setTimeout(updatePinDots, 600);
    }
  } catch (err) {
    if (errEl) errEl.textContent = 'Server bilan aloqa uzildi';
  }
}

// Lock Screen manually or on inactivity
function lockScreenNow() {
  verifiedAdminPin = null;
  currentPinInput = '';
  updatePinDots();

  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (autoLockTimer) {
    clearTimeout(autoLockTimer);
    autoLockTimer = null;
  }

  const overlay = document.getElementById('lockOverlay');
  if (overlay) overlay.classList.remove('unlocked');
}

// Auto-lock after 3 minutes of inactivity
function resetAutoLockTimer() {
  if (!verifiedAdminPin) return;
  if (autoLockTimer) clearTimeout(autoLockTimer);
  autoLockTimer = setTimeout(() => {
    console.log('Auto-locking due to inactivity');
    lockScreenNow();
  }, 3 * 60 * 1000); // 3 minutes
}

// ================= FETCH ADMIN DATA =================
async function fetchAdminData() {
  if (!verifiedAdminPin) return;

  const icon = document.getElementById('refreshIcon');
  if (icon) icon.classList.add('fa-spin');

  try {
    const res = await fetch('/api/admin/data', {
      headers: { 'X-Admin-Pin': verifiedAdminPin }
    });

    if (res.status === 401) {
      lockScreenNow();
      return;
    }

    const data = await res.json();
    const prevOrdersCount = adminOrders.length;
    const prevCallsCount = adminWaiterCalls.length;

    adminOrders = data.orders || [];
    adminWaiterCalls = data.waiterCalls || [];

    // Chime when new order arrives
    if (adminOrders.length > prevOrdersCount && prevOrdersCount !== 0) {
      playBeepNotification(false);
    }

    // Chime when new waiter call arrives
    if (adminWaiterCalls.length > prevCallsCount && prevCallsCount !== 0) {
      playBeepNotification(true);
    }

    renderStats(data.stats);
    renderWaiterAlerts();
    renderOrders();
  } catch (err) {
    console.error('Error fetching admin data:', err);
  } finally {
    if (icon) {
      setTimeout(() => icon.classList.remove('fa-spin'), 600);
    }
  }
}

// ================= RENDER STATS =================
function renderStats(stats) {
  if (!stats) return;

  const totalEl = document.getElementById('statTotalOrders');
  if (totalEl) totalEl.textContent = stats.totalOrdersToday || 0;

  const activeEl = document.getElementById('statActiveOrders');
  if (activeEl) activeEl.textContent = stats.activeOrdersCount || 0;

  const revEl = document.getElementById('statRevenue');
  if (revEl) revEl.textContent = formatSum(stats.revenueToday || 0);

  const callsEl = document.getElementById('statCalls');
  if (callsEl) callsEl.textContent = stats.pendingCallsCount || 0;

  // Filter counters
  const cAll = document.getElementById('countAll');
  if (cAll) cAll.textContent = adminOrders.length;

  const cNew = document.getElementById('countNew');
  if (cNew) cNew.textContent = adminOrders.filter(o => o.status === 'new').length;

  const cCook = document.getElementById('countCooking');
  if (cCook) cCook.textContent = adminOrders.filter(o => o.status === 'cooking').length;

  const cReady = document.getElementById('countReady');
  if (cReady) cReady.textContent = adminOrders.filter(o => o.status === 'ready').length;

  const cComp = document.getElementById('countCompleted');
  if (cComp) cComp.textContent = adminOrders.filter(o => o.status === 'completed').length;
}

// ================= RENDER WAITER ALERTS =================
function renderWaiterAlerts() {
  const section = document.getElementById('waiterAlertsSection');
  const list = document.getElementById('waiterAlertsList');
  if (!section || !list) return;

  if (adminWaiterCalls.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  list.innerHTML = adminWaiterCalls.map(call => `
    <div class="alert-item-card">
      <span class="alert-table-tag">Stol #${call.table}</span>
      <span class="alert-reason">${call.reason}</span>
      <span class="alert-time">${call.time}</span>
      <button class="btn-dismiss-alert" onclick="dismissWaiterCall('${call.id}')">
        Bajarildi ✅
      </button>
    </div>
  `).join('');
}

// ================= RENDER ORDERS =================
function renderOrders() {
  const board = document.getElementById('ordersBoard');
  if (!board) return;

  const searchInput = document.getElementById('orderSearchInput');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  let filtered = adminOrders;

  if (currentFilter !== 'all') {
    filtered = filtered.filter(o => o.status === currentFilter);
  }

  if (query) {
    filtered = filtered.filter(o => 
      o.id.toLowerCase().includes(query) || 
      String(o.table).includes(query) ||
      (o.notes && o.notes.toLowerCase().includes(query))
    );
  }

  if (filtered.length === 0) {
    board.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
        <i class="fas fa-clipboard-check" style="font-size: 3rem; color: #2A2E3D; margin-bottom: 12px; display:block;"></i>
        <h3>Hozircha buyurtmalar yo'q</h3>
        <p style="font-size:0.85rem;">Yangi buyurtmalar kelishi bilan shu yerda darhol aks etadi</p>
      </div>
    `;
    return;
  }

  board.innerHTML = filtered.map(order => {
    let actionBtn = '';
    if (order.status === 'new') {
      actionBtn = `
        <button class="btn-status-change btn-to-cooking" onclick="setOrderStatus('${order.id}', 'cooking')">
          <i class="fas fa-fire-burner"></i> Tayyorlashga olish
        </button>
      `;
    } else if (order.status === 'cooking') {
      actionBtn = `
        <button class="btn-status-change btn-to-ready" onclick="setOrderStatus('${order.id}', 'ready')">
          <i class="fas fa-check-circle"></i> Tayyor bo'ldi
        </button>
      `;
    } else if (order.status === 'ready') {
      actionBtn = `
        <button class="btn-status-change btn-to-completed" onclick="setOrderStatus('${order.id}', 'completed')">
          <i class="fas fa-paper-plane"></i> Yetkazildi (Yopish)
        </button>
      `;
    } else {
      actionBtn = `
        <button class="btn-status-change" style="background:#263238; color:#90A4AE;" onclick="setOrderStatus('${order.id}', 'cooking')">
          <i class="fas fa-redo"></i> Qayta ochish
        </button>
      `;
    }

    return `
      <div class="order-card status-${order.status}">
        <div class="card-top">
          <div class="card-table-badge">STOL #${order.table}</div>
          <div class="card-meta">
            <div class="card-order-id">#${order.id}</div>
            <div class="card-order-time"><i class="far fa-clock"></i> ${order.createdAt}</div>
          </div>
        </div>

        <div class="order-items-list">
          ${order.items.map(item => `
            <div class="order-item-row">
              <div class="item-qty-name">
                <span class="item-qty-badge">${item.qty}x</span>
                <div class="item-details-text">
                  <span class="item-main-name">${item.name}</span>
                  ${item.variantName ? `<span class="item-variant-label">${item.variantName}</span>` : ''}
                </div>
              </div>
              <span class="item-row-price">${formatSum(item.price * item.qty)}</span>
            </div>
          `).join('')}
        </div>

        ${order.notes ? `
          <div class="order-notes-box">
            <i class="fas fa-info-circle"></i> <strong>Izoh:</strong> ${order.notes}
          </div>
        ` : ''}

        <div class="order-card-summary">
          <div class="order-pay-method">
            <i class="fas fa-credit-card"></i> ${order.paymentMethod || 'Naqd pul'}
          </div>
          <div class="order-total-sum">${formatSum(order.total)}</div>
        </div>

        <div class="order-card-actions">
          ${actionBtn}
          <button class="btn-print-receipt" onclick="openReceipt('${order.id}')" title="Chek chiqarish">
            <i class="fas fa-print"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Update Order Status
async function setOrderStatus(orderId, newStatus) {
  if (!verifiedAdminPin) return;

  try {
    const res = await fetch('/api/admin/order-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Pin': verifiedAdminPin
      },
      body: JSON.stringify({ id: orderId, status: newStatus })
    });
    const result = await res.json();
    if (result.success) {
      fetchAdminData();
    }
  } catch (err) {
    console.error('Error updating status:', err);
  }
}

// Dismiss Waiter Call
async function dismissWaiterCall(callId) {
  if (!verifiedAdminPin) return;

  try {
    await fetch('/api/admin/dismiss-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Pin': verifiedAdminPin
      },
      body: JSON.stringify({ id: callId })
    });
    fetchAdminData();
  } catch (err) {
    console.error('Error dismissing call:', err);
  }
}

// Filter Tab Switch
function setOrderFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.filter === filter);
  });
  renderOrders();
}

// Audio chime using Web Audio API
function playBeepNotification(isUrgent = false) {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isUrgent) {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {
    // Audio restriction policy before user click
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('soundToggleBtn');
  const icon = document.getElementById('soundIcon');
  const text = document.getElementById('soundText');

  if (soundEnabled) {
    btn.classList.remove('muted');
    icon.className = 'fas fa-volume-up';
    text.textContent = 'Ovoz';
    playBeepNotification();
  } else {
    btn.classList.add('muted');
    icon.className = 'fas fa-volume-mute';
    text.textContent = 'Ovoz: O\'chiq';
  }
}

// ================= PRINT RECEIPT =================
function openReceipt(orderId) {
  const order = adminOrders.find(o => o.id === orderId);
  if (!order) return;

  const paper = document.getElementById('receiptPaper');
  paper.innerHTML = `
    <div class="receipt-header">
      <h3>FASTO</h3>
      <div>Fresh Drinks • Good Mood</div>
      <div style="font-size:0.75rem; color:#555;">Toshkent sh.</div>
    </div>
    <div class="receipt-dashed"></div>
    <div><strong>Chek:</strong> #${order.id}</div>
    <div><strong>Stol:</strong> #${order.table}</div>
    <div><strong>Vaqt:</strong> ${order.createdAt}</div>
    <div><strong>To'lov:</strong> ${order.paymentMethod || 'Naqd pul'}</div>
    <div class="receipt-dashed"></div>

    <table class="receipt-items-table">
      <thead>
        <tr>
          <th>Nomi</th>
          <th style="text-align:center;">Soni</th>
          <th style="text-align:right;">Summa</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `
          <tr>
            <td>
              ${item.name}
              ${item.variantName ? `<br><small style="color:#555;">(${item.variantName})</small>` : ''}
            </td>
            <td style="text-align:center;">${item.qty}</td>
            <td class="r-price">${formatSum(item.price * item.qty)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="receipt-dashed"></div>
    <div style="display:flex; justify-content:space-between; font-size:1.05rem; font-weight:bold;">
      <span>JAMI:</span>
      <span>${formatSum(order.total)}</span>
    </div>

    ${order.notes ? `
      <div class="receipt-dashed"></div>
      <div style="font-size:0.75rem;"><strong>Izoh:</strong> ${order.notes}</div>
    ` : ''}

    <div class="receipt-dashed"></div>
    <div style="text-align:center; font-size:0.75rem; margin-top:8px;">
      Tashrifingiz uchun rahmat!<br>Yoqimli ishtaha!
    </div>
  `;

  document.getElementById('receiptBackdrop').classList.add('active');
}

function closeReceipt(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('btn-close-receipt')) return;
  document.getElementById('receiptBackdrop').classList.remove('active');
}
