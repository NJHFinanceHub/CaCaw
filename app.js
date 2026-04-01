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
const loading = $('#loading');
const loadingText = $('#loading-text');
const birdResult = $('#bird-result');
const birdName = $('#bird-name');
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

let stream = null;
let isPlaying = false;

// Known Wingspan bird names to help with OCR matching
// This list helps fuzzy-match OCR results to actual bird names
const WINGSPAN_BIRDS = [
    "Abbott's Booby", "Acorn Woodpecker", "American Avocet", "American Bittern",
    "American Coot", "American Crow", "American Goldfinch", "American Kestrel",
    "American Oystercatcher", "American Robin", "American White Pelican",
    "Anna's Hummingbird", "Atlantic Puffin", "Bald Eagle", "Baltimore Oriole",
    "Barn Owl", "Barn Swallow", "Barred Owl", "Belted Kingfisher",
    "Black Skimmer", "Black Vulture", "Black-Chinned Hummingbird",
    "Blue Jay", "Blue-Gray Gnatcatcher", "Bobolink", "Bonelli's Eagle",
    "Borrelli's Eagle", "Broad-Winged Hawk", "Brown Pelican",
    "Brown-Headed Cowbird", "Bushtit", "California Condor", "California Quail",
    "Canada Goose", "Canvasback", "Carolina Chickadee", "Carolina Wren",
    "Cedar Waxwing", "Chimney Swift", "Chihuahuan Raven", "Clark's Nutcracker",
    "Common Grackle", "Common Loon", "Common Raven", "Common Yellowthroat",
    "Cooper's Hawk", "Dark-Eyed Junco", "Dickcissel", "Double-Crested Cormorant",
    "Downy Woodpecker", "Eastern Bluebird", "Eastern Kingbird",
    "Eastern Meadowlark", "Eastern Phoebe", "Eastern Screech-Owl",
    "Eastern Towhee", "Eurasian Collared-Dove", "European Goldfinch",
    "Evening Grosbeak", "Franklin's Gull", "Golden Eagle", "Great Blue Heron",
    "Great Crested Flycatcher", "Great Horned Owl", "Greater Flamingo",
    "Greater Roadrunner", "Green Heron", "Gyrfalcon", "Hairy Woodpecker",
    "Harlequin Duck", "Harris's Hawk", "Hermit Thrush", "Horned Lark",
    "House Finch", "House Sparrow", "House Wren", "Indigo Bunting",
    "Killdeer", "Lark Bunting", "Lazuli Bunting", "Least Flycatcher",
    "Lesser Goldfinch", "Lincoln's Sparrow", "Loggerhead Shrike",
    "Long-Eared Owl", "Mallard", "Marsh Wren", "Mississippi Kite",
    "Mocking Bird", "Mountain Bluebird", "Mourning Dove", "Mourning Warbler",
    "Northern Cardinal", "Northern Flicker", "Northern Gannet",
    "Northern Harrier", "Northern Mockingbird", "Northern Pintail",
    "Northern Saw-Whet Owl", "Osprey", "Ovenbird", "Painted Bunting",
    "Peregrine Falcon", "Pied-Billed Grebe", "Pileated Woodpecker",
    "Pine Grosbeak", "Pine Siskin", "Pine Warbler", "Prairie Falcon",
    "Purple Finch", "Purple Martin", "Red Crossbill", "Red Knot",
    "Red-Bellied Woodpecker", "Red-Breasted Nuthatch", "Red-Eyed Vireo",
    "Red-Headed Woodpecker", "Red-Shouldered Hawk", "Red-Tailed Hawk",
    "Red-Winged Blackbird", "Ring-Billed Gull", "Ring-Necked Duck",
    "Rose-Breasted Grosbeak", "Roseate Spoonbill", "Ruby-Crowned Kinglet",
    "Ruby-Throated Hummingbird", "Ruddy Duck", "Rufous Hummingbird",
    "Sandhill Crane", "Savannah Sparrow", "Say's Phoebe", "Scissor-Tailed Flycatcher",
    "Sharp-Shinned Hawk", "Short-Eared Owl", "Snow Bunting", "Snow Goose",
    "Snowy Egret", "Snowy Owl", "Song Sparrow", "Spotted Towhee",
    "Steller's Jay", "Swainson's Hawk", "Tree Swallow", "Trumpeter Swan",
    "Tufted Puffin", "Tufted Titmouse", "Turkey Vulture", "Varied Thrush",
    "Vesper Sparrow", "Warbling Vireo", "Western Grebe", "Western Kingbird",
    "Western Meadowlark", "Western Tanager", "White-Breasted Nuthatch",
    "White-Crowned Sparrow", "White-Throated Sparrow", "Wild Turkey",
    "Willow Flycatcher", "Wilson's Snipe", "Winter Wren", "Wood Duck",
    "Wood Thrush", "Yellow Warbler", "Yellow-Bellied Sapsucker",
    "Yellow-Headed Blackbird", "Yellow-Rumped Warbler"
];

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
    return canvas.toDataURL('image/jpeg', 0.9);
}

