/* The legacy entry point stays cacheable on jsDelivr. Rotate the runtime URL
 * every ten minutes so repeat page loads can use the browser cache.
 * Keep the same CDN host to respect customers' existing script-src policies.
 */
(function () {
    const script = document.currentScript;
    if (!script) return;

    const url = new URL('steno-chat-runtime.js', script.src);
    url.search = new URL(script.src).search;
    // Exact releases must remain reproducible. Alias URLs rely on release-time
    // CDN purging, plus a new browser URL every ten minutes.
    if (!/@\d+\.\d+\.\d+(?:-[\w.-]+)?\//.test(url.pathname)) {
        url.searchParams.set('_steno_update', String(Math.floor(Date.now() / 600000)));
    }

    const runtime = document.createElement('script');
    for (const attribute of script.attributes) {
        if (attribute.name.startsWith('data-')) {
            runtime.setAttribute(attribute.name, attribute.value);
        }
    }
    if (script.nonce) runtime.nonce = script.nonce;
    runtime.crossOrigin = script.crossOrigin;
    runtime.referrerPolicy = script.referrerPolicy;
    runtime.src = url.toString();
    runtime.onerror = function () {
        console.error('Steno Chat - Failed to load embed runtime');
    };
    script.after(runtime);
})();
