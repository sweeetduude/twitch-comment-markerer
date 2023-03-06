
const COMMENT_AREA_CLASSNAME = 'twitch-chat-markerer-custom-comment-area';
const INLINE_AREA_CLASSNAME = 'twitch-chat-markerer-inline-area';
const CUSTOM_HIGHLIGHT_ID = 'twitch-chat-markerer-custom-highlight';

let ENDPOINT_URL = "";
let CHANNEL = "";
let MOD = "";

function changeChannel(newChannel) {
    CHANNEL = newChannel;
    const $button = document.getElementById(CUSTOM_HIGHLIGHT_ID);
    if ($button) {
        $button.style.display = isOnChannel() ? 'block' : 'none';
    }
}

function changeEndpointUrl(newEndpointUrl) {
    ENDPOINT_URL = newEndpointUrl;
}

// get intial state from storage
chrome.storage.sync.get("channel", (response) => {
    CHANNEL = response["channel"] || '';
});

chrome.storage.sync.get("endpointUrl", (response) => {
    ENDPOINT_URL = response["endpointUrl"] || '';
});

chrome.storage.sync.get("mod", (response) => {
    MOD = response["mod"] || '';
});

// listen to changes from popup
chrome.runtime.onMessage.addListener(function(request) {
    if (request.action === 'change-endpointUrl') {
        changeEndpointUrl(request.payload);
    } else if (request.action === 'change-channel') {
        changeChannel(request.payload);
    }
});

function isOnChannel() {
    return location.href.indexOf('twitch.tv/' + CHANNEL) > -1;
}

function sendMessage(messageData) {
    console.log(messageData);
    return fetch(ENDPOINT_URL, {
        method: "POST",
        body: JSON.stringify(messageData),
    });
}

function createButton(isPrimary) {
    const $button = document.createElement('button');
    $button.style.background = isPrimary ? '#9147ff' : '#3a3a3d';
    $button.style.borderRadius = '2px';
    $button.style.border = 'none';
    $button.style.cursor = 'pointer';
    $button.style.padding = '4px 8px';
    $button.style.marginLeft = '8px';
    $button.style.lineHeight = '1.2rem';
    $button.style.fontSize = '1.2rem';
    $button.style.fontWeight = 'bold';
    return $button;
}

function createCommentArea() {
    const $commentArea = document.createElement('div');
    $commentArea.className = COMMENT_AREA_CLASSNAME;
    $commentArea.style.position = 'relative';
    $commentArea.style.right = '0px;';
    $commentArea.style.minHeight = '100px';
    $commentArea.style.width = '100%';
    $commentArea.style.padding = '3px';
    $commentArea.style.background = '#18181b';
    $commentArea.style.borderRadius = '4px';
    $commentArea.style.border = '1px solid #303032';
    $commentArea.style.zIndex = 999;

    const $textarea = document.createElement('textarea');
    $textarea.style.display = 'block';
    $textarea.style.width = '100%';
    $textarea.style.height = '98px';
    $textarea.style.background = '#000';
    $textarea.style.color = '#efeff1';
    $textarea.style.border = '#a970ff';
    $textarea.style.padding = '5px';
    $textarea.style.fontFamily = 'Inter, Roobert, "Helvetica Neue", Helvetica, Arial, sans-serif';
    $textarea.style.fontSize = '13px';
    $textarea.name = 'message';
    $commentArea.appendChild($textarea);

    const $button = createButton(true);
    $button.innerHTML = 'Send';
    $button.addEventListener('click', () => {
        const chatData = {
            isCustomMessage: true,
            mod: MOD,
            message: $textarea.value || '',
        };

        $commentArea.innerHTML = 'sending...';

        sendMessage(chatData).then(() => {
            $commentArea.innerHTML = 'Sent!';
        });

        setTimeout(() => {
            $commentArea.remove();
        }, 750);
    });
    $commentArea.appendChild($button);

    return $commentArea;
}

