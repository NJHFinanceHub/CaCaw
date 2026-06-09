// Test harness: loads the real app.js with DOM stubs and exercises
// the bird-matching logic against all birds, garbled OCR text, and
// false-positive bait. Run: node test/match.test.js
const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function makeEl() {
    return new Proxy({ _props: {} }, {
        get(t, p) {
            if (p === 'classList') return { add() {}, remove() {}, contains: () => false };
            if (p === 'style') return {};
            if (p === 'addEventListener') return () => {};
            if (p === 'querySelectorAll') return () => [];
            if (p in t._props) return t._props[p];
            return () => {};
        },
        set(t, p, v) { t._props[p] = v; return true; }
    });
}

const sandbox = {
    document: { querySelector: () => makeEl(), addEventListener: () => {}, createElement: () => makeEl() },
    navigator: {},
    console,
    setTimeout, clearTimeout,
    requestAnimationFrame: (f) => f(),
    fetch: () => Promise.reject(new Error('no network in tests')),
    Image: function () { return {}; },
    Promise, Math, Object, JSON, Array, Infinity, Uint8ClampedArray,
};

const exported = new Function(
    ...Object.keys(sandbox),
    code + '\n;return { findBirdInText, findScientificName, fuzzyScore, editDistance, BIRD_DB, WINGSPAN_BIRDS };'
)(...Object.values(sandbox));

const { findBirdInText, findScientificName, BIRD_DB, WINGSPAN_BIRDS } = exported;

let pass = 0, fail = 0;
const failures = [];
function check(label, got, want) {
    if (got === want) { pass++; }
    else { fail++; failures.push(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); }
}

// --- Test 1: exact name in clean OCR-like text matches every bird ---
for (const bird of WINGSPAN_BIRDS) {
    const text = `WHEN PLAYED\n${bird.toUpperCase()}\n25CM | egg capacity 3`;
    check(`exact [${bird}]`, findBirdInText(text), bird);
}

// --- Test 2: scientific name fallback resolves to a bird with that name ---
// (aliases share scientific names, so compare by scientific name not label)
for (const [bird, sci] of Object.entries(BIRD_DB)) {
    const text = `some unreadable junk\n${sci}\nforest wetland`;
    const got = findScientificName(text);
    check(`sci [${bird}]`, got && BIRD_DB[got], sci);
}

// --- Test 3: garbled OCR (one char substituted per word) still matches ---
let garbleOk = 0, garbleTotal = 0;
const garbleMisses = [];
for (const bird of WINGSPAN_BIRDS) {
    const garbled = bird.split(' ').map(w => {
        if (w.length < 4) return w;
        const i = Math.floor(w.length / 2);
        return w.slice(0, i) + (w[i] === 'x' ? 'y' : 'x') + w.slice(i + 1);
    }).join(' ');
    garbleTotal++;
    const got = findBirdInText(`${garbled}\nEGG 3 | 41CM`);
    if (got === bird) garbleOk++;
    else garbleMisses.push(`${bird} (garbled: "${garbled}") -> ${got}`);
}

// --- Test 4: false positives — typical Wingspan card text with NO bird name ---
const baitTexts = [
    'When played: draw 2 new bonus cards and keep 1.',
    'Tuck a card from your hand behind this bird.',
    'WHEN ACTIVATED: All players gain 1 seed from the supply.',
    'Egg capacity 4. Wingspan 25 cm. Forest habitat.',
    'Roll all dice not in birdfeeder. If any are fish, gain 1 fish.',
    'Draw 1 card. If you do, discard 1 card from your hand at end of turn.',
    'lay 1 egg on any bird draw cards equal to total',
    'gain 1 invertebrate or seed from birdfeeder',
];
for (const bait of baitTexts) {
    check(`bait "${bait.slice(0, 40)}..."`, findBirdInText(bait), null);
}

// --- Report ---
console.log(`\n=== RESULTS ===`);
console.log(`exact+sci+bait: ${pass} passed, ${fail} failed`);
if (failures.length) {
    console.log('\nFailures:');
    failures.slice(0, 30).forEach(f => console.log('  FAIL ' + f));
}
console.log(`\ngarbled OCR: ${garbleOk}/${garbleTotal} matched (${(100 * garbleOk / garbleTotal).toFixed(0)}%)`);
if (garbleMisses.length) {
    console.log('garble misses (first 15):');
    garbleMisses.slice(0, 15).forEach(m => console.log('  MISS ' + m));
}
process.exit(fail > 0 ? 1 : 0);
