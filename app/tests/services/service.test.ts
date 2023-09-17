// import * as FileService from '../../services/file.service';
// import { logger } from 'pwc-us-agc-logger';
// import { users } from '../_mocks_/user';

// jest.mock('../_mocks_/user');

// test("get", async () => {
//     try{ 
//         const User = new users;
//         User.get.mockResolvedValueOnce(
//             { firstName: 'John', lastName: 'Doe' , Id: '1' }
//           );
//         const object = new FileService
//         return object.get(req,res).then(data => expect(data).toEqual({firstName: 'John', lastName: 'Doe', Id: '1'}));
    
//     } catch(error) {
//         logger.log("error", error);
//     }
// }

// test("getbyID",  () => {
//     try{
//         const User = new users;
//         User.getbyId.mockResolvedValueOnce(
//             { firstName: 'John', lastName: 'Doe' , Id: '1' }
//           );
//         const object = new ProjectService
//         return object.getbyId(req,res).then(data => expect(data).toEqual({firstName: 'John', lastName: 'Doe', Id: '1'}));

//     } catch(error) {
//         logger.log("error", error);
//     }
// }

// test("post", () => {
//     try{
//         const User = new users;
//         User.post.mockResolvedValueOnce(
//             { firstName: 'John', lastName: 'Doe' , Id: '1' }
//           );
//         const object = new ProjectService
//         return object.post(req,res).then(data => expect(data).toEqual({response: "JohnDoe was created"}));
    
    
//     } catch(error) {
//         logger.log("error", error);
//     }
// }

// test("put", () => {
//     try{
//         const User = new users;
//         User.put.mockResolvedValueOnce(
//             { firstName: 'John', lastName: 'Doe' , Id: '1' }
//           );
//         const object = new ProjectService
//         return object.put(req,res).then(data => expect(data).toEqual({response: "JohnDoe was updated"}));
    
//     } catch(error) {
//         logger.log("error", error);
//     }
// }



// test("delete", () => {
//     try{
//         const User = new users;
//         User.delete.mockResolvedValueOnce(
//             { firstName: 'John', lastName: 'Doe' , Id: '1' }
//           );
//         const object = new ProjectService
//         return object.delete(req,res).then(data => expect(data).toEqual({response: "JohnDoe was deleted"}));
//     } catch(error) {
//         logger.log("error", error);
//     }
// }