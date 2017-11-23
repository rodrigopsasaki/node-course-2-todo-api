const express = require('express');
const bodyParser = require('body-parser');

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
      res.status(500).send(err);
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Server listening on port', port);
});
