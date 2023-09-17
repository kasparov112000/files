import * as ProjectService from './../../services/service';
import { logger } from 'pwc-us-agc-logger';

test("get", () => {
    try{ 
        const mockreq: any = {};
        const mockres: any = {};
        const object = new ProjectService
        return object.get(mockreq,mockres).then(data => expect(data).toEqual({message: "get success"}));
    
    } catch(error) {
        logger.log("error", error);
    }
}

test("getbyID", () => {
    try{
        const mockreq: any = {};
        const mockres: any = {};
        mockreq.getbyID = jest.fn().mockResolvedValue({message: "get by ID success"});
        const object = new ProjectService
        return object.getbyID(mockreq,mockres).then(data => expect(data).toEqual({message: "get by ID success"}));
    
    } catch(error) {
        logger.log("error", error);
    }
}

test("post", () => {
    try{
        const mockreq: any = {};
        const mockres: any = {};
        mockreq.post = jest.fn().mockResolvedValue({message: "post success"});
        const object = new ProjectService
        return object.post(mockreq,mockres).then(data => expect(data).toEqual({message: "post success"}));
    
    } catch(error) {
        logger.log("error", error);
    }
}

test("put", () => {
    try{
        const mockreq: any = {};
        const mockres: any = {};
        mockreq.put = jest.fn().mockResolvedValue({message: "put success"});
        const object = new ProjectService
        return object.put(mockreq,mockres).then(data => expect(data).toEqual({message: "put success"}));
    
    } catch(error) {
        logger.log("error", error);
    }
}



test("deleteId", () => {
    try{
        const mockreq: any = {};
        const mockres: any = {};
        mockreq.deleteId = jest.fn().mockResolvedValue({message: "delete success"});
        const object = new ProjectService
        return object.deleteId(mockreq,mockres).then(data => expect(data).toEqual({message: "delete success"}));
    
    } catch(error) {
        logger.log("error", error);
    }
}