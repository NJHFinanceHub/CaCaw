// CaCaw WingDex - Wingspan Bird Scanner (Pokedex edition)
const $ = (sel) => document.querySelector(sel);
const show = (el) => el && el.classList.remove('hidden');
const hide = (el) => el && el.classList.add('hidden');

// DOM elements
const camera = $('#camera');
const cameraView = $('#camera-view');
const entryView = $('#entry-view');
const scanBtn = $('#scan-btn');
const uploadBtn = $('#upload-btn');
const fileInput = $('#file-input');
const backBtn = $('#back-btn');
const speakBtn = $('#speak-btn');
const scanLoading = $('#scan-loading');
const loadingText = $('#loading-text');
const entryNumber = $('#entry-number');
const entryName = $('#entry-name');
const entrySci = $('#entry-sci');
const entryFact = $('#entry-fact');
const entryStatus = $('#entry-status');
const entryPhoto = $('#entry-photo');
const entryPhotoPlaceholder = $('#entry-photo-placeholder');
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
const processingCanvas = $('#processing-canvas');
const searchInput = $('#search-input');
const searchResults = $('#search-results');
const ledScan = $('#led-scan');
const ledVoice = $('#led-voice');
const ledSound = $('#led-sound');
const pokedexView = $('#pokedex-view');
const pokedexGrid = $('#pokedex-grid');
const pokedexStats = $('#pokedex-stats');
const dexBtn = $('#dex-btn');

let stream = null;
let isPlaying = false;
let tesseractWorker = null;
let currentBird = null;
let typewriterTimer = null;
let speechUnlocked = false;
let audioUnlocked = false;

