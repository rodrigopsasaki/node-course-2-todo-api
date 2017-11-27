const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('../server');
const { Todo } = require('../models/todo');
const { User } = require('../models/user');
const { todos, populateTodos, users, populateUsers } = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {

  it('should create a new todo', (done) => {

    const text = 'xablau texterz';

    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
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
      .set('x-auth', users[0].tokens[0].token)
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

  it('should get 401 if request is made without x-auth header', (done) => {

    request(app)
      .post('/todos')
      .send({})
      .expect(401)
      .end(done);

  });

});

describe('GET /todos', () => {

  it('should get all todos', (done) => {

    request(app)
      .get('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(1);
      })
      .end(done);

  });

  it('should get 401 if request is made without x-auth header', (done) => {

    request(app)
      .get('/todos')
      .send({})
      .expect(401)
      .end(done);

  });

});

describe('GET /todos/:id', () => {

  it('should return todo doc', (done) => {

    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);

  });

  it('should not return a todo doc created by other user', (done) => {

    request(app)
      .get(`/todos/${todos[1]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);

  });

  it('should get 400 on invalid id', (done) => {

    request(app)
      .get('/todos/some_invalid_id')
      .set('x-auth', users[0].tokens[0].token)
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
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .expect(res => {
        expect(res.body.error).toBe('Todo not found');
      })
      .end(done);

  });

  it('should get 401 if request is made without x-auth header', (done) => {

    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .send({})
      .expect(401)
      .end(done);

  });

});

describe('DELETE /todos/:id', () => {

  it('should remove a todo', (done) => {

    const hexId = todos[1]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body.todo._id).toBe(hexId);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(hexId)
          .then(todo => {
            expect(todo).toBeFalsy();
            done();
          })
          .catch(err => {
            done(err);
          });
      });

  });

  it('should not remove a todo created by another user', (done) => {

    const hexId = todos[0]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById(hexId)
          .then(todo => {
            expect(todo).toBeTruthy();
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
      .set('x-auth', users[1].tokens[0].token)
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
      .delete(`/todos/${inexistentId}`)
      .set('x-auth', users[1].tokens[0].token)
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

  it('should get 401 if request is made without x-auth header', (done) => {

    request(app)
      .delete(`/todos/${todos[0]._id.toHexString()}`)
      .send({})
      .expect(401)
      .end(done);

  });

});

describe('PATCH /todos/:id', () => {

  it('should successfully update a document by Id', (done) => {
    const hexId = todos[0]._id.toHexString();
    const text = 'This should be the new text';
    const completed = true;

    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', users[0].tokens[0].token)
      .send({ text, completed })
      .expect(200)
      .expect(res => {
        expect(res.body.todo.text).toBe(text);
        expect(res.body.todo.completed).toBe(completed);
        expect(typeof res.body.todo.completedAt).toBe('number');
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById({ _id: hexId })
          .then(todo => {
            expect(todo.text).toBe(text);
            expect(todo.completed).toBe(completed);
            done();
          })
          .catch(err => {
            done(err);
          });
      });

  });

  it('should not update a document created by another user', (done) => {
    const hexId = todos[0]._id.toHexString();
    const text = 'This should be the new text';
    const completed = true;

    request(app)
      .patch(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .send({ text, completed })
      .expect(404)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.findById({ _id: hexId })
          .then(todo => {
            expect(todo.text).not.toBe(text);
            expect(todo.completed).not.toBe(completed);
            expect(typeof todo.completedAt).not.toBe('number');
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
      .set('x-auth', users[1].tokens[0].token)
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

        Todo.findById({ _id: hexId })
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
      .set('x-auth', users[1].tokens[0].token)
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
      .set('x-auth', users[1].tokens[0].token)
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

  it('should get 401 if request is made without x-auth header', (done) => {

    request(app)
      .patch(`/todos/${todos[0]._id.toHexString()}`)
      .send({})
      .expect(401)
      .end(done);

  });

});

describe('GET /users/me', () => {

  it('should return user if authenticated', (done) => {

    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect(res => {
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);

  });

  it('should return 401 if not authenticated', (done) => {

    request(app)
      .get('/users/me')
      .expect(401)
      .expect(res => {
        expect(res.body).toEqual({});
      })
      .end(done);

  });

});

describe('POST /users', () => {

  it('should create a user', (done) => {
    const email = 'example@example.com';
    const password = '123456';

    request(app)
      .post('/users')
      .send({ email, password })
      .expect(200)
      .expect(res => {
        expect(res.headers['x-auth']).toBeTruthy();
        expect(res.body._id).toBeTruthy();
        expect(res.body.email).toBe(email);
      })
      .end(err => {
          if (err) {
            return done(err);
          }

          User.findOne({ email })
            .then(user => {
              expect(user).toBeTruthy();
              expect(user.password).not.toBe(password);
              done();
            })
            .catch(err => done(err));
        }
      );

  });

  it('should return validation errors if request invalid', (done) => {

    request(app)
      .post('/users')
      .send({
        email: 'rod',
        password: '12345'
      })
      .expect(400)
      .end(done);

  });

  it('should not create user if email in use', (done) => {

    request(app)
      .post('/users')
      .send({
        email: users[0].email,
        password: users[0].password
      })
      .expect(400)
      .end(done);

  });

});

describe('POST /users/login', () => {

  it('should login user and return auth token', (done) => {

    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password
      })
      .expect(200)
      .expect(res => {
        expect(res.headers['x-auth']).toBeTruthy();
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id)
          .then(user => {
            expect(user.toObject().tokens[1]).toMatchObject({
              access: 'auth',
              token: res.headers['x-auth']
            });
            done();
          })
          .catch(err => done(err));
      });

  });

  it('should reject invalid login', (done) => {

    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: 'wrong_password'
      })
      .expect(400)
      .expect(res => {
        expect(res.headers['x-auth']).toBeFalsy()
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        User.findById(users[1]._id)
          .then(user => {
            expect(user.tokens.length).toBe(1);
            done();
          })
          .catch(err => done(err));
      })

  });

});

describe('DELETE /users/me/token', () => {

  it('should remove auth token on logout', (done) => {

    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .end((err, res) => {

        if (err) {
          return done(err);
        }

        User.findById(users[0]._id)
          .then(user => {
            expect(user.tokens.length).toBe(0);
            done();
          })
          .catch(err => {
            return done(err);
          });

      });

  });

});
