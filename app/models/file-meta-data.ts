import { FileType } from './file-type';
import { FileCategory } from './file-category';

export class FileMetaData {
    public _id: string;
    public externalId: string;
    public fileName: string;
    public fileExtension: string;
    public content: string;
    public fileType: FileType;
    public fileCategory: FileCategory;
    public size?: number;
    public createdDate: Date;
    public modifiedDate: Date;

    constructor(fileName?: string, fileExtension?: string, fileType?: FileType, fileCategory?: FileCategory, size?: number) {
        this.fileName = fileName;
        this.fileExtension = fileExtension;
        this.fileType = fileType;
        this.fileCategory = fileCategory;
        this.size = size;
    }
}