const expect = require('expect');
const request = require('supertest');

const { app } = require('../server');
const { Todo } = require('../models/todo');

const todos = [
  {
    _id: '5a173790035ed62748d7e257',
    text: 'First test todo'
  },
  {
    text: 'Second test todo'
  }
];

beforeEach(done => {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }).then(() => done());
});

describe('POST /todos', () => {

  it('should create a new todo', (done) => {

    const text = 'xablau texterz';

    request(app)
      .post('/todos')
      .send({ text })
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({ text })
          .then(todos => {
            expect(todos.length).toBe(1);
            expect(todos[0].text).toBe(text);
            done();
          })
          .catch(err => {
            done(err);
          });
      });

  });

  it('should not create a todo with invalid body data', (done) => {

    request(app)
      .post('/todos')
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find()
          .then(todos => {
            expect(todos.length).toBe(2);
            done();
          })
          .catch(err => {
            done(err);
          });
      })

  });

});

describe('GET /todos', () => {

  it('should get all todos', (done) => {

    request(app)
      .get('/todos')
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);

  });

});

describe('GET /todos/:id', () => {

  it('should get todo by id', (done) => {

    request(app)
      .get('/todos/5a173790035ed62748d7e257')
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe('First test todo');
      })
      .end(done);

  });

  it('should get 400 on invalid id', (done) => {

    request(app)
      .get('/todos/some_invalid_id')
      .expect(400)
      .expect(res => {
        expect(res.body.error).toBe('Invalid ID');
      })
      .end(done);

  });

  it('should get 404 on id that does not exist', (done) => {

    request(app)
      .get('/todos/5a173790035ed62748d7e256')
      .expect(404)
      .expect(res => {
        expect(res.body.error).toBe('Todo not found');
      })
      .end(done);

  });

});
