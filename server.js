const express = require('express');
const db = require('./database');
const app = express();

app.use(express.static('public'));

app.get('/search', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    if (!query) return res.json([]);

    db.all(`SELECT * FROM movies WHERE LOWER(title) LIKE ?`, [`%${query}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        // Urutkan berdasarkan kecocokan sederhana (LIKE)
        const sorted = rows.sort((a, b) => {
            const aMatch = a.title.toLowerCase().indexOf(query);
            const bMatch = b.title.toLowerCase().indexOf(query);
            return aMatch - bMatch;
        });

        // Ambil hanya hasil terbaik
        res.json(sorted[0] ? [sorted[0]] : []);
    });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));