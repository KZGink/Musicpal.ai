// =================================================================
// Global State Variables (UPDATED)
// =================================================================
let currentFavTrackIndex = -1; // Index in the currently playing favorite list
let currentFavList = [];        // The actual list of tracks to autoplay
let isLooping = false;          // Loop state
let isAutoplayOn = true;        // NEW: Autoplay state starts ON by default.


// =================================================================
// 0. LOCAL STORAGE FUNCTIONS (The Agent's Memory/Learning Storage)
// =================================================================

// Load existing history or create an empty object
function loadHistory() {
    const history = localStorage.getItem('musicPalHistory');
    return history ? JSON.parse(history) : {};
}

// Save the current history object
function saveHistory(history) {
    localStorage.setItem('musicPalHistory', JSON.stringify(history));
}


// =================================================================
// 1. MUSIC DATA (The "Database")
// =================================================================

const musicData = [
    {
        title: "Cinta Pantai Merdeka",
        artist: "Jinbara",
        genre: "Rock", 
        year: 2011,
        file: "music/Cinta Pantai Merdeka.mp3",
        id: 1
    },
    {
        title: "Sepi Sekuntum Mawar Merah",
        artist: "Ella",
        genre: "Rock",
        year: 1990,
        file: "music/Sepi Sekuntum Mawar Merah.mp3",
        id: 2
    },
    {
        title: "Alasanmu",
        artist: "Exists",
        genre: "Pop",
        year: 2010,
        file: "music/Alasanmu.mp3",
        id: 3
    },
    {
        title: "P Ramlee Saloma",
        artist: "ALPHA",
        genre: "Ballad Balada", 
        year: 2025,
        file: "music/P Ramlee Saloma.mp3",
        id: 4
    },
    {
        title: "Puisi Malam",
        artist: "Fiq7",
        genre: "Hip-Hop Rap", 
        year: 2024,
        file: "music/Puisi Malam.mp3",
        id: 5
    },
    { title: "NIATKU", artist: "Ruang Red", genre: "Pop", year: 2024, file: "music/NIATKU.mp3", id: 6 },
    { title: "MALAMPAGI", artist: "Saixse", genre: "Reggae", year: 2022, file: "music/MALAMPAGI.mp3", id: 7 },
    { title: "Bourgenvilla", artist: "Spring", genre: "Rock", year: 1994, file: "music/Bourgenvilla.mp3", id: 8 },
    { 
        title: "Tak Sangka", 
        artist: "Yonnyboii Zynakal ASYRAF NASIR", 
        genre: "Hip Hop", 
        year: 2021, 
        file: "music/Tak Sangka.mp3", 
        id: 9 
    },
    { title: "Retak Hatiku", artist: "Iera Milpan", genre: "Pop", year: 2023, file: "music/Retak Hatiku.mp3", id: 10 }
];


// =================================================================
// 2. THE FILTER / SEARCH LOGIC (FINAL UPDATE FOR "list" KEYWORD)
// =================================================================

