(function(){const l={STYLES:{afterall:{button:`
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
                `,hover:`
                    transform: scale(1.05);
                `,logo:{src:"https://res.cloudinary.com/dyesqqjw9/image/upload/v1749700588/Chatbot_Bubble_tnhqey.svg",styles:`
                        min-width: 172px;
                        transition: transform 0.2s ease-in-out;
                    `}}}};function m(){var t;return(t=document.currentScript)!=null&&t.src&&/steno-button\.js(?:[?#]|$)/.test(document.currentScript.src)?document.currentScript:Array.from(document.scripts).find(e=>e.src&&/steno-button\.js(?:[?#]|$)/.test(e.src))||null}function p(t){try{return new URL("steno-chat.js",t.src).toString()}catch(e){return console.warn("Failed to derive steno-chat.js URL from steno-button.js",e),"https://embed.steno.ai/steno-chat.js"}}function a(){const t=m();if(!t){console.warn("Unable to find the steno-button.js script tag");return}const e=p(t),c=(t==null?void 0:t.getAttribute("data-id"))||"default",d="panel",h=(t==null?void 0:t.getAttribute("data-z-index"))||"9999",n=l.STYLES[c];if(!n){console.warn(`No style configuration found for chat ID: ${c}`);return}const o=document.createElement("button");o.id="openChatButton";const i=document.createElement("img");Object.assign(i,{src:n.logo.src,alt:c,id:"logo"}),o.appendChild(i);const u=document.createElement("style");u.innerHTML=`
            #openChatButton {
                ${n.button}
                z-index: ${h};
            }

            #openChatButton:hover {
                ${n.hover}
            }

            #logo {
                ${n.logo.styles}
            }
        `,document.head.appendChild(u),o.addEventListener("click",function(){if(document.getElementById("stenoScript"))return;const r=document.createElement("script");r.id="stenoScript",r.src=e,Array.from(t.attributes).filter(s=>s.name.startsWith("data-")).forEach(s=>{r.setAttribute(s.name,s.value)}),d&&r.setAttribute("data-mode",d),document.body.appendChild(r),o.style.display="none"}),document.body.appendChild(o)}window.requestIdleCallback?requestIdleCallback(()=>{document.readyState==="interactive"||document.readyState==="complete"?a():window.addEventListener("DOMContentLoaded",a)}):document.readyState==="interactive"||document.readyState==="complete"?a():window.addEventListener("DOMContentLoaded",a)})();
