const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// In-memory storage for tasks
let tasks = [];
let nextId = 1;

// GET /tasks - Get all tasks
app.get('/tasks', (req, res) => {
    console.log('Sending tasks:', tasks);
    res.json(tasks);
});

// POST /tasks - Create a new task
app.post('/tasks', (req, res) => {
    const { title, description } = req.body;

    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
    }

    const newTask = {
        id: nextId++,
        title: title.trim(),
        description: description ? description.trim() : '',
        status: 'pending',
        created_at: new Date().toISOString()
    };

    tasks.push(newTask);
    console.log('Task created:', newTask);
    res.status(201).json(newTask);
});

// PUT /tasks/:id - Toggle task status
app.put('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const task = tasks.find(t => t.id === parseInt(id));

    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    task.status = task.status === 'pending' ? 'completed' : 'pending';
    console.log('Task toggled:', task);
    res.json(task);
});

// PUT /tasks/:id/edit - Update task title and description
app.put('/tasks/:id/edit', (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    
    console.log('Edit request - ID:', id, 'Title:', title, 'Description:', description);
    
    const task = tasks.find(t => t.id === parseInt(id));

    if (!task) {
        console.log('Task not found');
        return res.status(404).json({ error: 'Task not found' });
    }

    if (!title || title.trim() === '') {
        console.log('Title is empty');
        return res.status(400).json({ error: 'Title is required' });
    }

    task.title = title.trim();
    task.description = description ? description.trim() : '';
    
    console.log('Task updated:', task);
    res.json(task);
});

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const taskIndex = tasks.findIndex(t => t.id === parseInt(id));

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }

    tasks.splice(taskIndex, 1);
    console.log('Task deleted, ID:', id);
    res.json({ message: 'Task deleted successfully' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});