function activateOnPage() {

    //channel-root__right-column
    //const $container = document.body.querySelector('.chat-scrollable-area__message-container');

    const $container = document.body.querySelector('.stream-chat-header');

    if (!$container) {
        return;
    }

    // to prove that it works you could color the chat..
    // document.body.querySelector('.chat-scrollable-area__message-container').style.backgroundColor = 'green';

    const $buttonHighlight = createButton(true);
    $buttonHighlight.id = CUSTOM_HIGHLIGHT_ID;
    $buttonHighlight.innerHTML = 'ALERT'; //Highlight message
    $buttonHighlight.addEventListener('click', () => {      
        if (!ENDPOINT_URL) {
            alert('Set endpoint url in addon settings!');
            return;
        }
        const $preExistingArea = document.querySelector(`.${COMMENT_AREA_CLASSNAME}`);

        if ($preExistingArea) {
            $preExistingArea.remove();
            return;
        }

        const $commentArea = createCommentArea();
        $buttonHighlight.parentElement.after($commentArea)
        //$buttonHighlight.after($commentArea);

        $commentArea.querySelector('textarea').focus();
    });
    $buttonHighlight.style.position = 'relative';
    $buttonHighlight.style.padding = '2px 5px';
    //$buttonHighlight.style.right = '10px';
    //$buttonHighlight.style.top = '10px';
    $buttonHighlight.style.zIndex = 999;
    $buttonHighlight.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
    $buttonHighlight.style.display = isOnChannel() ? 'block' : 'none';
    $container.appendChild($buttonHighlight);


    const $chatContainer = document.body.querySelector('.chat-scrollable-area__message-container');

    $chatContainer.addEventListener('dblclick', (e) => {
        if (!isOnChannel()) {
            console.info(`[Markerer]: Skipping marker, not on channel: ${CHANNEL}`);
            return;
        }

        const $chatLine = e.target.closest('.chat-line__message');

        if ($chatLine) {
            $chatLine.style.position = 'relative'; // <-- this line is added
            const markerer = $chatLine.querySelector(`.${INLINE_AREA_CLASSNAME}`);
            if (!markerer) {
                let $preExistingMarkerers = document.querySelector(`.${INLINE_AREA_CLASSNAME}`);

                if ($preExistingMarkerers) {
                    $preExistingMarkerers.remove();
                    $preExistingMarkerers = null;
                }

                const $actionMenu = document.createElement('div');
                $actionMenu.className = INLINE_AREA_CLASSNAME;
                $actionMenu.style.position = 'absolute';
                $actionMenu.style.right = '0px;';
                $actionMenu.style.bottom = '0px';
                $actionMenu.style.height = '32px';
                $actionMenu.style.padding = '3px';
                $actionMenu.style.background = '#18181b';
                $actionMenu.style.borderRadius = '4px';
                $actionMenu.style.border = '1px solid #303032';

                const $buttonMark = createButton(true);
                $buttonMark.innerHTML = 'mark';
                $buttonMark.addEventListener('click', () => {
                    $actionMenu.innerHTML = 'Sending..';
                    const chatData = {
                        mod: MOD,
                        isMod: !!$chatLine.querySelector('[data-base="moderator"]'),
                        isVip: !!$chatLine.querySelector('[data-badge="vip"]'),
                        isSubbed: !!$chatLine.querySelector('[data-badge="subscriber"]'),
                        username: $chatLine.querySelector('.chat-author__display-name').innerText,
                        message: Array.from(($chatLine.querySelector('.message') || $chatLine.querySelector('[data-test-selector="chat-line-message-body"]') || {}).children || ['message not found']).map(elm => {
                            if (elm.classList.contains('text-fragment')) {
                                return elm.innerText;
                            }

                            const $img = elm.querySelector('img');
                            return $img ? `[${$img.getAttribute('alt')}]` : elm.innerText;
                        }).join(' '),
                    };


                    sendMessage(chatData).then(() => {
                        $actionMenu.innerHTML = 'Sent!';
                    });

                    setTimeout(() => {
                        $actionMenu.remove();
                    }, 750);
                });
                $actionMenu.appendChild($buttonMark);

                const $buttonClose = createButton(false);
                $buttonClose.innerHTML = '&times;';
                $buttonClose.addEventListener('click', () => {
                    $actionMenu.remove();
                });
                $actionMenu.appendChild($buttonClose);
                $chatLine.appendChild($actionMenu);
            } else {
                markerer.remove();
            }
        }
    });
}

// give a second to load other addons which edit the DOM
setTimeout(() => {
    activateOnPage();
}, 1000);
