export interface AzureStorageConfiguration {
    serviceUrl?: string | undefined;
    shareName?: string | undefined;
    directoryName?: string | undefined;
    [key: string]: any;
}
