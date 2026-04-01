// CaCaw - Wingspan Bird Sound Scanner
// Scans Wingspan board game cards and plays the bird's call

const $ = (sel) => document.querySelector(sel);
const show = (el) => el.classList.remove('hidden');
const hide = (el) => el.classList.add('hidden');

// DOM elements
const camera = $('#camera');
const cameraPlaceholder = $('#camera-placeholder');
const startCameraBtn = $('#start-camera-btn');
const captureBtn = $('#capture-btn');
const uploadBtn = $('#upload-btn');
const fileInput = $('#file-input');
const cameraSection = $('#camera-section');
const resultSection = $('#result-section');
const capturedImage = $('#captured-image');
const capturedImageContainer = $('#captured-image-container');
const loading = $('#loading');
const loadingText = $('#loading-text');
const birdResult = $('#bird-result');
const birdNameEl = $('#bird-name');
const birdScientific = $('#bird-scientific');
const audioPlayer = $('#audio-player');
const playBtn = $('#play-btn');
const playIcon = $('.play-icon');
const birdAudio = $('#bird-audio');
const recordingInfo = $('#recording-info');
const audioProgressBar = $('#audio-progress-bar');
const noSound = $('#no-sound');
const errorMessage = $('#error-message');
const errorText = $('#error-text');
const scanAgainBtn = $('#scan-again-btn');
const processingCanvas = $('#processing-canvas');
const searchInput = $('#search-input');
const searchResults = $('#search-results');
const wrongBirdBtn = $('#wrong-bird-btn');

let stream = null;
let isPlaying = false;

