// DOM integration test: loads the real index.html + app.js in jsdom and
// verifies the UI wiring (element refs, search flow, dex entry flow).
// Run: node test/dom.test.js   (requires jsdom installed in /tmp)
const fs = require('fs');
const path = require('path');
const { JSDOM } = require(path.join('/tmp', 'node_modules', 'jsdom'));

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

const dom = new JSDOM(html, { url: 'https://example.com/', runScripts: 'outside-only', pretendToBeVisual: true });
const { window } = dom;

// --- Stubs for browser APIs jsdom lacks ---
window.SpeechSynthesisUtterance = class {
    constructor(text) { this.text = text; this.pitch = 1; this.rate = 1; }
};
const spoken = [];
window.speechSynthesis = {
    speak(u) { spoken.push(u.text); setTimeout(() => u.onend && u.onend(), 5); },
    cancel() {},
    getVoices: () => [{ name: 'Google US English', lang: 'en-US' }],
    set onvoiceschanged(f) {},
};
window.navigator.mediaDevices = undefined; // camera unavailable path
const fetchCalls = [];
window.fetch = (url) => {
    fetchCalls.push(String(url));
    // Wikipedia summary stub
    if (String(url).includes('rest_v1/page/summary')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                type: 'standard',
                extract: 'The northern cardinal is a songbird in the genus Cardinalis. It is found in southeastern Canada and the eastern United States.',
                thumbnail: { source: 'https://example.com/cardinal.jpg' }
            })
        });
    }
    // Wikimedia audio search stub
    if (String(url).includes('commons.wikimedia.org')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                query: { pages: { 1: { imageinfo: [{ url: 'https://example.com/call.ogg', mime: 'audio/ogg', extmetadata: {} }] } } }
            })
        });
    }
    return Promise.resolve({ ok: false });
};
window.HTMLMediaElement.prototype.play = function () {
    this.dispatchEvent(new window.Event('play'));
    return Promise.resolve();
};
window.HTMLMediaElement.prototype.pause = function () {};
window.Tesseract = undefined;

// --- Run the real app.js ---
let pass = 0, fail = 0;
const failures = [];
function check(label, cond) {
    if (cond) pass++;
    else { fail++; failures.push(label); }
}

try {
    window.eval(appJs);
    check('app.js executes without throwing', true);
} catch (e) {
    check('app.js executes without throwing: ' + e.message, false);
}

const doc = window.document;

// Every getElementById-style ref used in app.js must exist in the HTML
const idRefs = [...appJs.matchAll(/\$\('#([a-z0-9-]+)'\)/gi)].map(m => m[1]);
for (const id of new Set(idRefs)) {
    check(`element #${id} exists in index.html`, !!doc.getElementById(id));
}
const classRefs = [...appJs.matchAll(/\$\('\.([a-z0-9-]+)'\)/gi)].map(m => m[1]);
for (const cls of new Set(classRefs)) {
    check(`element .${cls} exists in index.html`, !!doc.querySelector('.' + cls));
}

(async () => {
    // Camera denied -> error entry should show
    await new Promise(r => setTimeout(r, 20));
    check('camera-denied shows entry view error',
        !doc.getElementById('entry-view').classList.contains('hidden') &&
        !doc.getElementById('error-message').classList.contains('hidden'));

    // --- Search flow ---
    const input = doc.getElementById('search-input');
    input.value = 'cardinal';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    const items = doc.querySelectorAll('.search-result-item');
    check('search "cardinal" returns results', items.length >= 1);
    check('search result is Northern Cardinal', items[0] && items[0].getAttribute('data-bird') === 'Northern Cardinal');

    // Click result -> dex entry flow
    items[0].dispatchEvent(new window.Event('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 50));

    check('entry view visible after search click', !doc.getElementById('entry-view').classList.contains('hidden'));
    check('camera view hidden after search click', doc.getElementById('camera-view').classList.contains('hidden'));
    check('entry name set', doc.getElementById('entry-name').textContent === 'NORTHERN CARDINAL');
    check('entry number is No.NNN', /^No\.\d{3}$/.test(doc.getElementById('entry-number').textContent));
    check('entry sci set', doc.getElementById('entry-sci').textContent === 'Cardinalis cardinalis');
    check('wikipedia summary was fetched', fetchCalls.some(u => u.includes('rest_v1/page/summary')));
    check('robotic voice spoke the entry', spoken.length > 0 && spoken.some(t => t.includes('Northern Cardinal')));

    // After voice ends, the call should auto-load + autoplay
    await new Promise(r => setTimeout(r, 100));
    check('audio player visible after voice (call autoplays)', !doc.getElementById('audio-player').classList.contains('hidden'));
    check('audio src points at the call recording', doc.getElementById('bird-audio').src.includes('call.ogg'));

    // Typewriter finishes
    await new Promise(r => setTimeout(r, 1800));
    const factText = doc.getElementById('entry-fact').textContent;
    check('fact typed out on screen', factText.includes('northern cardinal is a songbird'));

    // --- Back button returns to camera ---
    doc.getElementById('back-btn').dispatchEvent(new window.Event('click', { bubbles: true }));
    check('back returns to camera view', !doc.getElementById('camera-view').classList.contains('hidden'));
    check('entry hidden after back', doc.getElementById('entry-view').classList.contains('hidden'));

    console.log(`\n=== DOM RESULTS ===\n${pass} passed, ${fail} failed`);
    if (failures.length) failures.forEach(f => console.log('  FAIL ' + f));
    process.exit(fail > 0 ? 1 : 0);
})();
