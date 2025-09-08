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

function searchMovies() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    if (!query) return;

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    const moviesWithDistance = movies.map(movie => ({
        movie,
        distance: levenshteinDistance(query, movie.title.toLowerCase())
    }));
    moviesWithDistance.sort((a, b) => a.distance - b.distance);

    // Tampilkan hanya hasil terbaik (index 0)
    const bestMatch = moviesWithDistance[0].movie;
    const movieDiv = document.createElement('div');
    movieDiv.className = 'movie';
    movieDiv.innerHTML = `
        <img src="${bestMatch.poster}" alt="${bestMatch.title}">
        <h3>${bestMatch.title} (${bestMatch.year})</h3>
        <p>Genre: ${bestMatch.genre}</p>
        <p>Rating: ${bestMatch.rating}</p>
        <p>${bestMatch.overview}</p>
    `;
    resultsDiv.appendChild(movieDiv);
}