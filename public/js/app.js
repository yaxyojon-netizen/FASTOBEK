/* ===================================================
   FASTO — NFC RESTAURANT MENU & ORDER JAVASCRIPT
   Mobile-First, Real-Time Cart, Table State & Waiter Call
   =================================================== */

// Global State
let currentTable = '1';
let currentCategory = 'all';
let menuData = { categories: [], items: [] };
let selectedVariants = {}; // itemId -> variantIndex
let cart = []; // [{ id, name, variantName, price, image, qty }]

// Format Uzbek sum currency
function formatSum(amount) {
  return new Intl.NumberFormat('uz-UZ').format(amount || 0) + ' so\'m';
}

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', async () => {
  initTableNumber();
  setupEventListeners();
  await loadMenuData();
  renderTablesGrid();
  updateCartUI();
});

// Detect or set table from URL query (?table=5)
function initTableNumber() {
  const urlParams = new URLSearchParams(window.location.search);
  const tableParam = urlParams.get('table');
  if (tableParam) {
    currentTable = tableParam;
  } else {
    const saved = localStorage.getItem('fasto_table');
    if (saved) currentTable = saved;
  }
  updateTableUI();
}

function updateTableUI() {
  const cTable = document.getElementById('currentTableNum');
  if (cTable) cTable.textContent = currentTable;

  const bTable = document.getElementById('bannerTableNum');
  if (bTable) bTable.textContent = currentTable;

  const cmTable = document.getElementById('cartModalTable');
  if (cmTable) cmTable.textContent = currentTable;

  const wTable = document.getElementById('waiterTableNum');
  if (wTable) wTable.textContent = currentTable;

  const sTable = document.getElementById('successTableNum');
  if (sTable) sTable.textContent = currentTable;

  localStorage.setItem('fasto_table', currentTable);
}

// Fetch menu from API
async function loadMenuData() {
  try {
    const response = await fetch('/api/menu');
    menuData = await response.json();
    
    // Set default selected variant (index 0) for each item
    if (menuData.items) {
      menuData.items.forEach(item => {
        selectedVariants[item.id] = 0;
      });
    }

    renderMenu();
  } catch (err) {
    console.error('Error fetching menu data:', err);
    showToast('Menyuni yuklashda xatolik yuz berdi', 'error');
  }
}

