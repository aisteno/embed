(function () {
    function initStenoChat() {
        let chatIframe = document.getElementById('chat-iframe');
        if (chatIframe) return; // Check if the chat iframe already exists to avoid duplication

        const chatScript = document.querySelector('script[src$="steno-chat.js"]');
        const chatId = chatScript?.getAttribute('data-id') || 'default';
        const chatOrigin = chatScript?.getAttribute('data-origin') || '';
        const chatUrl = chatScript?.getAttribute('data-url') || 'https://chat.steno.ai';
        const chatPosition = chatScript?.getAttribute('data-position') || 'right';

        // Validate the chatUrl
        const allowedUrls = ['https://chat.steno.ai', 'https://devchat.steno.ai', 'https://chat.rpmplanner.com'];
        if (!allowedUrls.includes(chatUrl)) {
            console.error('Steno Chat - Invalid chat URL. Allowed URLs are: ' + allowedUrls.join(', '));
            return;
        }

        const chatIframeSrc = `${chatUrl}/chat?id=${chatId}&origin=${chatOrigin}&position=${chatPosition}`;

        if (chatIframeSrc) {
            chatIframe = document.createElement('iframe');
            chatIframe.id = 'chat-iframe';
            chatIframe.src = chatIframeSrc;
            chatIframe.style.position = 'fixed';
            chatIframe.style.bottom = '0';
            chatIframe.style.zIndex = '9999';
            chatIframe.style.border = 'none';
            chatIframe.style.colorScheme = 'light dark';

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

            chatIframe.setAttribute('allowTransparency', 'true');
            chatIframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media *; fullscreen; picture-in-picture; microphone *;');
            document.body.appendChild(chatIframe);

            window.addEventListener("message", event => {
                switch (event.data.action) {
                    case "navigate":
                        window.open(event.data.url, "_blank");
                        break;
                    case "resize":
                        if (!event.data.width || !event.data.height) return;
                        const { width, height } = event.data;
                        const isMobile = (window.innerWidth <= 500 ?? window.innerHeight <= 1000) && width !== "80px" && height !== "80px" && width !== "330px";
                        chatIframe.style.width = isMobile ? "100%" : width;
                        chatIframe.style.height = isMobile ? "100%" : height;
                        break;
                    default:
                        return;
                }
            });
        }
    }

    if (document.readyState === "interactive" || document.readyState === "complete") {
        initStenoChat();
    } else {
        window.addEventListener("DOMContentLoaded", initStenoChat);
    }
})();