// Wingspan bird database: common name -> scientific name
// Scientific names help with xeno-canto lookups which work better with Latin names
const BIRD_DB = {
    "Abbott's Booby": "Papasula abbotti",
    "Acorn Woodpecker": "Melanerpes formicivorus",
    "American Avocet": "Recurvirostra americana",
    "American Bittern": "Botaurus lentiginosus",
    "American Coot": "Fulica americana",
    "American Crow": "Corvus brachyrhynchos",
    "American Goldfinch": "Spinus tristis",
    "American Kestrel": "Falco sparverius",
    "American Oystercatcher": "Haematopus palliatus",
    "American Robin": "Turdus migratorius",
    "American White Pelican": "Pelecanus erythrorhynchos",
    "Anna's Hummingbird": "Calypte anna",
    "Atlantic Puffin": "Fratercula arctica",
    "Bald Eagle": "Haliaeetus leucocephalus",
    "Baltimore Oriole": "Icterus galbula",
    "Barn Owl": "Tyto alba",
    "Barn Swallow": "Hirundo rustica",
    "Barred Owl": "Strix varia",
    "Belted Kingfisher": "Megaceryle alcyon",
    "Black Skimmer": "Rynchops niger",
    "Black Vulture": "Coragyps atratus",
    "Black-Chinned Hummingbird": "Archilochus alexandri",
    "Blue Jay": "Cyanocitta cristata",
    "Blue-Gray Gnatcatcher": "Polioptila caerulea",
    "Bobolink": "Dolichonyx oryzivorus",
    "Bonelli's Eagle": "Aquila fasciata",
    "Broad-Winged Hawk": "Buteo platypterus",
    "Brown Pelican": "Pelecanus occidentalis",
    "Brown-Headed Cowbird": "Molothrus ater",
    "Bushtit": "Psaltriparus minimus",
    "California Condor": "Gymnogyps californianus",
    "California Quail": "Callipepla californica",
    "Canada Goose": "Branta canadensis",
    "Canvasback": "Aythya valisineria",
    "Carolina Chickadee": "Poecile carolinensis",
    "Carolina Wren": "Thryothorus ludovicianus",
    "Cedar Waxwing": "Bombycilla cedrorum",
    "Chimney Swift": "Chaetura pelagica",
    "Chihuahuan Raven": "Corvus cryptoleucus",
    "Clark's Nutcracker": "Nucifraga columbiana",
    "Common Grackle": "Quiscalus quiscula",
    "Common Loon": "Gavia immer",
    "Common Raven": "Corvus corax",
    "Common Yellowthroat": "Geothlypis trichas",
    "Cooper's Hawk": "Accipiter cooperii",
    "Dark-Eyed Junco": "Junco hyemalis",
    "Dickcissel": "Spiza americana",
    "Double-Crested Cormorant": "Nannopterum auritum",
    "Downy Woodpecker": "Dryobates pubescens",
    "Eastern Bluebird": "Sialia sialis",
    "Eastern Kingbird": "Tyrannus tyrannus",
    "Eastern Meadowlark": "Sturnella magna",
    "Eastern Phoebe": "Sayornis phoebe",
    "Eastern Screech-Owl": "Megascops asio",
    "Eastern Towhee": "Pipilo erythrophthalmus",
    "Eurasian Collared-Dove": "Streptopelia decaocto",
    "European Goldfinch": "Carduelis carduelis",
    "Evening Grosbeak": "Coccothraustes vespertinus",
    "Franklin's Gull": "Leucophaeus pipixcan",
    "Golden Eagle": "Aquila chrysaetos",
    "Great Blue Heron": "Ardea herodias",
    "Great Crested Flycatcher": "Myiarchus crinitus",
    "Great Horned Owl": "Bubo virginianus",
    "Greater Flamingo": "Phoenicopterus roseus",
    "Greater Roadrunner": "Geococcyx californianus",
    "Green Heron": "Butorides virescens",
    "Gyrfalcon": "Falco rusticolus",
    "Hairy Woodpecker": "Dryobates villosus",
    "Harlequin Duck": "Histrionicus histrionicus",
    "Harris's Hawk": "Parabuteo unicinctus",
    "Hermit Thrush": "Catharus guttatus",
    "Horned Lark": "Eremophila alpestris",
    "House Finch": "Haemorhous mexicanus",
    "House Sparrow": "Passer domesticus",
    "House Wren": "Troglodytes aedon",
    "Indigo Bunting": "Passerina cyanea",
    "Killdeer": "Charadrius vociferus",
    "Lark Bunting": "Calamospiza melanocorys",
    "Lazuli Bunting": "Passerina amoena",
    "Least Flycatcher": "Empidonax minimus",
    "Lesser Goldfinch": "Spinus psaltria",
    "Lincoln's Sparrow": "Melospiza lincolnii",
    "Loggerhead Shrike": "Lanius ludovicianus",
    "Long-Eared Owl": "Asio otus",
    "Mallard": "Anas platyrhynchos",
    "Marsh Wren": "Cistothorus palustris",
    "Mississippi Kite": "Ictinia mississippiensis",
    "Mountain Bluebird": "Sialia currucoides",
    "Mourning Dove": "Zenaida macroura",
    "Mourning Warbler": "Geothlypis philadelphia",
    "Northern Cardinal": "Cardinalis cardinalis",
    "Northern Flicker": "Colaptes auratus",
    "Northern Gannet": "Morus bassanus",
    "Northern Harrier": "Circus hudsonius",
    "Northern Mockingbird": "Mimus polyglottos",
    "Northern Pintail": "Anas acuta",
    "Northern Saw-Whet Owl": "Aegolius acadicus",
    "Osprey": "Pandion haliaetus",
    "Ovenbird": "Seiurus aurocapilla",
    "Painted Bunting": "Passerina ciris",
    "Peregrine Falcon": "Falco peregrinus",
    "Pied-Billed Grebe": "Podilymbus podiceps",
    "Pileated Woodpecker": "Dryocopus pileatus",
    "Pine Grosbeak": "Pinicola enucleator",
    "Pine Siskin": "Spinus pinus",
    "Pine Warbler": "Setophaga pinus",
    "Prairie Falcon": "Falco mexicanus",
    "Purple Finch": "Haemorhous purpureus",
    "Purple Martin": "Progne subis",
    "Red Crossbill": "Loxia curvirostra",
    "Red Knot": "Calidris canutus",
    "Red-Bellied Woodpecker": "Melanerpes carolinus",
    "Red-Breasted Nuthatch": "Sitta canadensis",
    "Red-Eyed Vireo": "Vireo olivaceus",
    "Red-Headed Woodpecker": "Melanerpes erythrocephalus",
    "Red-Shouldered Hawk": "Buteo lineatus",
    "Red-Tailed Hawk": "Buteo jamaicensis",
    "Red-Winged Blackbird": "Agelaius phoeniceus",
    "Ring-Billed Gull": "Larus delawarensis",
    "Ring-Necked Duck": "Aythya collaris",
    "Rose-Breasted Grosbeak": "Pheucticus ludovicianus",
    "Roseate Spoonbill": "Platalea ajaja",
    "Ruby-Crowned Kinglet": "Corthylio calendula",
    "Ruby-Throated Hummingbird": "Archilochus colubris",
    "Ruddy Duck": "Oxyura jamaicensis",
    "Rufous Hummingbird": "Selasphorus rufus",
    "Sandhill Crane": "Antigone canadensis",
    "Savannah Sparrow": "Passerculus sandwichensis",
    "Say's Phoebe": "Sayornis saya",
    "Scissor-Tailed Flycatcher": "Tyrannus forficatus",
    "Sharp-Shinned Hawk": "Accipiter striatus",
    "Short-Eared Owl": "Asio flammeus",
    "Snow Bunting": "Plectrophenax nivalis",
    "Snow Goose": "Anser caerulescens",
    "Snowy Egret": "Egretta thula",
    "Snowy Owl": "Bubo scandiacus",
    "Song Sparrow": "Melospiza melodia",
    "Spotted Towhee": "Pipilo maculatus",
    "Steller's Jay": "Cyanocitta stelleri",
    "Swainson's Hawk": "Buteo swainsoni",
    "Tree Swallow": "Tachycineta bicolor",
    "Trumpeter Swan": "Cygnus buccinator",
    "Tufted Puffin": "Fratercula cirrhata",
    "Tufted Titmouse": "Baeolophus bicolor",
    "Turkey Vulture": "Cathartes aura",
    "Varied Thrush": "Ixoreus naevius",
    "Vesper Sparrow": "Pooecetes gramineus",
    "Warbling Vireo": "Vireo gilvus",
    "Western Grebe": "Aechmophorus occidentalis",
    "Western Kingbird": "Tyrannus verticalis",
    "Western Meadowlark": "Sturnella neglecta",
    "Western Tanager": "Piranga ludoviciana",
    "White-Breasted Nuthatch": "Sitta carolinensis",
    "White-Crowned Sparrow": "Zonotrichia leucophrys",
    "White-Throated Sparrow": "Zonotrichia albicollis",
    "Wild Turkey": "Meleagris gallopavo",
    "Willow Flycatcher": "Empidonax traillii",
    "Wilson's Snipe": "Gallinago delicata",
    "Winter Wren": "Troglodytes hiemalis",
    "Wood Duck": "Aix sponsa",
    "Wood Thrush": "Hylocichla mustelina",
    "Yellow Warbler": "Setophaga petechia",
    "Yellow-Bellied Sapsucker": "Sphyrapicus varius",
    "Yellow-Headed Blackbird": "Xanthocephalus xanthocephalus",
    "Yellow-Rumped Warbler": "Setophaga coronata",
    // European expansion
    "Eurasian Sparrowhawk": "Accipiter nisus",
    "Common Buzzard": "Buteo buteo",
    "Eurasian Jay": "Garrulus glandarius",
    "European Robin": "Erithacus rubecula",
    "Common Kingfisher": "Alcedo atthis",
    "Great Tit": "Parus major",
    "Blue Tit": "Cyanistes caeruleus",
    "Eurasian Magpie": "Pica pica",
    "Common Starling": "Sturnus vulgaris",
    "Eurasian Blackbird": "Turdus merula",
    "Song Thrush": "Turdus philomelos",
    "Eurasian Wren": "Troglodytes troglodytes",
    "Goldcrest": "Regulus regulus",
    "White Stork": "Ciconia ciconia",
    "Grey Heron": "Ardea cinerea",
    "Common Swift": "Apus apus",
    "Barn Owl": "Tyto alba",
    "Tawny Owl": "Strix aluco",
    "Common Cuckoo": "Cuculus canorus",
    "European Bee-Eater": "Merops apiaster",
    "Hoopoe": "Upupa epops",
    "Great Spotted Woodpecker": "Dendrocopos major",
    "Common Nightingale": "Luscinia megarhynchos",
    "Mute Swan": "Cygnus olor",
    // Oceania expansion
    "Emu": "Dromaius novaehollandiae",
    "Kookaburra": "Dacelo novaeguineae",
    "Superb Fairywren": "Malurus cyaneus",
    "Galah": "Eolophus roseicapilla",
    "Sulphur-Crested Cockatoo": "Cacatua galerita",
    "Rainbow Lorikeet": "Trichoglossus moluccanus",
    "Kiwi": "Apteryx mantelli",
    "Tui": "Prosthemadera novaeseelandiae",
    "Bellbird": "Anthornis melanura",
    "Kakapo": "Strigops habroptilus"
};

