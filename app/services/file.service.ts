import { DbMicroServiceBase, HttpException } from 'hipolito-framework';
import { ApiResponse } from 'hipolito-models';
import { FileMetaData,FileType } from '../models';

import { AzureStorageProvider } from '../providers';
import { DbFileService } from './db-file.service';
import { AzureStorageConfig } from '../../config/azure-storage.config';
import { isNullOrUndefined } from 'util';
import { FileDownloadResponse } from '@azure/storage-file/typings/src/generated/src/models';
import {AzureStorageResponse} from '../../app/providers/azure-storage/azure-storage-response.model';

export class FileService extends DbMicroServiceBase {
    private readonly azureStorageProvider: AzureStorageProvider;

    // eslint-disable-line
    constructor(readonly dbService: DbFileService, readonly azureStorageConfig: AzureStorageConfig) {
        super(dbService);
        this.azureStorageProvider = new AzureStorageProvider(azureStorageConfig);
    }

    public addNewFile(req, res): Promise<ApiResponse<FileMetaData>> {
        let fileMetadata = req.body;

        if(fileMetadata.fileExtension){
            fileMetadata.fileType = this.getFileType(fileMetadata.fileExtension);
        }

        req.body = fileMetadata;
        return this.post(req, res);
    }

    public async deleteFile(req, res) {
        try {
    
            //EDG: Ok we are not actually going to delete yet.  The following code is wired up and works BUT
            //we don't want users accidentally deleting files or attachments.  We will just disassociate them
            //from the entity they are tied to.
            /*
            
            const fileMetaData = await this.findById(req.params.id);

            if(!fileMetaData){
                throw new Error('File does not exist');
            }
            
            let response = await this.dbService.delete<FileMetaData>(req);
            
            await this.azureStorageProvider.delete(this.getStorageFileName(fileMetaData));

            if (!response) {
                throw new Error('Unknown error deleting File.');
            }
            
            return this.handleResponse(response, res);
            */

            return this.handleResponse('file deleted', res);
      
          } catch (error) {
            return this.handleErrorResponse(error, res);
          }
    }

    public async upload(req, res): Promise<any> {
        const azureStorageResponse = await this.azureStorageProvider.upload(req.files);
        this.handleResponse(azureStorageResponse, res);
    }

    public async download(fileId:string, res): Promise<any> {
        const fileMetaData = await this.findById(fileId);

        if (isNullOrUndefined(fileMetaData)) {
            throw new HttpException(
                404,
                `The file requested with the ID of "${fileId}" was not found in the database.`,
            );
        }

        let storageFileName = fileMetaData._id;

        if(fileMetaData.fileExtension){
            storageFileName = `${storageFileName}.${fileMetaData.fileExtension}`;
        }

        const fileStream = await this.getFileDownload(storageFileName);
        res.attachment(fileMetaData.fileName);
        //EDG: Will go back to try to implement a file progress bar
        // const totalContentLength = fileStream._response.headers.get('content-length');
        // if(totalContentLength){
        //     res.setHeader('Content-Length',totalContentLength);
        // }
        fileStream.readableStreamBody.pipe(res);
    }

    private async getFileDownload(storageFileName: string): Promise<FileDownloadResponse> {
        return await this.azureStorageProvider.download(storageFileName);
    }

    private async findById(id: string): Promise<FileMetaData> {
        return await this.dbService.findById(id);
    }

    private getFileType(fileExtension: string){
        let compareFileExtension = fileExtension.toLowerCase();

        switch(compareFileExtension){
            case 'doc':
            case 'docx':
                return FileType.word;
            case 'pdf':
                return FileType.pdf;
            default:
                return FileType.notApplicable;
        }

    }

    private getStorageFileName(fileMetaData: FileMetaData){
        let fileName = fileMetaData._id;
        if(fileMetaData.fileExtension){
            fileName = `${fileName}.${fileMetaData.fileExtension}`;
        }

        return fileName;
    }
}
