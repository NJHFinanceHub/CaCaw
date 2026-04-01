// CaCaw - Wingspan Bird Sound Scanner
const $ = (sel) => document.querySelector(sel);
const show = (el) => el.classList.remove('hidden');
const hide = (el) => el.classList.add('hidden');

// DOM elements - matching new UI
const camera = $('#camera');
const scanBtn = $('#scan-btn');
const uploadBtn = $('#upload-btn');
const fileInput = $('#file-input');
const scanLoading = $('#scan-loading');
const loadingText = $('#loading-text');
const resultSheet = $('#result-sheet');
const birdResult = $('#bird-result');
const birdNameEl = $('#bird-name');
const birdScientific = $('#bird-scientific');
const audioPlayer = $('#audio-player');
const playBtn = $('#play-btn');
const playIcon = $('.play-icon');
const birdAudio = $('#bird-audio');
const recordingInfo = $('#recording-info');
const audioProgressBar = $('#audio-progress-bar');
const xcEmbedPlayer = $('#xc-embed-player');
const xcIframe = $('#xc-iframe');
const xcEmbedInfo = $('#xc-embed-info');
const noSound = $('#no-sound');
const errorMessage = $('#error-message');
const errorText = $('#error-text');
const dismissBtn = $('#dismiss-btn');
const wrongBirdBtn = $('#wrong-bird-btn');
const processingCanvas = $('#processing-canvas');
const searchInput = $('#search-input');
const searchResults = $('#search-results');

let stream = null;
let isPlaying = false;
let tesseractWorker = null;

// ---- Bird Database ----
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
    "Tawny Owl": "Strix aluco",
    "Common Cuckoo": "Cuculus canorus",
    "European Bee-Eater": "Merops apiaster",
    "Hoopoe": "Upupa epops",
    "Great Spotted Woodpecker": "Dendrocopos major",
    "Common Nightingale": "Luscinia megarhynchos",
    "Mute Swan": "Cygnus olor",
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
const SCIENTIFIC_TO_COMMON = {};
for (const [common, sci] of Object.entries(BIRD_DB)) {
    SCIENTIFIC_TO_COMMON[sci.toLowerCase()] = common;
}
const audioCache = {};

// ---- Camera (auto-start) ----

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 2560 } }
        });
        camera.srcObject = stream;
    } catch (err) {
        console.error('Camera error:', err);
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

// ---- Improved OCR ----

async function getWorker() {
    if (!tesseractWorker) {
        tesseractWorker = await Tesseract.createWorker('eng');
    }
    return tesseractWorker;
}

function preprocessImage(img, crop, threshold, invert) {
    const canvas = document.createElement('canvas');
    const sx = Math.floor(img.width * crop.left);
    const sy = Math.floor(img.height * crop.top);
    const sw = Math.floor(img.width * (crop.right - crop.left));
    const sh = Math.floor(img.height * (crop.bottom - crop.top));

    const scale = Math.max(1, Math.min(4, 1000 / sw));
    canvas.width = sw * scale;
    canvas.height = sh * scale;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sharpen: draw slightly blurred then overlay sharp (unsharp mask effect)
    ctx.filter = 'contrast(2.0) brightness(1.2) grayscale(1)';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    // Apply sharpening convolution
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const sharpened = sharpenImageData(imageData);

    // Threshold to B&W
    const d = sharpened.data;
    for (let i = 0; i < d.length; i += 4) {
        const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
        let val = avg > threshold ? 255 : 0;
        if (invert) val = 255 - val;
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
    }
    ctx.putImageData(sharpened, 0, 0);

    return canvas.toDataURL('image/png');
}

function sharpenImageData(imageData) {
    const w = imageData.width;
    const h = imageData.height;
    const src = imageData.data;
    const output = new ImageData(new Uint8ClampedArray(src), w, h);
    const dst = output.data;

    // Sharpening kernel: [0,-1,0,-1,5,-1,0,-1,0]
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            for (let c = 0; c < 3; c++) {
                const i = (y * w + x) * 4 + c;
                dst[i] = Math.min(255, Math.max(0,
                    5 * src[i]
                    - src[((y - 1) * w + x) * 4 + c]
                    - src[((y + 1) * w + x) * 4 + c]
                    - src[(y * w + x - 1) * 4 + c]
                    - src[(y * w + x + 1) * 4 + c]
                ));
            }
            dst[(y * w + x) * 4 + 3] = 255;
        }
    }
    return output;
}

