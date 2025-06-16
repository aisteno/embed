(function () {
    const CONFIG = {
        STENO_SCRIPT_URL: 'https://cdn.jsdelivr.net/gh/aisteno/embed@latest/steno-chat.js',
        STYLES: {
            afterall: {
                button: `
                    position: fixed;
                    bottom: 10px;
                    right: 10px;
                    cursor: pointer;
                    padding: 16px;
                    width: 172px;
                    height: 79px;
                    background-color: transparent;
                    border: none;
                    outline: none;
                    box-shadow: none;
                    transition: transform 0.2s ease-in-out; 
                `,
                hover: `
                    transform: scale(1.05);
                `,
                logo: {
                    src: 'https://res.cloudinary.com/dyesqqjw9/image/upload/v1749700588/Chatbot_Bubble_tnhqey.svg',
                    styles: `
                        min-width: 172px;
                        transition: transform 0.2s ease-in-out;
                    `
                },
            }
        }
    };

    function createStenoChatButton() {

        const buttonScript = document.querySelector('script[src*="steno-button.js"]');
        const chatId = buttonScript?.getAttribute('data-id') || 'default';
        const chatPosition = buttonScript?.getAttribute('data-position');
        const chatMode = "panel";
        const chatBackend = buttonScript?.getAttribute('data-backend');
        const chatUrl = buttonScript?.getAttribute('data-url');
        const sourceCookieName = buttonScript?.getAttribute('data-cookie-name');
        const targetCookieDomain = buttonScript?.getAttribute('data-cookie-domain');
        const chatZIndex = buttonScript?.getAttribute('data-z-index') || '9999';

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
                z-index: ${chatZIndex};
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
            if (sourceCookieName) stenoScript.setAttribute('data-cookie-name', sourceCookieName);
            if (targetCookieDomain) stenoScript.setAttribute('data-cookie-domain', targetCookieDomain);

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