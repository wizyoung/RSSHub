const utils = require('./utils');
const { getUserMedia } = require('./puppeteerget');

module.exports = async (ctx) => {
    const id = ctx.params.id;
    const { legacy_twit, legacy_user } = await getUserMedia(id);
    const userInfo = legacy_user;
    const data = legacy_twit;
    const profileImageUrl = userInfo.profile_image_url || userInfo.profile_image_url_https;

    ctx.state.data = {
        title: `Twitter @${userInfo.name}`,
        link: `https://twitter.com/${id}/`,
        image: profileImageUrl,
        description: userInfo.description,
        item: utils.ProcessFeed(ctx, {
            data,
        }),
    };
};
