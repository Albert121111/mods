const THEME_KEY = "musk-spend-theme";
const CURRENCY_KEY = "musk-spend-currency";
const USD_TO_RUB = 72.7479;
const ELON_NET_WORTH_USD = 1_400_000_000_000;
const ELON_NET_WORTH_RUB = Math.round(ELON_NET_WORTH_USD * USD_TO_RUB);

const PROFILES = {
  elon: {
    budget: ELON_NET_WORTH_RUB,
    avatar: "assets/avatar/elon-cutout.png",
    name: "Илона Маска",
    shortName: "Илон Маск",
    initials: "EM",
    eyebrow: "Интерактивный финансовый эксперимент",
    description: "У тебя есть состояние технологического миллиардера. Покупай кофе, компании, ракеты и совершенно необязательные порталы на Марс.",
    caption: "из состояния Илона Маска"
  },
  paradeev1ch: {
    budget: 30_000_000,
    avatar: "assets/avatar/paradeev1ch-photo.png?v=15",
    name: "paradeev1ch",
    shortName: "paradeev1ch",
    initials: "P1",
    eyebrow: "Условный бюджет стримера",
    description: "Потрать игровой бюджет стримера на технику, транспорт, недвижимость и покупки для самого громкого эфира.",
    caption: "из условного бюджета paradeev1ch"
  },
  kyertov: {
    budget: 158_000_000,
    avatar: "assets/avatar/kyertov-photo.png?v=15",
    name: "Влада Куертова",
    shortName: "Kyertov",
    initials: "VK",
    eyebrow: "Условный бюджет бизнесмена",
    description: "Распредели игровой капитал Kyertov между технологиями, бизнесом, недвижимостью и по-настоящему смелыми идеями.",
    caption: "из условного бюджета Kyertov"
  }
};

function getProfileId() {
  const id = location.hash.slice(1).toLowerCase();
  return PROFILES[id] ? id : "elon";
}

const state = {
  profileId: getProfileId(),
  balance: 0,
  quantities: {},
  category: "Все",
  sort: "cheap",
  search: "",
  currency: localStorage.getItem(CURRENCY_KEY) === "USD" ? "USD" : "RUB",
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
  currencyToggle: document.querySelector("#currency-toggle"),
  themeToggle: document.querySelector("#theme-toggle"),
  resetButton: document.querySelector("#reset-button"),
  finalResetButton: document.querySelector("#final-reset-button"),
  clearSaveButton: document.querySelector("#clear-save-button"),
  finale: document.querySelector("#finale"),
  emptyState: document.querySelector("#empty-state"),
  toastRegion: document.querySelector("#toast-region"),
  confettiLayer: document.querySelector("#confetti-layer"),
  profilePortrait: document.querySelector("#profile-portrait"),
  portraitPhoto: document.querySelector(".portrait-photo"),
  portraitInitials: document.querySelector("#portrait-initials"),
  profileName: document.querySelector("#profile-name"),
  heroEyebrow: document.querySelector("#hero-eyebrow"),
  heroDescription: document.querySelector("#hero-description"),
  spentCaption: document.querySelector("#spent-caption"),
  finaleTitle: document.querySelector("#finale-title")
};

function currentProfile() {
  return PROFILES[state.profileId];
}

function storageKey() {
  return `spend-game-rub-v2-${state.profileId}`;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("ru-RU");
}

function formatUsd(valueRub) {
  const dollars = valueRub / USD_TO_RUB;
  const maximumFractionDigits = dollars < 1_000 ? 2 : dollars < 100_000 ? 1 : 0;
  return `$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: dollars < 1_000 ? 2 : 0,
    maximumFractionDigits
  })}`;
}

function formatMoney(valueRub) {
  if (state.currency === "USD") return formatUsd(valueRub);
  return `${formatNumber(valueRub)} ₽`;
}

function productPhoto(product) {
  return `assets/products/${product.id}.jpg`;
}

function loadGame() {
  state.balance = currentProfile().budget;
  state.quantities = {};
  state.milestones = new Set();
  const saved = localStorage.getItem(storageKey());
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    const quantities = parsed.quantities && typeof parsed.quantities === "object" ? parsed.quantities : {};
    const spent = PRODUCTS.reduce((sum, product) => {
      const quantity = Math.max(0, Math.floor(Number(quantities[product.id]) || 0));
      state.quantities[product.id] = quantity;
      return sum + product.price * quantity;
    }, 0);
    state.balance = Math.max(0, currentProfile().budget - Math.min(currentProfile().budget, spent));
    state.milestones = new Set(Array.isArray(parsed.milestones) ? parsed.milestones : []);
  } catch {
    localStorage.removeItem(storageKey());
  }
}

