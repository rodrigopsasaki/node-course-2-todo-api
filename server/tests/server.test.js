const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('../server');
const { Todo } = require('../models/todo');

const todos = [
  {
    _id: new ObjectID(),
    text: 'First test todo'
  },
  {
    _id: new ObjectID(),
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
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(todos[0].text);
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

    const inexistentId = new ObjectID().toHexString();

    request(app)
      .get(`/todos/${inexistentId}`)
      .expect(404)
      .expect(res => {
        expect(res.body.error).toBe('Todo not found');
      })
      .end(done);

  });

});

describe('DELETE /todos/:id', () => {

  it('should successfully delete a document by Id', (done) => {

    request(app)
      .delete(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find()
          .then(todos => {
            expect(todos.length).toBe(1);
            done();
          })
          .catch(err => {
            done(err);
          });
      });

  });

  it('should get 400 on invalid id', (done) => {

    request(app)
      .delete(`/todos/some_invalid_id`)
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
      });

  });

  it('should get 404 on id that does not exist', (done) => {

    const inexistentId = new ObjectID().toHexString();

    request(app)
      .get(`/todos/${inexistentId}`)
      .expect(404)
      .expect(res => {
        expect(res.body.error).toBe('Todo not found');
      })
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
      });

  });

});

describe('PATCH /todos/:id', () => {

  it('should successfully update a document by Id', (done) => {
    const hexId = todos[0]._id.toHexString();
    const text = 'This should be the new text';
    const completed = true;

    request(app)
      .patch(`/todos/${hexId}`)
      .send({ text, completed })
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(completed);
        expect(res.body.todo.completedAt).toBeA('number');
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById({_id: hexId})
          .then(todo => {
            expect(todo.text).toBe(text);
            expect(todo.completed).toBe(completed);
            expect(todo.completedAt).toBeA('number');
            done();
          })
          .catch(err => {
            done(err);
          });
      });

  });

  it('should clear completedAt when todo is not completed', (done) => {
    const hexId = todos[1]._id.toHexString();
    const text = 'This should be the new text';
    const completed = false;

    request(app)
      .patch(`/todos/${hexId}`)
      .send({ text, completed })
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(completed);
        expect(res.body.todo.completedAt).toBe(null);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById({_id: hexId})
          .then(todo => {
            expect(todo.text).toBe(text);
            expect(todo.completed).toBe(completed);
            expect(todo.completedAt).toBe(null);
            done();
          })
          .catch(err => {
            done(err);
          });
      });
  });

  it('should get 400 on invalid id', (done) => {

    request(app)
      .patch(`/todos/some_invalid_id`)
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
      });

  });

  it('should get 404 on id that does not exist', (done) => {

    const inexistentId = new ObjectID().toHexString();

    request(app)
      .patch(`/todos/${inexistentId}`)
      .expect(404)
      .expect(res => {
        expect(res.body.error).toBe('Todo not found');
      })
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
      });

  });

});
