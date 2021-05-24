const puppeteer = require('@/utils/puppeteer');

async function Scroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = 1000;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

async function getLegacy(id, keyword) {
    const browser = await puppeteer();
    const page = await browser.newPage();
    await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
    });
    let twit_ok = false,
        twit = {};
    let user_ok = false,
        user = {};
    page.on('response', async function (response) {
        if (!twit_ok && response.url().indexOf(keyword) !== -1) {
            twit_ok = true;
            twit = JSON.parse(await response.text());
        }
        if (!user_ok && response.url().indexOf('UserByScreenNameWithoutResults') !== -1) {
            user_ok = true;
            user = JSON.parse(await response.text());
        }
    });
    await page.goto(`https://twitter.com/${id}`);
    while (!(twit_ok && user_ok)) {
        // eslint-disable-next-line no-await-in-loop
        await Scroll(page);
    }
    await page.close();
    await browser.close();
    const legacy_user = user.data.user.legacy;
    const legacy_twit = [];
    for (const entry of twit.data.user.result.timeline.timeline.instructions[0].entries) {
        if (entry.entryId.indexOf('tweet') === -1) {
            continue;
        }
        const t = entry.content.itemContent.tweet.legacy;
        t.user = entry.content.itemContent.tweet.core.user.legacy;
        legacy_twit.push(t);
    }
    return { legacy_twit, legacy_user };
}

const getUserMedia = async function (id) {
    return await getLegacy(id, 'UserMedia');
};

const getUserTweet = async function (id) {
    return await getLegacy(id, 'UserTweet');
};

module.exports = {
    getUserMedia,
    getUserTweet,
};
