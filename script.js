const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const filterRadios = document.querySelectorAll('input[name="filter"]');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let filter = 'all';

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function createIcon(path) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('class', 'w-5 h-5');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathEl.setAttribute('d', path);
  svg.appendChild(pathEl);
  return svg;
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'flex items-center justify-between py-2';
  li.dataset.id = task.id;

  const left = document.createElement('div');
  left.className = 'flex items-center';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.className = 'mr-2';
  checkbox.addEventListener('change', () => {
    task.completed = checkbox.checked;
    saveTasks();
    renderTasks();
  });

  const span = document.createElement('span');
  span.textContent = task.text;
  if (task.completed) {
    span.className = 'line-through text-gray-500';
  }

  left.appendChild(checkbox);
  left.appendChild(span);

  const controls = document.createElement('div');
  controls.className = 'flex items-center space-x-2';

  const editBtn = document.createElement('button');
  editBtn.appendChild(createIcon('M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.939l-3.182 1.061a1 1 0 01-1.263-1.263l1.06-3.182a4 4 0 01.94-1.415L15.232 5.232z'));
  editBtn.className = 'text-blue-500 hover:text-blue-700';
  editBtn.addEventListener('click', () => editTask(task.id));

  const deleteBtn = document.createElement('button');
  deleteBtn.appendChild(createIcon('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 2h4m-4 0a1 1 0 00-1 1v1h6V3a1 1 0 00-1-1m-4 0h4'));
  deleteBtn.className = 'text-red-500 hover:text-red-700';
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  controls.appendChild(editBtn);
  controls.appendChild(deleteBtn);

  li.appendChild(left);
  li.appendChild(controls);

  return li;
}

function renderTasks() {
  taskList.innerHTML = '';
  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });
  filtered.forEach(task => {
    const li = createTaskElement(task);
    taskList.appendChild(li);
  });
}

function addTask(text) {
  const task = {
    id: Date.now().toString(),
    text,
    completed: false
  };
  tasks.push(task);
  saveTasks();
  renderTasks();
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  const newText = prompt('Edit task', task.text);
  if (newText !== null && newText.trim() !== '') {
    task.text = newText.trim();
    saveTasks();
    renderTasks();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

filterRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    filter = radio.value;
    renderTasks();
  });
});

taskForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = taskInput.value.trim();
  if (text !== '') {
    addTask(text);
    taskInput.value = '';
  }
});

renderTasks();
