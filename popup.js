function bindStorage(name) {
    const input = document.querySelector(`[name=${name}]`);

    // initial value
    chrome.storage.sync.get(name, (response) => {
        console.log('value is', response[name]);
        input.value = response[name] || '';

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: `change-${name}`, payload: response[name] || '' })
        });
    });

    input.addEventListener('change', (e) => {
        const data = {};
        data[name] = e.currentTarget.value;
        chrome.storage.sync.set(data);
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: `change-${name}`, payload: data[name] })
        });
    })
}

bindStorage('endpointUrl');
bindStorage('channel');
bindStorage('mod');