const WINGSPAN_BIRDS = Object.keys(BIRD_DB);

// Build a reverse lookup: scientific name -> common name
const SCIENTIFIC_TO_COMMON = {};
for (const [common, sci] of Object.entries(BIRD_DB)) {
    SCIENTIFIC_TO_COMMON[sci.toLowerCase()] = common;
}

// Audio cache to avoid re-fetching
const audioCache = {};

// ---- Camera ----

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 2560 }
            }
        });
        camera.srcObject = stream;
        hide(cameraPlaceholder);
        hide(startCameraBtn);
        show(captureBtn);
    } catch (err) {
        console.error('Camera error:', err);
        showError('Could not access camera. Try uploading a photo instead.');
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
        camera.srcObject = null;
    }
}

function captureFrame() {
    const canvas = processingCanvas;
    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(camera, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.92);
}

// ---- OCR with multiple strategies ----

function preprocessImage(img, cropTop, cropBottom, cropLeft, cropRight) {
    const canvas = document.createElement('canvas');
    const sx = Math.floor(img.width * cropLeft);
    const sy = Math.floor(img.height * cropTop);
    const sw = Math.floor(img.width * (cropRight - cropLeft));
    const sh = Math.floor(img.height * (cropBottom - cropTop));

    // Scale up small crops for better OCR
    const scale = Math.max(1, Math.min(3, 800 / sw));
    canvas.width = sw * scale;
    canvas.height = sh * scale;
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw with high contrast
    ctx.filter = 'contrast(2.0) brightness(1.2) grayscale(1)';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    // Additional pass: threshold to black & white
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
        const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
        const val = avg > 140 ? 255 : 0;
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
    }
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/png');
}

