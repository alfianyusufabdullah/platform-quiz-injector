let currentTargetUrl = ``
let currentRequesterTabId = -1

const incr = isReload => new Promise((resolve, reject) => {
    chrome.storage.local.get(['count'], function (result) {
        const count = !result.count ? 1 : result.count + 1
        chrome.storage.local.set({ count, isReload }, function () {
            resolve('Incr ' + count)
        });
    });
})

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    if (request.type === 'request-execute-start') {

        currentTargetUrl = request.createUrl
        currentRequesterTabId = sender.tab.id
        chrome.tabs.create({ url: currentTargetUrl });
        return sendResponse('Start executing!')
    }

    if (request.type === 'current-data-procced') {
        console.log(request);
        return sendResponse('Next!')
    }

    if (request.type === 'save-clicked') {
        setTimeout(async () => {
            chrome.tabs.remove(sender.tab.id, function () {
                console.log(`Close tab with id ${sender.tab.id}`);
            });

            const action = request.action
            switch (action) {
                case 'open-tab':
                    await incr(false)
                    chrome.tabs.create({ url: currentTargetUrl });
                    break;
                case 'reload':
                    await incr(true)
                    chrome.tabs.reload(currentRequesterTabId);
                    break;
            }
        }, 2000)
    }
});