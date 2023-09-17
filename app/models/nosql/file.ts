import * as mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
    externalId: {
        type: String,
        required: false,
    },
    fileName: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: false,
    },
    fileCategory: {
        type: String,
        required: true,
    },
    fileExtension: {
        type: String,
        required: false,
    },
    size: {
        type: Number,
        required: true,
    },
    content: {
        type: String,
        required: false,
    },
    createdDate: {
        type: Date,
        required: false,
    },
    modifiedDate: {
        type: Date,
        required: false,
    },
});

const file = mongoose.model('Files', FileSchema);
export { file };