async function recognizeBirdName(imageDataUrl) {
    loadingText.textContent = 'Reading card text...';

    const img = new Image();
    await new Promise((resolve) => {
        img.onload = resolve;
        img.src = imageDataUrl;
    });

    // Strategy 1: Top-right area where bird name typically is on Wingspan cards
    // The name is usually in the top-right quadrant in a banner
    const crops = [
        { name: 'top-right name area', top: 0, bottom: 0.15, left: 0.3, right: 1.0 },
        { name: 'top banner', top: 0, bottom: 0.2, left: 0.0, right: 1.0 },
        { name: 'upper third', top: 0, bottom: 0.33, left: 0.0, right: 1.0 },
        { name: 'full card', top: 0, bottom: 1.0, left: 0.0, right: 1.0 },
    ];

    let allOcrText = '';

    for (const crop of crops) {
        loadingText.textContent = `Scanning ${crop.name}...`;

        const processed = preprocessImage(img, crop.top, crop.bottom, crop.left, crop.right);
        const worker = await Tesseract.createWorker('eng');
        const { data } = await worker.recognize(processed);
        await worker.terminate();

        const text = data.text.trim();
        console.log(`OCR [${crop.name}]:`, text);
        allOcrText += ' ' + text;

        // Try to match after each crop
        const match = findBirdInText(allOcrText);
        if (match) {
            console.log(`Found match from ${crop.name}: ${match}`);
            return match;
        }
    }

    // Also try matching scientific names (italic text under the common name)
    const sciMatch = findScientificName(allOcrText);
    if (sciMatch) return sciMatch;

    return null;
}

