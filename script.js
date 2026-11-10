const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const dishes = [...document.querySelectorAll(".dish")];
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const emptyNote = document.querySelector(".filter-empty");
const trayList = document.querySelector(".tray-list");
const trayEmpty = document.querySelector(".tray-empty");
const trayTotal = document.querySelector(".tray-total");
const checkout = document.querySelector(".btn-checkout");
const toast = document.querySelector(".toast");

const cart = new Map();
let toastTimer = 0;

function closeNav() {
  navLinks.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open menu");
}

navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNav();
});

function applyFilter(category) {
  let shown = 0;
  dishes.forEach((dish) => {
    const match = category === "all" || dish.dataset.category === category;
    dish.classList.toggle("is-hidden", !match);
    if (match) shown += 1;
  });
  filterButtons.forEach((button) => {
    if (!button.matches("button")) return;
    button.classList.toggle("is-active", button.dataset.filter === category);
  });
  emptyNote.hidden = shown !== 0;
}

function scrollToId(id) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-nav")) closeNav();

  const filterTrigger = event.target.closest("[data-filter]");
  if (filterTrigger) {
    event.preventDefault();
    applyFilter(filterTrigger.dataset.filter);
    closeNav();
    scrollToId("dishes");
    return;
  }

  if (event.target.closest(".nav-links a, .logo")) closeNav();

  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    const card = addButton.closest(".dish");
    addToCart(card.dataset.id, card.dataset.name, Number(card.dataset.price), 1);
    showToast(`Added ${card.dataset.name}`);
    return;
  }

  const qtyButton = event.target.closest("[data-qty]");
  if (qtyButton) {
    const row = cart.get(qtyButton.dataset.id);
    if (!row) return;
    addToCart(row.id, row.name, row.price, Number(qtyButton.dataset.qty));
    return;
  }

  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    cart.delete(removeButton.dataset.remove);
    renderCart();
  }
});

function addToCart(id, name, price, delta) {
  const current = cart.get(id) || { id, name, price, qty: 0 };
  current.qty += delta;
  if (current.qty <= 0) cart.delete(id);
  else cart.set(id, current);
  renderCart();
}

function money(value) {
  return `$${value.toFixed(0)}`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));
}

function renderCart() {
  const rows = [...cart.values()];
  trayList.innerHTML = rows.map((row) => `
    <li class="tray-row">
      <div>
        <strong>${escapeHtml(row.name)}</strong>
        <em>${money(row.price)} each</em>
      </div>
      <div class="qty">
        <button type="button" data-qty="-1" data-id="${row.id}" aria-label="Decrease ${escapeHtml(row.name)}">−</button>
        <span>${row.qty}</span>
        <button type="button" data-qty="1" data-id="${row.id}" aria-label="Increase ${escapeHtml(row.name)}">+</button>
      </div>
      <button type="button" class="remove" data-remove="${row.id}">Remove</button>
    </li>
  `).join("");

  const total = rows.reduce((sum, row) => sum + row.price * row.qty, 0);
  trayEmpty.hidden = rows.length > 0;
  trayTotal.textContent = `Total ${money(total)}`;
  checkout.disabled = rows.length === 0;
}

checkout.addEventListener("click", () => {
  if (cart.size === 0) return;
  cart.clear();
  renderCart();
  showToast("Order placed. A rider will arrive in 30–60 minutes.");
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-on");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 2200);
}

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());

renderCart();
