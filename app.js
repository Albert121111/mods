const INITIAL_BUDGET = 62_448_565_000_000;
const STORAGE_KEY = "musk-spend-game-rub-v1";
const THEME_KEY = "musk-spend-theme";

const state = {
  balance: INITIAL_BUDGET,
  quantities: {},
  category: "Все",
  sort: "cheap",
  search: "",
  milestones: new Set()
};

const els = {
  balance: document.querySelector("#balance"),
  balancePanel: document.querySelector("#balance-panel"),
  progressFill: document.querySelector("#progress-fill"),
  progressText: document.querySelector("#progress-text"),
  remainingNote: document.querySelector("#remaining-note"),
  spentStat: document.querySelector("#spent-stat"),
  itemsStat: document.querySelector("#items-stat"),
  expensiveStat: document.querySelector("#expensive-stat"),
  expensivePrice: document.querySelector("#expensive-price"),
  percentStat: document.querySelector("#percent-stat"),
  productsGrid: document.querySelector("#products-grid"),
  categoryChips: document.querySelector("#category-chips"),
  visibleCount: document.querySelector("#visible-count"),
  searchInput: document.querySelector("#search-input"),
  sortSelect: document.querySelector("#sort-select"),
  themeToggle: document.querySelector("#theme-toggle"),
  resetButton: document.querySelector("#reset-button"),
  finalResetButton: document.querySelector("#final-reset-button"),
  clearSaveButton: document.querySelector("#clear-save-button"),
  finale: document.querySelector("#finale"),
  emptyState: document.querySelector("#empty-state"),
  toastRegion: document.querySelector("#toast-region"),
  confettiLayer: document.querySelector("#confetti-layer")
};

function formatCompactNumber(value) {
  const units = [
    { value: 1e18, label: "квинтлн" },
    { value: 1e15, label: "квадрлн" },
    { value: 1e12, label: "трлн" },
    { value: 1e9, label: "млрд" },
    { value: 1e6, label: "млн" },
    { value: 1e3, label: "тыс" }
  ];
  const unit = units.find((item) => Math.abs(value) >= item.value);
  if (!unit) return Math.round(value).toLocaleString("ru-RU");

  const scaled = value / unit.value;
  const maximumFractionDigits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return `${scaled.toLocaleString("ru-RU", { maximumFractionDigits })} ${unit.label}`;
}

function formatMoney(value) {
  return `${formatCompactNumber(value)} ₽`;
}