// ---- OCR ----

async function recognizeBirdName(imageDataUrl) {
    loadingText.textContent = 'Reading card text...';

    const worker = await Tesseract.createWorker('eng');

    // Create an image element to get dimensions for cropping
    const img = new Image();
    await new Promise((resolve) => {
        img.onload = resolve;
        img.src = imageDataUrl;
    });

    // Crop to the top portion of the image where the bird name usually is
    const cropCanvas = document.createElement('canvas');
    const cropHeight = Math.floor(img.height * 0.25);
    cropCanvas.width = img.width;
    cropCanvas.height = cropHeight;
    const cropCtx = cropCanvas.getContext('2d');

    // Increase contrast for better OCR
    cropCtx.filter = 'contrast(1.8) brightness(1.1)';
    cropCtx.drawImage(img, 0, 0, img.width, cropHeight, 0, 0, img.width, cropHeight);

    const cropDataUrl = cropCanvas.toDataURL('image/jpeg', 0.95);

    const { data } = await worker.recognize(cropDataUrl);
    await worker.terminate();

    const fullText = data.text;
    console.log('OCR text (top crop):', fullText);

    // Also try full image if top crop fails
    let birdMatch = findBirdInText(fullText);

    if (!birdMatch) {
        loadingText.textContent = 'Scanning full card...';
        const worker2 = await Tesseract.createWorker('eng');
        const { data: fullData } = await worker2.recognize(imageDataUrl);
        await worker2.terminate();
        console.log('OCR text (full):', fullData.text);
        birdMatch = findBirdInText(fullData.text);
    }

    return birdMatch;
}