function saveGame() {
  localStorage.setItem(storageKey(), JSON.stringify({
    quantities: state.quantities,
    milestones: [...state.milestones]
  }));
}

function getStats() {
  const spent = currentProfile().budget - state.balance;
  const totalItems = Object.values(state.quantities).reduce((sum, quantity) => sum + quantity, 0);
  const purchased = PRODUCTS.filter((product) => (state.quantities[product.id] || 0) > 0);
  const mostExpensive = purchased.sort((a, b) => b.price - a.price)[0] || null;
  const percent = (spent / currentProfile().budget) * 100;
  return { spent, totalItems, mostExpensive, percent };
}

function renderCategories() {
  els.categoryChips.innerHTML = CATEGORIES.map((category) => `
    <button class="category-chip ${state.category === category ? "active" : ""}" data-category="${category}" type="button">
      ${category}
    </button>
  `).join("");
}

function renderProfile() {
  const profile = currentProfile();
  document.title = `Потрать деньги ${profile.name}`;
  els.profileName.textContent = profile.name;
  els.heroEyebrow.textContent = profile.eyebrow;
  els.heroDescription.textContent = profile.description;
  els.spentCaption.textContent = profile.caption;
  els.finaleTitle.textContent = `Ты почти потратил бюджет ${profile.name}!`;
  els.profilePortrait.classList.toggle("paradeev1ch", state.profileId === "paradeev1ch");
  els.profilePortrait.classList.toggle("kyertov", state.profileId === "kyertov");
  els.profilePortrait.setAttribute("aria-label", `Аватар ${profile.shortName}`);
  els.portraitPhoto.src = profile.avatar;
  els.portraitPhoto.alt = profile.shortName;
  els.portraitPhoto.classList.toggle("profile-cutout", state.profileId !== "elon");
  els.portraitPhoto.classList.remove("hidden");
  els.portraitInitials.classList.add("hidden");
  els.portraitInitials.textContent = profile.initials;
  document.querySelectorAll(".profile-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.profile === state.profileId);
  });
}

function renderCurrencyToggle() {
  els.currencyToggle.textContent = state.currency === "RUB" ? "Показать $" : "Показать ₽";
  els.currencyToggle.setAttribute("aria-label", state.currency === "RUB" ? "Показать суммы в долларах" : "Показать суммы в рублях");
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
          <img src="${productPhoto(product)}" alt="${product.name}" loading="lazy" referrerpolicy="no-referrer" />
          <span class="photo-source">Фото: Unsplash</span>
        </div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <strong class="product-price">${formatMoney(product.price)}</strong>
          <small class="price-note">${product.priceNote || "Ориентир рынка РФ/СНГ"}</small>
        </div>
        <div class="quantity-row">
          <button class="action-button sell" data-action="sell" ${quantity === 0 ? "disabled" : ""} type="button">Продать</button>
          <div class="quantity"><span>Куплено</span><strong>${formatNumber(quantity)}</strong></div>
          <button class="action-button buy" data-action="buy" ${!canBuy ? "disabled" : ""} type="button">Купить</button>
        </div>
        <div class="custom-buy-row">
          <input class="buy-amount" type="text" value="1" inputmode="numeric" pattern="[0-9 ]*" autocomplete="off" aria-label="Количество товара ${product.name}" />
          <button class="custom-buy-button" data-action="custom-buy" ${!canBuy ? "disabled" : ""} type="button">Купить указанное</button>
        </div>
        <button class="max-button" data-action="max" ${!canBuy ? "disabled" : ""} type="button">
          Купить максимум <span>${canBuy ? `×${formatNumber(Math.floor(state.balance / product.price))}` : "Недоступно"}</span>
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
  els.itemsStat.textContent = formatNumber(totalItems);
  els.percentStat.textContent = displayPercent;
  els.progressText.textContent = `Потрачено ${displayPercent}`;
  els.progressFill.style.width = `${Math.min(100, percent)}%`;
  els.balancePanel.classList.toggle("hot", percent >= 90);
  els.finale.classList.toggle("hidden", percent < 99);

  if (percent >= 99) els.remainingNote.textContent = "Финиш уже рядом";
  else if (percent >= 90) els.remainingNote.textContent = "Осталось совсем немного";
  else if (percent >= 50) els.remainingNote.textContent = "Половина состояния позади";
  else if (percent > 0) els.remainingNote.textContent = `${currentProfile().shortName} начинает волноваться`;
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
  renderProfile();
  renderCurrencyToggle();
  renderCategories();
  renderProducts();
  renderStats();
}

