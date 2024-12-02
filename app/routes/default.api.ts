import { FileService } from '../services/file.service';
import * as fileUpload from 'express-fileupload';
import { HttpException } from 'hipolito-framework';
import { DbFileService } from '../services/db-file.service';
const multer = require('multer');

export default function(app, express, serviceProvider: FileService) {
    let router = express.Router();
    const dbService = new DbFileService();
    const status = require('http-status');
    const storage = multer.memoryStorage();
    const upload = multer({ storage: storage });
    const path = require('path');

    
    router.get('/pingfiles', (req, res) => {
         console.log('info', 'GET Ping files', {
          timestamp: Date.now(),
           txnId: req.id
         });
        res.status(status.OK).json({ message: 'pong from files' });
    });
    
    app.get('/pingfilesdb', (req, res) => {   
    
       console.log('info', 'Attempting to ping files database');
      dbService.connect()
      .then(connectionInfo => {
        res.status(status.OK).json(`<div><h1>files service DB is Up and running </h1></div>`);
    
         console.log('info', 'Successfully pinged database!  ');
      }, err => {
        res.status(status.INTERNAL_SERVER_ERROR).json('<div><h1>files DB service is down </h1></div>');
    
         console.log('error', `Unable to ping files database : ${err}`);
      });
      dbService.close();
    });

    /* Initial route for testing!! */
    router.get('/files', (req, res) => {
        serviceProvider.get(req, res);
    });

    router.get('/files/:id', (req, res) => {
        serviceProvider.getById(req, res);
    });

    app.use(fileUpload());
    router.post('/files/attachments/upload', (req, res) => {
        try {
            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).send('No files were uploaded.');
            }
            serviceProvider.upload(req, res);
        } catch (exception) {
            res.status(500).json(exception);
        }
    });

    router.get('/files/:id/attachments/download', async (req, res) => {
        try{
            await serviceProvider.download(req.params.id, res);
        }
        catch(exception){
            if(exception.status){
                res.status(exception.status).json(exception.message);
            }
            else{
                res.status(500).json(exception);
            }
            
        }
    });

    router.post('/files/gdrive/download', async (req, res) => {
        const { fileName } = req.body; // Ensure the client sends the file name in the request body
        if (!fileName) {
          return res.status(400).send('File name is required.');
        }
      
        const destPath = path.join(__dirname, fileName); // Destination path for the downloaded file
      
        try {
          await serviceProvider.downloadToGdrive(fileName, res);
          // res.status(200).send(`File downloaded successfully to ${destPath}`);
        } catch (error) {
          res.status(500).send(`Error: ${error.message}`);
        }
      });
    
      // Define the upload endpoint
    app.post('/files/gdrive/upload', upload.single('file'), async (req, res) => {
      if (!req.file) {
        return res.status(400).send('No file uploaded.');
      }
    
      try {
        const fileId = await serviceProvider.uploadFileToDrive(req.file);
        res.status(200).send(`File uploaded successfully. File ID: ${fileId}`);
      } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
      }
    });

    router.post('/files', (req, res) => {
        serviceProvider.post(req, res);
    });

    router.put('/files/:id', (req, res) => {
        serviceProvider.put(req, res);
    });

    router.delete('/files/:id', (req, res) => {
        serviceProvider.deleteFile(req, res);
    });

    return router;
}
