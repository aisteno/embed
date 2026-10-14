/* The legacy entry point stays cacheable on jsDelivr. Resolve the runtime on
 * each page load so a cached loader does not hold customers on an old widget.
 * Keep the same CDN host to respect customers' existing script-src policies.
 */
(function () {
    const script = document.currentScript;
    if (!script) return;

    const url = new URL('steno-chat-runtime.js', script.src);
    url.search = new URL(script.src).search;
    // Exact releases must remain reproducible. Alias URLs rely on release-time
    // CDN purging, plus a fresh browser URL for every load.
    if (!/@\d+\.\d+\.\d+(?:-[\w.-]+)?\//.test(url.pathname)) {
        url.searchParams.set('_steno_update', String(Date.now()));
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
