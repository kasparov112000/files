export class AzureStorageResponse {

    public static readonly ERROR_CODE_EXCEPTION: string = 'EXCEPTION';

    public errorCode?: string | undefined;
    public fileId?: string | undefined;
    public message?: string | undefined;
    public requestId?: string | undefined;

    constructor(params: {
        message?: string;
        fileId: string;
        requestId?: string | undefined;
        errorCode?: string | undefined;
    }) {
        this.message = params.message;
        this.fileId = params.fileId;
        this.requestId = params.requestId;
        this.errorCode = params.errorCode;
    }
}