// ================= RENDER MENU =================
function renderMenu() {
  const container = document.getElementById('menuContainer');
  if (!container || !menuData.items) return;

  const searchInput = document.getElementById('searchInput');
  const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : '';

  // Filter items
  let filteredItems = menuData.items;

  if (currentCategory !== 'all') {
    filteredItems = filteredItems.filter(item => item.categoryId === currentCategory);
  }

  if (searchVal) {
    filteredItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes(searchVal) || 
      item.description.toLowerCase().includes(searchVal)
    );
  }

  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 50px 20px; color: var(--text-muted);">
        <i class="fas fa-search" style="font-size: 2.5rem; color:#D1D1D6; margin-bottom: 12px; display:block;"></i>
        <p style="font-weight: 600;">Hech qanday mahsulot topilmadi</p>
        <small>Boshqa so'z bilan qidirib ko'ring yoki boshqa toifani tanlang</small>
      </div>
    `;
    return;
  }

  // Group items by category if "all" is active and not searching
  if (currentCategory === 'all' && !searchVal) {
    let html = '';
    menuData.categories.forEach(cat => {
      const catItems = filteredItems.filter(item => item.categoryId === cat.id);
      if (catItems.length > 0) {
        html += `
          <div class="category-block" id="cat-section-${cat.id}">
            <div class="category-header">
              <h2>${cat.icon} ${cat.name}</h2>
              <span class="items-count">${catItems.length} ta mahsulot</span>
            </div>
            <div class="products-grid">
              ${catItems.map(item => renderProductCard(item)).join('')}
            </div>
          </div>
        `;
      }
    });
    container.innerHTML = html;
  } else {
    container.innerHTML = `
      <div class="products-grid">
        ${filteredItems.map(item => renderProductCard(item)).join('')}
      </div>
    `;
  }
}

// Render single product card
function renderProductCard(item) {
  const selectedIdx = selectedVariants[item.id] || 0;
  const currentVariant = item.variants[selectedIdx] || item.variants[0];
  const price = currentVariant ? currentVariant.price : item.price;
  
  // Check if item is already in cart
  const cartItem = cart.find(c => c.id === item.id && c.variantName === (currentVariant ? currentVariant.name : ''));
  const qtyInCart = cartItem ? cartItem.qty : 0;

  let variantsHtml = '';
  if (item.variants && item.variants.length > 1) {
    variantsHtml = `
      <div class="variant-selector">
        <div class="variant-pills">
          ${item.variants.map((v, idx) => `
            <button class="variant-btn ${idx === selectedIdx ? 'selected' : ''}" 
                    onclick="selectVariant('${item.id}', ${idx})">
              ${v.name}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  let actionBtnHtml = '';
  if (qtyInCart > 0) {
    actionBtnHtml = `
      <div class="item-qty-stepper">
        <button class="stepper-btn" onclick="stepItemQty('${item.id}', '${currentVariant ? currentVariant.name : ''}', -1)">−</button>
        <span class="stepper-count">${qtyInCart}</span>
        <button class="stepper-btn" onclick="stepItemQty('${item.id}', '${currentVariant ? currentVariant.name : ''}', 1)">+</button>
      </div>
    `;
  } else {
    actionBtnHtml = `
      <button class="btn-add-cart" onclick="addToCart('${item.id}')">
        <i class="fas fa-plus"></i> Qo'shish
      </button>
    `;
  }

  return `
    <div class="product-card" id="card-${item.id}">
      <div class="product-img-box">
        <img src="${item.image}" alt="${item.name}" loading="lazy">
        ${item.badge ? `<span class="product-badge">${item.badge}</span>` : ''}
      </div>
      <div class="product-details">
        <div>
          <h3 class="product-title">${item.name}</h3>
          <p class="product-desc">${item.description}</p>
          ${variantsHtml}
        </div>
        <div class="product-footer">
          <div class="product-price">
            ${formatSum(price)}
          </div>
          ${actionBtnHtml}
        </div>
      </div>
    </div>
  `;
}

// Select item variant
function selectVariant(itemId, variantIdx) {
  selectedVariants[itemId] = variantIdx;
  renderMenu();
}

// ================= CART LOGIC =================
function addToCart(itemId) {
  const item = menuData.items.find(i => i.id === itemId);
  if (!item) return;

  const variantIdx = selectedVariants[itemId] || 0;
  const variant = item.variants[variantIdx] || item.variants[0];
  const variantName = variant ? variant.name : 'Standart';
  const price = variant ? variant.price : item.price;

  // Check if already in cart
  const existing = cart.find(c => c.id === itemId && c.variantName === variantName);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: itemId,
      name: item.name,
      variantName: variantName,
      price: price,
      image: item.image,
      qty: 1
    });
  }

  updateCartUI();
  renderMenu();
  showToast(`"${item.name}" (${variantName}) savatga qo'shildi!`);
}

// Quick Add Sauce
function quickAddSauce(sauceName, price, img) {
  const existing = cart.find(c => c.name === sauceName);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: 'sauce_' + Date.now(),
      name: sauceName,
      variantName: 'Portsiya',
      price: price,
      image: img,
      qty: 1
    });
  }
  updateCartUI();
  showToast(`${sauceName} qo'shildi!`);
}

// Step quantity directly from product card
function stepItemQty(itemId, variantName, delta) {
  const index = cart.findIndex(c => c.id === itemId && c.variantName === variantName);
  if (index !== -1) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
  }
  updateCartUI();
  renderMenu();
}

// Step quantity inside cart modal
function changeCartItemQty(index, delta) {
  if (!cart[index]) return;
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  updateCartUI();
  renderMenu();
}

// Remove item from cart
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
  renderMenu();
  showToast('Mahsulot savatchadan o\'chirildi');
}