// ---- Bird Database ----
// Covers Wingspan base game, European and Oceania expansions.
const BIRD_DB = {
    // --- Base game (North America) ---
    "Acorn Woodpecker": "Melanerpes formicivorus",
    "American Avocet": "Recurvirostra americana",
    "American Bittern": "Botaurus lentiginosus",
    "American Coot": "Fulica americana",
    "American Crow": "Corvus brachyrhynchos",
    "American Goldfinch": "Spinus tristis",
    "American Kestrel": "Falco sparverius",
    "American Oystercatcher": "Haematopus palliatus",
    "American Redstart": "Setophaga ruticilla",
    "American Robin": "Turdus migratorius",
    "American White Pelican": "Pelecanus erythrorhynchos",
    "American Woodcock": "Scolopax minor",
    "Anhinga": "Anhinga anhinga",
    "Anna's Hummingbird": "Calypte anna",
    "Ash-Throated Flycatcher": "Myiarchus cinerascens",
    "Atlantic Puffin": "Fratercula arctica",
    "Baird's Sparrow": "Centronyx bairdii",
    "Bald Eagle": "Haliaeetus leucocephalus",
    "Baltimore Oriole": "Icterus galbula",
    "Barn Owl": "Tyto alba",
    "Barn Swallow": "Hirundo rustica",
    "Barred Owl": "Strix varia",
    "Barrow's Goldeneye": "Bucephala islandica",
    "Bell's Vireo": "Vireo bellii",
    "Belted Kingfisher": "Megaceryle alcyon",
    "Bewick's Wren": "Thryomanes bewickii",
    "Black Skimmer": "Rynchops niger",
    "Black Tern": "Chlidonias niger",
    "Black Vulture": "Coragyps atratus",
    "Black-Bellied Whistling-Duck": "Dendrocygna autumnalis",
    "Black-Billed Magpie": "Pica hudsonia",
    "Black-Chinned Hummingbird": "Archilochus alexandri",
    "Black-Crowned Night-Heron": "Nycticorax nycticorax",
    "Black-Necked Stilt": "Himantopus mexicanus",
    "Blue Grosbeak": "Passerina caerulea",
    "Blue Jay": "Cyanocitta cristata",
    "Blue-Gray Gnatcatcher": "Polioptila caerulea",
    "Blue-Winged Warbler": "Vermivora cyanoptera",
    "Bobolink": "Dolichonyx oryzivorus",
    "Brant": "Branta bernicla",
    "Brewer's Blackbird": "Euphagus cyanocephalus",
    "Broad-Tailed Hummingbird": "Selasphorus platycercus",
    "Broad-Winged Hawk": "Buteo platypterus",
    "Bronzed Cowbird": "Molothrus aeneus",
    "Brown Creeper": "Certhia americana",
    "Brown Pelican": "Pelecanus occidentalis",
    "Brown-Headed Cowbird": "Molothrus ater",
    "Burrowing Owl": "Athene cunicularia",
    "Bushtit": "Psaltriparus minimus",
    "California Condor": "Gymnogyps californianus",
    "California Quail": "Callipepla californica",
    "Canada Goose": "Branta canadensis",
    "Canvasback": "Aythya valisineria",
    "Carolina Chickadee": "Poecile carolinensis",
    "Carolina Wren": "Thryothorus ludovicianus",
    "Caspian Tern": "Hydroprogne caspia",
    "Cassin's Finch": "Haemorhous cassinii",
    "Cassin's Sparrow": "Peucaea cassinii",
    "Cedar Waxwing": "Bombycilla cedrorum",
    "Cerulean Warbler": "Setophaga cerulea",
    "Chestnut-Collared Longspur": "Calcarius ornatus",
    "Chihuahuan Raven": "Corvus cryptoleucus",
    "Chimney Swift": "Chaetura pelagica",
    "Chipping Sparrow": "Spizella passerina",
    "Clark's Grebe": "Aechmophorus clarkii",
    "Clark's Nutcracker": "Nucifraga columbiana",
    "Cliff Swallow": "Petrochelidon pyrrhonota",
    "Common Grackle": "Quiscalus quiscula",
    "Common Loon": "Gavia immer",
    "Common Merganser": "Mergus merganser",
    "Common Nighthawk": "Chordeiles minor",
    "Common Raven": "Corvus corax",
    "Common Yellowthroat": "Geothlypis trichas",
    "Cooper's Hawk": "Accipiter cooperii",
    "Crested Caracara": "Caracara plancus",
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
    "European Starling": "Sturnus vulgaris",
    "Evening Grosbeak": "Coccothraustes vespertinus",
    "Ferruginous Hawk": "Buteo regalis",
    "Forster's Tern": "Sterna forsteri",
    "Franklin's Gull": "Leucophaeus pipixcan",
    "Golden Eagle": "Aquila chrysaetos",
    "Grasshopper Sparrow": "Ammodramus savannarum",
    "Gray Catbird": "Dumetella carolinensis",
    "Great Blue Heron": "Ardea herodias",
    "Great Crested Flycatcher": "Myiarchus crinitus",
    "Great Egret": "Ardea alba",
    "Great Horned Owl": "Bubo virginianus",
    "Greater Prairie-Chicken": "Tympanuchus cupido",
    "Greater Roadrunner": "Geococcyx californianus",
    "Green Heron": "Butorides virescens",
    "Gyrfalcon": "Falco rusticolus",
    "Hairy Woodpecker": "Dryobates villosus",
    "Harlequin Duck": "Histrionicus histrionicus",
    "Harris's Hawk": "Parabuteo unicinctus",
    "Hermit Thrush": "Catharus guttatus",
    "Hooded Merganser": "Lophodytes cucullatus",
    "Hooded Warbler": "Setophaga citrina",
    "Horned Lark": "Eremophila alpestris",
    "House Finch": "Haemorhous mexicanus",
    "House Sparrow": "Passer domesticus",
    "House Wren": "Troglodytes aedon",
    "Inca Dove": "Columbina inca",
    "Indigo Bunting": "Passerina cyanea",
    "Juniper Titmouse": "Baeolophus ridgwayi",
    "Killdeer": "Charadrius vociferus",
    "King Rail": "Rallus elegans",
    "Lark Bunting": "Calamospiza melanocorys",
    "Lazuli Bunting": "Passerina amoena",
    "Least Flycatcher": "Empidonax minimus",
    "Lesser Goldfinch": "Spinus psaltria",
    "Lewis's Woodpecker": "Melanerpes lewis",
    "Lincoln's Sparrow": "Melospiza lincolnii",
    "Loggerhead Shrike": "Lanius ludovicianus",
    "Long-Eared Owl": "Asio otus",
    "Mallard": "Anas platyrhynchos",
    "Marsh Wren": "Cistothorus palustris",
    "Mississippi Kite": "Ictinia mississippiensis",
    "Mountain Bluebird": "Sialia currucoides",
    "Mountain Chickadee": "Poecile gambeli",
    "Mourning Dove": "Zenaida macroura",
    "Mourning Warbler": "Geothlypis philadelphia",
    "Northern Bobwhite": "Colinus virginianus",
    "Northern Cardinal": "Cardinalis cardinalis",
    "Northern Flicker": "Colaptes auratus",
    "Northern Gannet": "Morus bassanus",
    "Northern Harrier": "Circus hudsonius",
    "Northern Mockingbird": "Mimus polyglottos",
    "Northern Pintail": "Anas acuta",
    "Northern Saw-Whet Owl": "Aegolius acadicus",
    "Northern Shoveler": "Spatula clypeata",
    "Osprey": "Pandion haliaetus",
    "Ovenbird": "Seiurus aurocapilla",
    "Painted Bunting": "Passerina ciris",
    "Painted Whitestart": "Myioborus pictus",
    "Peregrine Falcon": "Falco peregrinus",
    "Pied-Billed Grebe": "Podilymbus podiceps",
    "Pileated Woodpecker": "Dryocopus pileatus",
    "Pine Grosbeak": "Pinicola enucleator",
    "Pine Siskin": "Spinus pinus",
    "Pine Warbler": "Setophaga pinus",
    "Prairie Falcon": "Falco mexicanus",
    "Prothonotary Warbler": "Protonotaria citrea",
    "Purple Finch": "Haemorhous purpureus",
    "Purple Gallinule": "Porphyrio martinica",
    "Purple Martin": "Progne subis",
    "Pygmy Nuthatch": "Sitta pygmaea",
    "Red Crossbill": "Loxia curvirostra",
    "Red Knot": "Calidris canutus",
    "Red-Bellied Woodpecker": "Melanerpes carolinus",
    "Red-Breasted Merganser": "Mergus serrator",
    "Red-Breasted Nuthatch": "Sitta canadensis",
    "Red-Cockaded Woodpecker": "Dryobates borealis",
    "Red-Eyed Vireo": "Vireo olivaceus",
    "Red-Headed Woodpecker": "Melanerpes erythrocephalus",
    "Red-Shouldered Hawk": "Buteo lineatus",
    "Red-Tailed Hawk": "Buteo jamaicensis",
    "Red-Winged Blackbird": "Agelaius phoeniceus",
    "Ring-Billed Gull": "Larus delawarensis",
    "Ring-Necked Duck": "Aythya collaris",
    "Ring-Necked Pheasant": "Phasianus colchicus",
    "Rose-Breasted Grosbeak": "Pheucticus ludovicianus",
    "Roseate Spoonbill": "Platalea ajaja",
    "Ruby-Crowned Kinglet": "Corthylio calendula",
    "Ruby-Throated Hummingbird": "Archilochus colubris",
    "Ruddy Duck": "Oxyura jamaicensis",
    "Ruffed Grouse": "Bonasa umbellus",
    "Rufous Hummingbird": "Selasphorus rufus",
    "Sandhill Crane": "Antigone canadensis",
    "Savannah Sparrow": "Passerculus sandwichensis",
    "Say's Phoebe": "Sayornis saya",
    "Scaled Quail": "Callipepla squamata",
    "Scarlet Tanager": "Piranga olivacea",
    "Scissor-Tailed Flycatcher": "Tyrannus forficatus",
    "Sharp-Shinned Hawk": "Accipiter striatus",
    "Short-Eared Owl": "Asio flammeus",
    "Snow Bunting": "Plectrophenax nivalis",
    "Snow Goose": "Anser caerulescens",
    "Snowy Egret": "Egretta thula",
    "Song Sparrow": "Melospiza melodia",
    "Spotted Sandpiper": "Actitis macularius",
    "Spotted Towhee": "Pipilo maculatus",
    "Sprague's Pipit": "Anthus spragueii",
    "Steller's Jay": "Cyanocitta stelleri",
    "Swainson's Hawk": "Buteo swainsoni",
    "Trumpeter Swan": "Cygnus buccinator",
    "Tree Swallow": "Tachycineta bicolor",
    "Tufted Puffin": "Fratercula cirrhata",
    "Tufted Titmouse": "Baeolophus bicolor",
    "Turkey Vulture": "Cathartes aura",
    "Varied Thrush": "Ixoreus naevius",
    "Verdin": "Auriparus flaviceps",
    "Vesper Sparrow": "Pooecetes gramineus",
    "Violet-Green Swallow": "Tachycineta thalassina",
    "Warbling Vireo": "Vireo gilvus",
    "Western Grebe": "Aechmophorus occidentalis",
    "Western Kingbird": "Tyrannus verticalis",
    "Western Meadowlark": "Sturnella neglecta",
    "Western Tanager": "Piranga ludoviciana",
    "Whimbrel": "Numenius phaeopus",
    "White-Breasted Nuthatch": "Sitta carolinensis",
    "White-Crowned Sparrow": "Zonotrichia leucophrys",
    "White-Faced Ibis": "Plegadis chihi",
    "White-Throated Sparrow": "Zonotrichia albicollis",
    "White-Throated Swift": "Aeronautes saxatalis",
    "Wild Turkey": "Meleagris gallopavo",
    "Willet": "Tringa semipalmata",
    "Willow Flycatcher": "Empidonax traillii",
    "Willow Ptarmigan": "Lagopus lagopus",
    "Wilson's Snipe": "Gallinago delicata",
    "Winter Wren": "Troglodytes hiemalis",
    "Wood Duck": "Aix sponsa",
    "Wood Stork": "Mycteria americana",
    "Wood Thrush": "Hylocichla mustelina",
    "Yellow Warbler": "Setophaga petechia",
    "Yellow-Bellied Sapsucker": "Sphyrapicus varius",
    "Yellow-Billed Cuckoo": "Coccyzus americanus",
    "Yellow-Breasted Chat": "Icteria virens",
    "Yellow-Headed Blackbird": "Xanthocephalus xanthocephalus",
    "Yellow-Rumped Warbler": "Setophaga coronata",

    // --- European expansion ---
    "Barnacle Goose": "Branta leucopsis",
    "Black Redstart": "Phoenicurus ochruros",
    "Black Woodpecker": "Dryocopus martius",
    "Black-Headed Gull": "Chroicocephalus ridibundus",
    "Black-Tailed Godwit": "Limosa limosa",
    "Blue Tit": "Cyanistes caeruleus",
    "Bohemian Waxwing": "Bombycilla garrulus",
    "Bonelli's Eagle": "Aquila fasciata",
    "Carrion Crow": "Corvus corone",
    "Cetti's Warbler": "Cettia cetti",
    "Common Blackbird": "Turdus merula",
    "Common Buzzard": "Buteo buteo",
    "Common Chaffinch": "Fringilla coelebs",
    "Common Chiffchaff": "Phylloscopus collybita",
    "Common Crane": "Grus grus",
    "Common Cuckoo": "Cuculus canorus",
    "Common Goldeneye": "Bucephala clangula",
    "Common Kingfisher": "Alcedo atthis",
    "Common Little Bittern": "Ixobrychus minutus",
    "Common Moorhen": "Gallinula chloropus",
    "Common Nightingale": "Luscinia megarhynchos",
    "Common Swift": "Apus apus",
    "Coal Tit": "Periparus ater",
    "Corn Bunting": "Emberiza calandra",
    "Corncrake": "Crex crex",
    "Dunnock": "Prunella modularis",
    "Eleonora's Falcon": "Falco eleonorae",
    "Eurasian Blackcap": "Sylvia atricapilla",
    "Eurasian Bullfinch": "Pyrrhula pyrrhula",
    "Eurasian Golden Oriole": "Oriolus oriolus",
    "Eurasian Green Woodpecker": "Picus viridis",
    "Eurasian Hobby": "Falco subbuteo",
    "Eurasian Hoopoe": "Upupa epops",
    "Eurasian Jay": "Garrulus glandarius",
    "Eurasian Magpie": "Pica pica",
    "Eurasian Nuthatch": "Sitta europaea",
    "Eurasian Sparrowhawk": "Accipiter nisus",
    "Eurasian Tree Sparrow": "Passer montanus",
    "Eurasian Treecreeper": "Certhia familiaris",
    "European Bee-Eater": "Merops apiaster",
    "European Goldfinch": "Carduelis carduelis",
    "European Honey Buzzard": "Pernis apivorus",
    "European Robin": "Erithacus rubecula",
    "European Roller": "Coracias garrulus",
    "European Turtle Dove": "Streptopelia turtur",
    "Goldcrest": "Regulus regulus",
    "Great Cormorant": "Phalacrocorax carbo",
    "Great Crested Grebe": "Podiceps cristatus",
    "Great Spotted Woodpecker": "Dendrocopos major",
    "Great Tit": "Parus major",
    "Greater Flamingo": "Phoenicopterus roseus",
    "Grey Heron": "Ardea cinerea",
    "Greylag Goose": "Anser anser",
    "Griffon Vulture": "Gyps fulvus",
    "Hawfinch": "Coccothraustes coccothraustes",
    "Lesser Whitethroat": "Curruca curruca",
    "Little Owl": "Athene noctua",
    "Long-Tailed Tit": "Aegithalos caudatus",
    "Mistle Thrush": "Turdus viscivorus",
    "Mute Swan": "Cygnus olor",
    "Northern Lapwing": "Vanellus vanellus",
    "Red Kite": "Milvus milvus",
    "Red-Backed Shrike": "Lanius collurio",
    "Redwing": "Turdus iliacus",
    "Savi's Warbler": "Locustella luscinioides",
    "Snowy Owl": "Bubo scandiacus",
    "Song Thrush": "Turdus philomelos",
    "Tawny Owl": "Strix aluco",
    "Thrush Nightingale": "Luscinia luscinia",
    "Water Rail": "Rallus aquaticus",
    "White Stork": "Ciconia ciconia",
    "White Wagtail": "Motacilla alba",
    "White-Backed Woodpecker": "Dendrocopos leucotos",
    "Willow Tit": "Poecile montanus",
    "Wood Warbler": "Phylloscopus sibilatrix",
    "Eurasian Wren": "Troglodytes troglodytes",
    "Yellowhammer": "Emberiza citrinella",

    // --- Oceania expansion ---
    "Australasian Pipit": "Anthus novaeseelandiae",
    "Australasian Shoveler": "Spatula rhynchotis",
    "Australian Ibis": "Threskiornis molucca",
    "Australian Magpie": "Gymnorhina tibicen",
    "Australian Owlet-Nightjar": "Aegotheles cristatus",
    "Australian Raven": "Corvus coronoides",
    "Australian Reed Warbler": "Acrocephalus australis",
    "Australian Shelduck": "Tadorna tadornoides",
    "Australian Zebra Finch": "Taeniopygia castanotis",
    "Black Noddy": "Anous minutus",
    "Black Swan": "Cygnus atratus",
    "Black-Shouldered Kite": "Elanus axillaris",
    "Blue-Billed Duck": "Oxyura australis",
    "Brolga": "Antigone rubicunda",
    "Budgerigar": "Melopsittacus undulatus",
    "Cockatiel": "Nymphicus hollandicus",
    "Common Myna": "Acridotheres tristis",
    "Crested Pigeon": "Ocyphaps lophotes",
    "Crimson Chat": "Epthianura tricolor",
    "Eastern Rosella": "Platycercus eximius",
    "Eastern Whipbird": "Psophodes olivaceus",
    "Emu": "Dromaius novaehollandiae",
    "Galah": "Eolophus roseicapilla",
    "Gouldian Finch": "Chloebia gouldiae",
    "Grey Butcherbird": "Cracticus torquatus",
    "Grey Shrikethrush": "Colluricincla harmonica",
    "Grey Teal": "Anas gracilis",
    "Grey Warbler": "Gerygone igata",
    "Kakapo": "Strigops habroptilus",
    "Kea": "Nestor notabilis",
    "Kelp Gull": "Larus dominicanus",
    "Korimako": "Anthornis melanura",
    "Laughing Kookaburra": "Dacelo novaeguineae",
    "Little Penguin": "Eudyptula minor",
    "Little Pied Cormorant": "Microcarbo melanoleucos",
    "Magpie-Lark": "Grallina cyanoleuca",
    "Major Mitchell's Cockatoo": "Lophochroa leadbeateri",
    "Maned Duck": "Chenonetta jubata",
    "Masked Lapwing": "Vanellus miles",
    "Mistletoebird": "Dicaeum hirundinaceum",
    "Morepork": "Ninox novaeseelandiae",
    "New Holland Honeyeater": "Phylidonyris novaehollandiae",
    "Noisy Miner": "Manorina melanocephala",
    "North Island Brown Kiwi": "Apteryx mantelli",
    "Orange-Footed Scrubfowl": "Megapodius reinwardt",
    "Pacific Black Duck": "Anas superciliosa",
    "Peaceful Dove": "Geopelia placida",
    "Pesquet's Parrot": "Psittrichas fulgidus",
    "Pied Currawong": "Strepera graculina",
    "Plains-Wanderer": "Pedionomus torquatus",
    "Pukeko": "Porphyrio melanotus",
    "Rainbow Lorikeet": "Trichoglossus moluccanus",
    "Red Wattlebird": "Anthochaera carunculata",
    "Red-Capped Robin": "Petroica goodenovii",
    "Red-Winged Parrot": "Aprosmictus erythropterus",
    "Regent Bowerbird": "Sericulus chrysocephalus",
    "Rose-Crowned Fruit-Dove": "Ptilinopus regina",
    "Royal Spoonbill": "Platalea regia",
    "Silvereye": "Zosterops lateralis",
    "South Island Robin": "Petroica australis",
    "Splendid Fairywren": "Malurus splendens",
    "Spotted Dove": "Spilopelia chinensis",
    "Stubble Quail": "Coturnix pectoralis",
    "Sulphur-Crested Cockatoo": "Cacatua galerita",
    "Superb Fairywren": "Malurus cyaneus",
    "Superb Lyrebird": "Menura novaehollandiae",
    "Tawny Frogmouth": "Podargus strigoides",
    "Tui": "Prosthemadera novaeseelandiae",
    "Wedge-Tailed Eagle": "Aquila audax",
    "Welcome Swallow": "Hirundo neoxena",
    "White-Breasted Woodswallow": "Artamus leucorynchus",
    "White-Faced Heron": "Egretta novaehollandiae",
    "Willie Wagtail": "Rhipidura leucophrys",

    // Common aliases (different printings / shorthand names)
    "Kookaburra": "Dacelo novaeguineae",
    "Kiwi": "Apteryx mantelli",
    "Bellbird": "Anthornis melanura",
    "Common Starling": "Sturnus vulgaris",
    "Eurasian Blackbird": "Turdus merula",
    "Hoopoe": "Upupa epops"
};

