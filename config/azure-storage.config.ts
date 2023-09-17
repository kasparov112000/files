import { AzureStorageConfiguration } from '../app/providers';

export class AzureStorageConfig implements AzureStorageConfiguration {
    public readonly serviceUrl: string | undefined;
    public readonly shareName?: string | undefined;
    public readonly directoryName?: string | undefined;

    constructor(options: {
        serviceUrl?: string | undefined;
        shareName?: string | undefined;
        directoryName?: string | undefined;
    }) {
        this.serviceUrl = options.serviceUrl;
        this.directoryName = options.directoryName;
        this.shareName = options.shareName;
    }
}
