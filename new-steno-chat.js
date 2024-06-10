(function () {
    let stenoChatLoaded = false;

    function initStenoChat() {
        if (stenoChatLoaded || document.readyState !== "interactive" || document.readyState !== "complete") return;
        stenoChatLoaded = true;

        const chatScript = document.querySelector('script[src$="steno-chat.js"]');
        const chatId = chatScript?.getAttribute('data-id') || 'default';
        const chatOrigin = chatScript?.getAttribute('data-origin') || '';
        const chatUrl = chatScript?.getAttribute('data-url') || 'https://chat.steno.ai';
        const chatPosition = chatScript?.getAttribute('data-position') || 'right';

        const allowedUrls = ['https://chat.steno.ai', 'https://devchat.steno.ai', 'https://chat.rpmplanner.com'];
        if (!allowedUrls.includes(chatUrl)) {
            console.error('Steno Chat - Invalid chat URL. Allowed URLs are: ' + allowedUrls.join(', '));
            return;
        }

        const chatIframeSrc = `${chatUrl}/chat?id=${chatId}&origin=${chatOrigin}&position=${chatPosition}`;
        const chatIframe = document.createElement('iframe');
        setupIframe(chatIframe, chatPosition, chatIframeSrc);
        document.body.appendChild(chatIframe);

        window.addEventListener("message", handleMessage);
    }

    function setupIframe(iframe, position, src) {
        iframe.id = 'chat-iframe';
        iframe.src = src;
        iframe.style = `position: fixed; bottom: 0; z-index: 9999; border: none; ${position === 'center' ? `left: 50%; transform: translateX(-50%); width: 330px; height: 80px;` : `${position}: 0; width: 80px; height: 80px;`}`;
        iframe.setAttribute('allowTransparency', 'true');
        iframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media *; fullscreen; picture-in-picture; microphone *;');
    }

    function handleMessage(event) {
        const actions = {
            navigate: () => window.open(event.data.url, "_blank"),
            resize: () => {
                if (!event.data.width || !event.data.height) return;
                const { width, height } = event.data;
                const isMobile = (window.innerWidth <= 500 && window.innerHeight <= 1000) && width !== "80px" && height !== "80px" && width !== "330px";
                chatIframe.style.width = isMobile ? "100%" : width;
                chatIframe.style.height = isMobile ? "100%" : height;
            }
        };
        if (actions[event.data.action]) actions[event.data.action]();
    }

    if (document.readyState === "interactive" || document.readyState === "complete") {
        initStenoChat();
    } else {
        window.addEventListener("load", initStenoChat);
    }
})();
