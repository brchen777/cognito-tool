(async () => {
    const AWS = require('aws-sdk');
    const rootPath = require('app-root-path').path;

    const __PATH__ = {
        config: `${rootPath}/configs`,
        credential: 'credential',
        pool: 'user-pool',
        client: 'user-pool-client',
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

    // Load user pool config
    console.log('\n========== Load pool and client config ==========');
    let poolMode = 'default';
    let poolParams = require(`${__PATH__.config}/${__PATH__.pool}/${__PATH__.defaultFile}`);
    try {
        poolParams = require(`${__PATH__.config}/${__PATH__.pool}/${__PATH__.productionFile}`);
        poolMode = 'production';
    } catch (err) {}
    console.log(`Pool load ${poolMode} config`);

    // Load user client config
    let clientMode = 'default';
    let clientParams = require(`${__PATH__.config}/${__PATH__.client}/${__PATH__.defaultFile}`);
    try {
        clientParams = require(`${__PATH__.config}/${__PATH__.client}/${__PATH__.productionFile}`);
        clientMode = 'production';
    } catch (err) {}
    console.log(`Client load ${clientMode} config`);

    // Create user pool
    console.log('\n========== Result ==========');
    console.log(`Pool name: ${poolParams.PoolName}`);
    const userPoolId = await cognito
        .createUserPool(poolParams)
        .promise()
        .then(data => {
            console.log(`Pool Id: ${data.UserPool.Id}`);
            return data.UserPool.Id;
        })
        .catch(err => {
            console.log(err, err.stack);
        });

    // Add App client
    clientParams.UserPoolId = userPoolId;
    await cognito
        .createUserPoolClient(clientParams)
        .promise()
        .then(data => {
            console.log(`App client id: ${data.UserPoolClient.ClientId}`);
            console.log(`App client secret: ${data.UserPoolClient.ClientSecret}`);
        })
        .catch(err => {
            console.log(err, err.stack);
        });
})();