function filterMusic() {
    const searchInput = document.getElementById('music-search');
    const input = searchInput.value.toLowerCase().trim(); // Use trim() and toLowerCase()
    
    const resultsContainer = document.getElementById('music-list');
    resultsContainer.innerHTML = ''; 

    let tracksToDisplay = [];
    let placeholderText = `<p class="placeholder-text">Type a keyword above to get started!</p>`;

    // 1. Check for the special 'list' keyword
    if (input === 'list') {
        tracksToDisplay = musicData; // Display ALL tracks
        placeholderText = `<p class="placeholder-text">All ${musicData.length} tracks listed.</p>`;
    } 
    // 2. Proceed with standard filtering if input is NOT 'list' and has length
    else if (input.length > 0) {
        
        tracksToDisplay = musicData.filter(track => {
            const trackString = 
                `${track.title} ${track.artist} ${track.genre} ${track.year}`.toLowerCase();
            return trackString.includes(input);
        });
        
        if (tracksToDisplay.length === 0) {
            placeholderText = `<p class="placeholder-text">No music found matching "${input}". Try a different keyword!</p>`;
        }
    } 
    // 3. Handle empty input
    else {
        resultsContainer.innerHTML = placeholderText;
        return;
    }
    
    // 4. Display results (or the appropriate placeholder/message)
    if (tracksToDisplay.length > 0) {
        // Display the placeholder text (like "All tracks listed") above the list
        resultsContainer.innerHTML += placeholderText; 
        
        tracksToDisplay.forEach(track => {
            const trackHtml = `
                <div class="track-item">
                    <div class="track-info">
                        <div class="title">${track.title}</div>
                        <div class="meta">${track.artist} | ${track.genre} | ${track.year}</div>
                    </div>
                    <button class="play-button" onclick="playTrack('${track.file}')">
                        Play
                    </button>
                </div>
            `;
            resultsContainer.innerHTML += trackHtml;
        });
    } else if (input.length > 0) {
        // Display the 'No music found' message only if a non-'list' keyword was typed
        resultsContainer.innerHTML = placeholderText;
    }
}


// =================================================================
// 3. LOOPING AND AUTOPLAY ENGINE (UPDATED)
// =================================================================

function buildFavoriteQueue() {
    const history = loadHistory();
    let favoriteTracks = Object.values(history);
    
    favoriteTracks.sort((a, b) => b.count - a.count);

    const queue = favoriteTracks.map(favTrack => 
        musicData.find(t => t.title === favTrack.title)
    ).filter(t => t); 

    return queue;
}

// Function to toggle the Autoplay feature ON/OFF
function toggleAutoplay() {
    isAutoplayOn = !isAutoplayOn; 
    const autoplayBtn = document.getElementById('autoplay-btn');

    if (isAutoplayOn) {
        autoplayBtn.textContent = '▶️ Autoplay ON (Favs)';
        autoplayBtn.classList.remove('off');
        console.log("Autoplay is ON. Will play next favorite track.");
    } else {
        autoplayBtn.textContent = '⏸️ Autoplay OFF';
        autoplayBtn.classList.add('off');
        
        // Clear the current queue so the 'ended' event doesn't trigger anything
        currentFavTrackIndex = -1;
        currentFavList = []; 
        
        console.log("Autoplay is OFF. Next song will not play automatically.");
    }
}

// Function to handle automatic playback of the next song (Feature 2 & 4)
function playNext() {
    // 1. Check Autoplay State
    if (!isAutoplayOn) {
        console.log("Autoplay is OFF. Stopping queue playback.");
        currentFavTrackIndex = -1;
        currentFavList = [];
        return; 
    }

    // 2. Queue Management
    if (currentFavList.length > 0 && currentFavTrackIndex !== -1) {
        
        currentFavTrackIndex++; 
        
        // Handle wrap-around (Feature 4)
        if (currentFavTrackIndex >= currentFavList.length) {
            currentFavTrackIndex = 0; 
            console.log("Autoplay finished list, wrapping back to the beginning.");
        }

        const nextTrack = currentFavList[currentFavTrackIndex];
        
        if (nextTrack) {
            console.log(`Autoplay: Playing next track at index ${currentFavTrackIndex}`);
            playTrack(nextTrack.file, true); 
            return;
        }
    }
    
    console.log("Autoplay queue finished or is inactive.");
    currentFavTrackIndex = -1;
    currentFavList = [];
}

// Function to toggle the loop feature (Feature 1)
function toggleLoop() {
    isLooping = !isLooping; 
    const audioPlayer = document.getElementById('audio-player');
    const loopBtn = document.getElementById('loop-btn');

    audioPlayer.loop = isLooping; 

    if (isLooping) {
        loopBtn.textContent = '🔁 Loop ON';
        loopBtn.classList.add('active'); 
        console.log("Looping is ON");
    } else {
        loopBtn.textContent = '🔁 Loop OFF';
        loopBtn.classList.remove('active');
        console.log("Looping is OFF");
    }
}


