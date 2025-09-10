const movies = [
    { title: "Inception", year: 2010, genre: "Sci-Fi", rating: 8.8, overview: "Dream heist within dreams.", poster: "https://via.placeholder.com/200x300?text=Inception" },
    { title: "The Matrix", year: 1999, genre: "Action", rating: 8.7, overview: "Virtual reality rebellion.", poster: "https://via.placeholder.com/200x300?text=Matrix" },
    { title: "Interstellar", year: 2014, genre: "Sci-Fi", rating: 8.6, overview: "Space exploration for survival.", poster: "https://via.placeholder.com/200x300?text=Interstellar" }
];

const levenshteinDistance = (s, t) => {
    if (!s.length) return t.length;
    if (!t.length) return s.length;
    const arr = [];
    for (let i = 0; i <= t.length; i++) {
        arr[i] = [i];
        for (let j = 1; j <= s.length; j++) {
            arr[i][j] = i === 0 ? j : Math.min(
                arr[i - 1][j] + 1,
                arr[i][j - 1] + 1,
                arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
            );
        }
    }
    return arr[t.length][s.length];
};

const favoriteIds = new Set();

async function refreshFavoriteIds() {
    try {
        const res = await fetch('/favorites');
        const favs = await res.json();
        favoriteIds.clear();
        if (Array.isArray(favs)) {
            favs.forEach(m => favoriteIds.add(m.id));
        }
    } catch (_) {
        // ignore refresh errors
    }
}

async function searchMovies() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    if (!query) return;

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    showSkeleton(resultsDiv);

    try {
        const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
        const movies = await response.json();
        resultsDiv.innerHTML = '';
        await refreshFavoriteIds();
        if (movies.length > 0) {
            movies.forEach(movie => {
                const movieDiv = document.createElement('div');
                movieDiv.className = 'movie';
                const isFav = favoriteIds.has(movie.id);
                movieDiv.innerHTML = `
                    <img src="${movie.poster_url}" alt="${movie.title}" data-id="${movie.id}">
                    <h3>${movie.title} (${movie.year})</h3>
                    <p>Genre: ${movie.genre}</p>
                    <p>Rating: ${movie.rating}</p>
                    <p>${(movie.overview || '').substring(0, 120)}...</p>
                    ${isFav
                        ? `<button class="remove-fav-btn" data-id="${movie.id}">Hapus Favorit</button>`
                        : `<button class="fav-btn" data-id="${movie.id}">Tambah Favorit</button>`}
                `;
                resultsDiv.appendChild(movieDiv);
            });
        } else {
            resultsDiv.innerHTML = '<div class="error-box">Film tidak ditemukan.</div>';
        }
    } catch (error) {
        console.error('Search error:', error);
        resultsDiv.innerHTML = '<div class="error-box">Terjadi kesalahan saat mencari. Coba lagi.</div>';
    }
}

async function showDetail(id) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    try {
        const response = await fetch(`/movie/${id}`);
        const movie = await response.json();
        if (movie.error) throw new Error(movie.error);
        resultsDiv.innerHTML = `
            <div class="movie-detail">
                <img src="${movie.poster_url}" alt="${movie.title}">
                <h2>${movie.title} (${movie.year})</h2>
                <p>Genre: ${movie.genre}</p>
                <p>Rating: ${movie.rating}</p>
                <p>${movie.overview}</p>
                <button class="fav-btn" data-id="${movie.id}">Tambah Favorit</button>
            </div>
        `;
    } catch (error) {
        console.error('Detail error:', error);
        resultsDiv.innerHTML = '<div class="error-box">Gagal memuat detail film.</div>';
    }
}

async function addFavorite(id) {
    try {
        const response = await fetch('/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movie_id: id })
        });
        if (response.status === 409) {
            alert('Film sudah ada di favorit');
            favoriteIds.add(Number(id));
            updateButtonsState(id, true);
            return;
        }
        const result = await response.json();
        if (result.success) {
            favoriteIds.add(Number(id));
            updateButtonsState(id, true);
            alert('Ditambahkan ke favorit');
        } else {
            throw new Error(result.error || 'Gagal menambah favorit');
        }
    } catch (error) {
        console.error('Add favorite error:', error);
        alert('Gagal menambah favorit');
    }
}