// Update all Cart UI counters, floating bar, total
function updateCartUI() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Update Header Counter
  const headerCount = document.getElementById('headerCartCount');
  if (headerCount) headerCount.textContent = totalQty;

  // Update Floating Bottom Bar
  const floatingBar = document.getElementById('floatingCartBar');
  const floatingCount = document.getElementById('floatingCartCount');
  const floatingTotal = document.getElementById('floatingCartTotal');

  if (floatingCount) floatingCount.textContent = totalQty;
  if (floatingTotal) floatingTotal.textContent = formatSum(totalPrice);

  if (floatingBar) {
    if (totalQty > 0) {
      floatingBar.classList.add('visible');
    } else {
      floatingBar.classList.remove('visible');
    }
  }

  // Update Cart Sheet / Modal Elements
  const summarySubtotal = document.getElementById('summarySubtotal');
  if (summarySubtotal) summarySubtotal.textContent = formatSum(totalPrice);

  const summaryTotal = document.getElementById('summaryTotal');
  if (summaryTotal) summaryTotal.textContent = formatSum(totalPrice);

  const submitBtnPrice = document.getElementById('submitBtnPrice');
  if (submitBtnPrice) submitBtnPrice.textContent = formatSum(totalPrice);

  renderCartSheetList();
}

// Render items inside the Bottom Sheet Cart
function renderCartSheetList() {
  const listEl = document.getElementById('cartItemsList');
  if (!listEl) return;

  const submitBtn = document.getElementById('submitOrderBtn');

  if (cart.length === 0) {
    listEl.innerHTML = `
      <div class="empty-cart-view">
        <i class="fas fa-shopping-basket empty-cart-icon"></i>
        <h4 style="color:var(--text-main); margin-bottom: 4px;">Savatchangiz bo'sh</h4>
        <p style="font-size:0.85rem;">Menyudan lazzatli taom yoki ichimlik tanlang</p>
      </div>
    `;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.5';
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
  }

  listEl.innerHTML = cart.map((item, idx) => `
    <div class="cart-item-row">
      <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-variant">${item.variantName}</div>
        <div class="cart-item-price">${formatSum(item.price * item.qty)}</div>
      </div>
      <div class="cart-item-controls">
        <button onclick="changeCartItemQty(${idx}, -1)">−</button>
        <span class="cart-item-qty">${item.qty}</span>
        <button onclick="changeCartItemQty(${idx}, 1)">+</button>
        <button class="btn-remove-item" onclick="removeFromCart(${idx})" title="O'chirish">
          <i class="fas fa-trash-alt" style="font-size: 0.75rem;"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// ================= SUBMIT ORDER =================
async function submitOrder() {
  if (!cart || cart.length === 0) {
    showToast('Savatcha bo\'sh! Avval taom qo\'shing.', 'error');
    return;
  }

  const submitBtn = document.getElementById('submitOrderBtn');
  const originalText = submitBtn ? submitBtn.innerHTML : '';
  
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';
  }

  const notesEl = document.getElementById('orderNotes');
  const notes = notesEl ? notesEl.value.trim() : '';
  
  const payMethodInput = document.querySelector('input[name="payMethod"]:checked');
  const payMethod = payMethodInput ? payMethodInput.value : 'Naqd pul';
  
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const orderPayload = {
    table: currentTable || '1',
    items: cart,
    total: totalPrice,
    notes: notes,
    paymentMethod: payMethod
  };

  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    if (!res.ok) {
      throw new Error(`Server javobi: ${res.status}`);
    }

    const result = await res.json();
    if (result.success) {
      closeCartModal();

      // Show success modal
      const successOrderId = document.getElementById('successOrderId');
      if (successOrderId) successOrderId.textContent = '#' + (result.orderId || 'FST-1001');

      const successTotal = document.getElementById('successTotal');
      if (successTotal) successTotal.textContent = formatSum(totalPrice);

      const successTableNum = document.getElementById('successTableNum');
      if (successTableNum) successTableNum.textContent = currentTable;

      const orderSuccessBackdrop = document.getElementById('orderSuccessBackdrop');
      if (orderSuccessBackdrop) orderSuccessBackdrop.classList.add('active');

      // Clear cart
      cart = [];
      if (notesEl) notesEl.value = '';

      updateCartUI();
      renderMenu();
      showToast('Buyurtmangiz qabul qilindi! 🎉');
    } else {
      showToast(result.message || 'Xatolik yuz berdi', 'error');
    }
  } catch (err) {
    console.error('Order submit error:', err);
    showToast('Buyurtma yuborishda xatolik: ' + (err.message || 'Aloqa yo\'q'), 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
    }
  }
}

// Close Success Modal
function closeSuccessModal() {
  const el = document.getElementById('orderSuccessBackdrop');
  if (el) el.classList.remove('active');
}

// ================= CALL WAITER =================
async function callWaiter(reason) {
  try {
    const res = await fetch('/api/call-waiter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: currentTable, reason: reason })
    });
    const result = await res.json();
    closeWaiterModal();
    showToast(`🔔 Stol #${currentTable}: Ofitsiantga xabar yuborildi!`);
  } catch (err) {
    showToast('Xabar yuborishda xatolik', 'error');
  }
}

