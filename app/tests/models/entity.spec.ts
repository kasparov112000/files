import * as mocha from 'mocha';
import { expect } from 'chai';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';


const dbUrl = 'mongodb://localhost:27017/temp';
const dbOptions = {
    useNewUrlParser: true
};
const Schema = mongoose.Schema;
const todoSchema = new Schema({
    todo: {
        type: String
    },
    completed: {
        type: Boolean,
        default: false
    },
    created_by: {
        type: Date,
        default: Date.now
    }
});
const todoModel = mongoose.model('Todo', todoSchema);
interface SuccessTodoResponse {
    status: boolean;
    todo: any[];
}

describe('Database Tests', () => {
    describe('Get all todos', () => {
        // Test will pass if we get all todos
        it('should return all todos', (done) => {
            let todoMock = sinon.mock(todoModel);
            let expectedResult = { status: true, todo: [] };
            todoMock.expects('find').yields(undefined, expectedResult);
            todoModel.find((err, result: SuccessTodoResponse) => {
                todoMock.verify();
                todoMock.restore();
                expect(result.status).to.be.true;
                done();
            });
        });

        // Test will pass if we fail to get a todo
        it('should return error', (done) => {
            let todoMock = sinon.mock(todoModel);
            let expectedResult = { status: false, error: 'Something went wrong' };
            todoMock.expects('find').yields(expectedResult, undefined);
            todoModel.find((err, result) => {
                todoMock.verify();
                todoMock.restore();
                expect(err.status).to.not.be.true;
                done();
            });
        });
    });

    // Test will pass if the todo is saved
    describe('Post a new todo', () => {
        it('should create new todo', (done) => {
            let todoMock = sinon.mock(new todoModel({ todo: 'Save new todo from mock' }));
            let todo = todoMock.object;
            let expectedResult = { status: true };
            todoMock.expects('save').yields(undefined, expectedResult);
            todo.save((err, result) => {
                todoMock.verify();
                todoMock.restore();
                expect(result.status).to.be.true;
                done();
            });
        });
        // Test will pass if the todo is not saved
        it('should return error, if todo not saved', (done) => {
            let todoMock = sinon.mock(new todoModel({ todo: 'Save new todo from mock' }));
            let todo = todoMock.object;
            let expectedResult = { status: false };
            todoMock.expects('save').yields(expectedResult, undefined);
            todo.save((err, result) => {
                todoMock.verify();
                todoMock.restore();
                expect(err.status).to.not.be.true;
                done();
            });
        });
    });

    // Test will pass if the todo is updated based on an ID
    describe('Update a new todo by id', () => {
        it('should update a todo by id', (done) => {
            let todoMock = sinon.mock(todoModel);
            // var todo = TodoMock.object;
            let expectedResult = { status: true };
            todoMock.expects('update').withArgs({ _id: 12345 }).yields(undefined, expectedResult);
            todoModel.update({_id: 12345}, (err, result) => {
                todoMock.verify();
                todoMock.restore();
                expect(result.status).to.be.true;
                done();
            });
        });
        // Test will pass if the todo is not updated based on an ID
        it('should return error if update action is failed', (done) => {
            let todoMock = sinon.mock(new todoModel({ completed: true }));
            let todo = todoMock.object;
            let expectedResult = { status: false };
            todoMock.expects('update').withArgs({ _id: 12345 }).yields(expectedResult, undefined);
            todo.update({_id: 12345}, (err, result) => {
                todoMock.verify();
                todoMock.restore();
                expect(err.status).to.not.be.true;
                done();
            });
        });
    });

    // Test will pass if the todo is deleted based on an ID
    describe('Delete a todo by id', () => {
        it('should delete a todo by id', (done) => {
            let todoMock = sinon.mock(todoModel);
            let expectedResult = { status: true };
            todoMock.expects('remove').withArgs({ _id: 12345 }).yields(undefined, expectedResult);
            todoModel.remove({ _id: 12345 }, (err) => {
                todoMock.verify();
                todoMock.restore();
                expect(err).to.be.undefined;
                done();
            });
        });
        // Test will pass if the todo is not deleted based on an ID
        it('should return error if delete action is failed', (done) => {
            let todoMock = sinon.mock(todoModel);
            let expectedResult = { status: false };
            todoMock.expects('remove').withArgs({ _id: 12345 }).yields(expectedResult, undefined);
            todoModel.remove({ _id: 12345 }, (err) => {
                todoMock.verify();
                todoMock.restore();
                expect(err.status).to.not.be.true;
                done();
            });
        });
    });
});
