import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as dotenv from 'dotenv';
 
import * as swaggerUi from 'swagger-ui-express';
import * as yamljs from 'yamljs';
// import * as appdynamics from 'appdynamics';
import { DbFileService } from './services/db-file.service';
import { serviceConfigs, azureStorageConfig } from '../config/global.config';
import routeBinder from './lib/router-binder';
import { FileService } from './services/file.service';
import * as mongoSanitize from 'express-mongo-sanitize';

const app = express();
const dbFileService = new DbFileService();
let service;

// Get environment vars
dotenv.config();

app.use(
    bodyParser.urlencoded({
        limit: '100mb',
        extended: true,
    }),
);
app.use(
    bodyParser.json({
        limit: '100mb',
    }),
);
app.use(helmet());

//EDG: Sanitize any input in the req.body, req.params or req.query by replacing any keys in objects that begin with "$" or contain a "." with a "_"
app.use(mongoSanitize({
    replaceWith: '_'
}));

app.use(
    morgan(function(tokens, req:any, res) {
        return [
            req.hostname,
            tokens.method(req, res),
            tokens.url(req, res),
            tokens.status(req, res),
            tokens.res(req, res, 'content-length'),
            '-',
            tokens['response-time'](req, res),
            'ms',
        ].join(' ');
    }),
);

function databaseConnect() {
     console.log('info', 'Attempting to connect to database');
    dbFileService.connect().then(
        (connectionInfo) => {
             console.log('info', `Successfully connected to database!  Connection Info: ${connectionInfo}`);
        },
        (err) => {
             console.log('error', `Unable to connect to database : ${err}`);
        },
    );

    bindServices();
    routeBinder(app, express, service);
}

function bindServices() {
    try {
        // These should all be converted to use DI.
        service = new FileService(dbFileService, azureStorageConfig);
    } catch (err) {
         console.log(`Error occurred binding services : ${err}`);
    }
}

// Let's get our Swagger going on.
const yaml = yamljs;
const swaggerDocument = yaml.load('./docs/swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
 console.log('info', `You can view your swagger documentation at <host>:${serviceConfigs.port}/api-docs`);
// expose static swagger docs
app.use(express.static('./docs'));
// Start Server: Main point of entry
app.listen(serviceConfigs.port, () => {
     console.log('info', `Service listening on port ${serviceConfigs.port} in ${serviceConfigs.envName}`, {
        timestamp: Date.now(),
    });

    // Connect to database
    databaseConnect();
});

process.on('SIGINT', async () => {
     console.log('info', 'exit process');
    if (dbFileService) {
        await dbFileService.close();
         console.log('info', 'DB is closed');
        process.exit();
    }
});
