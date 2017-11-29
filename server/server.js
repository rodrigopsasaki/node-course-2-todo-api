require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const { authenticate } = require('./middleware/authenticate');

const app = express();
app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res) => {
  const todo = new Todo({
    text: req.body.text,
    _creator: req.user._id,
  });

  todo.save()
    .then(todo => {
      res.send(todo);
    }, (err) => {
      res.status(400).send(err);
    });
});

app.get('/todos', authenticate, (req, res) => {

  Todo.find({
      _creator: req.user._id
    })
    .then(todos => {
      res.send({ todos });
    })
    .catch(err => {
      res.status(400).send(err);
    });

});

app.get('/todos/:id', authenticate, (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(400).send({ error: 'Invalid ID' });
  }

  Todo.findOne({
      _id: id,
      _creator: req.user._id
    })
    .then(todo => {
      if (!todo) {
        return res.status(404).send({ error: 'Todo not found' });
      }

      return res.status(200).send({ todo });
    })
    .catch(err => {
      return res.status(500).send({ error: 'Internal server error' });
    });
});

app.delete('/todos/:id', authenticate, async (req, res) => {

  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(400).send({ error: 'Invalid ID' });
  }

  try {
    const todo = await Todo.findOneAndRemove({ _id: id, _creator: req.user._id });
    if (!todo) {
      return res.status(404).send({ error: 'Todo not found' });
    }

    return res.status(200).send({ todo });
  } catch (err) {
    return res.status(500).send({ error: 'Internal server error' });
  }
});

app.patch('/todos/:id', authenticate, (req, res) => {
  const id = req.params.id;
  const body = _.pick(req.body, ['text', 'completed']);

  if (!ObjectID.isValid(id)) {
    return res.status(400).send({ error: 'Invalid ID' });
  }

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findOneAndUpdate({
      _id: id,
      _creator: req.user._id
    }, { $set: body }, { new: true })
    .then(todo => {
      if (!todo) {
        return res.status(404).send({ error: 'Todo not found' });
      }

      return res.send({ todo });
    })
    .catch(err => {
      return res.status(500).send({ error: 'Internal server error' });
    })

});

app.post('/users', async (req, res) => {
  try {
    const body = _.pick(req.body, ['email', 'password']);
    const user = new User(body);
    await user.save();
    const token = user.generateAuthToken();

    return res.header('x-auth', token).send(user);
  } catch (err) {
    return res.status(400).send(err);
  }
});


app.get('/users/me', authenticate, (req, res) => {
  return res.send(req.user);
});

app.post('/users/login', async (req, res) => {
  try {
    const body = _.pick(req.body, ['email', 'password']);
    const user = await User.findByCredentials(body.email, body.password);
    const token = await user.generateAuthToken();

    return res.header('x-auth', token).send(user);
  } catch (err) {
    return res.status(400).send();
  }

});

app.delete('/users/me/token', authenticate, async (req, res) => {
  try {
    await req.user.removeToken(req.token);
    return res.status(200).send();
  } catch (err) {
    return res.status(400).send();
  }
});

app.listen(process.env.PORT, () => {
  console.log('Server listening on port', process.env.PORT);
});

module.exports = {
  app,
};