function findScientificName(text) {
    if (!text) return null;
    const normalized = text.toLowerCase().replace(/[^a-z\s]/g, ' ');

    for (const [sci, common] of Object.entries(SCIENTIFIC_TO_COMMON)) {
        const parts = sci.split(' ');
        if (parts.length >= 2) {
            // Check if both genus and species appear in text
            const genus = parts[0];
            const species = parts[1];
            if (normalized.includes(genus) && normalized.includes(species)) {
                console.log(`Scientific name match: ${sci} -> ${common}`);
                return common;
            }
        }
    }
    return null;
}

function findBirdInText(text) {
    if (!text) return null;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    const normalized = text.toLowerCase().replace(/[^a-z\s'-]/g, ' ').replace(/\s+/g, ' ');

    // First: try direct substring match against known birds (longest first to avoid partial matches)
    const sortedBirds = [...WINGSPAN_BIRDS].sort((a, b) => b.length - a.length);
    for (const bird of sortedBirds) {
        if (normalized.includes(bird.toLowerCase())) {
            return bird;
        }
    }

    // Second: fuzzy match each line against known birds
    let bestMatch = null;
    let bestScore = 0;

    for (const bird of WINGSPAN_BIRDS) {
        const birdLower = bird.toLowerCase();
        const birdWords = birdLower.replace(/['-]/g, ' ').split(/\s+/).filter(w => w.length > 1);

        // Check against each line
        for (const line of lines) {
            const lineLower = line.toLowerCase().replace(/[^a-z\s]/g, ' ');
            const score = fuzzyScore(birdWords, lineLower);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = bird;
            }
        }

        // Check against whole text
        const wholeScore = fuzzyScore(birdWords, normalized);
        if (wholeScore > bestScore) {
            bestScore = wholeScore;
            bestMatch = bird;
        }
    }

    if (bestScore >= 0.7) {
        console.log(`Fuzzy match: "${bestMatch}" (score: ${bestScore.toFixed(2)})`);
        return bestMatch;
    }

    return null;
}

function fuzzyScore(birdWords, text) {
    if (birdWords.length === 0) return 0;
    let matched = 0;
    const textWords = text.split(/\s+/);

    for (const word of birdWords) {
        if (word.length <= 1) continue;

        // Direct match
        if (text.includes(word)) {
            matched++;
            continue;
        }

        // Fuzzy word-to-word match
        let bestDist = Infinity;
        for (const tw of textWords) {
            if (tw.length < 2) continue;
            const dist = editDistance(word, tw);
            if (dist < bestDist) bestDist = dist;
        }

        // Allow ~30% error rate
        const threshold = Math.max(1, Math.floor(word.length * 0.3));
        if (bestDist <= threshold) {
            matched++;
        }
    }

    return matched / birdWords.length;
}

function editDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = b[i - 1] === a[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[b.length][a.length];
}

// ---- Xeno-canto API ----

// List of CORS proxies to try (xeno-canto doesn't support CORS from browsers)
const CORS_PROXIES = [
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => url, // try direct as last resort
];

async function fetchWithCorsRetry(url) {
    for (const proxyFn of CORS_PROXIES) {
        const proxyUrl = proxyFn(url);
        try {
            const response = await fetch(proxyUrl);
            if (response.ok) {
                return response;
            }
        } catch (err) {
            console.log(`CORS proxy failed: ${proxyUrl}`, err.message);
        }
    }
    return null;
}

async function fetchBirdSound(birdName) {
    loadingText.textContent = 'Finding bird sounds...';

    // Check cache
    if (audioCache[birdName]) return audioCache[birdName];

    const scientificName = BIRD_DB[birdName] || '';

    // Try scientific name first (more reliable on xeno-canto)
    const searches = [];
    if (scientificName) {
        searches.push(scientificName);
    }
    searches.push(birdName.replace(/[']/g, '').replace(/[-]/g, ' '));

    for (const searchTerm of searches) {
        const apiUrl = `https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(searchTerm)}+q:A&page=1`;

        try {
            const response = await fetchWithCorsRetry(apiUrl);
            if (!response) continue;

            const data = await response.json();

            if (data.recordings && data.recordings.length > 0) {
                // Prefer song over call, and higher quality
                const sorted = [...data.recordings].sort((a, b) => {
                    // Prefer songs
                    const aIsSong = a.type && a.type.toLowerCase().includes('song') ? 1 : 0;
                    const bIsSong = b.type && b.type.toLowerCase().includes('song') ? 1 : 0;
                    if (bIsSong !== aIsSong) return bIsSong - aIsSong;
                    // Then by quality
                    const qOrder = { A: 5, B: 4, C: 3, D: 2, E: 1 };
                    return (qOrder[b.q] || 0) - (qOrder[a.q] || 0);
                });

                const recording = sorted[0];
                let audioUrl = recording.file;
                if (audioUrl.startsWith('//')) audioUrl = 'https:' + audioUrl;

                const result = {
                    url: audioUrl,
                    recordist: recording.rec,
                    country: recording.cnt,
                    type: recording.type,
                    quality: recording.q,
                    scientificName: recording.gen + ' ' + recording.sp
                };

                audioCache[birdName] = result;
                return result;
            }
        } catch (err) {
            console.error(`Search failed for "${searchTerm}":`, err);
        }
    }

    return null;
}

// ---- Audio Playback ----

function setupAudioPlayer(soundData) {
    let audioUrl = soundData.url;

    // Don't set crossOrigin - let the browser handle it
    birdAudio.removeAttribute('crossorigin');
    birdAudio.src = audioUrl;
    recordingInfo.textContent = `Recorded by ${soundData.recordist} in ${soundData.country} (${soundData.type})`;

    show(audioPlayer);
    hide(noSound);

    playAudio();
}

function playAudio() {
    if (isPlaying) {
        birdAudio.pause();
        playIcon.textContent = '\u25B6';
        isPlaying = false;
    } else {
        birdAudio.play().catch(err => {
            console.error('Audio playback error:', err);
            // If direct play fails, try through CORS proxy
            const currentSrc = birdAudio.src;
            if (!currentSrc.includes('corsproxy')) {
                const proxied = `https://corsproxy.io/?${encodeURIComponent(currentSrc)}`;
                birdAudio.src = proxied;
                birdAudio.play().catch(e => console.error('Proxied playback also failed:', e));
            }
        });
        playIcon.textContent = '\u23F8';
        isPlaying = true;
    }
}

birdAudio.addEventListener('timeupdate', () => {
    if (birdAudio.duration) {
        const pct = (birdAudio.currentTime / birdAudio.duration) * 100;
        audioProgressBar.style.width = pct + '%';
    }
});

birdAudio.addEventListener('ended', () => {
    playIcon.textContent = '\u25B6';
    isPlaying = false;
    audioProgressBar.style.width = '0%';
});

birdAudio.addEventListener('error', () => {
    console.error('Audio element error');
});

// ---- Manual Search ----

function setupSearch() {
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 2) {
            hide(searchResults);
            return;
        }

        const matches = WINGSPAN_BIRDS.filter(bird =>
            bird.toLowerCase().includes(query) ||
            (BIRD_DB[bird] && BIRD_DB[bird].toLowerCase().includes(query))
        ).slice(0, 8);

        if (matches.length === 0) {
            hide(searchResults);
            return;
        }

        searchResults.innerHTML = matches.map(bird =>
            `<div class="search-result-item" data-bird="${bird}">
                ${bird}
                <br><span class="sci-name">${BIRD_DB[bird] || ''}</span>
            </div>`
        ).join('');

        show(searchResults);

        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const selectedBird = item.getAttribute('data-bird');
                hide(searchResults);
                searchInput.value = '';
                playBirdByName(selectedBird);
            });
        });
    });

    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            hide(searchResults);
        }
    });
}