// =================================================================
// 4. THE AUDIO PLAYER LOGIC (UPDATED with Learning)
// =================================================================

function playTrack(filePath, isAutoplay = false) { 
    const player = document.getElementById('audio-player');
    
    // 1. Learning Agent Logic (Update History)
    const track = musicData.find(t => t.file === filePath);
    
    if (track) { 
        const history = loadHistory();
        const trackKey = track.id; 
        
        if (history[trackKey]) { 
            history[trackKey].count += 1; 
            history[trackKey].lastPlayed = Date.now(); 
        } else { 
            history[trackKey] = { 
                count: 1, 
                lastPlayed: Date.now(), 
                title: track.title, 
                artist: track.artist 
            }; 
        }
        saveHistory(history);
        console.log(`Track ${track.title} played. Total plays: ${history[trackKey].count}`);
    }

    // 2. Start Playback
    player.src = filePath;
    player.load();
    player.play().catch(error => {
        console.log("Playback failed (possibly due to browser autoplay policy). Please interact with the player.", error);
    });
    
    // 3. Setup Autoplay Listener 
    player.removeEventListener('ended', playNext);
    player.addEventListener('ended', playNext);
    
    // 4. Queue Management (Start/Reset sequence if manually played)
    if (!isAutoplay) {
        // Only reset queue if Autoplay is actually ON
        if (isAutoplayOn) {
            currentFavList = buildFavoriteQueue();
            
            const clickedIndex = currentFavList.findIndex(t => t.file === filePath);
            
            currentFavTrackIndex = clickedIndex !== -1 ? clickedIndex : -1;
        } else {
            // If autoplay is off, a manual click does not start a queue
            currentFavList = [];
            currentFavTrackIndex = -1;
        }
    }
}


// =================================================================
// 5. FAVORITES DISPLAY LOGIC (The Recommendation Agent)
// =================================================================

function showFavorites() {
    document.getElementById('music-search').value = '';
    
    const history = loadHistory();
    const resultsContainer = document.getElementById('music-list');
    resultsContainer.innerHTML = ''; 

    let favoriteTracks = Object.values(history);

    favoriteTracks.sort((a, b) => b.count - a.count);

    const topFavorites = favoriteTracks.slice(0, 5);
    
    resultsContainer.innerHTML = `<h2 style="color: #1DB954;">🔥 Your Top ${topFavorites.length} Favorite Tracks</h2>`;
    
    if (topFavorites.length === 0) {
        resultsContainer.innerHTML += `<p class="placeholder-text">Play some songs first to start building your favorites list!</p>`;
        return;
    }

    topFavorites.forEach(favTrack => {
        const fullTrack = musicData.find(t => t.title === favTrack.title);
        
        if (fullTrack) {
            const trackHtml = `
                <div class="track-item">
                    <div class="track-info">
                        <div class="title">#${topFavorites.indexOf(favTrack) + 1}: ${favTrack.title}</div>
                        <div class="meta">${favTrack.artist} | Played ${favTrack.count} times</div>
                    </div>
                    <button class="play-button" onclick="playTrack('${fullTrack.file}')">
                        Play
                    </button>
                </div>
            `;
            resultsContainer.innerHTML += trackHtml;
        }
    });
}


// =================================================================
// 6. INITIALIZATION (Feature 3: Auto-play top favorite on load)
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    const history = loadHistory();
    
    // Only attempt to autoplay on load if the feature is ON
    if (isAutoplayOn && Object.keys(history).length > 0) {
        currentFavList = buildFavoriteQueue();
        
        if (currentFavList.length > 0) {
            currentFavTrackIndex = 0; 
            const firstTrack = currentFavList[0];
            
            console.log(`Initialization: Attempting to auto-play top favorite song: ${firstTrack.title}`);
            
            playTrack(firstTrack.file, true); 
        }
    }
    
    filterMusic(); 
});