const WINGSPAN_BIRDS = Object.keys(BIRD_DB).sort();
const SCIENTIFIC_TO_COMMON = {};
for (const [common, sci] of Object.entries(BIRD_DB)) {
    if (!SCIENTIFIC_TO_COMMON[sci.toLowerCase()]) {
        SCIENTIFIC_TO_COMMON[sci.toLowerCase()] = common;
    }
}
const audioCache = {};
const factCache = {};

// ---- Pokédex Collection (localStorage) ----
const COLLECTION_KEY = 'wingdex-collection';
const collectionCount = $('#collection-count');

function loadCollection() {
    try { return new Set(JSON.parse(localStorage.getItem(COLLECTION_KEY) || '[]')); }
    catch { return new Set(); }
}

function saveCollection(set) {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify([...set]));
}

const collection = loadCollection();

function addToCollection(bird) {
    if (collection.has(bird)) return;
    collection.add(bird);
    saveCollection(collection);
    updateCollectionCounter();
}

function updateCollectionCounter() {
    if (collectionCount) collectionCount.textContent = `${collection.size}/${WINGSPAN_BIRDS.length}`;
}

// ---- Camera ----

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 2560 } }
        });
        camera.srcObject = stream;
    } catch (err) {
        console.error('Camera error:', err);
        showError('CAMERA OFFLINE. Use UPLOAD PHOTO or search the database above.');
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

// ---- OCR ----

async function getWorker() {
    if (!tesseractWorker) {
        if (typeof Tesseract === 'undefined') {
            throw new Error('OCR library failed to load. Check your internet connection.');
        }
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

    ctx.filter = 'contrast(2.0) brightness(1.2) grayscale(1)';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const sharpened = sharpenImageData(imageData);

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

function rotateImage(img, degrees) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const w = img.width || img.naturalWidth;
    const h = img.height || img.naturalHeight;
    if (degrees === 90 || degrees === -90) {
        canvas.width = h;
        canvas.height = w;
    } else {
        canvas.width = w;
        canvas.height = h;
    }
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(degrees * Math.PI / 180);
    ctx.drawImage(img, -w / 2, -h / 2);
    return canvas;
}

async function recognizeBirdName(imageDataUrl) {
    loadingText.textContent = 'READING CARD...';

    const img = new Image();
    await new Promise((resolve) => { img.onload = resolve; img.src = imageDataUrl; });

    const worker = await getWorker();
    let allOcrText = '';

    // === Step 1: Original orientation, EXACT matches only ===
    // (prevents false fuzzy matches when card is sideways)
    const crops = [
        { name: 'NAME BANNER', top: 0, bottom: 0.15, left: 0.25, right: 1.0 },
        { name: 'TOP BANNER', top: 0, bottom: 0.22, left: 0.0, right: 1.0 },
        { name: 'LEFT NAME', top: 0, bottom: 0.18, left: 0.0, right: 0.7 },
        { name: 'UPPER THIRD', top: 0, bottom: 0.35, left: 0.0, right: 1.0 },
    ];

    for (const crop of crops) {
        loadingText.textContent = `SCANNING ${crop.name}...`;
        const processed = preprocessImage(img, crop, 140, false);
        const { data } = await worker.recognize(processed);
        const text = data.text.trim();
        if (text.length > 2) {
            console.log(`OCR [${crop.name}]:`, text);
            allOcrText += ' ' + text;
            const match = findBirdInText(allOcrText, true);
            if (match) { console.log(`Exact match: ${match}`); return match; }
        }
    }

    let sciMatch = findScientificName(allOcrText);
    if (sciMatch) return sciMatch;

    // === Step 2: Rotated orientations (cards held sideways) ===
    // Fresh text per rotation, full matching (exact + fuzzy)
    const rotCrops = [
        { name: 'TOP', top: 0, bottom: 0.22, left: 0.0, right: 1.0 },
        { name: 'NAME', top: 0, bottom: 0.15, left: 0.2, right: 1.0 },
        { name: 'UPPER', top: 0, bottom: 0.35, left: 0.0, right: 1.0 },
    ];
    for (const deg of [90, -90, 180]) {
        loadingText.textContent = `ROTATING ${deg > 0 ? '+' : ''}${deg}°...`;
        const rotCanvas = rotateImage(img, deg);
        const rotImg = new Image();
        await new Promise(r => { rotImg.onload = r; rotImg.src = rotCanvas.toDataURL('image/jpeg', 0.92); });

        let rotText = '';
        for (const crop of rotCrops) {
            const processed = preprocessImage(rotImg, crop, 140, false);
            const { data } = await worker.recognize(processed);
            const text = data.text.trim();
            if (text.length > 2) {
                console.log(`OCR [rot${deg} ${crop.name}]:`, text);
                rotText += ' ' + text;
                const match = findBirdInText(rotText);
                if (match) { console.log(`Rotation match: ${match}`); return match; }
            }
        }
        sciMatch = findScientificName(rotText);
        if (sciMatch) return sciMatch;
    }

    // === Step 3: Enhanced original orientation (fuzzy matching allowed) ===
    // For right-side-up cards that need varied thresholds
    loadingText.textContent = 'ENHANCED SCAN...';
    const enhancedCrops = [
        { name: 'TOP BANNER', top: 0, bottom: 0.22, left: 0.0, right: 1.0 },
        { name: 'NAME BANNER', top: 0, bottom: 0.15, left: 0.25, right: 1.0 },
        { name: 'FULL CARD', top: 0, bottom: 1.0, left: 0.0, right: 1.0 },
    ];
    const enhancedConfigs = [
        { threshold: 100, invert: false },
        { threshold: 180, invert: false },
        { threshold: 140, invert: true },
        { threshold: 100, invert: true },
    ];

    for (const crop of enhancedCrops) {
        for (const cfg of enhancedConfigs) {
            const processed = preprocessImage(img, crop, cfg.threshold, cfg.invert);
            const { data } = await worker.recognize(processed);
            const text = data.text.trim();
            if (text.length > 2) {
                console.log(`OCR [enhanced ${crop.name} t=${cfg.threshold} inv=${cfg.invert}]:`, text);
                allOcrText += ' ' + text;
                const match = findBirdInText(allOcrText);
                if (match) { console.log(`Enhanced match: ${match}`); return match; }
            }
        }
    }

    return findScientificName(allOcrText);
}

// ---- Matching ----

function findScientificName(text) {
    if (!text) return null;
    const normalized = text.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ');
    // Prefer the full "genus species" phrase appearing together
    for (const [sci, common] of Object.entries(SCIENTIFIC_TO_COMMON)) {
        if (normalized.includes(sci)) return common;
    }
    // Fallback: both words present (handles line breaks between genus/species).
    // When genus === species (e.g. Tyrannus tyrannus) the word must appear twice,
    // otherwise any congener would false-match.
    for (const [sci, common] of Object.entries(SCIENTIFIC_TO_COMMON)) {
        const parts = sci.split(' ');
        if (parts.length < 2) continue;
        if (parts[0] === parts[1]) {
            if (normalized.split(parts[0]).length - 1 >= 2) return common;
        } else if (normalized.includes(parts[0]) && normalized.includes(parts[1])) {
            return common;
        }
    }
    return null;
}

function findBirdInText(text, exactOnly) {
    if (!text) return null;

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    const normalized = text.toLowerCase().replace(/[-'']/g, ' ').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ');

    const sortedBirds = [...WINGSPAN_BIRDS].sort((a, b) => b.length - a.length);
    for (const bird of sortedBirds) {
        const birdNorm = bird.toLowerCase().replace(/[-'']/g, ' ');
        if (normalized.includes(birdNorm)) return bird;
    }

    if (exactOnly) return null;

    let bestMatch = null;
    let bestScore = 0;
    let bestWords = 0;
    const isBetter = (score, n) => score > bestScore || (score === bestScore && n > bestWords);

    for (const bird of WINGSPAN_BIRDS) {
        const birdWords = bird.toLowerCase().replace(/['-]/g, ' ').split(/\s+/).filter(w => w.length > 1);
        if (birdWords.length <= 1) continue;
        for (const line of lines) {
            const lineLower = line.toLowerCase().replace(/[-'']/g, ' ').replace(/[^a-z\s]/g, ' ');
            const score = fuzzyScore(birdWords, lineLower);
            if (isBetter(score, birdWords.length)) { bestScore = score; bestMatch = bird; bestWords = birdWords.length; }
        }
        const wholeScore = fuzzyScore(birdWords, normalized);
        if (isBetter(wholeScore, birdWords.length)) { bestScore = wholeScore; bestMatch = bird; bestWords = birdWords.length; }
    }

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
        // Very short words (≤3 chars like "red", "tit", "jay") require exact substring
        if (word.length <= 3) continue;
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

// ---- Dex Facts (Wikipedia summary: CORS-enabled, has extract + photo) ----

async function fetchBirdFact(birdName, scientificName) {
    if (factCache[birdName]) return factCache[birdName];
    const titles = [birdName, scientificName].filter(Boolean);
    for (const title of titles) {
        try {
            const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
            const resp = await fetch(url);
            if (!resp.ok) continue;
            const data = await resp.json();
            if (data.type === 'disambiguation' || !data.extract) continue;
            const result = {
                fact: data.extract,
                image: (data.thumbnail && data.thumbnail.source) || null
            };
            factCache[birdName] = result;
            return result;
        } catch (err) {
            console.error('Fact fetch failed:', err);
        }
    }
    return null;
}

// Trim an extract to whole sentences within maxLen chars
function trimToSentences(text, maxLen) {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLen) return clean;
    const slice = clean.slice(0, maxLen);
    const lastStop = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('.'));
    return lastStop > 60 ? slice.slice(0, lastStop + 1) : slice + '...';
}

// ---- Audio Unlock (iOS/Chrome autoplay policy) ----

function unlockAudio() {
    if (audioUnlocked) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        ctx.resume();
    } catch (e) { /* ignore */ }
    try {
        birdAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        birdAudio.play().then(() => { birdAudio.pause(); birdAudio.currentTime = 0; }).catch(() => {});
    } catch (e) { /* ignore */ }
    audioUnlocked = true;
}

// ---- Robotic Dex Voice ----

function speechAvailable() {
    return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
}

function pickVoice() {
    const voices = speechSynthesis.getVoices();
    return voices.find(v => /en[-_]/i.test(v.lang) && /google/i.test(v.name))
        || voices.find(v => /^en/i.test(v.lang))
        || null;
}

// iOS/Safari requires speech to be primed by a user gesture
function unlockSpeech() {
    if (speechUnlocked || !speechAvailable()) return;
    try {
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        speechSynthesis.speak(u);
        speechUnlocked = true;
    } catch (e) { /* ignore */ }
}

function speak(text, onDone) {
    if (!speechAvailable()) { if (onDone) onDone(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.pitch = 0.45;   // low pitch = robotic dex voice
    u.rate = 0.95;
    const voice = pickVoice();
    if (voice) u.voice = voice;
    let finished = false;
    const done = () => {
        if (finished) return;
        finished = true;
        ledVoice.classList.remove('on');
        speakBtn.classList.remove('active');
        if (onDone) onDone();
    };
    u.onend = done;
    u.onerror = done;
    ledVoice.classList.add('on');
    speakBtn.classList.add('active');
    speechSynthesis.speak(u);
    // Safety: some browsers never fire onend; cap at ~40s
    setTimeout(done, 40000);
}

function stopSpeech() {
    if (speechAvailable()) speechSynthesis.cancel();
    ledVoice.classList.remove('on');
    speakBtn.classList.remove('active');
}

// Preload voices (Chrome populates them asynchronously)
if (speechAvailable()) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}

// ---- Typewriter effect ----

function typewriter(el, text, speed) {
    clearInterval(typewriterTimer);
    el.classList.remove('done');
    el.textContent = '';
    let i = 0;
    typewriterTimer = setInterval(() => {
        i += 2; // two chars per tick keeps long entries snappy
        el.textContent = text.slice(0, i);
        if (i >= text.length) {
            clearInterval(typewriterTimer);
            el.classList.add('done');
        }
    }, speed || 18);
}

// ---- Sound Fetching ----

function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
    ]);
}

