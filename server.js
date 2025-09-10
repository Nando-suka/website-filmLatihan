const express = require('express');
const db = require('./database');
const app = express();

app.use(express.static('public'));
app.use(express.json()); // Pastikan JSON parsing aktif

app.get('/search', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    if (!query) return res.json([]);

    db.all(`SELECT * FROM movies WHERE LOWER(title) LIKE ?`, [`%${query}%`], (err, rows) => {
        if (err) {
            console.error('Search error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        const sorted = rows.sort((a, b) => {
            const aMatch = a.title.toLowerCase().indexOf(query);
            const bMatch = b.title.toLowerCase().indexOf(query);
            return aMatch - bMatch;
        });
        res.json(sorted);
    });
});

app.get('/movie/:id', (req, res) => {
    const id = req.params.id;
    db.get(`SELECT * FROM movies WHERE id = ?`, [id], (err, row) => {
        if (err) {
            console.error('Movie detail error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) return res.status(404).json({ error: 'Film not found' });
        res.json(row);
    });
});

app.post('/favorites', (req, res) => {
    const { movie_id } = req.body;
    if (!movie_id) {
        console.error('Invalid movie_id:', movie_id);
        return res.status(400).json({ error: 'Invalid movie_id' });
    }

    // Validasi movie_id ada di tabel movies
    db.get(`SELECT id FROM movies WHERE id = ?`, [movie_id], (err, row) => {
        if (err) {
            console.error('Validate movie error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        db.run(`INSERT INTO favorites (movie_id) VALUES (?)`, [movie_id], err2 => {
            if (err2) {
                const msg = String(err2.message || '').toLowerCase();
                if (msg.includes('unique')) {
                    return res.status(409).json({ error: 'Already in favorites' });
                }
                console.error('Add favorite error:', err2);
                return res.status(500).json({ error: 'Error adding favorite' });
            }
            console.log(`Favorite added: movie_id=${movie_id}`);
            res.status(201).json({ success: true });
        });
    });
});

app.get('/favorites', (req, res) => {
    db.all(`SELECT m.* FROM favorites f JOIN movies m ON f.movie_id = m.id`, (err, rows) => {
        if (err) {
            console.error('Favorites error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Cek status favorit per movie_id
app.get('/favorites/:movie_id', (req, res) => {
    const movieId = req.params.movie_id;
    db.get(`SELECT 1 FROM favorites WHERE movie_id = ?`, [movieId], (err, row) => {
        if (err) {
            console.error('Favorite status error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ favorite: !!row });
    });
});

// Hapus dari favorit
app.delete('/favorites/:movie_id', (req, res) => {
    const movieId = req.params.movie_id;
    db.run(`DELETE FROM favorites WHERE movie_id = ?`, [movieId], function(err) {
        if (err) {
            console.error('Delete favorite error:', err);
            return res.status(500).json({ error: 'Error deleting favorite' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Favorite not found' });
        }
        res.json({ success: true, deleted: this.changes });
    });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));