async function recognizeBirdName(imageDataUrl) {
    loadingText.textContent = 'Reading card text...';

    const img = new Image();
    await new Promise((resolve) => { img.onload = resolve; img.src = imageDataUrl; });

    const crops = [
        { name: 'top-right name', top: 0, bottom: 0.15, left: 0.3, right: 1.0 },
        { name: 'top banner', top: 0, bottom: 0.22, left: 0.0, right: 1.0 },
        { name: 'upper third', top: 0, bottom: 0.35, left: 0.0, right: 1.0 },
        { name: 'full card', top: 0, bottom: 1.0, left: 0.0, right: 1.0 },
    ];
    const thresholds = [140, 100, 180];

    const worker = await getWorker();
    let allOcrText = '';

    for (const crop of crops) {
        for (const thresh of thresholds) {
            // Try normal and inverted
            for (const invert of [false, true]) {
                loadingText.textContent = `Scanning ${crop.name}...`;
                const processed = preprocessImage(img, crop, thresh, invert);
                const { data } = await worker.recognize(processed);
                const text = data.text.trim();
                if (text.length > 2) {
                    console.log(`OCR [${crop.name} t=${thresh} inv=${invert}]:`, text);
                    allOcrText += ' ' + text;

                    const match = findBirdInText(allOcrText);
                    if (match) {
                        console.log(`Match found: ${match}`);
                        return match;
                    }
                }
            }
        }
    }

    const sciMatch = findScientificName(allOcrText);
    if (sciMatch) return sciMatch;

    return null;
}

function findScientificName(text) {
    if (!text) return null;
    const normalized = text.toLowerCase().replace(/[^a-z\s]/g, ' ');
    for (const [sci, common] of Object.entries(SCIENTIFIC_TO_COMMON)) {
        const parts = sci.split(' ');
        if (parts.length >= 2 && normalized.includes(parts[0]) && normalized.includes(parts[1])) {
            return common;
        }
    }
    return null;
}