async function fetchBirdSound(birdName) {
    if (audioCache[birdName]) return audioCache[birdName];
    const scientificName = BIRD_DB[birdName] || '';

    try {
        const wikiResult = await withTimeout(fetchFromWikimedia(birdName, scientificName), 8000);
        if (wikiResult) { audioCache[birdName] = wikiResult; return wikiResult; }
    } catch (err) { console.log('Wikimedia timed out, trying xeno-canto...'); }

    try {
        const xcResult = await withTimeout(fetchFromXenoCanto(birdName, scientificName), 8000);
        if (xcResult) { audioCache[birdName] = xcResult; return xcResult; }
    } catch (err) { console.log('Xeno-canto timed out'); }

    return null;
}

async function fetchFromWikimedia(birdName, scientificName) {
    const searchTerms = [
        scientificName ? scientificName + ' bird sound' : null,
        scientificName ? scientificName + ' call' : null,
        birdName + ' bird sound',
        birdName + ' call',
        scientificName || null,
    ].filter(Boolean);
    const searches = [...new Set(searchTerms)];
    for (const term of searches) {
        try {
            const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime|extmetadata&format=json&origin=*`;
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

    // Also check Wikipedia article for linked audio files
    const wikiSearches = [birdName, scientificName].filter(Boolean);
    for (const term of wikiSearches) {
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
        const apiUrl = `https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(searchTerm)}&page=1`;
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

function cleanDescription(raw) {
    if (!raw) return '';
    return raw
        .replace(/<[^>]*>/g, '')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\{[^}]*\}/g, '')
        .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function formatRecordingInfo(soundData) {
    if (soundData.type === 'wikimedia') {
        const desc = cleanDescription(soundData.description);
        if (desc && desc.length > 5 && desc.length < 120) return desc;
        return 'Bird call · Wikimedia Commons';
    }
    if (soundData.type === 'xeno-canto') {
        let info = '';
        if (soundData.recordist) info += `Rec: ${soundData.recordist}`;
        if (soundData.country) info += info ? ` · ${soundData.country}` : soundData.country;
        const type = (soundData.recordingType || '').toLowerCase();
        if (type.includes('song')) info += ' · Song';
        else if (type.includes('call')) info += ' · Call';
        return info || 'Bird call · xeno-canto';
    }
    return 'Bird call';
}

function setupAudioPlayer(soundData, autoplay) {
    hide(audioPlayer);
    hide(xcEmbedPlayer);
    hide(noSound);
    isPlaying = false;
    playIcon.textContent = '▶';
    ledSound.classList.remove('on');

    birdAudio.src = soundData.url;
    birdAudio.load();
    recordingInfo.textContent = formatRecordingInfo(soundData);
    show(audioPlayer);

    if (autoplay) {
        const doPlay = () => {
            birdAudio.play().then(() => {
                playIcon.textContent = '⏸';
                isPlaying = true;
                ledSound.classList.add('on');
            }).catch(() => {
                if (soundData.type === 'xeno-canto' && soundData.id) {
                    hide(audioPlayer);
                    xcIframe.src = `https://xeno-canto.org/${soundData.id}/embed?simple=1`;
                    xcEmbedInfo.textContent = formatRecordingInfo(soundData);
                    show(xcEmbedPlayer);
                }
            });
        };
        if (birdAudio.readyState >= 3) {
            doPlay();
        } else {
            birdAudio.addEventListener('canplaythrough', doPlay, { once: true });
            setTimeout(doPlay, 5000);
        }
    }
}

