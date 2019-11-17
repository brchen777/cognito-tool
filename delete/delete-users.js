(async () => {
    const AWS = require('aws-sdk');
    const rootPath = require('app-root-path').path;

    const __PATH__ = {
        config: `${rootPath}/configs`,
        credential: 'credential',
        defaultFile: 'default.json',
        productionFile: 'production.json'
    };

    // Load credentials
    try {
        const credentialDefault = require(`${__PATH__.config}/${__PATH__.credential}/${__PATH__.defaultFile}`);
        const credentialUser = require(`${__PATH__.config}/${__PATH__.credential}/${__PATH__.productionFile}`);
        AWS.config.set('credentials', Object.assign(credentialDefault, credentialUser));
        console.log('========== Load credentials ==========');
        console.log(`Access key: ${AWS.config.credentials.accessKeyId}`);
        console.log(`Secret access key: ${AWS.config.credentials.secretAccessKey}`);
        console.log(`Region: ${AWS.config.credentials.region}`);
    } catch (err) {
        console.log('Your credentials not loaded', err);
        throw err;
    }
    const cognito = new AWS.CognitoIdentityServiceProvider(AWS.config.credentials);

    // Load config
    console.log('\n========== Prepare something ==========');
    let configMode = 'default';
    let configParams = require(`./${__PATH__.defaultFile}`);
    try {
        configParams = require(`./${__PATH__.productionFile}`);
        configMode = 'production';
    } catch (err) {}
    console.log(`Load ${configMode} config`);

    // Get user list
    console.log('Get user list');
    const { UserPoolId: userPoolId, WhiteListUserIds: whiteList = [] } = configParams;
    const users = await cognito
        .listUsers({ UserPoolId: userPoolId })
        .promise()
        .then(data => {
            return data.Users;
        })
        .catch(err => {
            console.log(err);
        });

    // Delete users
    console.log('\n========== Delete users start ==========');
    let whiteListMatchCnt = 0;
    let deleteSuccessCnt = 0;
    let deleteFailedCnt = 0;
    for (const { Username: userName } of users) {
        if (whiteList.includes(userName)) {
            whiteListMatchCnt++;
            continue;
        }

        await cognito
            .adminDeleteUser({
                UserPoolId: userPoolId,
                Username: userName
            })
            .promise()
            .then(() => {
                console.log(`User ${userName} delete finish`);
                deleteSuccessCnt++;
            })
            .catch(err => {
                console.error(err);
                deleteFailedCnt++;
            });
    }
    console.log('========== Delete users end ==========');

    // Show results
    console.log('\n========== Report ==========');
    console.log(`Whitelist count: ${whiteList.length}`);
    console.log(`Whitelist match count: ${whiteListMatchCnt}`);
    console.log(`Total in user list: ${users.length}`);
    console.log(`Delete success count: ${deleteSuccessCnt}`);
    console.log(`Delete failed count: ${deleteFailedCnt}`);
})();
