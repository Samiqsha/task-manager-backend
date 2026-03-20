try {
    require('dotenv').config();
} catch (_) {
    // dotenv optional (e.g. production where env vars are set by host)
}
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5001;

// ── Supabase client ────────────────────────────────────────────────────────────
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY   // use service-role key on the server
);

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ── GET /tasks ─────────────────────────────────────────────────────────────────
app.get('/tasks', async (req, res) => {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tasks:', error.message);
        return res.status(500).json({ error: error.message });
    }

    console.log('Sending tasks:', data);
    res.json(data);
});

// ── POST /tasks ────────────────────────────────────────────────────────────────
app.post('/tasks', async (req, res) => {
    const { title, description } = req.body;

    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
    }

    const { data, error } = await supabase
        .from('tasks')
        .insert([
            {
                title: title.trim(),
                description: description ? description.trim() : '',
                status: 'pending',
            },
        ])
        .select()
        .single();

    if (error) {
        console.error('Error creating task:', error.message);
        return res.status(500).json({ error: error.message });
    }

    console.log('Task created:', data);
    res.status(201).json(data);
});

// ── PUT /tasks/:id — toggle status ────────────────────────────────────────────
app.put('/tasks/:id', async (req, res) => {
    const { id } = req.params;

    // Fetch current status first
    const { data: existing, error: fetchError } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', id)
        .single();

    if (fetchError || !existing) {
        return res.status(404).json({ error: 'Task not found' });
    }

    const newStatus = existing.status === 'pending' ? 'completed' : 'pending';

    const { data, error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error toggling task:', error.message);
        return res.status(500).json({ error: error.message });
    }

    console.log('Task toggled:', data);
    res.json(data);
});

// ── PUT /tasks/:id/edit — update title & description ─────────────────────────
app.put('/tasks/:id/edit', async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;

    console.log('Edit request — ID:', id, 'Title:', title, 'Description:', description);

    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required' });
    }

    const { data, error } = await supabase
        .from('tasks')
        .update({
            title: title.trim(),
            description: description ? description.trim() : '',
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        // PostgREST returns an error with code PGRST116 when no rows match
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Task not found' });
        }
        console.error('Error updating task:', error.message);
        return res.status(500).json({ error: error.message });
    }

    console.log('Task updated:', data);
    res.json(data);
});

// ── DELETE /tasks/:id ──────────────────────────────────────────────────────────
app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;

    const { error, count } = await supabase
        .from('tasks')
        .delete({ count: 'exact' })
        .eq('id', id);

    if (error) {
        console.error('Error deleting task:', error.message);
        return res.status(500).json({ error: error.message });
    }

    if (count === 0) {
        return res.status(404).json({ error: 'Task not found' });
    }

    console.log('Task deleted, ID:', id);
    res.json({ message: 'Task deleted successfully' });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
