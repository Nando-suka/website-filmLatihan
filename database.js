const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('movies.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        year INTEGER,
        genre TEXT,
        rating REAL,
        overview TEXT,
        poster_url TEXT
    )`);

    // Insert data awal
    const stmt = db.prepare(`INSERT OR IGNORE INTO movies (title, year, genre, rating, overview, poster_url) VALUES (?, ?, ?, ?, ?, ?)`);
    const movies = [
        ['Inception', 2010, 'Sci-Fi', 8.8, 'Dream heist within dreams.', 'https://via.placeholder.com/200x300?text=Inception'],
        ['The Matrix', 1999, 'Action', 8.7, 'Virtual reality rebellion.', 'https://via.placeholder.com/200x300?text=Matrix'],
        ['Interstellar', 2014, 'Sci-Fi', 8.6, 'Space exploration for survival.', 'https://via.placeholder.com/200x300?text=Interstellar']
    ];
    movies.forEach(movie => stmt.run(movie));
    stmt.finalize();
});

module.exports = db;