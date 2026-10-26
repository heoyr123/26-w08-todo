const STORAGE_KEY = 'tuturist.todos.v1';

const categoryLabels = {
  assignment: '과제',
  personal: '개인',
  other: '기타'
};

const priorityLabels = {
  high: '높음',
  medium: '보통',
  low: '낮음'
};

const state = {
  todos: loadTodos(),
  category: 'all',
  filter: 'all'
};

const todoForm = document.querySelector('#todoForm');
const todoText = document.querySelector('#todoText');
const todoList = document.querySelector('#todoList');
const emptyState = document.querySelector('#emptyState');
const formFeedback = document.querySelector('#formFeedback');
const progressBar = document.querySelector('#progressBar');
const progressText = document.querySelector('#progressText');
const progress = document.querySelector('.progress');

function loadTodos() {
  try {
    const storedTodos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(storedTodos)) return [];

    return storedTodos
      .filter((todo) => todo && typeof todo.text === 'string')
      .map((todo) => ({
        id: String(todo.id || createId()),
        text: todo.text.slice(0, 200),
        completed: todo.completed === true,
        dueDate: typeof todo.dueDate === 'string' ? todo.dueDate : '',
        priority: priorityLabels[todo.priority] ? todo.priority : 'medium',
        category: categoryLabels[todo.category] ? todo.category : 'other',
        createdAt: Number(todo.createdAt) || Date.now()
      }));
  } catch (error) {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
}

function createId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showFeedback(message) {
  formFeedback.textContent = message;
  formFeedback.hidden = false;
}

function clearFeedback() {
  formFeedback.textContent = '';
  formFeedback.hidden = true;
}

function formatDueDate(dueDate) {
  if (!dueDate) return '';
  const date = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dueDate;
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function isOverdue(todo) {
  if (todo.completed || !todo.dueDate) return false;
  const dueDate = new Date(`${todo.dueDate}T23:59:59`);
  return !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < Date.now();
}

function getVisibleTodos() {
  return state.todos
    .filter((todo) => state.category === 'all' || todo.category === state.category)
    .filter((todo) => {
      if (state.filter === 'active') return !todo.completed;
      if (state.filter === 'completed') return todo.completed;
      return true;
    })
    .sort((first, second) => second.createdAt - first.createdAt);
}

function render() {
  renderCategoryCounts();
  renderProgress();
  renderTodos();
  updateSelectedControls();
}

function renderCategoryCounts() {
  document.querySelector('[data-category="all"] .tab-count').textContent = state.todos.length;
  Object.keys(categoryLabels).forEach((category) => {
    const count = state.todos.filter((todo) => todo.category === category).length;
    document.querySelector(`[data-category="${category}"] .tab-count`).textContent = count;
  });
}

function renderProgress() {
  const total = state.todos.length;
  const completed = state.todos.filter((todo) => todo.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressBar.style.width = `${percentage}%`;
  progressText.textContent = `${percentage}%`;
  progress.setAttribute('aria-valuenow', percentage);
}

function renderTodos() {
  const visibleTodos = getVisibleTodos();
  todoList.replaceChildren();
  emptyState.hidden = visibleTodos.length !== 0;

  visibleTodos.forEach((todo) => {
    todoList.appendChild(createTodoElement(todo));
  });
}

function createTodoElement(todo) {
  const item = document.createElement('article');
  item.className = 'todo-item';
  item.dataset.todoId = todo.id;
  if (todo.completed) item.classList.add('is-completed');
  if (isOverdue(todo)) item.classList.add('is-overdue');

  const checkbox = document.createElement('input');
  checkbox.className = 'form-check-input todo-check';
  checkbox.type = 'checkbox';
  checkbox.checked = todo.completed;
  checkbox.dataset.action = 'toggle';
  checkbox.setAttribute('aria-label', `${todo.text} 완료 상태 변경`);

  const content = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'todo-title';
  title.textContent = todo.text;
  content.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'todo-meta';
  addBadge(meta, categoryLabels[todo.category], 'text-bg-light');
  addBadge(meta, `우선순위 ${priorityLabels[todo.priority]}`, getPriorityBadgeClass(todo.priority));
  if (todo.dueDate) {
    addBadge(meta, `마감 ${formatDueDate(todo.dueDate)}`, 'due-badge text-bg-light');
  }
  content.appendChild(meta);

  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-button';
  deleteButton.type = 'button';
  deleteButton.dataset.action = 'delete';
  deleteButton.textContent = '삭제';
  deleteButton.setAttribute('aria-label', `${todo.text} 삭제`);

  item.append(checkbox, content, deleteButton);
  return item;
}

function addBadge(parent, text, className) {
  const badge = document.createElement('span');
  badge.className = `badge ${className}`;
  badge.textContent = text;
  parent.appendChild(badge);
}

function getPriorityBadgeClass(priority) {
  if (priority === 'high') return 'text-bg-warning';
  if (priority === 'low') return 'text-bg-secondary';
  return 'text-bg-success';
}

function updateSelectedControls() {
  document.querySelectorAll('[data-category]').forEach((button) => {
    const isSelected = button.dataset.category === state.category;
    button.classList.toggle('active', isSelected);
    button.setAttribute('aria-selected', String(isSelected));
  });

  document.querySelectorAll('[data-filter]').forEach((button) => {
    const isSelected = button.dataset.filter === state.filter;
    button.classList.toggle('active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
}

todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = todoText.value.trim();

  if (!text) {
    showFeedback('할 일 내용을 입력해주세요.');
    todoText.focus();
    return;
  }

  if (text.length > 200) {
    showFeedback('할 일은 200자 이내로 입력해주세요.');
    todoText.focus();
    return;
  }

  const formData = new FormData(todoForm);
  state.todos.push({
    id: createId(),
    text,
    completed: false,
    dueDate: String(formData.get('dueDate') || ''),
    priority: String(formData.get('priority') || 'medium'),
    category: String(formData.get('category') || 'other'),
    createdAt: Date.now()
  });

  saveTodos();
  todoForm.reset();
  clearFeedback();
  render();
  todoText.focus();
});

document.querySelector('#categoryTabs').addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  state.category = button.dataset.category;
  render();
});

document.querySelector('#statusFilters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  state.filter = button.dataset.filter;
  render();
});

todoList.addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-action="toggle"]');
  if (!checkbox) return;
  const item = checkbox.closest('[data-todo-id]');
  const todo = state.todos.find((candidate) => candidate.id === item.dataset.todoId);
  if (!todo) return;
  todo.completed = checkbox.checked;
  saveTodos();
  render();
});

todoList.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-action="delete"]');
  if (!deleteButton) return;
  const item = deleteButton.closest('[data-todo-id]');
  state.todos = state.todos.filter((todo) => todo.id !== item.dataset.todoId);
  saveTodos();
  render();
});

render();