function playAudio() {
    if (isPlaying) {
        birdAudio.pause();
        playIcon.textContent = '▶';
        isPlaying = false;
        ledSound.classList.remove('on');
    } else {
        birdAudio.play().catch(err => console.error('Audio error:', err));
        playIcon.textContent = '⏸';
        isPlaying = true;
        ledSound.classList.add('on');
    }
}

birdAudio.addEventListener('timeupdate', () => {
    if (birdAudio.duration) {
        audioProgressBar.style.width = (birdAudio.currentTime / birdAudio.duration) * 100 + '%';
    }
});

birdAudio.addEventListener('ended', () => {
    playIcon.textContent = '▶';
    isPlaying = false;
    ledSound.classList.remove('on');
    audioProgressBar.style.width = '0%';
});

birdAudio.addEventListener('pause', () => {
    ledSound.classList.remove('on');
});

function resetAudioState() {
    isPlaying = false;
    birdAudio.pause();
    birdAudio.removeAttribute('src');
    xcIframe.removeAttribute('src');
    audioProgressBar.style.width = '0%';
    playIcon.textContent = '▶';
    ledSound.classList.remove('on');
    hide(audioPlayer);
    hide(xcEmbedPlayer);
    hide(noSound);
}

// ---- Pokédex Grid ----

