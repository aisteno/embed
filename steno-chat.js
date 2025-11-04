(function () {
    function isCrawler() {
        return /bot|crawler|spider|crawling/i.test(navigator.userAgent);
    }

    const CONFIG = {
        DEFAULT_CHAT_URL: 'https://chat.steno.ai',
        MOBILE_BREAKPOINT: 768,
        API_BASE_URL: 'https://voice-api.steno.ai'
    };

    // In-memory Promise cache for domain validation - secure and performant
    const domainValidationPromises = new Map();

    function checkDomainWithAPI(url) {
        try {
            const domain = new URL(url).hostname;

            // Check if a validation Promise for this domain is already in flight
            if (domainValidationPromises.has(domain)) {
                // Return the existing promise - all callers will await the same result
                return domainValidationPromises.get(domain);
            }

            // Create a new validation request
            const fetchPromise = fetch(`${CONFIG.API_BASE_URL}/api/v1/domains/check?domain=${encodeURIComponent(domain)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    // For non-ok responses, treat as invalid
                    return { isValid: false };
                })
                .then(data => {
                    // Return the boolean result
                    return data.isValid;
                })
                .catch(error => {
                    // On network error or any other failure, fail closed (deny access)
                    console.error('Domain validation API error:', error);
                    return false;
                });

            // Store the Promise in the map immediately
            domainValidationPromises.set(domain, fetchPromise);

            // Return the new promise
            return fetchPromise;

        } catch (error) {
            // This catches synchronous errors like a malformed URL
            console.error('Domain validation sync error:', error);
            return Promise.resolve(false);
        }
    }

    function getCookieValue(cookieName) {
        const match = document.cookie.match(new RegExp(`(^|;\\s*)${cookieName}=([^;]+)`));
        return match ? decodeURIComponent(match[2]) : null;
    }

    function setTopLevelCookie(cookieValue, domain) {
        if (!cookieValue || !domain) return;
        const cookieStr = `StenoInfo=${encodeURIComponent(cookieValue)}; path=/; domain=${domain}; secure; samesite=lax`;
        document.cookie = cookieStr;
    }

    async function initStenoChat() {
        if (isCrawler()) {
            console.log('Crawler detected, skipping chat initialization');
            return;
        }

        const chatScript = document.querySelector('script[src$="steno-chat.js"]');
        const sourceCookieName = chatScript?.getAttribute('data-cookie-name');
        const targetCookieDomain = chatScript?.getAttribute('data-cookie-domain');

        // Read source cookie and write cookie if both params are set
        if (sourceCookieName && targetCookieDomain) {
            const rawCookieValue = getCookieValue(sourceCookieName);
            setTopLevelCookie(rawCookieValue, targetCookieDomain);
        }

        let chatIframe = document.getElementById('chat-iframe');
        if (chatIframe) return;

        const chatId = chatScript?.getAttribute('data-id') || 'default';
        const chatUrl = chatScript?.getAttribute('data-url') || CONFIG.DEFAULT_CHAT_URL;
        const chatPosition = chatScript?.getAttribute('data-position');
        const chatMode = chatScript?.getAttribute('data-mode');
        const chatBackend = chatScript?.getAttribute('data-backend');
        const chatLanguage = chatScript?.getAttribute('data-language');
        const chatZIndex = chatScript?.getAttribute('data-z-index') || '9999';

        // Check domain validity with API or fallback
        const isValid = await checkDomainWithAPI(chatUrl);
        if (!isValid) {
            console.error('Steno Chat - Invalid chat URL. Domain not authorized.');
            return;
        }

        // Check if we're on mobile and disable panel mode if so
        const isMobile = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
        const effectiveMode = (isMobile && chatMode === 'panel') ? null : chatMode;

        if (isMobile && chatMode === 'panel') {
            console.log('Mobile detected: Panel mode disabled, chat will start closed');
        }

        const params = new URLSearchParams();
        params.append('id', chatId);
        if (chatPosition) params.append('position', chatPosition);
        if (effectiveMode) params.append('mode', effectiveMode);
        if (chatBackend) params.append('backend', chatBackend);
        if (chatLanguage) params.append('language', chatLanguage);
        if (isMobile) params.append('mobile', 'true');

        const chatIframeSrc = `${chatUrl}?${params.toString()}`;

        if (chatIframeSrc) {
            chatIframe = document.createElement('iframe');

            chatIframe.id = 'chat-iframe';
            chatIframe.setAttribute('title', 'Steno Chat Support Widget');
            chatIframe.setAttribute('aria-hidden', 'true');
            chatIframe.setAttribute('tabindex', '-1');
            chatIframe.setAttribute('loading', 'lazy');

            chatIframe.onerror = function () {
                console.error('Failed to load Steno chat widget');
                chatIframe.remove();
            };

            chatIframe.src = chatIframeSrc;
            chatIframe.style.position = 'fixed';
            chatIframe.style.bottom = '0';
            chatIframe.style.zIndex = chatZIndex;
            chatIframe.style.border = 'none';
            chatIframe.style.colorScheme = 'only dark';
            chatIframe.style.overflow = 'hidden';

            if (chatMode === 'fullscreen') {
                chatIframe.style.top = '0';
                chatIframe.style.left = '0';
                chatIframe.style.width = '100vw';
                chatIframe.style.height = '100vh';
                chatIframe.style.bottom = 'unset';
            } else if (chatPosition === 'center') {
                chatIframe.style.left = '50%';
                chatIframe.style.transform = 'translateX(-50%)';
                chatIframe.style.width = '330px';
                chatIframe.style.height = '80px';
            } else {
                chatIframe.style[chatPosition === 'left' ? 'left' : 'right'] = '0';
                chatIframe.style.width = '80px';
                chatIframe.style.height = '80px';
            }

            chatIframe.setAttribute('allow', 'autoplay; clipboard-write *; clipboard-read *; encrypted-media *; fullscreen; picture-in-picture; microphone *;');
            chatIframe.setAttribute('scrolling', 'no');

            requestAnimationFrame(() => {
                document.body.appendChild(chatIframe);
            });

            const messageHandler = async event => {
                // Validate origin against API
                const isValidOrigin = await checkDomainWithAPI(event.origin);
                if (!isValidOrigin) return;
                if (!event.data?.action) return;

                try {
                    switch (event.data.action) {
                        case "navigate": {
                            if (!event.data.url) return;
                            const url = new URL(event.data.url);
                            const allowedProtocols = ['https:', 'tel:', 'mailto:'];
                            if (!allowedProtocols.includes(url.protocol)) return;
                            if (url.protocol === 'tel:') {
                                window.location.href = url.href;
                            } else {
                                window.open(url.href, "_blank", "noopener,noreferrer");
                            }
                            break;
                        }
                        case "resize": {
                            if (!event.data.width || !event.data.height) return;

                            // Don't resize if we're in fullscreen mode
                            if (chatMode === 'fullscreen') return;

                            const { width, height } = event.data;
                            const isMobile = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT &&
                                width !== "80px" &&
                                height !== "80px" &&
                                width !== "330px";
                            chatIframe.style.width = isMobile ? "100%" : width;
                            chatIframe.style.height = isMobile ? "100%" : height;
                            break;
                        }
                        default:
                            return;
                    }
                } catch (error) {
                    console.error('Error handling message:', error);
                }
            };

            window.addEventListener("message", messageHandler);

            const cleanup = () => {
                window.removeEventListener("message", messageHandler);
                chatIframe?.remove();
            };

            window.addEventListener('unload', cleanup);

            window.addEventListener('error', (event) => {
                if (event.target === chatIframe) {
                    console.error('Chat iframe error:', event.error);
                    cleanup();
                }
            });
        }
    }

    if (window.requestIdleCallback) {
        requestIdleCallback(() => {
            if (document.readyState === "interactive" || document.readyState === "complete") {
                initStenoChat();
            } else {
                window.addEventListener("DOMContentLoaded", initStenoChat);
            }
        });
    } else {
        if (document.readyState === "interactive" || document.readyState === "complete") {
            initStenoChat();
        } else {
            window.addEventListener("DOMContentLoaded", initStenoChat);
        }
    }
})();
