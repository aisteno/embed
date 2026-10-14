/* Browser regression tests against the actual embed source and computed CSS.
 * Only iframe navigation is replaced, to avoid creating production sessions.
 */
(async function () {
    const tests = [];
    const throughLoader = new URLSearchParams(location.search).get('delivery') === 'loader';
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const assert = (condition, message) => {
        if (!condition) throw new Error(message);
    };
    const waitFor = async predicate => {
        const deadline = Date.now() + 3000;
        while (!predicate()) {
            if (Date.now() >= deadline) throw new Error('Timed out waiting for iframe');
            await delay(30);
        }
    };
    const test = (name, run) => tests.push({ name, run });
    const escapeAttribute = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

    async function fixture({ attributes = {}, css = '', width = 1024, crawler = false } = {}) {
        const frame = document.createElement('iframe');
        frame.style.width = `${width}px`;
        const attributesHtml = Object.entries({ 'data-id': 'fixture-chat', ...attributes })
            .map(([name, value]) => `${name}="${escapeAttribute(value)}"`).join(' ');
        frame.srcdoc = `<!doctype html><html><head><style>
            body { margin: 0; } #slot { width: 400px; height: 300px; } ${css}
            </style></head><body><div id="modal"><div id="slot"></div></div>
            <script>
                window.assignedUrls = [];
                window.runtimeUrls = [];
                window.activeTimers = new Set();
                const originalCreate = document.createElement.bind(document);
                document.createElement = function(tag, options) {
                    const element = originalCreate(tag, options);
                    if (tag.toLowerCase() === 'script') {
                        Object.defineProperty(element, 'src', { set(url) {
                            window.runtimeUrls.push(url);
                            // Exercise the loader with the real runtime source.
                            this.setAttribute('src', '/steno-chat.js');
                        }, get() { return this.getAttribute('src'); } });
                    }
                    if (tag.toLowerCase() === 'iframe') {
                        Object.defineProperty(element, 'src', { set(url) {
                            window.assignedUrls.push(url);
                            this.setAttribute('data-requested-src', url);
                            this.setAttribute('src', '/tests/chat-stub.html?' + new URL(url).searchParams);
                        }, get() { return this.getAttribute('data-requested-src'); } });
                    }
                    return element;
                };
                const originalSetInterval = window.setInterval.bind(window);
                const originalClearInterval = window.clearInterval.bind(window);
                window.setInterval = function(callback, interval) {
                    const timer = originalSetInterval(callback, interval);
                    window.activeTimers.add(timer);
                    return timer;
                };
                window.clearInterval = function(timer) {
                    window.activeTimers.delete(timer);
                    originalClearInterval(timer);
                };
                window.requestIdleCallback = callback => setTimeout(callback, 0);
                Object.defineProperty(navigator, 'userAgent', { value: '${crawler ? 'ExampleBot/1.0' : 'EmbedRegressionBrowser/1.0'}' });
            <\/script>
            <script src="${throughLoader ? '/scripts/jsdelivr-loader.js' : '/steno-chat.js'}" ${attributesHtml}><\/script></body></html>`;
        const loaded = new Promise(resolve => frame.addEventListener('load', resolve, { once: true }));
        document.getElementById('fixture').appendChild(frame);
        await loaded;
        await delay(250);
        const win = frame.contentWindow;
        const doc = frame.contentDocument;
        if (throughLoader) {
            assert(win.runtimeUrls.length === 1 && new URL(win.runtimeUrls[0]).searchParams.has('_steno_update'), 'Loader did not request a runtime with the update window');
        }
        return {
            frame, win, doc,
            chat: () => doc.getElementById('chat-iframe'),
            params: () => new URL(win.assignedUrls[0]).searchParams,
            cleanup: () => frame.remove(),
        };
    }

    for (const [name, css, reveal] of [
        ['transparent modal ancestor', '#modal { opacity: 0; pointer-events: none; }', f => { f.doc.getElementById('modal').style.opacity = '1'; }],
        ['display:none ancestor', '#modal { display: none; }', f => { f.doc.getElementById('modal').style.display = 'block'; }],
        ['visibility:hidden ancestor', '#modal { visibility: hidden; }', f => { f.doc.getElementById('modal').style.visibility = 'visible'; }],
        ['content-visibility:hidden ancestor', '#modal { content-visibility: hidden; }', f => { f.doc.getElementById('modal').style.contentVisibility = 'visible'; }],
        ['transparent container', '#slot { opacity: 0; }', f => { f.doc.getElementById('slot').style.opacity = '1'; }],
        ['zero-size container', '#slot { width: 0; height: 0; }', f => { f.doc.getElementById('slot').style.cssText = 'width:400px;height:300px'; }],
    ]) {
        test(`${name}: no navigation until visible; reopen keeps one iframe`, async () => {
            const f = await fixture({ attributes: { 'data-container': '#slot' }, css });
            try {
                assert(!f.chat() && f.win.assignedUrls.length === 0, 'Hidden embed navigated');
                assert(f.win.activeTimers.size === 1, 'Expected one visibility watcher');
                reveal(f);
                await waitFor(f.chat);
                const chat = f.chat();
                assert(chat.parentElement.id === 'slot', 'Container mounting changed');
                assert(f.params().get('mode') === 'fullscreen', 'Container must fill its host');
                assert(f.win.assignedUrls.length === 1 && f.win.activeTimers.size === 0, 'Watcher did not stop after loading');
                f.doc.getElementById('modal').style.opacity = '0';
                await delay(250);
                f.doc.getElementById('modal').style.opacity = '1';
                await delay(250);
                assert(f.chat() === chat && f.win.assignedUrls.length === 1, 'Reopen started another iframe');
            } finally { f.cleanup(); }
        });
    }

    test('opacity transition is detected after opening', async () => {
        const f = await fixture({ attributes: { 'data-container': '#slot' }, css: '#modal { opacity:0; transition:opacity 0.3s; }' });
        try {
            assert(!f.chat(), 'Transitioning modal started while closed');
            f.doc.getElementById('modal').style.opacity = '1';
            await waitFor(f.chat);
            assert(Number(f.win.getComputedStyle(f.doc.getElementById('modal')).opacity) > 0, 'Loaded before opacity became positive');
        } finally { f.cleanup(); }
    });

    test('media query changes reveal a hidden container', async () => {
        const f = await fixture({ attributes: { 'data-container': '#slot' }, width: 400, css: '@media(max-width:768px) { #modal { opacity:0; } }' });
        try {
            assert(!f.chat(), 'Mobile-hidden container navigated');
            f.frame.style.width = '1024px';
            await waitFor(f.chat);
        } finally { f.cleanup(); }
    });

    test('replacement container mounts once when visible', async () => {
        const f = await fixture({ attributes: { 'data-container': '#slot' }, css: '#slot { opacity:0; }' });
        try {
            f.doc.getElementById('slot').remove();
            const replacement = f.doc.createElement('div');
            replacement.id = 'slot';
            replacement.style.opacity = '1';
            f.doc.getElementById('modal').appendChild(replacement);
            await waitFor(f.chat);
            assert(f.chat().parentElement === replacement && f.win.assignedUrls.length === 1, 'Replacement was not used');
        } finally { f.cleanup(); }
    });

    test('unload cancels the hidden-container watcher', async () => {
        const f = await fixture({ attributes: { 'data-container': '#slot' }, css: '#modal { opacity:0; }' });
        try {
            f.win.dispatchEvent(new f.win.Event('unload'));
            assert(f.win.activeTimers.size === 0 && !f.chat(), 'Watcher survived unload');
        } finally { f.cleanup(); }
    });

    test('visible inline container fills its host and ignores floating resize', async () => {
        const f = await fixture({ attributes: { 'data-container': '#slot', 'data-position': 'left', 'data-mode': 'default' } });
        try {
            await waitFor(f.chat);
            assert(f.chat().style.width === '100%' && f.chat().style.height === '100%', 'Inline sizing changed');
            assert(!f.params().has('position') && f.params().get('mode') === 'fullscreen', 'Inline mode changed');
            f.win.dispatchEvent(new f.win.MessageEvent('message', { origin:'https://chat.steno.ai', data:{action:'resize',width:'80px',height:'80px'} }));
            assert(f.chat().style.width === '100%', 'Inline sizing responded to floating resize');
        } finally { f.cleanup(); }
    });

    for (const [name, attributes, width, expectedMode, expectedWidth] of [
        ['default right', {'data-mode':'default','data-position':'right'}, 1024, 'default', '80px'],
        ['default left', {'data-mode':'default','data-position':'left'}, 1024, 'default', '80px'],
        ['center launcher', {'data-mode':'default','data-position':'center'}, 1024, 'default', '330px'],
        ['desktop panel', {'data-mode':'panel'}, 1024, 'panel', '80px'],
        ['mobile panel fallback', {'data-mode':'panel'}, 400, null, '80px'],
        ['desktop fullscreen', {'data-mode':'fullscreen'}, 1024, 'fullscreen', '100vw'],
        ['mobile fullscreen', {'data-mode':'fullscreen'}, 400, 'fullscreen', '100vw'],
    ]) {
        test(`${name} retains mode and sizing`, async () => {
            const f = await fixture({ attributes, width });
            try {
                await waitFor(f.chat);
                assert(f.chat().parentElement === f.doc.body, 'Floating iframe mounted elsewhere');
                assert(f.params().get('mode') === expectedMode && f.chat().style.width === expectedWidth, 'Mode or width changed');
                assert(f.params().has('mobile') === (width <= 768), 'Mobile parameter changed');
                assert(f.win.activeTimers.size === 0, 'Floating embed started a visibility watcher');
            } finally { f.cleanup(); }
        });
    }

    test('floating resize validates origin and expands on mobile', async () => {
        const f = await fixture({ width:400, attributes:{'data-position':'right'} });
        try {
            await waitFor(f.chat);
            const data = { action:'resize', width:'400px', height:'600px' };
            f.win.dispatchEvent(new f.win.MessageEvent('message', { origin:'https://untrusted.example',data }));
            assert(f.chat().style.width === '80px', 'Untrusted resize accepted');
            f.win.dispatchEvent(new f.win.MessageEvent('message', { origin:'https://chat.steno.ai',data }));
            assert(f.chat().style.width === '100%' && f.chat().style.height === '100%', 'Mobile expansion changed');
        } finally { f.cleanup(); }
    });

    test('crawler exclusion still prevents iframe navigation', async () => {
        const f = await fixture({ crawler:true, attributes:{'data-container':'#slot'} });
        try {
            assert(!f.chat() && f.win.assignedUrls.length === 0 && f.win.activeTimers.size === 0, 'Crawler initialized an embed');
        } finally { f.cleanup(); }
    });

    let failures = 0;
    for (const { name, run } of tests) {
        const result = document.createElement('li');
        try {
            await run();
            result.className = 'pass';
            result.textContent = `PASS: ${name}`;
        } catch (error) {
            failures++;
            result.className = 'fail';
            result.textContent = `FAIL: ${name}: ${error.message}`;
        }
        document.getElementById('results').appendChild(result);
    }
    document.getElementById('status').textContent = `${tests.length - failures}/${tests.length} passed; ${failures} failed.`;
    document.getElementById('status').dataset.complete = 'true';
})();