function renderPokedexGrid() {
    const allBirds = WINGSPAN_BIRDS.filter(b => !['Kookaburra','Kiwi','Bellbird','Common Starling','Eurasian Blackbird','Hoopoe'].includes(b));
    pokedexGrid.innerHTML = allBirds.map((bird, i) => {
        const num = i + 1;
        const found = collection.has(bird);
        return `<div class="pdex-cell${found ? ' discovered' : ''}" data-bird="${bird}">
            <span class="pdex-num">${String(num).padStart(3, '0')}</span>
            <span class="pdex-name">${found ? bird : '???'}</span>
        </div>`;
    }).join('');
    const total = allBirds.length;
    const discovered = allBirds.filter(b => collection.has(b)).length;
    pokedexStats.textContent = `${discovered} / ${total} DISCOVERED`;
    if (collectionCount) collectionCount.textContent = `${discovered}/${total}`;

    pokedexGrid.querySelectorAll('.pdex-cell.discovered').forEach(cell => {
        cell.addEventListener('click', () => {
            unlockSpeech();
            unlockAudio();
            showDexEntry(cell.getAttribute('data-bird'));
        });
    });
}

// ---- View Switching ----

function showPokedexMode() {
    stopSpeech();
    resetAudioState();
    clearInterval(typewriterTimer);
    hide(entryView);
    hide(cameraView);
    show(pokedexView);
    hide(backBtn);
    hide(speakBtn);
    currentBird = null;
    renderPokedexGrid();
}

