document.addEventListener("DOMContentLoaded", () => {
    const chatScript = document.querySelector('script[src$="steno-chat.js"]');
    const chatId = chatScript?.getAttribute('data-id') || 'default';
    const chatOrigin = chatScript?.getAttribute('data-origin') || '';
    const chatUrl = chatScript?.getAttribute('data-url') || 'https://chat.steno.ai';

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
        chatIframe.style.bottom = '0';
        chatIframe.style.right = '0';
        chatIframe.style.zIndex = '9999';
        chatIframe.style.border = 'none';
        chatIframe.style.width = '80px';
        chatIframe.style.height = '80px';
        document.body.appendChild(chatIframe);

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
});


