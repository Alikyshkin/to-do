const STORAGE_KEY = 'tasks';
const FILTER_ALL = 'all';
const FILTER_ACTIVE = 'active';
const FILTER_COMPLETED = 'completed';

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const filterRadios = document.querySelectorAll('input[name="filter"]');

let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let filter = FILTER_ALL;

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function updateTasks() {
  saveTasks();
  renderTasks();
}

function matchesFilter(task) {
  if (filter === FILTER_ACTIVE) return !task.completed;
  if (filter === FILTER_COMPLETED) return task.completed;
  return true;
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task';
  if (task.completed) li.classList.add('completed');
  li.dataset.id = task.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.addEventListener('change', () => {
    task.completed = checkbox.checked;
    updateTasks();
  });

  const span = document.createElement('span');
  span.className = 'text';
  span.textContent = task.text;

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.textContent = 'Изменить';
  editBtn.addEventListener('click', () => editTask(task.id));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.textContent = 'Удалить';
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(editBtn);
  li.appendChild(deleteBtn);

  return li;
}

function renderTasks() {
  taskList.innerHTML = '';
  tasks.filter(matchesFilter).forEach((task) => {
    taskList.appendChild(createTaskElement(task));
  });
}

function addTask(text) {
  tasks.push({
    id: Date.now().toString(),
    text,
    completed: false
  });
  updateTasks();
}

function editTask(id) {
  const task = tasks.find((t) => t.id === id);
  const newText = prompt('Редактировать задачу', task.text);
  if (newText !== null && newText.trim() !== '') {
    task.text = newText.trim();
    updateTasks();
  }
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  updateTasks();
}

filterRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    filter = radio.value;
    renderTasks();
  });
});

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (text) {
    addTask(text);
    taskInput.value = '';
  }
});

renderTasks();