function showCameraMode() {
    stopSpeech();
    resetAudioState();
    clearInterval(typewriterTimer);
    hide(entryView);
    hide(pokedexView);
    show(cameraView);
    hide(backBtn);
    hide(speakBtn);
    hide(errorMessage);
    currentBird = null;
}

function showEntryMode() {
    hide(cameraView);
    hide(pokedexView);
    show(entryView);
    show(backBtn);
    show(speakBtn);
}

function showError(message) {
    showEntryMode();
    entryNumber.textContent = 'ERROR';
    entryName.textContent = '';
    entrySci.textContent = '';
    entryFact.textContent = '';
    entryFact.classList.add('done');
    entryStatus.textContent = '';
    hide(entryPhoto);
    show(entryPhotoPlaceholder);
    errorText.textContent = message;
    show(errorMessage);
    hide(speakBtn);
}

// ---- Dex Entry: the heart of the Pokedex flow ----

let lastSpokenText = '';

async function showDexEntry(bird) {
    stopSpeech();
    resetAudioState();
    currentBird = bird;
    addToCollection(bird);
    const sci = BIRD_DB[bird] || '';
    const dexNo = WINGSPAN_BIRDS.indexOf(bird) + 1;

    // Set up the entry screen
    hide(errorMessage);
    entryNumber.textContent = 'No.' + String(dexNo).padStart(3, '0');
    entryName.textContent = bird.toUpperCase();
    entrySci.textContent = sci;
    entryFact.textContent = '';
    entryFact.classList.remove('done');
    entryStatus.textContent = 'ACCESSING DATABASE...';
    hide(entryPhoto);
    show(entryPhotoPlaceholder);
    showEntryMode();

    // Fetch fact and sound in parallel
    const factPromise = withTimeout(fetchBirdFact(bird, sci), 8000).catch(() => null);
    const soundPromise = fetchBirdSound(bird).catch(() => null);

    const factData = await factPromise;
    if (currentBird !== bird) return; // user navigated away

    // Photo
    if (factData && factData.image) {
        entryPhoto.src = factData.image;
        entryPhoto.onload = () => {
            if (currentBird !== bird) return;
            show(entryPhoto);
            hide(entryPhotoPlaceholder);
        };
    }

    // Fact text: typewriter on screen + robotic voice reading it
    const displayFact = factData
        ? trimToSentences(factData.fact, 420)
        : `${bird}. Scientific name: ${sci}. A bird from the Wingspan deck. No further data available.`;
    const speechFact = factData
        ? trimToSentences(factData.fact.replace(/\([^)]*\)/g, ''), 360)
        : displayFact;

    typewriter(entryFact, displayFact);
    entryStatus.textContent = 'READING ENTRY...';

    lastSpokenText = `${bird}. ${speechFact}`;
    speak(lastSpokenText, async () => {
        if (currentBird !== bird) return;
        // Voice done -> play the bird call
        entryStatus.textContent = 'PLAYING CALL...';
        const soundData = await soundPromise;
        if (currentBird !== bird) return;
        if (soundData) {
            setupAudioPlayer(soundData, true);
            entryStatus.textContent = '';
        } else {
            show(noSound);
            entryStatus.textContent = '';
        }
    });
}

