export class AzureStorageException extends Error {
    public storageFileName?: string | undefined;
    public statusCode?: number | undefined;

    constructor(params: {
        message: string;
        storageFileName?: string | undefined;
        statusCode?: number | undefined;
        stack: string;
    }) {
        super(params.message);
        this.stack = params.stack;
        this.statusCode = params.statusCode;
        this.storageFileName = params.storageFileName;
    }
}
