const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');

const config = require('./config/config');
const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const app = express();
app.use(bodyParser.json());

app.post('/todos', (req, res) => {
  const todo = new Todo({
    text: req.body.text
  });

  todo.save()
    .then(todo => {
      res.send(todo);
    }, (err) => {
      res.status(400).send(err);
    });
});

app.get('/todos', (req, res) => {

  Todo.find({})
    .then(todos => {
      res.send({ todos });
    })
    .catch(err => {
      res.status(400).send(err);
    });

});

app.get('/todos/:id', (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(400).send({ error: 'Invalid ID' });
  }

  Todo.findById(id)
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

app.delete('/todos/:id', (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(400).send({ error: 'Invalid ID' });
  }

  Todo.findByIdAndRemove(id)
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

app.patch('/todos/:id', (req, res) => {
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

  Todo.findByIdAndUpdate(id, { $set: body }, { new: true })
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

app.post('/users', (req, res) => {
  const body = _.pick(req.body, ['email', 'password']);

  new User(body).save()
    .then(user => res.send(user))
    .catch(err => res.status(500).send(err));
});

app.listen(process.env.PORT, () => {
  console.log('Server listening on port', process.env.PORT);
});

module.exports = {
  app,
};
