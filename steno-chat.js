(function () {
    // Add crawler detection
    function isCrawler() {
        return /bot|crawler|spider|crawling/i.test(navigator.userAgent);
    }

    const CONFIG = {
        ALLOWED_URLS: [
            'https://chat.steno.ai',
            'https://devchat.steno.ai',
            'https://chat.rpmplanner.com',
            'https://dev-chat.rpmplanner.com',
            'https://exp-chat.rpmplanner.com'
        ],
        DEFAULT_CHAT_URL: 'https://chat.steno.ai',
        MOBILE_BREAKPOINT: 500
    };

    // Improve URL validation with pattern matching
    function isValidChatUrl(url) {
        return CONFIG.ALLOWED_URLS.includes(url) ||
            CONFIG.ALLOWED_URLS.some(allowed => new URL(url).origin === new URL(allowed).origin);
    }

    function initStenoChat() {
        // Don't initialize for crawlers
        if (isCrawler()) {
            console.log('Crawler detected, skipping chat initialization');
            return;
        }

        let chatIframe = document.getElementById('chat-iframe');
        if (chatIframe) return; // Check if the chat iframe already exists to avoid duplication

        const chatScript = document.querySelector('script[src$="steno-chat.js"]');
        const chatId = chatScript?.getAttribute('data-id') || 'default';
        const chatUrl = chatScript?.getAttribute('data-url') || CONFIG.DEFAULT_CHAT_URL;
        const chatPosition = chatScript?.getAttribute('data-position');
        const chatMode = chatScript?.getAttribute('data-mode');
        const chatBackend = chatScript?.getAttribute('data-backend');

        // Validate the chatUrl
        if (!isValidChatUrl(chatUrl)) {
            console.error('Steno Chat - Invalid chat URL. Allowed URLs are: ' + CONFIG.ALLOWED_URLS.join(', '));
            return;
        }

        const params = new URLSearchParams();
        params.append('id', chatId);
        if (chatPosition) {
            params.append('position', chatPosition);
        }
        if (chatMode) {
            params.append('mode', chatMode);
        }
        if (chatBackend) {
            params.append('backend', chatBackend);
        }

        const chatIframeSrc = `${chatUrl}/chat?${params.toString()}`;

        if (chatIframeSrc) {
            chatIframe = document.createElement('iframe');

            // Add SEO-friendly attributes
            chatIframe.id = 'chat-iframe';
            chatIframe.setAttribute('title', 'Steno Chat Support Widget');
            chatIframe.setAttribute('aria-hidden', 'true');
            chatIframe.setAttribute('tabindex', '-1');
            chatIframe.setAttribute('loading', 'lazy');

            // Add error handling
            chatIframe.onerror = function () {
                console.error('Failed to load Steno chat widget');
                chatIframe.remove();
            };

            chatIframe.src = chatIframeSrc;
            chatIframe.style.position = 'fixed';
            chatIframe.style.bottom = '0';
            chatIframe.style.zIndex = '9999';
            chatIframe.style.border = 'none';
            chatIframe.style.colorScheme = 'only dark';
            chatIframe.style.overflow = 'hidden';

            if (chatPosition === 'center') {
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

            // Defer iframe insertion using requestAnimationFrame
            requestAnimationFrame(() => {
                document.body.appendChild(chatIframe);
            });

            // Optimize message event listener with a single bound function
            const messageHandler = event => {
                // Add origin verification
                if (!CONFIG.ALLOWED_URLS.includes(event.origin)) return;

                if (!event.data?.action) return;

                try {
                    switch (event.data.action) {
                        case "navigate":
                            if (!event.data.url) return;
                            // Add URL validation before opening
                            const url = new URL(event.data.url);
                            if (url.protocol !== 'https:') return;
                            window.open(url.href, "_blank", "noopener,noreferrer");
                            break;
                        case "resize":
                            if (!event.data.width || !event.data.height) return;
                            const { width, height } = event.data;
                            const isMobile = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT &&
                                width !== "80px" &&
                                height !== "80px" &&
                                width !== "330px";
                            chatIframe.style.width = isMobile ? "100%" : width;
                            chatIframe.style.height = isMobile ? "100%" : height;
                            break;
                        default:
                            return;
                    }
                } catch (error) {
                    console.error('Error handling message:', error);
                }
            };

            window.addEventListener("message", messageHandler);

            // Add cleanup function
            const cleanup = () => {
                window.removeEventListener("message", messageHandler);
                chatIframe?.remove();
            };

            // Clean up on page unload
            window.addEventListener('unload', cleanup);

            // Add error boundary
            window.addEventListener('error', (event) => {
                if (event.target === chatIframe) {
                    console.error('Chat iframe error:', event.error);
                    cleanup();
                }
            });
        }
    }

    // Use requestIdleCallback for non-critical initialization
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