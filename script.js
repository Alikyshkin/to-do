const STORAGE_KEY = 'tasks';
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const taskSummary = document.getElementById('task-summary');
const emptyState = document.getElementById('empty-state');
const storageWarning = document.getElementById('storage-warning');
const filterRadios = document.querySelectorAll('input[name="filter"]');
const emptyMessages = {
  all: 'Пока нет задач.',
  active: 'Активных задач нет.',
  completed: 'Выполненных задач пока нет.',
};

let storageUsable = true;
let idSequence = 0;
let filter = 'all';
let editing = null;
let tasks = readTasks();

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? Date.now() + '-' + idSequence++;
}

function showStorageWarning(message) {
  storageUsable = false;
  storageWarning.textContent = message;
  storageWarning.hidden = false;
}

function readTaskId(task) {
  return typeof task.id === 'string' || Number.isSafeInteger(task.id) ? String(task.id) : '';
}

function readTasks() {
  let value;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return [];
    value = JSON.parse(saved);
  } catch {
    showStorageWarning('Не удалось прочитать сохранённые задачи. Изменения будут доступны в этой вкладке.');
    return [];
  }
  if (!Array.isArray(value) || !value.every(task => task && typeof task.text === 'string')) {
    showStorageWarning('Сохранённые задачи имеют неизвестный формат. Изменения будут доступны в этой вкладке.');
    return [];
  }

  const reservedIds = new Set(value.map(readTaskId));
  const seenIds = new Set();
  return value.map((task, index) => {
    let id = readTaskId(task);
    if (!id || seenIds.has(id)) {
      id = 'legacy-' + index;
      while (reservedIds.has(id)) id += '-';
      reservedIds.add(id);
    }
    seenIds.add(id);
    return { id, text: task.text, completed: Boolean(task.completed) };
  });
}

function updateTasks(change) {
  if (storageUsable) {
    const saved = readTasks();
    if (storageUsable) tasks = saved;
  }
  change();
  if (storageUsable) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      showStorageWarning('Не удалось сохранить задачи. Изменения будут доступны в этой вкладке.');
    }
  }
  renderTasks();
}

function matchesFilter(task) {
  if (filter === 'active') return !task.completed;
  if (filter === 'completed') return task.completed;
  return true;
}

function createButton(label, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className = className;
  return button;
}

function focusTask(id, selector) {
  const row = Array.from(taskList.children).find(item => item.dataset.id === id);
  (row?.querySelector(selector) ?? taskInput).focus();
}

function createTaskEditor(task) {
  const form = document.createElement('form');
  const input = document.createElement('input');
  const actions = document.createElement('div');
  const save = createButton('Сохранить');
  const cancel = createButton('Отмена');
  form.className = 'task-editor';
  actions.className = 'task-actions';
  input.type = 'text';
  input.required = true;
  input.value = editing.value;
  input.setAttribute('aria-label', 'Текст задачи');
  save.type = 'submit';

  function closeEditor() {
    editing = null;
    renderTasks();
    focusTask(task.id, '.edit-task');
  }

  input.addEventListener('input', () => {
    input.setCustomValidity('');
    editing.value = input.value;
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !event.isComposing) closeEditor();
  });
  cancel.addEventListener('click', closeEditor);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.setCustomValidity('Введите текст задачи.');
      input.reportValidity();
      return;
    }

    editing = null;
    updateTasks(() => {
      const current = tasks.find(item => item.id === task.id);
      if (current) current.text = text;
    });
    focusTask(task.id, '.edit-task');
  });

  actions.append(save, cancel);
  form.append(input, actions);
  return form;
}

function createTaskElement(task) {
  const row = document.createElement('li');
  row.className = task.completed ? 'task completed' : 'task';
  row.dataset.id = task.id;
  if (editing?.id === task.id) {
    row.append(createTaskEditor(task));
    return row;
  }

  const title = document.createElement('label');
  const checkbox = document.createElement('input');
  const text = document.createElement('span');
  const actions = document.createElement('div');
  const edit = createButton('Изменить', 'edit-task');
  const remove = createButton('Удалить', 'delete-task');
  title.className = 'task-title';
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', 'Выполнено: ' + task.text);
  text.textContent = task.text;
  actions.className = 'task-actions';
  edit.setAttribute('aria-label', 'Изменить: ' + task.text);
  remove.setAttribute('aria-label', 'Удалить: ' + task.text);

  checkbox.addEventListener('change', () => {
    updateTasks(() => {
      const current = tasks.find(item => item.id === task.id);
      if (current) current.completed = checkbox.checked;
    });
    focusTask(task.id, 'input[type="checkbox"]');
  });
  edit.addEventListener('click', () => {
    editing = { id: task.id, value: task.text };
    renderTasks();
    focusTask(task.id, '.task-editor input');
  });
  remove.addEventListener('click', () => {
    const nextRow = row.nextElementSibling ?? row.previousElementSibling;
    updateTasks(() => {
      tasks = tasks.filter(item => item.id !== task.id);
    });
    focusTask(nextRow?.dataset.id, '.delete-task');
  });

  title.append(checkbox, text);
  actions.append(edit, remove);
  row.append(title, actions);
  return row;
}

function renderTasks() {
  const shown = tasks.filter(matchesFilter);
  const rows = document.createDocumentFragment();
  shown.forEach(task => rows.append(createTaskElement(task)));
  taskList.replaceChildren(rows);
  emptyState.hidden = shown.length !== 0;
  emptyState.textContent = emptyMessages[filter];
  const completed = tasks.filter(task => task.completed).length;
  taskSummary.textContent = tasks.length ? 'Выполнено ' + completed + ' из ' + tasks.length : 'Нет задач';
}

function selectFilter(next) {
  filter = next;
  filterRadios.forEach(radio => {
    radio.checked = radio.value === next;
  });
}

filterRadios.forEach(radio => radio.addEventListener('change', () => {
  selectFilter(radio.value);
  renderTasks();
}));

taskInput.addEventListener('input', () => taskInput.setCustomValidity(''));
taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.setCustomValidity('Введите текст задачи.');
    taskInput.reportValidity();
    return;
  }

  if (filter === 'completed') selectFilter('active');
  updateTasks(() => tasks.push({ id: makeId(), text, completed: false }));
  taskForm.reset();
  taskInput.focus();
});

window.addEventListener('storage', (event) => {
  if (!storageUsable || (event.key !== STORAGE_KEY && event.key !== null)) return;
  const saved = readTasks();
  if (!storageUsable) return;
  const activeRow = document.activeElement?.closest('.task');
  const hadEditorFocus = document.activeElement?.matches('.task-editor input');
  tasks = saved;
  if (editing && !tasks.some(task => task.id === editing.id)) editing = null;
  renderTasks();
  if (activeRow && hadEditorFocus) focusTask(activeRow.dataset.id, '.task-editor input');
});

renderTasks();
