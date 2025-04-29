(function () {
    function isCrawler() {
        return /bot|crawler|spider|crawling/i.test(navigator.userAgent);
    }

    function initNiro() {
        if (isCrawler()) {
            console.log('Crawler detected, skipping chat initialization');
            return;
        }

        const chatScript = document.querySelector('script[src$="niro.js"]');

        let niroIframe = document.getElementById('niro-iframe');
        if (niroIframe) return;

        const niroId = chatScript?.getAttribute('data-id') || 'default';

        const params = new URLSearchParams();
        params.append('id', niroId);

        const niroIframeSrc = `https://niro.steno.ai?${params.toString()}`;

        if (niroIframeSrc) {

            niroIframe = document.createElement('iframe');
            niroIframe.id = 'niro-iframe';
            niroIframe.setAttribute('title', 'Niro Support Widget');
            niroIframe.setAttribute('aria-hidden', 'true');
            niroIframe.setAttribute('tabindex', '-1');
            niroIframe.setAttribute('loading', 'lazy');

            niroIframe.onerror = function () {
                console.error('Failed to load Steno chat widget');
                niroIframe.remove();
            };

            niroIframe.src = niroIframeSrc;
            niroIframe.style.position = 'fixed';
            niroIframe.style.bottom = '0';
            niroIframe.style.zIndex = '9999';
            niroIframe.style.border = 'none';
            niroIframe.style.colorScheme = 'only dark';
            niroIframe.style.overflow = 'hidden';
            niroIframe.style.width = '100vw';
            niroIframe.style.height = '100vh';
            niroIframe.style.top = '0';
            niroIframe.style.left = '0';
            niroIframe.style.right = '0';

            niroIframe.setAttribute('allow', 'autoplay; clipboard-write *; clipboard-read *; encrypted-media *; fullscreen; picture-in-picture; microphone *;');
            niroIframe.setAttribute('scrolling', 'no');

            requestAnimationFrame(() => {
                document.body.appendChild(niroIframe);
            });



            const cleanup = () => {
                niroIframe?.remove();
            };

            window.addEventListener('unload', cleanup);

            window.addEventListener('error', (event) => {
                if (event.target === niroIframe) {
                    console.error('Chat iframe error:', event.error);
                    cleanup();
                }
            });
        }
    }

    if (window.requestIdleCallback) {
        requestIdleCallback(() => {
            if (document.readyState === "interactive" || document.readyState === "complete") {
                initNiro();
            } else {
                window.addEventListener("DOMContentLoaded", initNiro);
            }
        });
    } else {
        if (document.readyState === "interactive" || document.readyState === "complete") {
            initNiro();
        } else {
            window.addEventListener("DOMContentLoaded", initNiro);
        }
    }
})();
