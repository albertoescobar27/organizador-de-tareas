document.addEventListener('DOMContentLoaded', () => {
    const monthYearDisplay = document.getElementById('month-year');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const noTasksMessage = document.getElementById('no-tasks-message');
    const filterButtons = document.querySelectorAll('.task-filters button');
    const clearCompletedButton = document.getElementById('clear-completed-tasks');

    let currentDate = new Date();
    let selectedDate = null; // Formato YYYY-MM-DD
    let tasks = JSON.parse(localStorage.getItem('calendarTasks')) || {};
    let currentFilter = 'all';

    function saveTasks() {
        localStorage.setItem('calendarTasks', JSON.stringify(tasks));
    }

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-11

        monthYearDisplay.textContent = `${currentDate.toLocaleString('es-ES', { month: 'long' })} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Dom) - 6 (Sáb)
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Rellenar días vacíos al inicio del mes
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('empty');
            calendarGrid.appendChild(emptyCell);
        }

        // Rellenar los días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.textContent = day;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayCell.dataset.date = dateStr;

            if (tasks[dateStr] && tasks[dateStr].length > 0) {
                dayCell.classList.add('has-tasks');
            }

            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayCell.classList.add('current-day');
            }
            if (dateStr === selectedDate) {
                dayCell.classList.add('selected-day');
            }

            dayCell.addEventListener('click', () => handleDayClick(dateStr));
            calendarGrid.appendChild(dayCell);
        }
        updateSelectedDateDisplay();
    }

    function handleDayClick(dateStr) {
        selectedDate = dateStr;
        renderCalendar(); // Re-render para actualizar la clase 'selected-day'
        renderTasks();
    }
    
    function updateSelectedDateDisplay() {
        if (selectedDate) {
            const [year, month, day] = selectedDate.split('-');
            const dateObj = new Date(year, month - 1, day);
            selectedDateDisplay.textContent = dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } else {
            selectedDateDisplay.textContent = 'Ningún día seleccionado';
        }
    }

    function renderTasks() {
        if (!selectedDate) {
            taskList.innerHTML = '';
            noTasksMessage.classList.remove('hidden');
            noTasksMessage.textContent = 'Selecciona un día para ver o agregar tareas.';
            clearCompletedButton.classList.add('hidden');
            return;
        }

        taskList.innerHTML = '';
        const dayTasks = tasks[selectedDate] || [];
        let filteredTasks = dayTasks;

        if (currentFilter === 'active') {
            filteredTasks = dayTasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = dayTasks.filter(task => task.completed);
        }
        
        if (filteredTasks.length === 0) {
            noTasksMessage.classList.remove('hidden');
            if (dayTasks.length > 0 && currentFilter !== 'all') { // Hay tareas pero no coinciden con el filtro
                noTasksMessage.textContent = `No hay tareas ${currentFilter === 'active' ? 'activas' : 'completadas'} para este día.`;
            } else {
                 noTasksMessage.textContent = 'No hay tareas para este día.';
            }
        } else {
            noTasksMessage.classList.add('hidden');
        }

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.classList.toggle('completed', task.completed);
            
            const taskTextSpan = document.createElement('span');
            taskTextSpan.classList.add('task-text');
            taskTextSpan.textContent = task.text;

            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('task-actions');

            const completeButton = document.createElement('button');
            completeButton.classList.add('complete-btn');
            completeButton.innerHTML = task.completed ? '&#x2714;' : '&#x25CB;'; // Checkmark o círculo
            completeButton.classList.toggle('uncompleted', !task.completed);
            completeButton.title = task.completed ? "Marcar como no completada" : "Marcar como completada";
            completeButton.addEventListener('click', () => toggleTaskComplete(task.id));

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-btn');
            deleteButton.innerHTML = '&#x1F5D1;'; // Papelera
            deleteButton.title = "Eliminar tarea";
            deleteButton.addEventListener('click', () => deleteTask(task.id));
            
            actionsDiv.appendChild(completeButton);
            actionsDiv.appendChild(deleteButton);
            li.appendChild(taskTextSpan);
            li.appendChild(actionsDiv);
            taskList.appendChild(li);
        });

        const hasCompletedTasks = dayTasks.some(task => task.completed);
        clearCompletedButton.classList.toggle('hidden', !hasCompletedTasks || currentFilter === 'active');

    }

    function addTask(text) {
        if (!selectedDate) {
            alert('Por favor, selecciona un día del calendario primero.');
            return;
        }
        if (!tasks[selectedDate]) {
            tasks[selectedDate] = [];
        }
        tasks[selectedDate].push({ id: Date.now(), text: text, completed: false });
        saveTasks();
        renderTasks();
        renderCalendar(); // Para actualizar el indicador 'has-tasks'
    }

    function toggleTaskComplete(taskId) {
        if (!selectedDate || !tasks[selectedDate]) return;
        const task = tasks[selectedDate].find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        }
    }

    function deleteTask(taskId) {
        if (!selectedDate || !tasks[selectedDate]) return;
        tasks[selectedDate] = tasks[selectedDate].filter(t => t.id !== taskId);
        if (tasks[selectedDate].length === 0) {
            delete tasks[selectedDate]; // Limpiar si no quedan tareas para ese día
        }
        saveTasks();
        renderTasks();
        renderCalendar(); // Para actualizar el indicador 'has-tasks'
    }
    
    function clearCompleted() {
        if (!selectedDate || !tasks[selectedDate]) return;
        tasks[selectedDate] = tasks[selectedDate].filter(task => !task.completed);
         if (tasks[selectedDate].length === 0) {
            delete tasks[selectedDate];
        }
        saveTasks();
        renderTasks();
        renderCalendar();
    }


    // Event Listeners
    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        renderTasks(); // Actualizar tareas si el día seleccionado cae en el nuevo mes
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        renderTasks();
    });

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskText = taskInput.value.trim();
        if (taskText) {
            addTask(taskText);
            taskInput.value = '';
            taskInput.focus();
        }
    });

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            renderTasks();
        });
    });
    
    clearCompletedButton.addEventListener('click', clearCompleted);

    // Initial render
    renderCalendar();
    renderTasks(); // Mostrar mensaje inicial si no hay día seleccionado
});