function findBirdInText(text) {
    if (!text) return null;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    const normalized = text.toLowerCase().replace(/[^a-z\s'-]/g, ' ').replace(/\s+/g, ' ');

    const sortedBirds = [...WINGSPAN_BIRDS].sort((a, b) => b.length - a.length);
    for (const bird of sortedBirds) {
        if (normalized.includes(bird.toLowerCase())) return bird;
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const bird of WINGSPAN_BIRDS) {
        const birdWords = bird.toLowerCase().replace(/['-]/g, ' ').split(/\s+/).filter(w => w.length > 1);
        for (const line of lines) {
            const lineLower = line.toLowerCase().replace(/[^a-z\s]/g, ' ');
            const score = fuzzyScore(birdWords, lineLower);
            if (score > bestScore) { bestScore = score; bestMatch = bird; }
        }
        const wholeScore = fuzzyScore(birdWords, normalized);
        if (wholeScore > bestScore) { bestScore = wholeScore; bestMatch = bird; }
    }

    // Lowered threshold from 0.7 to 0.55 for blurry photos
    if (bestScore >= 0.55) return bestMatch;
    return null;
}

function fuzzyScore(birdWords, text) {
    if (birdWords.length === 0) return 0;
    let matched = 0;
    const textWords = text.split(/\s+/);
    for (const word of birdWords) {
        if (word.length <= 1) continue;
        if (text.includes(word)) { matched++; continue; }
        let bestDist = Infinity;
        for (const tw of textWords) {
            if (tw.length < 2) continue;
            const dist = editDistance(word, tw);
            if (dist < bestDist) bestDist = dist;
        }
        if (bestDist <= Math.max(1, Math.floor(word.length * 0.35))) matched++;
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
            matrix[i][j] = Math.min(matrix[i-1][j]+1, matrix[i][j-1]+1, matrix[i-1][j-1]+cost);
        }
    }
    return matrix[b.length][a.length];
}

// ---- Sound Fetching ----

async function fetchBirdSound(birdName) {
    loadingText.textContent = 'Finding bird sounds...';
    if (audioCache[birdName]) return audioCache[birdName];
    const scientificName = BIRD_DB[birdName] || '';

    const wikiResult = await fetchFromWikimedia(birdName, scientificName);
    if (wikiResult) { audioCache[birdName] = wikiResult; return wikiResult; }

    const xcResult = await fetchFromXenoCanto(birdName, scientificName);
    if (xcResult) { audioCache[birdName] = xcResult; return xcResult; }

    return null;
}

async function fetchFromWikimedia(birdName, scientificName) {
    const searches = [scientificName, birdName].filter(Boolean);
    for (const term of searches) {
        try {
            const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term + ' bird sound')}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime|extmetadata&format=json&origin=*`;
            const resp = await fetch(url);
            if (!resp.ok) continue;
            const data = await resp.json();
            if (!data.query || !data.query.pages) continue;
            for (const page of Object.values(data.query.pages)) {
                if (!page.imageinfo) continue;
                const info = page.imageinfo[0];
                if ((info.mime || '').startsWith('audio/')) {
                    const meta = info.extmetadata || {};
                    return { type: 'wikimedia', url: info.url, source: 'Wikimedia Commons',
                        description: meta.ImageDescription ? meta.ImageDescription.value.replace(/<[^>]*>/g, '') : '',
                        scientificName };
                }
            }
        } catch (err) { console.error('Wikimedia search failed:', err); }
    }

    for (const term of searches) {
        try {
            const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(term)}&prop=images&format=json&origin=*`;
            const resp = await fetch(url);
            if (!resp.ok) continue;
            const data = await resp.json();
            if (!data.query || !data.query.pages) continue;
            for (const page of Object.values(data.query.pages)) {
                if (!page.images) continue;
                for (const img of page.images) {
                    const title = img.title || '';
                    if (title.match(/\.(ogg|mp3|wav|flac)$/i)) {
                        const fileUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|mime&format=json&origin=*`;
                        const fileResp = await fetch(fileUrl);
                        if (!fileResp.ok) continue;
                        const fileData = await fileResp.json();
                        for (const fp of Object.values(fileData.query.pages)) {
                            if (fp.imageinfo && fp.imageinfo[0].mime.startsWith('audio/')) {
                                return { type: 'wikimedia', url: fp.imageinfo[0].url, source: 'Wikimedia Commons',
                                    description: title.replace('File:', '').replace(/\.[^.]+$/, ''), scientificName };
                            }
                        }
                    }
                }
            }
        } catch (err) { console.error('Wikipedia search failed:', err); }
    }
    return null;
}

async function fetchFromXenoCanto(birdName, scientificName) {
    const searches = [scientificName, birdName.replace(/[']/g, '').replace(/[-]/g, ' ')].filter(Boolean);
    for (const searchTerm of searches) {
        const apiUrl = `https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(searchTerm)}+q:A&page=1`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) continue;
            const wrapper = await response.json();
            const data = JSON.parse(wrapper.contents);
            if (data.recordings && data.recordings.length > 0) {
                const sorted = [...data.recordings].sort((a, b) => {
                    const aS = a.type && a.type.toLowerCase().includes('song') ? 1 : 0;
                    const bS = b.type && b.type.toLowerCase().includes('song') ? 1 : 0;
                    if (bS !== aS) return bS - aS;
                    const q = { A: 5, B: 4, C: 3, D: 2, E: 1 };
                    return (q[b.q] || 0) - (q[a.q] || 0);
                });
                const rec = sorted[0];
                return { type: 'xeno-canto', id: rec.id,
                    url: (rec.file.startsWith('//') ? 'https:' : '') + rec.file,
                    recordist: rec.rec, country: rec.cnt, recordingType: rec.type,
                    quality: rec.q, scientificName: rec.gen + ' ' + rec.sp };
            }
        } catch (err) { console.error(`XC search failed for "${searchTerm}":`, err); }
    }
    return null;
}

// ---- Audio Playback ----

function setupAudioPlayer(soundData) {
    hide(audioPlayer);
    hide(xcEmbedPlayer);

    if (soundData.type === 'wikimedia') {
        birdAudio.src = soundData.url;
        recordingInfo.textContent = soundData.description || `Source: ${soundData.source}`;
        show(audioPlayer);
        hide(noSound);
        playAudio();
    } else if (soundData.type === 'xeno-canto') {
        birdAudio.src = soundData.url;
        recordingInfo.textContent = `Recorded by ${soundData.recordist} in ${soundData.country} (${soundData.recordingType})`;
        show(audioPlayer);
        hide(noSound);
        birdAudio.play().then(() => {
            playIcon.textContent = '\u23F8';
            isPlaying = true;
        }).catch(() => {
            hide(audioPlayer);
            xcIframe.src = `https://xeno-canto.org/${soundData.id}/embed?simple=1`;
            xcEmbedInfo.textContent = `Recorded by ${soundData.recordist} in ${soundData.country}`;
            show(xcEmbedPlayer);
        });
        return;
    }
}

function playAudio() {
    if (isPlaying) {
        birdAudio.pause();
        playIcon.textContent = '\u25B6';
        isPlaying = false;
    } else {
        birdAudio.play().catch(err => console.error('Audio error:', err));
        playIcon.textContent = '\u23F8';
        isPlaying = true;
    }
}

birdAudio.addEventListener('timeupdate', () => {
    if (birdAudio.duration) {
        audioProgressBar.style.width = (birdAudio.currentTime / birdAudio.duration) * 100 + '%';
    }
});

birdAudio.addEventListener('ended', () => {
    playIcon.textContent = '\u25B6';
    isPlaying = false;
    audioProgressBar.style.width = '0%';
});

// ---- UI: Bottom Sheet ----

function showSheet() {
    show(resultSheet);
    requestAnimationFrame(() => resultSheet.classList.add('open'));
}

function hideSheet() {
    resultSheet.classList.remove('open');
    setTimeout(() => {
        hide(resultSheet);
        hide(birdResult);
        hide(errorMessage);
    }, 350);
    resetAudioState();
}

function resetAudioState() {
    isPlaying = false;
    birdAudio.pause();
    birdAudio.removeAttribute('src');
    xcIframe.removeAttribute('src');
    audioProgressBar.style.width = '0%';
}

// ---- Manual Search ----

function setupSearch() {
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 2) { hide(searchResults); return; }

        const matches = WINGSPAN_BIRDS.filter(bird =>
            bird.toLowerCase().includes(query) ||
            (BIRD_DB[bird] && BIRD_DB[bird].toLowerCase().includes(query))
        ).slice(0, 8);

        if (matches.length === 0) { hide(searchResults); return; }

        searchResults.innerHTML = matches.map(bird =>
            `<div class="search-result-item" data-bird="${bird}">
                ${bird}<br><span class="sci-name">${BIRD_DB[bird] || ''}</span>
            </div>`
        ).join('');
        show(searchResults);

        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const bird = item.getAttribute('data-bird');
                hide(searchResults);
                searchInput.value = '';
                playBirdByName(bird);
            });
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) hide(searchResults);
    });
}

