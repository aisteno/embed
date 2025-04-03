(function () {
    const CONFIG = {
        STENO_SCRIPT_URL: 'https://cdn.jsdelivr.net/gh/aisteno/embed@latest/steno-chat.js',
        STYLES: {
            afterall: {
                button: `
                    position: fixed;
                    bottom: 10px;
                    right: 10px;
                    z-index: 9999;
                    cursor: pointer;
                    padding: 16px;
                    width: 60px;
                    height: 60px;
                    border-radius: 12px;
                    border-bottom-right-radius: 0px;
                    border: none;
                    background: rgb(23, 120, 129);
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `,
                logo: {
                    src: 'https://res.cloudinary.com/dmcrsjgu0/image/upload/v1743001995/Afterall-logo_npdtys.svg',
                    styles: `
                        width: 45px;
                        height: 45px;
                        object-fit: contain;
                        object-position: center;
                    `
                },
                hover: `
                    background: rgb(20, 108, 116);
                    transform: scale(1.1);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
                `
            }
        }
    };

    function createStenoChatButton() {
        // Get the script element and its attributes
        const buttonScript = document.querySelector('script[src*="steno-button.js"]');
        const chatId = buttonScript?.getAttribute('data-id') || 'default';
        const chatPosition = buttonScript?.getAttribute('data-position');
        const chatMode = buttonScript?.getAttribute('data-mode');
        const chatBackend = buttonScript?.getAttribute('data-backend');
        const chatUrl = buttonScript?.getAttribute('data-url');

        // Get client-specific styles
        const clientStyle = CONFIG.STYLES[chatId];

        // If no style found for this chatId, don't proceed
        if (!clientStyle) {
            console.warn(`No style configuration found for chat ID: ${chatId}`);
            return;
        }

        // Create button and logo
        const openChatButton = document.createElement('button');
        openChatButton.id = 'openChatButton';

        const logoImg = document.createElement('img');
        Object.assign(logoImg, {
            src: clientStyle.logo.src,
            alt: chatId,
            id: 'logo'
        });

        openChatButton.appendChild(logoImg);

        // Create styles
        const style = document.createElement('style');
        style.innerHTML = `
            #openChatButton {
                ${clientStyle.button}
            }

            #openChatButton:hover {
                ${clientStyle.hover}
            }

            #logo {
                ${clientStyle.logo.styles}
            }
        `;
        document.head.appendChild(style);

        // Add click listener
        openChatButton.addEventListener('click', function () {
            if (document.getElementById('stenoScript')) return;

            const stenoScript = document.createElement('script');
            stenoScript.id = 'stenoScript';
            stenoScript.src = CONFIG.STENO_SCRIPT_URL;

            // Forward all data attributes
            if (chatId) stenoScript.setAttribute('data-id', chatId);
            if (chatPosition) stenoScript.setAttribute('data-position', chatPosition);
            if (chatMode) stenoScript.setAttribute('data-mode', chatMode);
            if (chatBackend) stenoScript.setAttribute('data-backend', chatBackend);
            if (chatUrl) stenoScript.setAttribute('data-url', chatUrl);

            document.body.appendChild(stenoScript);
            openChatButton.style.display = 'none';
        });

        document.body.appendChild(openChatButton);
    }

    // Keep the same initialization logic
    if (window.requestIdleCallback) {
        requestIdleCallback(() => {
            if (document.readyState === "interactive" || document.readyState === "complete") {
                createStenoChatButton();
            } else {
                window.addEventListener("DOMContentLoaded", createStenoChatButton);
            }
        });
    } else {
        if (document.readyState === "interactive" || document.readyState === "complete") {
            createStenoChatButton();
        } else {
            window.addEventListener("DOMContentLoaded", createStenoChatButton);
        }
    }
})();