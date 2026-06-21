/* =====================================================
   VINCESLINK SUPERSTORE — CART SYSTEM
   =====================================================
   Handles: add/remove via heart (.btn-wishlist, .dt-small-wish,
   .dt-hero-wish) and plus (.card__plus) buttons, badge state
   (bait "3" / empty "0" / active count), slide-in cart panel,
   quantity adjustment inside panel, refresh-recovery prompt,
   and WhatsApp order handoff.

   Storage key: 'vl_cart' in localStorage.
   Cart item shape: { id, name, price, qty }
   price is stored as a NUMBER (naira, no symbol) for math;
   display formatting happens at render time.
   ===================================================== */

(function () {
  'use strict';

  /* ---------- CONFIG ---------- */
  const WHATSAPP_NUMBER = '2349078683552'; // Vinceslink Superstore customer service
  const STORAGE_KEY = 'vl_cart';
  const SESSION_FLAG_KEY = 'vl_cart_session_started'; // tracks whether intro popup was dismissed this "session"

  /* ---------- STATE ---------- */
  let cart = []; // [{ id, name, price, qty }]

  /* ---------- UTIL ---------- */
  function parsePrice(text) {
    if (!text) return 0;
    // strips ₦, commas, spaces -> "₦9,500" => 9500
    const cleaned = text.replace(/[^\d.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  function formatPrice(num) {
    return '₦' + num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function findItem(id) {
    return cart.find(item => item.id === id);
  }

  /* ---------- BADGE ---------- */
  function getBadgeEls() {
    return document.querySelectorAll('.cart-badge');
  }

  function updateBadge() {
    const badges = getBadgeEls();
    const sessionStarted = sessionStorage.getItem(SESSION_FLAG_KEY);

    if (!sessionStarted && cart.length === 0) {
      // Bait state: nothing happened yet this session, cart is empty
      badges.forEach(b => { b.textContent = '3'; b.style.display = ''; });
      return;
    }

    // Active/empty state: show real distinct-product count
    const count = cart.length;
    badges.forEach(b => {
      b.textContent = String(count);
      b.style.display = '';
    });
  }

  function markSessionStarted() {
    sessionStorage.setItem(SESSION_FLAG_KEY, '1');
  }

  function isBaitState() {
    return !sessionStorage.getItem(SESSION_FLAG_KEY) && cart.length === 0;
  }

  /* ---------- TOGGLE STATE ON SOURCE BUTTONS ---------- */
  // Re-applies visual "added" state to every button matching a product id
  // (keeps mobile/desktop versions of the same product in sync, and
  // restores state correctly after a page reload).
  function syncButtonsForId(id, isAdded) {
    const heartButtons = document.querySelectorAll(
      `.btn-wishlist-hot[data-product-id="${id}"], .dt-small-wish[data-product-id="${id}"], .dt-hero-wish[data-product-id="${id}"]`
    );
    heartButtons.forEach(btn => btn.classList.toggle('liked', isAdded));

    const plusButtons = document.querySelectorAll(`.card__plus[data-product-id="${id}"]`);
    plusButtons.forEach(btn => btn.classList.toggle('added', isAdded));
  }

  function syncAllButtonsFromCart() {
    const allTrigger = document.querySelectorAll(
      '.btn-wishlist-hot[data-product-id], .dt-small-wish[data-product-id], .dt-hero-wish[data-product-id], .card__plus[data-product-id]'
    );
    allTrigger.forEach(btn => {
      const id = btn.dataset.productId;
      const inCart = !!findItem(id);
      if (btn.classList.contains('btn-wishlist-hot') || btn.classList.contains('dt-small-wish') || btn.classList.contains('dt-hero-wish')) {
        btn.classList.toggle('liked', inCart);
      } else {
        btn.classList.toggle('added', inCart);
      }
    });
  }

  /* ---------- TOAST (fade-in confirmation text) ---------- */
  let toastTimer = null;
  function showToast(message) {
    let toast = document.getElementById('vl-cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'vl-cart-toast';
      toast.className = 'vl-cart-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('vl-toast-show');
    void toast.offsetWidth; // restart animation
    toast.classList.add('vl-toast-show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('vl-toast-show');
    }, 2200);
  }

  /* ---------- ADD / REMOVE FROM CART ---------- */
  function addItem(id, name, price) {
    if (findItem(id)) return; // already in cart, ignore (card-level is binary)
    cart.push({ id, name, price, qty: 1 });
    saveCart();
    updateBadge();
    showToast(`${name} added to your cart`);
  }

  function removeItem(id, name) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateBadge();
    syncButtonsForId(id, false);
    if (name) showToast(`${name} removed from your cart`);
    renderCartPanel(); // keep panel list in sync if open
  }

  function changeQty(id, delta) {
    const item = findItem(id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      removeItem(id, item.name);
      return;
    }
    saveCart();
    renderCartPanel();
  }

  /* ---------- CONFETTI BURST (for .card__plus buttons that have it) ---------- */
  function fireConfetti(btn) {
    const card = btn.closest('.card-hot, .dt-small-card, .dt-hero-card, .card-shell, .product-card');
    if (!card) return;
    const confettiEl = card.querySelector('.confetti-wrap');
    if (!confettiEl) return;

    confettiEl.style.left = (btn.offsetLeft + btn.offsetWidth / 2) + 'px';
    confettiEl.style.top = (btn.offsetTop + btn.offsetHeight / 2) + 'px';
    confettiEl.classList.remove('burst');
    void confettiEl.offsetWidth; // restart animation
    confettiEl.classList.add('burst');
    setTimeout(() => confettiEl.classList.remove('burst'), 900);
  }

  /* ---------- TOGGLE HANDLER FOR HEART / PLUS BUTTONS ---------- */
  // cart.js is the SINGLE source of truth for the .added / .liked class.
  // Do not let any other script (e.g. an old initCartBtn) also toggle these
  // classes on the same button — two listeners racing to toggle the same
  // class is exactly what causes the button to silently flip back off.
  function handleToggleClick(btn) {
    const id = btn.dataset.productId;
    if (!id) return; // safety: button without an id does nothing to the cart

    const card = btn.closest('.card-hot, .dt-small-card, .dt-hero-card, .card-shell, .product-card');
    if (!card) return;

    const nameEl = card.querySelector('.product-name-hot, .dt-small-name, .dt-hero-name, .card__title, .product-name');
    const priceEl = card.querySelector('.price-current-hot, .dt-small-price, .dt-hero-price-current, .card__price-new, .price-current');

    const name = nameEl ? nameEl.textContent.trim() : 'Product';
    const price = priceEl ? parsePrice(priceEl.textContent) : 0;

    const alreadyIn = !!findItem(id);

    if (alreadyIn) {
      removeItem(id, name);
    } else {
      // First-ever interaction this session: dismiss bait state silently
      if (isBaitState()) markSessionStarted();
      addItem(id, name, price);
      if (btn.classList.contains('card__plus')) fireConfetti(btn);
    }

    syncButtonsForId(id, !alreadyIn);
  }

  function wireTriggerButtons() {
    document.querySelectorAll(
      '.btn-wishlist-hot[data-product-id], .dt-small-wish[data-product-id], .dt-hero-wish[data-product-id], .card__plus[data-product-id]'
    ).forEach(btn => {
      // Avoid double-binding if this runs more than once
      if (btn.dataset.vlBound) return;
      btn.dataset.vlBound = '1';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleToggleClick(btn);
      });
    });
  }

  /* ---------- CART PANEL (slide-in) ---------- */
  function ensureCartPanel() {
    if (document.getElementById('vl-cart-panel')) return;

    const overlay = document.createElement('div');
    overlay.id = 'vl-cart-overlay';
    overlay.className = 'vl-cart-overlay';
    overlay.addEventListener('click', closeCartPanel);

    const panel = document.createElement('div');
    panel.id = 'vl-cart-panel';
    panel.className = 'vl-cart-panel';
    panel.innerHTML = `
      <div class="vl-cart-header">
        <h3>Your Cart</h3>
        <button class="vl-cart-close" aria-label="Close cart">&times;</button>
      </div>
      <div class="vl-cart-body" id="vl-cart-body"></div>
      <div class="vl-cart-footer" id="vl-cart-footer"></div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    panel.querySelector('.vl-cart-close').addEventListener('click', closeCartPanel);
  }

  function openCartPanel() {
    ensureCartPanel();
    renderCartPanel();
    document.getElementById('vl-cart-overlay').classList.add('open');
    document.getElementById('vl-cart-panel').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCartPanel() {
    const overlay = document.getElementById('vl-cart-overlay');
    const panel = document.getElementById('vl-cart-panel');
    if (overlay) overlay.classList.remove('open');
    if (panel) panel.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderCartPanel() {
    const body = document.getElementById('vl-cart-body');
    const footer = document.getElementById('vl-cart-footer');
    if (!body || !footer) return;

    if (cart.length === 0) {
      body.innerHTML = `<p class="vl-cart-empty">Your cart is empty. Add products to calculate your order.</p>`;
      footer.innerHTML = '';
      return;
    }

    let rows = '';
    let total = 0;
    cart.forEach((item, idx) => {
      const lineTotal = item.price * item.qty;
      total += lineTotal;
      rows += `
        <div class="vl-cart-row" data-id="${item.id}">
          <span class="vl-cart-sn">${idx + 1}</span>
          <span class="vl-cart-name">${item.name}</span>
          <span class="vl-cart-price">${formatPrice(lineTotal)}${item.qty > 1 ? ` <small>(${item.qty}x)</small>` : ''}</span>
          <span class="vl-cart-qty-controls">
            <button class="vl-qty-btn vl-qty-add" data-id="${item.id}" aria-label="Add one more">+</button>
            <button class="vl-qty-btn vl-qty-remove" data-id="${item.id}" aria-label="Remove one">&minus;</button>
          </span>
        </div>`;
    });

    body.innerHTML = rows;

    footer.innerHTML = `
      <button class="vl-add-more-btn">Add more products</button>
      <div class="vl-cart-total">Total: <strong>${formatPrice(total)}</strong></div>
      <button class="vl-order-btn">Order on WhatsApp</button>
    `;

    body.querySelectorAll('.vl-qty-add').forEach(b =>
      b.addEventListener('click', () => changeQty(b.dataset.id, +1))
    );
    body.querySelectorAll('.vl-qty-remove').forEach(b =>
      b.addEventListener('click', () => changeQty(b.dataset.id, -1))
    );

    footer.querySelector('.vl-add-more-btn').addEventListener('click', closeCartPanel);
    footer.querySelector('.vl-order-btn').addEventListener('click', sendWhatsAppOrder);
  }

  /* ---------- INTRO POPUP (bait state explanation) ---------- */
  function showIntroPopup() {
    if (document.getElementById('vl-intro-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'vl-intro-overlay';
    overlay.className = 'vl-cart-overlay open';

    const box = document.createElement('div');
    box.className = 'vl-intro-box';
    box.innerHTML = `
      <h3>Welcome to your Cart</h3>
      <p>Add products you like using the heart or + buttons. We'll calculate everything for you here, and you can place your order directly on WhatsApp — no account needed.</p>
      <button class="vl-intro-ok-btn">Got it</button>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    box.querySelector('.vl-intro-ok-btn').addEventListener('click', () => {
      overlay.remove();
      markSessionStarted();
      updateBadge();
    });
  }

  /* ---------- WHATSAPP ORDER ---------- */
  function sendWhatsAppOrder() {
    if (cart.length === 0) return;

    let lines = ['Hi, I want to order:'];
    let total = 0;
    cart.forEach(item => {
      const lineTotal = item.price * item.qty;
      total += lineTotal;
      lines.push(`${item.name}${item.qty > 1 ? ` x${item.qty}` : ''} - ${formatPrice(lineTotal)}`);
    });
    lines.push(`Total: ${formatPrice(total)}`);

    const message = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(url, '_blank');

    // Clear cart after order is sent
    cart = [];
    saveCart();
    syncAllButtonsFromCart();
    updateBadge();
    closeCartPanel();
  }

  /* ---------- REFRESH RECOVERY PROMPT ---------- */
  function maybeShowRefreshPrompt() {
    const stored = loadCart();
    if (stored.length === 0) {
      cart = [];
      return; // nothing to recover, just proceed normally
    }

    // There's saved cart data from a previous visit/refresh — ask the user
    const overlay = document.createElement('div');
    overlay.id = 'vl-refresh-overlay';
    overlay.className = 'vl-cart-overlay open';

    const box = document.createElement('div');
    box.className = 'vl-intro-box';
    box.innerHTML = `
      <h3>Welcome back</h3>
      <p>You had ${stored.length} product${stored.length > 1 ? 's' : ''} in your cart. Would you like to keep them, or start fresh?</p>
      <div class="vl-refresh-actions">
        <button class="vl-keep-btn">Keep my cart</button>
        <button class="vl-fresh-btn">Start afresh</button>
      </div>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    box.querySelector('.vl-keep-btn').addEventListener('click', () => {
      cart = stored;
      markSessionStarted(); // keeping a cart means they're past the bait stage
      overlay.remove();
      syncAllButtonsFromCart();
      updateBadge();
    });

    box.querySelector('.vl-fresh-btn').addEventListener('click', () => {
      cart = [];
      saveCart();
      sessionStorage.removeItem(SESSION_FLAG_KEY); // back to bait state
      overlay.remove();
      syncAllButtonsFromCart();
      updateBadge();
    });
  }

  /* ---------- CART ICON CLICK ---------- */
  function wireCartIcons() {
    document.querySelectorAll('.nav-cart-icon, .cart-btn').forEach(btn => {
      if (btn.dataset.vlBound) return;
      btn.dataset.vlBound = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (isBaitState()) {
          showIntroPopup();
          return;
        }
        openCartPanel();
      });
    });
  }

  /* ---------- INIT ---------- */
  function init() {
    // Decide initial cart state: either recover prompt (cart had items
    // from a previous session) or just start clean.
    const stored = loadCart();
    if (stored.length > 0) {
      maybeShowRefreshPrompt(); // will populate `cart` once user answers
    } else {
      cart = [];
    }

    wireTriggerButtons();
    wireCartIcons();
    syncAllButtonsFromCart();
    updateBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