async function deleteFavorite(id) {
    try {
        const res = await fetch(`/favorites/${id}`, { method: 'DELETE' });
        if (res.ok) {
            favoriteIds.delete(Number(id));
            updateButtonsState(id, false);
        } else {
            const data = await res.json().catch(() => ({}));
            alert(data.error || 'Gagal menghapus favorit');
        }
    } catch (e) {
        console.error('Delete favorite error:', e);
        alert('Gagal menghapus favorit');
    }
}

function updateButtonsState(id, isFav) {
    // Ubah semua tombol terkait id ini di layar sekarang
    document.querySelectorAll(`button[data-id="${id}"]`).forEach(btn => {
        if (isFav) {
            btn.className = 'remove-fav-btn';
            btn.textContent = 'Hapus Favorit';
        } else {
            btn.className = 'fav-btn';
            btn.textContent = 'Tambah Favorit';
        }
    });
}

function showSkeleton(container) {
    const count = 6;
    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'movie skeleton-card';
        card.innerHTML = `
            <div class="skeleton skeleton-thumb"></div>
            <div class="skeleton skeleton-line" style="width: 80%"></div>
            <div class="skeleton skeleton-line" style="width: 60%"></div>
            <div class="skeleton skeleton-line" style="width: 90%"></div>
        `;
        container.appendChild(card);
    }
}

async function loadFavorites() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    showSkeleton(resultsDiv);
    try {
        const response = await fetch('/favorites');
        const favorites = await response.json();
        resultsDiv.innerHTML = '';
        favoriteIds.clear();
        favorites.forEach(m => favoriteIds.add(m.id));
        if (Array.isArray(favorites) && favorites.length) {
            favorites.forEach(movie => {
                const movieDiv = document.createElement('div');
                movieDiv.className = 'movie';
                movieDiv.innerHTML = `
                    <img src="${movie.poster_url}" alt="${movie.title}" data-id="${movie.id}">
                    <h3>${movie.title} (${movie.year})</h3>
                    <p>Genre: ${movie.genre}</p>
                    <p>Rating: ${movie.rating}</p>
                    <p>${(movie.overview || '').substring(0, 120)}...</p>
                    <button class="remove-fav-btn" data-id="${movie.id}">Hapus Favorit</button>
                `;
                resultsDiv.appendChild(movieDiv);
            });
        } else {
            resultsDiv.innerHTML = '<div class="error-box">Belum ada film favorit.</div>';
        }
    } catch (e) {
        console.error('Favorites error:', e);
        resultsDiv.innerHTML = '<div class="error-box">Gagal memuat daftar favorit.</div>';
    }
}

// Event handlers
const searchBtn = document.getElementById('searchBtn');
if (searchBtn) {
    searchBtn.addEventListener('click', () => searchMovies());
}

const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchMovies();
    });
}

const resultsDiv = document.getElementById('results');
if (resultsDiv) {
    resultsDiv.addEventListener('click', (e) => {
        const img = e.target.closest('img[data-id]');
        if (img) {
            const id = img.getAttribute('data-id');
            showDetail(id);
            return;
        }
        const favBtn = e.target.closest('.fav-btn');
        if (favBtn) {
            const id = favBtn.getAttribute('data-id');
            addFavorite(id);
        }
        const removeBtn = e.target.closest('.remove-fav-btn');
        if (removeBtn) {
            const id = removeBtn.getAttribute('data-id');
            deleteFavorite(id).then(() => {
                // Jika saat ini di halaman favorites, hapus kartu dari DOM
                if (document.getElementById('favoritesBtn')?.classList.contains('active')) {
                    const card = removeBtn.closest('.movie');
                    if (card) card.remove();
                }
            });
        }
    });
}

const favoritesBtn = document.getElementById('favoritesBtn');
if (favoritesBtn) {
    favoritesBtn.addEventListener('click', () => loadFavorites());
}