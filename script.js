const STORAGE_KEY = "tuturelist-todos";
const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "과제", label: "과제" },
  { value: "개인", label: "개인" },
  { value: "기타", label: "기타" },
];
const PRIORITIES = {
  high: { label: "높음", className: "bg-red-100 text-red-700" },
  medium: { label: "보통", className: "bg-amber-100 text-amber-700" },
  low: { label: "낮음", className: "bg-emerald-100 text-emerald-700" },
};

const state = {
  todos: loadTodos(),
  activeCategory: "all",
  activeFilter: "all",
};

const elements = {
  form: document.querySelector("#todo-form"),
  text: document.querySelector("#todo-text"),
  category: document.querySelector("#todo-category"),
  priority: document.querySelector("#todo-priority"),
  dueDate: document.querySelector("#todo-due-date"),
  error: document.querySelector("#form-error"),
  categoryTabs: document.querySelector("#category-tabs"),
  statusFilters: document.querySelector("#status-filters"),
  list: document.querySelector("#todo-list"),
  emptyState: document.querySelector("#empty-state"),
  progressLabel: document.querySelector("#progress-label"),
  progressBar: document.querySelector("#progress-bar"),
  progressCount: document.querySelector("#progress-count"),
};

function loadTodos() {
  const savedTodos = localStorage.getItem(STORAGE_KEY);
  if (!savedTodos) return [];

  try {
    const parsedTodos = JSON.parse(savedTodos);
    return Array.isArray(parsedTodos) ? parsedTodos : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function createId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getFilteredTodos() {
  return state.todos.filter((todo) => {
    const matchesCategory =
      state.activeCategory === "all" || todo.category === state.activeCategory;
    const matchesFilter =
      state.activeFilter === "all" ||
      (state.activeFilter === "active" && !todo.completed) ||
      (state.activeFilter === "completed" && todo.completed);
    return matchesCategory && matchesFilter;
  });
}

function formatDueDate(dueDate) {
  if (!dueDate) return "마감일 없음";
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return "마감일 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isOverdue(todo) {
  return !todo.completed && todo.dueDate && new Date(todo.dueDate).getTime() < Date.now();
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.classList.remove("hidden");
}

function clearError() {
  elements.error.textContent = "";
  elements.error.classList.add("hidden");
}

function renderCategoryTabs() {
  elements.categoryTabs.replaceChildren();
  CATEGORIES.forEach((category) => {
    const button = document.createElement("button");
    const isActive = state.activeCategory === category.value;
    button.type = "button";
    button.dataset.category = category.value;
    button.textContent = category.label;
    button.setAttribute("aria-selected", String(isActive));
    button.className = isActive
      ? "shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
      : "shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900";
    elements.categoryTabs.append(button);
  });
}

function renderStatusFilters() {
  elements.statusFilters.querySelectorAll("[data-filter]").forEach((button) => {
    const isActive = state.activeFilter === button.dataset.filter;
    button.setAttribute("aria-pressed", String(isActive));
    button.className = isActive
      ? "filter-button rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
      : "filter-button rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900";
  });
}

function renderTodo(todo) {
  const item = document.createElement("li");
  const overdue = isOverdue(todo);
  const priority = PRIORITIES[todo.priority] || PRIORITIES.medium;
  item.className = "flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm";
  item.dataset.todoId = todo.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.dataset.action = "toggle";
  checkbox.setAttribute("aria-label", `${todo.text} 완료 여부`);
  checkbox.className = "mt-1 h-5 w-5 shrink-0 cursor-pointer accent-indigo-600";

  const content = document.createElement("div");
  content.className = "min-w-0 flex-1";

  const text = document.createElement("p");
  text.textContent = todo.text;
  text.className = todo.completed
    ? "break-words text-sm text-slate-400 line-through"
    : "break-words text-sm font-medium text-slate-800";

  const metadata = document.createElement("div");
  metadata.className = "mt-2 flex flex-wrap items-center gap-2 text-xs";

  const priorityBadge = document.createElement("span");
  priorityBadge.textContent = priority.label;
  priorityBadge.className = `rounded-full px-2 py-1 font-semibold ${priority.className}`;

  const categoryBadge = document.createElement("span");
  categoryBadge.textContent = todo.category;
  categoryBadge.className = "rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-600";

  const dueDate = document.createElement("span");
  dueDate.textContent = formatDueDate(todo.dueDate);
  dueDate.className = overdue ? "font-semibold text-red-600" : "text-slate-500";

  metadata.append(priorityBadge, categoryBadge, dueDate);
  content.append(text, metadata);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  deleteButton.setAttribute("aria-label", `${todo.text} 삭제`);
  deleteButton.textContent = "삭제";
  deleteButton.className = "shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200";

  item.append(checkbox, content, deleteButton);
  return item;
}

function renderTodos() {
  const filteredTodos = getFilteredTodos();
  elements.list.replaceChildren(...filteredTodos.map(renderTodo));
  elements.emptyState.classList.toggle("hidden", filteredTodos.length > 0);
}

function renderProgress() {
  const total = state.todos.length;
  const completed = state.todos.filter((todo) => todo.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  elements.progressLabel.textContent = `${percentage}%`;
  elements.progressCount.textContent = `완료 ${completed} / 전체 ${total}`;
  elements.progressBar.style.width = `${percentage}%`;
  elements.progressBar.setAttribute("aria-valuenow", String(percentage));
}

function render() {
  renderCategoryTabs();
  renderStatusFilters();
  renderTodos();
  renderProgress();
}

function handleFormSubmit(event) {
  event.preventDefault();
  const text = elements.text.value.trim();

  if (!text) {
    showError("할 일 내용을 입력해주세요.");
    elements.text.focus();
    return;
  }
  if (text.length > 200) {
    showError("할 일은 200자 이내로 입력해주세요.");
    elements.text.focus();
    return;
  }

  state.todos.unshift({
    id: createId(),
    text,
    completed: false,
    dueDate: elements.dueDate.value,
    priority: elements.priority.value,
    category: elements.category.value,
  });
  saveTodos();
  elements.form.reset();
  clearError();
  render();
  elements.text.focus();
}

function handleTodoAction(event) {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) return;

  const item = actionElement.closest("[data-todo-id]");
  if (!item) return;
  const todoIndex = state.todos.findIndex((todo) => todo.id === item.dataset.todoId);
  if (todoIndex === -1) return;

  if (actionElement.dataset.action === "toggle") {
    state.todos[todoIndex].completed = actionElement.checked;
  } else if (actionElement.dataset.action === "delete") {
    state.todos.splice(todoIndex, 1);
  }

  saveTodos();
  render();
}

elements.form.addEventListener("submit", handleFormSubmit);
elements.list.addEventListener("click", handleTodoAction);
elements.list.addEventListener("change", handleTodoAction);
elements.categoryTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.activeCategory = button.dataset.category;
  render();
});
elements.statusFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  state.activeFilter = button.dataset.filter;
  render();
});
elements.text.addEventListener("input", clearError);

render();
