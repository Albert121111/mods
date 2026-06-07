const INITIAL_BUDGET = 850_000_000_000;
const STORAGE_KEY = "musk-spend-game-v1";
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

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

function formatMoney(value) {
  return moneyFormatter.format(value);
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
        <div class="product-visual"><span>${product.emoji}</span></div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <strong class="product-price">${formatMoney(product.price)}</strong>
        </div>
        <div class="quantity-row">
          <button class="action-button sell" data-action="sell" ${quantity === 0 ? "disabled" : ""} type="button">Продать</button>
          <div class="quantity"><span>Куплено</span><strong>${quantity.toLocaleString("ru-RU")}</strong></div>
          <button class="action-button buy" data-action="buy" ${!canBuy ? "disabled" : ""} type="button">Купить</button>
        </div>
        <button class="max-button" data-action="max" ${!canBuy ? "disabled" : ""} type="button">
          Купить максимум <span>${canBuy ? `×${Math.floor(state.balance / product.price).toLocaleString("ru-RU")}` : "Недоступно"}</span>
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
  els.itemsStat.textContent = totalItems.toLocaleString("ru-RU");
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
  showToast(quantity === 1 ? `Куплено: ${product.name}` : `Куплено ${quantity.toLocaleString("ru-RU")} × ${product.name}`);
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
