const puppeteer = require('@/utils/puppeteer');

function pickLegacyFromTweet(tweet) {
    const legacy = tweet.legacy;
    legacy.user = tweet.core.user.legacy;
    if (legacy.retweeted_status) {
        legacy.retweeted_status = pickLegacyFromTweet(legacy.retweeted_status);
    }
    return legacy;
}

function gatherLegacyFromEntries(entries) {
    const legacy = [];
    for (const entry of entries) {
        if (entry.entryId.indexOf('tweet') === -1) {
            continue;
        }
        legacy.push(pickLegacyFromTweet(entry.content.itemContent.tweet));
    }
    return legacy;
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
            twit = JSON.parse(await response.text());
            twit_ok = true;
        }
        if (!user_ok && response.url().indexOf('UserByScreenNameWithoutResults') !== -1) {
            user = JSON.parse(await response.text());
            user_ok = true;
        }
    });
    await page.goto(`https://twitter.com/${id}/with_replies`);
    await new Promise((resolve) => {
        const waiter = setInterval(() => {
            if (twit_ok && user_ok) {
                clearInterval(waiter);
                resolve();
            }
        });
    });
    await page.close();
    await browser.close();
    const legacy_user = user.data.user.legacy;
    const legacy_twit = gatherLegacyFromEntries(twit.data.user.result.timeline.timeline.instructions[0].entries);
    return { legacy_twit, legacy_user };
}

const getUserMedia = async function (id) {
    return await getLegacy(id, 'UserMedia');
};

const getUserTweet = async function (id) {
    return await getLegacy(id, 'UserTweet');
};

const getUserTweetsAndReplies = async function (id) {
    return await getLegacy(id, 'UserTweetsAndReplies');
};

const excludeRetweet = function (tweets) {
    const excluded = [];
    for (const t of tweets) {
        if (t.retweeted_status) {
            continue;
        }
        excluded.push(t);
    }
    return excluded;
};

module.exports = {
    getUserMedia,
    getUserTweet,
    getUserTweetsAndReplies,
    excludeRetweet,
};
