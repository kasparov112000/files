import {
    ServiceURL,
    StorageURL,
    AnonymousCredential,
    Aborter,
    DirectoryURL,
    ShareURL,
    FileURL,
    uploadStreamToAzureFile
} from '@azure/storage-file';

import { AzureStorageConfiguration } from './azure-storage-configuration.interface';
import { AzureStorageOptions } from './azure-storage-options.interface';
import { AzureStorageResponse } from './azure-storage-response.model';
import { AzureStorageException } from './azure-storage.exception';
import { FileDownloadResponse, FileUploadRangeResponse } from '@azure/storage-file/typings/src/generated/src/models';
import { Duplex } from 'stream';

export class AzureStorageProvider {
    private serviceUrl: ServiceURL;
    private azureStorageOptions: AzureStorageOptions;

    constructor(private azureStorageConfig: AzureStorageConfiguration) {}

    public async download(storageFileName: string, options: AzureStorageOptions = {}): Promise<FileDownloadResponse> {
        this.azureStorageOptions = Object.assign(this.azureStorageConfig, options);
        this.initializeService();

        const fileUrl = this.getFileUrl(
            this.azureStorageOptions.shareName,
            this.azureStorageOptions.directoryName,
            storageFileName,
        );

        try {
            return await fileUrl.download(Aborter.none, 0);
        } catch (exception) {
            throw new AzureStorageException({
                message: exception.message,
                stack: exception.stack,
                statusCode: 500,
                storageFileName: storageFileName,
            });
        }
    }

    public async upload(file: any, options: AzureStorageOptions = {}): Promise<AzureStorageResponse> {
        this.azureStorageOptions = Object.assign(this.azureStorageConfig, options);
        this.initializeService();

        for (const uploadedFileId in file) {

            let storageFileName = uploadedFileId;
            let fileName = file[uploadedFileId].name;
            if (fileName.includes('.')) {
                storageFileName = storageFileName + fileName.slice(fileName.lastIndexOf('.'), fileName.length);
            }

            const fileUrl = this.getFileUrl(
                this.azureStorageOptions.shareName,
                this.azureStorageOptions.directoryName,
                storageFileName
            );

            const fileSize = file[uploadedFileId].size;
            let chunkSizeInBytes = 4000000;
            let bytesToUpload: number;
            let offset = 0;
            try {
                let stream = new Duplex();
                stream.push(file[uploadedFileId].data);
                stream.push(null);
                await uploadStreamToAzureFile(Aborter.none,stream,fileSize,fileUrl,chunkSizeInBytes, 5);
                // await fileUrl.create(Aborter.none, fileSize);
                // let fileBuffer = Buffer.from(file[uploadedFileId].data);
                // do{
                //     if(offset+chunkSizeInBytes > fileSize){
                //         chunkSizeInBytes = fileSize - offset;
                //     }
                    
                //     console.log(`Uploading next ${chunkSizeInBytes} from ${offset} of ${fileSize} total`);

                //     var bufferPart = fileBuffer.slice(offset,offset+chunkSizeInBytes);
                //     bytesToUpload = Buffer.byteLength(bufferPart);

                //     response = await fileUrl.uploadRange(
                //         Aborter.none,
                //         bufferPart,
                //         offset,
                //         bytesToUpload,
                //     );

                //     console.log(response);

                //     offset+=chunkSizeInBytes;
                // } while(offset < fileSize)
                // const response = await fileUrl.uploadRange(
                //     Aborter.none,
                //     file[uploadedFileId].data,
                //     0,
                //     file[uploadedFileId].size,
                // );

                return new AzureStorageResponse({
                    fileId: uploadedFileId
                });
            } catch (exception) {
                return new AzureStorageResponse({
                    fileId: uploadedFileId,
                    errorCode: AzureStorageResponse.ERROR_CODE_EXCEPTION,
                    message: exception.message,
                });
            }
        }
    }

    public async delete(storageFileName: string){
        const fileUrl = this.getFileUrl(
            this.azureStorageOptions.shareName,
            this.azureStorageOptions.directoryName,
            storageFileName
        );
        
        await fileUrl.delete(Aborter.none);
    }

    public async listAll(shareName: string, directoryName: string): Promise<void> {
        const shareUrl = ShareURL.fromServiceURL(this.serviceUrl, shareName);
        const directoryUrl = DirectoryURL.fromShareURL(shareUrl, directoryName);

        console.log(shareName);
        console.log(directoryName);
        let marker;
        do {
            const listSharesResponse = await this.serviceUrl.listSharesSegment(Aborter.none, marker);
            marker = listSharesResponse.nextMarker;
            for (const share of listSharesResponse.shareItems) {
                console.log(`\tShare: ${share.name}`);
            }
        } while (marker);

        do {
            const listFilesAndDirectoriesResponse = await directoryUrl.listFilesAndDirectoriesSegment(
                Aborter.none,
                marker,
            );

            marker = listFilesAndDirectoriesResponse.nextMarker;
            for (const file of listFilesAndDirectoriesResponse.segment.fileItems) {
                console.log(`\tFile: ${file.name}`);
            }
            for (const directory of listFilesAndDirectoriesResponse.segment.directoryItems) {
                console.log(`\tDirectory: ${directory.name}`);
            }
        } while (marker);
    }

    private initializeService(): void {
        this.serviceUrl = new ServiceURL(
            this.azureStorageOptions.serviceUrl,
            StorageURL.newPipeline(new AnonymousCredential()),
        );
    }

    private getFileUrl(shareName: string, directoryName: string, fileName: string): FileURL {
        const directoryUrl = this.getDirectoryUrlFromShare(shareName, directoryName);
        return FileURL.fromDirectoryURL(directoryUrl, fileName);
    }

    private getDirectoryUrlFromShare(shareName: string, directoryName: string): DirectoryURL {
        const shareUrl = this.getShareUrl(shareName);
        return this.getDirectoryUrl(shareUrl, directoryName);
    }

    private getDirectoryUrl(shareUrl: ShareURL, directoryName: string): DirectoryURL {
        return DirectoryURL.fromShareURL(shareUrl, directoryName);
    }

    private getShareUrl(shareName: string): ShareURL {
        return ShareURL.fromServiceURL(this.serviceUrl, shareName);
    }
}
