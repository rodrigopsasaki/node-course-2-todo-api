const { ObjectID } = require('mongodb');

const { mongoose } = require('./../server/db/mongoose');
const { Todo } = require('./../server/models/todo');
const { User } = require('./../server/models/user');

// remove all
// Todo.remove({}).then(result => {
//   console.log(result);
// });

Todo.findByIdAndRemove('5a1816e7283c377e7ded6d7d').then(todo => {
  console.log(todo);
});

// Todo.findOneAndRemove({}).then(result => {
//   console.log(result);
// });