function findBirdInText(text) {
    if (!text) return null;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    const normalized = text.toLowerCase().replace(/[^a-z\s'-]/g, ' ');

    // First: try direct substring match against known birds
    for (const bird of WINGSPAN_BIRDS) {
        if (normalized.includes(bird.toLowerCase())) {
            return bird;
        }
    }

    // Second: fuzzy match each line against known birds
    let bestMatch = null;
    let bestScore = 0;

    for (const bird of WINGSPAN_BIRDS) {
        const birdLower = bird.toLowerCase();
        const birdWords = birdLower.replace(/['-]/g, ' ').split(/\s+/);

        for (const line of lines) {
            const lineLower = line.toLowerCase().replace(/[^a-z\s]/g, ' ');
            const score = fuzzyScore(birdWords, lineLower);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = bird;
            }
        }

        // Also check the whole normalized text
        const wholeScore = fuzzyScore(birdWords, normalized);
        if (wholeScore > bestScore) {
            bestScore = wholeScore;
            bestMatch = bird;
        }
    }

    // Require a reasonable match score
    if (bestScore >= 0.6) {
        console.log(`Fuzzy match: "${bestMatch}" (score: ${bestScore.toFixed(2)})`);
        return bestMatch;
    }

    // Fallback: try to extract any plausible bird name from text
    // Look for capitalized multi-word names
    const capitalPattern = /([A-Z][a-z]+(?:[-'\s][A-Z][a-z]+)+)/g;
    const matches = text.match(capitalPattern);
    if (matches && matches.length > 0) {
        // Return the longest match as it's most likely the full bird name
        matches.sort((a, b) => b.length - a.length);
        return matches[0];
    }

    return null;
}

function fuzzyScore(birdWords, text) {
    let matched = 0;
    for (const word of birdWords) {
        if (word.length <= 1) continue;
        // Allow partial word matches (at least 70% of characters)
        const minLen = Math.ceil(word.length * 0.7);
        const wordChars = word.substring(0, minLen);
        if (text.includes(word) || text.includes(wordChars)) {
            matched++;
        } else {
            // Check edit distance for short words
            const textWords = text.split(/\s+/);
            for (const tw of textWords) {
                if (editDistance(word, tw) <= Math.floor(word.length * 0.3)) {
                    matched++;
                    break;
                }
            }
        }
    }
    return birdWords.length > 0 ? matched / birdWords.length : 0;
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

async function fetchBirdSound(birdName) {
    loadingText.textContent = 'Finding bird sounds...';

    // Clean up the name for searching
    const searchName = birdName
        .replace(/[']/g, '')
        .replace(/[-]/g, ' ');

    // Use the xeno-canto API via their CORS-friendly endpoint
    const url = `https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(searchName)}+q:A&page=1`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();

        if (data.recordings && data.recordings.length > 0) {
            // Pick a high-quality recording (quality A is best)
            const recording = data.recordings[0];
            return {
                url: recording.file,
                recordist: recording.rec,
                country: recording.cnt,
                type: recording.type,
                quality: recording.q,
                scientificName: recording.gen + ' ' + recording.sp
            };
        }

        // Try with just the common name words
        const words = birdName.split(/[\s-]+/).filter(w => w.length > 2);
        if (words.length > 1) {
            const simpleSearch = words.join(' ');
            const url2 = `https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(simpleSearch)}+q:A&page=1`;
            const response2 = await fetch(url2);
            if (response2.ok) {
                const data2 = await response2.json();
                if (data2.recordings && data2.recordings.length > 0) {
                    const recording = data2.recordings[0];
                    return {
                        url: recording.file,
                        recordist: recording.rec,
                        country: recording.cnt,
                        type: recording.type,
                        quality: recording.q,
                        scientificName: recording.gen + ' ' + recording.sp
                    };
                }
            }
        }

        return null;
    } catch (err) {
        console.error('Xeno-canto API error:', err);
        return null;
    }
}

// ---- Audio Playback ----

function setupAudioPlayer(soundData) {
    // Xeno-canto serves files over HTTPS
    let audioUrl = soundData.url;
    if (audioUrl.startsWith('//')) {
        audioUrl = 'https:' + audioUrl;
    }

    birdAudio.src = audioUrl;
    birdAudio.crossOrigin = 'anonymous';
    recordingInfo.textContent = `Recorded by ${soundData.recordist} in ${soundData.country} (${soundData.type})`;

    show(audioPlayer);
    hide(noSound);

    // Auto-play
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

// ---- Main Flow ----

async function processImage(imageDataUrl) {
    // Switch to result view
    hide(cameraSection);
    show(resultSection);
    capturedImage.src = imageDataUrl;

    // Reset state
    hide(birdResult);
    hide(errorMessage);
    hide(audioPlayer);
    hide(noSound);
    show(loading);
    isPlaying = false;
    birdAudio.pause();
    audioProgressBar.style.width = '0%';

    try {
        // Step 1: OCR to find bird name
        const bird = await recognizeBirdName(imageDataUrl);

        if (!bird) {
            hide(loading);
            showError('Could not identify a bird name on the card. Try getting a clearer photo of the card name.');
            return;
        }

        birdName.textContent = bird;

        // Step 2: Fetch bird sound
        const soundData = await fetchBirdSound(bird);

        hide(loading);
        show(birdResult);

        if (soundData) {
            birdScientific.textContent = soundData.scientificName || '';
            setupAudioPlayer(soundData);
        } else {
            birdScientific.textContent = '';
            hide(audioPlayer);
            show(noSound);
        }

    } catch (err) {
        console.error('Processing error:', err);
        hide(loading);
        showError('Something went wrong while processing the card. Please try again.');
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

uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

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
