import * as mongoose from 'mongoose';
import { DbServiceBase } from 'hipolito-framework';

import { connection } from '../../config/connection';

export class DbFileService extends DbServiceBase {
    constructor() {
        super(connection, mongoose);
    }
}