// ================= TABLE SELECTOR =================
function renderTablesGrid() {
  const grid = document.getElementById('tablesGrid');
  if (!grid) return;
  let html = '';
  for (let i = 1; i <= 24; i++) {
    const isSelected = String(i) === String(currentTable);
    html += `
      <button class="table-btn ${isSelected ? 'selected' : ''}" onclick="selectExactTable('${i}')">
        ${i}
      </button>
    `;
  }
  grid.innerHTML = html;
}

function selectExactTable(tableNum) {
  currentTable = String(tableNum);
  updateTableUI();
  renderTablesGrid();
  closeTableModal();
  showToast(`Stol raqami #${currentTable} ga o'zgartirildi!`);
}

function setCustomTable() {
  const val = document.getElementById('customTableInput').value.trim();
  if (val && parseInt(val) > 0) {
    selectExactTable(val);
  }
}

// ================= MODAL CONTROLLERS =================
function openCartModal() {
  renderCartSheetList();
  const el = document.getElementById('cartModalBackdrop');
  if (el) el.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCartModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('sheet-close-btn')) return;
  const el = document.getElementById('cartModalBackdrop');
  if (el) el.classList.remove('active');
  document.body.style.overflow = '';
}

function openTableModal() {
  renderTablesGrid();
  const el = document.getElementById('tableModalBackdrop');
  if (el) el.classList.add('active');
}

function closeTableModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('sheet-close-btn')) return;
  const el = document.getElementById('tableModalBackdrop');
  if (el) el.classList.remove('active');
}

function openWaiterModal() {
  const el = document.getElementById('waiterModalBackdrop');
  if (el) el.classList.add('active');
}

function closeWaiterModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('sheet-close-btn')) return;
  const el = document.getElementById('waiterModalBackdrop');
  if (el) el.classList.remove('active');
}

// Poster viewer
function viewPoster(src, title) {
  const img = document.getElementById('posterModalImg');
  const t = document.getElementById('posterModalTitle');
  const el = document.getElementById('posterModalBackdrop');
  if (img) img.src = src;
  if (t) t.textContent = title;
  if (el) el.classList.add('active');
}

function closePosterModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('sheet-close-btn')) return;
  const el = document.getElementById('posterModalBackdrop');
  if (el) el.classList.remove('active');
}

// ================= SEARCH & CATEGORY LISTENERS =================
function setupEventListeners() {
  const tabs = document.querySelectorAll('.cat-pill');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.cat;
      renderMenu();
    });
  });

  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearchBtn');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (clearBtn) {
        clearBtn.style.display = searchInput.value.trim().length > 0 ? 'flex' : 'none';
      }
      renderMenu();
    });
  }
}

function clearSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  renderMenu();
}

// Toast
let toastTimeout;
function showToast(message, type = 'success') {
  const toast = document.getElementById('nfcToast');
  const msgEl = document.getElementById('toastMsg');
  const iconEl = document.getElementById('toastIcon');

  if (!toast || !msgEl || !iconEl) return;

  msgEl.textContent = message;
  if (type === 'error') {
    iconEl.className = 'fas fa-exclamation-circle';
    iconEl.style.color = '#FF5252';
  } else {
    iconEl.className = 'fas fa-check-circle';
    iconEl.style.color = '#4CAF50';
  }

  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
