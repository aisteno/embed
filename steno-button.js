(function () {
    const CONFIG = {
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

    function getButtonScript() {
        if (document.currentScript?.src && /steno-button\.js(?:[?#]|$)/.test(document.currentScript.src)) {
            return document.currentScript;
        }

        return Array.from(document.scripts).find((script) =>
            script.src && /steno-button\.js(?:[?#]|$)/.test(script.src)
        ) || null;
    }

    function getChatScriptUrl(buttonScript) {
        try {
            return new URL('steno-chat.js', buttonScript.src).toString();
        } catch (error) {
            console.warn('Failed to derive steno-chat.js URL from steno-button.js', error);
            return 'https://embed.steno.ai/steno-chat.js';
        }
    }

    function createStenoChatButton() {
        const buttonScript = getButtonScript();

        if (!buttonScript) {
            console.warn('Unable to find the steno-button.js script tag');
            return;
        }

        const chatScriptUrl = getChatScriptUrl(buttonScript);
        const chatId = buttonScript?.getAttribute('data-id') || 'default';
        const chatMode = "panel";
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
            stenoScript.src = chatScriptUrl;

            // Forward all data-* attributes from the button embed to the chat embed.
            Array.from(buttonScript.attributes)
                .filter((attribute) => attribute.name.startsWith('data-'))
                .forEach((attribute) => {
                    stenoScript.setAttribute(attribute.name, attribute.value);
                });

            if (chatMode) stenoScript.setAttribute('data-mode', chatMode);

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
