(function () {
    let stenoChatLoaded = false;

    function initStenoChat() {
        if (stenoChatLoaded) return;

        const chatScript = document.querySelector('script[src$="steno-chat.js"]');
        const chatId = chatScript?.getAttribute('data-id') || 'default';
        const chatOrigin = chatScript?.getAttribute('data-origin') || '';
        const chatUrl = chatScript?.getAttribute('data-url') || 'https://chat.steno.ai';
        const chatPosition = chatScript?.getAttribute('data-position') || 'right';

        // Validate the chatUrl
        const allowedUrls = ['https://chat.steno.ai', 'https://devchat.steno.ai'];
        if (!allowedUrls.includes(chatUrl)) {
            console.error('Steno Chat - Invalid chat URL. Allowed URLs are: ' + allowedUrls.join(', '));
            return;
        }

        const chatIframeSrc = `${chatUrl}/chat?id=${chatId}&origin=${chatOrigin}`;

        if (chatIframeSrc) {
            const chatIframe = document.createElement('iframe');
            chatIframe.id = 'chat-iframe';
            chatIframe.src = chatIframeSrc;
            chatIframe.style.position = 'fixed';
            chatIframe.style[chatPosition === 'left' ? 'left' : 'right'] = '0';
            chatIframe.style.bottom = '0';
            chatIframe.style.zIndex = '9999';
            chatIframe.style.border = 'none';
            chatIframe.style.width = '80px';
            chatIframe.style.height = '80px';
            document.body.appendChild(chatIframe);
            chatIframe.setAttribute('allowTransparency', 'true');
            stenoChatLoaded = true;

            chatIframe.onload = function () {
                chatIframe.contentDocument.body.style.backgroundColor = 'transparent';
            };

            window.addEventListener("message", event => {
                switch (event.data.action) {
                    case "navigate":
                        window.open(event.data.url, "_blank");
                        break;
                    case "resize":
                        if (!event.data.width || !event.data.height) return;
                        const { width, height } = event.data;
                        const isMobile = (window.innerWidth <= 500 ?? window.innerHeight <= 1000) && width !== "80px" && height !== "80px";
                        chatIframe.style.width = isMobile ? "100%" : width;
                        chatIframe.style.height = isMobile ? "100%" : height;
                        break;
                    default:
                        return;
                }
            });
        }
    }

    // handle the case where the script is loaded after the DOMContentLoaded event (e.g. React, Vue, etc.)
    document.addEventListener("steno-chat-loaded", initStenoChat);
    document.addEventListener("DOMContentLoaded", initStenoChat);
})();