async function playBirdByName(bird) {
    hide(birdResult);
    hide(errorMessage);
    hide(audioPlayer);
    hide(xcEmbedPlayer);
    hide(noSound);
    show(scanLoading);
    loadingText.textContent = 'Finding bird sounds...';
    showSheet();

    birdNameEl.textContent = bird;
    birdScientific.textContent = BIRD_DB[bird] || '';

    const soundData = await fetchBirdSound(bird);
    hide(scanLoading);
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
    hide(birdResult);
    hide(errorMessage);
    hide(audioPlayer);
    hide(xcEmbedPlayer);
    hide(noSound);
    show(scanLoading);
    scanBtn.classList.add('scanning');

    try {
        const bird = await recognizeBirdName(imageDataUrl);
        if (!bird) {
            hide(scanLoading);
            scanBtn.classList.remove('scanning');
            showSheet();
            showError('Could not read the bird name. Try a closer/clearer photo, or search manually above.');
            return;
        }

        birdNameEl.textContent = bird;
        loadingText.textContent = 'Finding bird sounds...';

        const soundData = await fetchBirdSound(bird);
        hide(scanLoading);
        scanBtn.classList.remove('scanning');
        showSheet();
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
        hide(scanLoading);
        scanBtn.classList.remove('scanning');
        showSheet();
        showError('Something went wrong. Try again or search manually.');
    }
}

function showError(message) {
    errorText.textContent = message;
    show(errorMessage);
}

// ---- Event Listeners ----

scanBtn.addEventListener('click', () => {
    if (!stream) { startCamera(); return; }
    const imageData = captureFrame();
    processImage(imageData);
});

uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processImage(ev.target.result);
    reader.readAsDataURL(file);
    fileInput.value = '';
});

playBtn.addEventListener('click', playAudio);
dismissBtn.addEventListener('click', hideSheet);

wrongBirdBtn.addEventListener('click', () => {
    hideSheet();
    searchInput.focus();
});

// ---- Init ----
setupSearch();
startCamera();