async function playBirdByName(bird) {
    // Show result section without an image
    hide(cameraSection);
    show(resultSection);
    hide(capturedImageContainer);
    hide(birdResult);
    hide(errorMessage);
    show(loading);
    loadingText.textContent = 'Finding bird sounds...';
    isPlaying = false;
    birdAudio.pause();
    audioProgressBar.style.width = '0%';

    birdNameEl.textContent = bird;
    birdScientific.textContent = BIRD_DB[bird] || '';

    const soundData = await fetchBirdSound(bird);
    hide(loading);
    show(birdResult);

    if (soundData) {
        birdScientific.textContent = soundData.scientificName || BIRD_DB[bird] || '';
        setupAudioPlayer(soundData);
    } else {
        hide(audioPlayer);
        show(noSound);
    }
}

// ---- Main Flow ----

async function processImage(imageDataUrl) {
    hide(cameraSection);
    show(resultSection);
    show(capturedImageContainer);
    capturedImage.src = imageDataUrl;

    hide(birdResult);
    hide(errorMessage);
    hide(audioPlayer);
    hide(noSound);
    show(loading);
    isPlaying = false;
    birdAudio.pause();
    audioProgressBar.style.width = '0%';

    try {
        const bird = await recognizeBirdName(imageDataUrl);

        if (!bird) {
            hide(loading);
            showError('Could not identify the bird name. Try a clearer photo, or use the manual search below.');
            show(resultSection);
            return;
        }

        birdNameEl.textContent = bird;

        const soundData = await fetchBirdSound(bird);
        hide(loading);
        show(birdResult);

        if (soundData) {
            birdScientific.textContent = soundData.scientificName || BIRD_DB[bird] || '';
            setupAudioPlayer(soundData);
        } else {
            birdScientific.textContent = BIRD_DB[bird] || '';
            hide(audioPlayer);
            show(noSound);
        }
    } catch (err) {
        console.error('Processing error:', err);
        hide(loading);
        showError('Something went wrong. Please try again or use manual search.');
    }
}

function showError(message) {
    errorText.textContent = message;
    show(errorMessage);
}

function resetToCamera() {
    hide(resultSection);
    show(cameraSection);
    birdAudio.pause();
    isPlaying = false;

    if (!stream) {
        show(cameraPlaceholder);
        show(startCameraBtn);
        hide(captureBtn);
    }
}

// ---- Event Listeners ----

startCameraBtn.addEventListener('click', startCamera);

captureBtn.addEventListener('click', () => {
    const imageData = captureFrame();
    stopCamera();
    processImage(imageData);
});

uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        stopCamera();
        processImage(ev.target.result);
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
});

playBtn.addEventListener('click', playAudio);
scanAgainBtn.addEventListener('click', resetToCamera);

wrongBirdBtn.addEventListener('click', () => {
    resetToCamera();
    searchInput.focus();
});

// Init
setupSearch();
