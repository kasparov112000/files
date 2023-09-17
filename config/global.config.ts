import { AzureStorageConfig } from './azure-storage.config';

const ENV_NAME = process.env.ENV_NAME || 'LOCAL';
const msport = (process.env.ENV_NAME || 'LOCAL') !== 'LOCAL' ? 3000 : 3008;

const serviceConfigs = {
    port: msport,
    envName: ENV_NAME,
};

const azureStorageConfig: AzureStorageConfig = new AzureStorageConfig({
    directoryName: process.env.FILE_UPLOAD_DIRECTORY_NAME || 'mdl-attachments',
    serviceUrl: process.env.FILE_UPLOAD_SAS_URL || 'https://pzigxnus2slc96cd001.file.core.windows.net/?sv=2019-02-02&ss=f&srt=sco&sp=rwdlc&se=2030-01-28T22:13:55Z&st=2020-01-28T14:13:55Z&spr=https&sig=Q8M2cZg5Pou4Ve1OCG98FXQ4wZAoqxcAagSWncaLeZI%3D',
    shareName: process.env.FILE_UPLOAD_SHARE_NAME || 'mdl-storage'
});

// App Dynamics
const debug = process.env.APPD_DEBUG || true;
const controllerHostName = process.env.APPDYNAMICS_CONTROLLER_HOST_NAME || '<hostname>';
const controllerPort = process.env.APPDYNAMICS_CONTROLLER_PORT || 443;
const controllerSslEnabled = process.env.APPDYNAMICS_CONTROLLER_SSL_ENABLED || true;
const accountName = process.env.APPDYNAMICS_ACCOUNT_NAME || '<accountname>';
const accountAccessKey = process.env.APPDYNAMICS_ACCOUNT_ACCESS_KEY || '<accesskey>';
const applicationName = process.env.APPDYNAMICS_APPLICATION_NAME || '<appname>';
const tierName = '<servicename>' || process.env.APPDYNAMICS_TIER_NAME;
const nodeName = '<servicename>' || process.env.APPDYNAMICS_NODE_NAME;
const reuseNode = true;
const reuseNodePrefix = '<servicename>';
const libagent = true;

const appDynamicsConfigs = {
    environmentName: ENV_NAME,
    port: msport,
    enableAppdynamics: process.env.ENABLE_APPDYNAMICS || false,
    appdynamicsProfile: {
        debug: debug,
        controllerHostName: controllerHostName,
        controllerPort: controllerPort,
        controllerSslEnabled: controllerSslEnabled,
        accountName: accountName,
        accountAccessKey: accountAccessKey,
        applicationName: applicationName,
        tierName: tierName,
        nodeName: nodeName,
        reuseNode: reuseNode,
        reuseNodePrefix: reuseNodePrefix,
        libagent: libagent,
    },
};
// /App Dynamics

export { serviceConfigs, appDynamicsConfigs, azureStorageConfig };