// ---- Scan Flow ----

async function processImage(imageDataUrl) {
    show(scanLoading);
    scanBtn.classList.add('scanning');
    ledScan.classList.add('on');

    try {
        const bird = await recognizeBirdName(imageDataUrl);
        hide(scanLoading);
        scanBtn.classList.remove('scanning');
        ledScan.classList.remove('on');

        if (!bird) {
            showError('NO MATCH FOUND. Try a closer, clearer photo of the card, or search the database above.');
            return;
        }
        showDexEntry(bird);
    } catch (err) {
        console.error('Processing error:', err);
        hide(scanLoading);
        scanBtn.classList.remove('scanning');
        ledScan.classList.remove('on');
        showError('SCAN FAILURE. Try again or search the database above.');
    }
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

        searchResults.innerHTML = matches.map(bird => {
            const caught = collection.has(bird) ? '<span class="caught-badge">✓</span>' : '';
            return `<div class="search-result-item${collection.has(bird) ? ' caught' : ''}" data-bird="${bird}">
                ${caught}${bird}<br><span class="sci-name">${BIRD_DB[bird] || ''}</span>
            </div>`;
        }).join('');
        show(searchResults);

        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const bird = item.getAttribute('data-bird');
                hide(searchResults);
                searchInput.value = '';
                searchInput.blur();
                unlockSpeech();
                unlockAudio();
                showDexEntry(bird);
            });
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) hide(searchResults);
    });
}

// ---- Event Listeners ----

scanBtn.addEventListener('click', () => {
    if (scanBtn.classList.contains('scanning')) return;
    unlockSpeech();
    unlockAudio();
    // If not already on camera view, switch to it first
    if (cameraView.classList.contains('hidden')) {
        showCameraMode();
        if (!stream) startCamera();
        return;
    }
    if (!stream) { startCamera(); return; }
    const imageData = captureFrame();
    processImage(imageData);
});

uploadBtn.addEventListener('click', () => {
    unlockSpeech();
    unlockAudio();
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    showCameraMode();
    const reader = new FileReader();
    reader.onload = (ev) => processImage(ev.target.result);
    reader.readAsDataURL(file);
    fileInput.value = '';
});

dexBtn.addEventListener('click', showPokedexMode);
playBtn.addEventListener('click', playAudio);
backBtn.addEventListener('click', showPokedexMode);

speakBtn.addEventListener('click', () => {
    if (!lastSpokenText) return;
    stopSpeech();
    speak(lastSpokenText, null);
});

// ---- Init ----
setupSearch();
showPokedexMode();
