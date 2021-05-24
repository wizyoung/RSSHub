const utils = require('./utils');
// const config = require('@/config').value;
const { getUserMedia } = require('./puppeteerget');

module.exports = async (ctx) => {
    const id = ctx.params.id;
    // if (!config.twitter || !config.twitter.consumer_key || !config.twitter.consumer_secret) {
    const { legacy_twit, legacy_user } = await getUserMedia(id);
    const userInfo = legacy_user;
    const data = legacy_twit;
    // } else {
    // // else 里的代码应该是基于API获取User Media的方式
    // // 留待申请到了Twitter Developer的好心人实现
    // const { legacy_twit, legacy_user } = await getUserMedia(id);
    // userInfo = legacy_user;
    // data = legacy_twit;
    // }
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
