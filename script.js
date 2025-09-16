document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const selectedDateInput = document.getElementById('selected-date');
    const treeStatus = document.getElementById('tree-status');
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthDisplay = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const forestMessage = document.getElementById('forest-message');
    const closeMessageBtn = document.getElementById('close-message');
    
    // Initialize with current date (timezone-safe)
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Normalize to midday to avoid timezone issues
    let currentDate = new Date(today);
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();
    
    // Set default date in the date picker
    selectedDateInput.valueAsDate = today;
    selectedDateInput.setAttribute('min', formatDate(today)); // Disable past dates
    
    // Create warning message element
    const warningMsg = document.createElement('div');
    warningMsg.className = 'date-warning';
    warningMsg.textContent = 'You can only add tasks for today or future dates.';
    selectedDateInput.parentNode.appendChild(warningMsg);
    
    // Load data from localStorage or initialize
    let todos = JSON.parse(localStorage.getItem('todos')) || {};
    let treesPlanted = JSON.parse(localStorage.getItem('treesPlanted')) || {};
    
    // Initialize the app
    updateCalendar();
    loadTodosForDate(currentDate);
    checkDateValidity(currentDate);
    
    // Event listeners
    selectedDateInput.addEventListener('change', function() {
        const selectedDate = new Date(this.value);
        selectedDate.setHours(12, 0, 0, 0); // Normalize to midday
        currentDate = selectedDate;
        loadTodosForDate(currentDate);
        checkDateValidity(currentDate);
    });
    
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTodo();
    });
    
    prevMonthBtn.addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateCalendar();
    });
    
    nextMonthBtn.addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateCalendar();
    });
    
    closeMessageBtn.addEventListener('click', function() {
        forestMessage.classList.add('hidden');
    });
    
    // Validate selected date
    function checkDateValidity(date) {
        if (date < today) {
            addBtn.disabled = true;
            addBtn.classList.add('disabled-add-btn');
            warningMsg.style.display = 'block';
        } else {
            addBtn.disabled = false;
            addBtn.classList.remove('disabled-add-btn');
            warningMsg.style.display = 'none';
        }
    }
    
    // Add new todo
    function addTodo() {
        const text = todoInput.value.trim();
        if (text === '') return;
        
        // Double-check date validity
        if (currentDate < today) {
            alert('Cannot add tasks to past dates!');
            return;
        }
        
        const dateKey = formatDate(currentDate);
        
        if (!todos[dateKey]) {
            todos[dateKey] = [];
        }
        
        todos[dateKey].push({
            id: Date.now(),
            text: text,
            completed: false
        });
        
        saveData();
        loadTodosForDate(currentDate);
        todoInput.value = '';
        todoInput.focus();
    }
    
    // Load todos for selected date
    function loadTodosForDate(date) {
        const dateKey = formatDate(date);
        const dateTodos = todos[dateKey] || [];
        
        todoList.innerHTML = '';
        
        if (dateTodos.length === 0) {
            treeStatus.textContent = 'No tasks for this day. Add some to plant a tree!';
        } else {
            const allCompleted = dateTodos.every(todo => todo.completed);
            
            if (allCompleted) {
                treeStatus.textContent = '🌲 You planted a tree today! 🌲';
            } else {
                const completedCount = dateTodos.filter(todo => todo.completed).length;
                treeStatus.textContent = `Complete all ${dateTodos.length} tasks to plant a tree (${completedCount}/${dateTodos.length})`;
            }
        }
        
        dateTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = 'todo-item' + (todo.completed ? ' completed' : '');
            li.dataset.id = todo.id;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', function() {
                todo.completed = this.checked;
                saveData();
                loadTodosForDate(date);
                checkForTreePlanting(date);
            });
            
            const span = document.createElement('span');
            span.textContent = todo.text;
            
            li.appendChild(checkbox);
            li.appendChild(span);
            todoList.appendChild(li);
        });
        
        updateCalendar();
    }
    
    // Check if all tasks are completed to plant a tree
    function checkForTreePlanting(date) {
        const dateKey = formatDate(date);
        const dateTodos = todos[dateKey] || [];
        
        if (dateTodos.length > 0 && dateTodos.every(todo => todo.completed)) {
            if (!treesPlanted[dateKey]) {
                treesPlanted[dateKey] = true;
                saveData();
                loadTodosForDate(date);
                updateCalendar();
                checkForForestAchievement(date);
            }
        }
    }
    
    // Check if all days in month have trees
    function checkForForestAchievement(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let treesThisMonth = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const checkDate = new Date(year, month, day);
            const checkKey = formatDate(checkDate);
            
            if (treesPlanted[checkKey]) {
                treesThisMonth++;
            }
        }
        
        if (treesThisMonth === daysInMonth) {
            forestMessage.classList.remove('hidden');
        }
    }
    
    // Update calendar display
    function updateCalendar() {
        currentMonthDisplay.textContent = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
        
        calendarGrid.innerHTML = '';
        
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyCell);
        }
        
        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            const cellDate = new Date(currentYear, currentMonth, day);
            cellDate.setHours(12, 0, 0, 0); // Normalize to midday
            const dateKey = formatDate(cellDate);
            
            dayCell.className = 'calendar-day';
            if (treesPlanted[dateKey]) {
                dayCell.classList.add('tree-planted');
            }
            
            // Highlight current date
            if (day === currentDate.getDate() && 
                currentMonth === currentDate.getMonth() && 
                currentYear === currentDate.getFullYear()) {
                dayCell.style.border = '2px solid #2e7d32';
            }
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            dayCell.appendChild(dayHeader);
            
            // Click handler with timezone-safe date
            dayCell.addEventListener('click', function() {
                const clickedDate = new Date(currentYear, currentMonth, day);
                clickedDate.setHours(12, 0, 0, 0); // Normalize
                
                currentDate = clickedDate;
                selectedDateInput.valueAsDate = clickedDate;
                loadTodosForDate(clickedDate);
                checkDateValidity(clickedDate);
            });
            
            calendarGrid.appendChild(dayCell);
        }
    }
    
    // Format date as YYYY-MM-DD (timezone-safe)
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Save data to localStorage
    function saveData() {
        localStorage.setItem('todos', JSON.stringify(todos));
        localStorage.setItem('treesPlanted', JSON.stringify(treesPlanted));
    }
});