const categoryArtwork = {
  "Еда и мелочи": `
    <path d="M52 84h96c0 27-18 44-48 44S52 111 52 84Z" fill="none" stroke="currentColor" stroke-width="8"/>
    <path d="M62 72c10-21 66-21 76 0H62Z" fill="currentColor" opacity=".9"/>
    <path d="M73 58c9-10 45-10 54 0" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
    <path d="M67 98h66" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>`,
  "Техника": `
    <rect x="48" y="43" width="104" height="73" rx="10" fill="none" stroke="currentColor" stroke-width="8"/>
    <path d="M36 132h128l-13 14H49l-13-14Z" fill="currentColor" opacity=".9"/>
    <circle cx="100" cy="80" r="17" fill="none" stroke="currentColor" stroke-width="7"/>
    <path d="M100 57v-9m0 64v-9m23-23h9m-64 0h9m39-16 7-7m-46 46 7-7m32 0 7 7M77 57l7 7" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`,
  "Транспорт": `
    <path d="M43 112h114l-9-31-24-18H75L55 81l-12 31Z" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="round"/>
    <path d="M70 82h61M40 112h120" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
    <circle cx="67" cy="119" r="13" fill="currentColor"/>
    <circle cx="135" cy="119" r="13" fill="currentColor"/>`,
  "Недвижимость": `
    <path d="M46 143V68l54-35 54 35v75H46Z" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="round"/>
    <path d="M80 143v-38h40v38M72 77h18v18H72zm38 0h18v18h-18z" fill="currentColor"/>
    <path d="M36 143h128" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>`,
  "Бизнес": `
    <rect x="43" y="54" width="114" height="88" rx="12" fill="none" stroke="currentColor" stroke-width="8"/>
    <path d="M75 54V41h50v13M43 83h114M86 78v11h28V78" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round"/>
    <path d="M70 116h19m22 0h19" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>`,
  "Космос": `
    <path d="M100 31c25 19 32 53 18 84l-18 22-18-22c-14-31-7-65 18-84Z" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="round"/>
    <circle cx="100" cy="76" r="14" fill="currentColor"/>
    <path d="m82 107-24 25 26 2m34-27 24 25-26 2M100 139v18m-13-13-7 14m33-14 7 14" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  "Безумные покупки": `
    <path d="m100 29 13 38 40-7-30 27 27 31-40-9-10 40-10-40-40 9 27-31-30-27 40 7 13-38Z" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="round"/>
    <circle cx="100" cy="88" r="18" fill="currentColor"/>
    <path d="M42 35l10 10m96-10-10 10M43 145l12-12m90 12-12-12" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>`
};

const categoryColors = {
  "Еда и мелочи": ["#f59e0b", "#f97316"],
  "Техника": ["#0ea5e9", "#6366f1"],
  "Транспорт": ["#ef4444", "#f97316"],
  "Недвижимость": ["#14b8a6", "#22c55e"],
  "Бизнес": ["#8b5cf6", "#d946ef"],
  "Космос": ["#2563eb", "#7c3aed"],
  "Безумные покупки": ["#ec4899", "#f59e0b"]
};

function escapeSvgText(text) {
  return text.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
  })[char]);
}

function productArtwork(product) {
  const [start, end] = categoryColors[product.category];
  const title = escapeSvgText(product.name.length > 24 ? `${product.name.slice(0, 22)}...` : product.name);
  const shape = categoryArtwork[product.category];
  const seed = product.id * 37;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 260" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="${start}"/><stop offset="1" stop-color="${end}"/>
        </linearGradient>
        <filter id="s"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-opacity=".22"/></filter>
      </defs>
      <rect width="420" height="260" rx="30" fill="url(#g)"/>
      <circle cx="${335 + seed % 55}" cy="${24 + seed % 38}" r="${72 + seed % 34}" fill="#fff" opacity=".10"/>
      <circle cx="${30 + seed % 48}" cy="${198 + seed % 35}" r="${45 + seed % 25}" fill="#fff" opacity=".09"/>
      <path d="M0 210C90 160 145 247 235 195s130-30 185-66v131H0Z" fill="#07130b" opacity=".12"/>
      <g transform="translate(205 14) scale(.72)" color="#fff" opacity=".96" filter="url(#s)">${shape}</g>
      <rect x="22" y="183" width="376" height="55" rx="16" fill="#07130b" opacity=".22"/>
      <text x="40" y="216" fill="#fff" font-size="22" font-family="Arial, sans-serif" font-weight="700">${title}</text>
      <text x="40" y="47" fill="#fff" opacity=".74" font-size="11" font-family="Arial, sans-serif" font-weight="700" letter-spacing="1.6">${escapeSvgText(product.category.toUpperCase())}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function loadGame() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    const quantities = parsed.quantities && typeof parsed.quantities === "object" ? parsed.quantities : {};
    const spent = PRODUCTS.reduce((sum, product) => {
      const quantity = Math.max(0, Math.floor(Number(quantities[product.id]) || 0));
      state.quantities[product.id] = quantity;
      return sum + product.price * quantity;
    }, 0);
    state.balance = Math.max(0, INITIAL_BUDGET - Math.min(INITIAL_BUDGET, spent));
    state.milestones = new Set(Array.isArray(parsed.milestones) ? parsed.milestones : []);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    quantities: state.quantities,
    milestones: [...state.milestones]
  }));
}

function getStats() {
  const spent = INITIAL_BUDGET - state.balance;
  const totalItems = Object.values(state.quantities).reduce((sum, quantity) => sum + quantity, 0);
  const purchased = PRODUCTS.filter((product) => (state.quantities[product.id] || 0) > 0);
  const mostExpensive = purchased.sort((a, b) => b.price - a.price)[0] || null;
  const percent = (spent / INITIAL_BUDGET) * 100;
  return { spent, totalItems, mostExpensive, percent };
}

function renderCategories() {
  els.categoryChips.innerHTML = CATEGORIES.map((category) => `
    <button class="category-chip ${state.category === category ? "active" : ""}" data-category="${category}" type="button">
      ${category}
    </button>
  `).join("");
}

function getVisibleProducts() {
  const query = state.search.trim().toLocaleLowerCase("ru");
  const filtered = PRODUCTS.filter((product) => {
    const matchesCategory = state.category === "Все" || product.category === state.category;
    const matchesSearch = !query || `${product.name} ${product.description} ${product.category}`.toLocaleLowerCase("ru").includes(query);
    return matchesCategory && matchesSearch;
  });

  return filtered.sort((a, b) => {
    if (state.sort === "expensive") return b.price - a.price;
    if (state.sort === "popular") return b.popularity - a.popularity || a.price - b.price;
    if (state.sort === "crazy") return b.crazy - a.crazy || b.price - a.price;
    return a.price - b.price;
  });
}

function renderProducts() {
  const products = getVisibleProducts();
  els.visibleCount.textContent = products.length;
  els.emptyState.classList.toggle("hidden", products.length > 0);
  els.productsGrid.innerHTML = products.map((product) => {
    const quantity = state.quantities[product.id] || 0;
    const canBuy = state.balance >= product.price;
    return `
      <article class="product-card ${quantity ? "owned" : ""}" data-id="${product.id}">
        <div class="product-topline">
          <span class="category-label">${product.category}</span>
          <span class="crazy-level" title="Уровень безумия">✦ ${product.crazy}/10</span>
        </div>
        <div class="product-visual">
          <img src="${productArtwork(product)}" alt="${product.name}" loading="lazy" />
        </div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <strong class="product-price">${formatMoney(product.price)}</strong>
        </div>
        <div class="quantity-row">
          <button class="action-button sell" data-action="sell" ${quantity === 0 ? "disabled" : ""} type="button">Продать</button>
          <div class="quantity"><span>Куплено</span><strong>${formatCompactNumber(quantity)}</strong></div>
          <button class="action-button buy" data-action="buy" ${!canBuy ? "disabled" : ""} type="button">Купить</button>
        </div>
        <button class="max-button" data-action="max" ${!canBuy ? "disabled" : ""} type="button">
          Купить максимум <span>${canBuy ? `×${formatCompactNumber(Math.floor(state.balance / product.price))}` : "Недоступно"}</span>
        </button>
      </article>
    `;
  }).join("");
}

function renderStats() {
  const { spent, totalItems, mostExpensive, percent } = getStats();
  const displayPercent = percent < 0.01 && percent > 0 ? "< 0,01%" : `${percent.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}%`;

  els.balance.textContent = formatMoney(state.balance);
  els.spentStat.textContent = formatMoney(spent);
  els.itemsStat.textContent = formatCompactNumber(totalItems);
  els.percentStat.textContent = displayPercent;
  els.progressText.textContent = `Потрачено ${displayPercent}`;
  els.progressFill.style.width = `${Math.min(100, percent)}%`;
  els.balancePanel.classList.toggle("hot", percent >= 90);
  els.finale.classList.toggle("hidden", percent < 99);

  if (percent >= 99) els.remainingNote.textContent = "Финиш уже рядом";
  else if (percent >= 90) els.remainingNote.textContent = "Осталось совсем немного";
  else if (percent >= 50) els.remainingNote.textContent = "Половина состояния позади";
  else if (percent > 0) els.remainingNote.textContent = "Илон начинает волноваться";
  else els.remainingNote.textContent = "Приключение начинается";

  if (mostExpensive) {
    els.expensiveStat.textContent = mostExpensive.name;
    els.expensivePrice.textContent = formatMoney(mostExpensive.price);
  } else {
    els.expensiveStat.textContent = "Пока ничего";
    els.expensivePrice.textContent = "Начни с чего-нибудь";
  }
}

function render() {
  renderCategories();
  renderProducts();
  renderStats();
}

function showToast(message, type = "buy") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  els.toastRegion.append(toast);
  setTimeout(() => toast.remove(), 2200);
}

function animateBalance(type) {
  els.balance.classList.remove("balance-buy", "balance-sell");
  void els.balance.offsetWidth;
  els.balance.classList.add(type === "buy" ? "balance-buy" : "balance-sell");
}

function purchase(product, amount = 1) {
  const affordable = Math.floor(state.balance / product.price);
  const quantity = Math.max(0, Math.min(amount, affordable));
  if (!quantity) {
    showToast("На это уже не хватает денег", "warning");
    return;
  }
  state.quantities[product.id] = (state.quantities[product.id] || 0) + quantity;
  state.balance -= product.price * quantity;
  animateBalance("buy");
  showToast(quantity === 1 ? `Куплено: ${product.name}` : `Куплено ${formatCompactNumber(quantity)} × ${product.name}`);
  afterTransaction();
}

function sell(product) {
  const quantity = state.quantities[product.id] || 0;
  if (!quantity) return;
  state.quantities[product.id] = quantity - 1;
  state.balance += product.price;
  animateBalance("sell");
  showToast(`Продано: ${product.name}`, "sell");
  afterTransaction();
}

function afterTransaction() {
  saveGame();
  checkMilestones();
  render();
}

function checkMilestones() {
  const percent = getStats().percent;
  [50, 90, 99].forEach((milestone) => {
    if (percent >= milestone && !state.milestones.has(milestone)) {
      state.milestones.add(milestone);
      launchConfetti(milestone >= 99 ? 120 : 70);
      showToast(`Потрачено ${milestone}% состояния!`, "milestone");
    }
  });
}

function launchConfetti(count) {
  const colors = ["#22c55e", "#86efac", "#facc15", "#38bdf8", "#fb7185", "#ffffff"];
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement("i");
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.setProperty("--fall", `${70 + Math.random() * 50}vh`);
    piece.style.setProperty("--drift", `${-120 + Math.random() * 240}px`);
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.animationDuration = `${1.8 + Math.random() * 1.8}s`;
    els.confettiLayer.append(piece);
    setTimeout(() => piece.remove(), 4000);
  }
}

function resetGame(clearSave = false) {
  state.balance = INITIAL_BUDGET;
  state.quantities = {};
  state.milestones = new Set();
  if (clearSave) localStorage.removeItem(STORAGE_KEY);
  else saveGame();
  render();
  showToast(clearSave ? "Сохранение очищено" : "Игра сброшена", "sell");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  els.themeToggle.textContent = theme === "dark" ? "☀" : "☾";
  localStorage.setItem(THEME_KEY, theme);
}

els.productsGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  const card = event.target.closest("[data-id]");
  if (!button || !card) return;
  const product = PRODUCTS.find((item) => item.id === Number(card.dataset.id));
  if (!product) return;

  if (button.dataset.action === "buy") purchase(product);
  if (button.dataset.action === "max") purchase(product, Math.floor(state.balance / product.price));
  if (button.dataset.action === "sell") sell(product);
});

els.categoryChips.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderCategories();
  renderProducts();
});

els.searchInput.addEventListener("input", () => {
  state.search = els.searchInput.value;
  renderProducts();
});

els.sortSelect.addEventListener("change", () => {
  state.sort = els.sortSelect.value;
  renderProducts();
});

els.themeToggle.addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

els.resetButton.addEventListener("click", () => resetGame(false));
els.finalResetButton.addEventListener("click", () => resetGame(false));
els.clearSaveButton.addEventListener("click", () => resetGame(true));

loadGame();
setTheme(localStorage.getItem(THEME_KEY) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
render();
