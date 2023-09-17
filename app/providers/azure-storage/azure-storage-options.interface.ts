import { AzureStorageConfiguration } from './azure-storage-configuration.interface';

export interface AzureStorageOptions extends AzureStorageConfiguration {
    transactionId?: string | undefined;
}
