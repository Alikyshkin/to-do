const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const filterRadios = document.querySelectorAll('input[name="filter"]');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let filter = 'all';

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
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
    saveTasks();
    renderTasks();
  });

  const span = document.createElement('span');
  span.className = 'text';
  span.textContent = task.text;

  const editBtn = document.createElement('button');
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => editTask(task.id));

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(editBtn);
  li.appendChild(deleteBtn);

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