function getRequestedAmount(card) {
  const input = card?.querySelector(".buy-amount");
  const value = Math.floor(Number(input?.value.replace(/\s/g, "")));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function updateProductCard(card) {
  const product = PRODUCTS.find((item) => item.id === Number(card.dataset.id));
  if (!product) return;

  const quantity = state.quantities[product.id] || 0;
  const affordable = Math.floor(state.balance / product.price);
  const requested = getRequestedAmount(card);
  const canBuy = affordable > 0;

  card.classList.toggle("owned", quantity > 0);
  card.querySelector(".quantity strong").textContent = formatNumber(quantity);
  card.querySelector('[data-action="sell"]').disabled = quantity === 0;
  card.querySelector('[data-action="buy"]').disabled = !canBuy;
  card.querySelector('[data-action="custom-buy"]').disabled = !canBuy || requested === 0 || requested > affordable;

  const maxButton = card.querySelector('[data-action="max"]');
  maxButton.disabled = !canBuy;
  maxButton.querySelector("span").textContent = canBuy ? `×${formatNumber(affordable)}` : "Недоступно";
}

function updateVisibleProductCards() {
  els.productsGrid.querySelectorAll(".product-card").forEach(updateProductCard);
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
  const requested = Math.floor(Number(amount));
  if (!Number.isFinite(requested) || requested < 1) {
    showToast("Укажи корректное количество", "warning");
    return;
  }
  const quantity = Math.max(0, Math.min(requested, affordable));
  if (!quantity) {
    showToast("На это уже не хватает денег", "warning");
    return;
  }
  state.quantities[product.id] = (state.quantities[product.id] || 0) + quantity;
  state.balance -= product.price * quantity;
  animateBalance("buy");
  showToast(quantity === 1 ? `Куплено: ${product.name}` : `Куплено ${formatNumber(quantity)} × ${product.name}`);
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
  renderStats();
  updateVisibleProductCards();
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
  state.balance = currentProfile().budget;
  state.quantities = {};
  state.milestones = new Set();
  if (clearSave) localStorage.removeItem(storageKey());
  else saveGame();
  render();
  showToast(clearSave ? "Сохранение очищено" : "Игра сброшена", "sell");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function switchProfile(profileId) {
  if (!PROFILES[profileId] || profileId === state.profileId) return;
  state.profileId = profileId;
  history.replaceState(null, "", `#${profileId}`);
  loadGame();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  els.themeToggle.textContent = theme === "dark" ? "☀" : "☾";
  localStorage.setItem(THEME_KEY, theme);
}

function toggleCurrency() {
  state.currency = state.currency === "RUB" ? "USD" : "RUB";
  localStorage.setItem(CURRENCY_KEY, state.currency);
  renderCurrencyToggle();
  renderProducts();
  renderStats();
}

els.productsGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  const card = event.target.closest("[data-id]");
  if (!button || !card) return;
  const product = PRODUCTS.find((item) => item.id === Number(card.dataset.id));
  if (!product) return;

  if (button.dataset.action === "buy") purchase(product);
  if (button.dataset.action === "custom-buy") {
    const requested = getRequestedAmount(card);
    purchase(product, requested);
  }
  if (button.dataset.action === "max") purchase(product, Math.floor(state.balance / product.price));
  if (button.dataset.action === "sell") sell(product);
});

els.productsGrid.addEventListener("input", (event) => {
  if (!event.target.matches(".buy-amount")) return;
  updateProductCard(event.target.closest("[data-id]"));
});

document.querySelector(".profile-nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-profile]");
  if (button) switchProfile(button.dataset.profile);
});

window.addEventListener("hashchange", () => {
  const profileId = getProfileId();
  if (profileId !== state.profileId) switchProfile(profileId);
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

els.currencyToggle.addEventListener("click", toggleCurrency);
els.resetButton.addEventListener("click", () => resetGame(false));
els.finalResetButton.addEventListener("click", () => resetGame(false));
els.clearSaveButton.addEventListener("click", () => resetGame(true));

loadGame();
setTheme(localStorage.getItem(THEME_KEY) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
render();
