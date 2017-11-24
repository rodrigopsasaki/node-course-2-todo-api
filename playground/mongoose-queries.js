const { ObjectID } = require('mongodb');
const { mongoose } = require('./../server/db/mongoose');
const { Todo } = require('./../server/models/todo');
const { User } = require('./../server/models/user');

const id = '5a174001f549074d61136e41';

if (!ObjectID.isValid(id)) {
  console.log('ID not valid');
}
//
// Todo.find({
//   _id: id
// }).then((todos) => {
//   console.log('Todos:', todos);
// });
//
// Todo.findOne({
//   _id: id
// }).then((todo) => {
//   console.log('Todo:', todo);
// });

// Todo.findById(id)
//   .then(todo => {
//     if (!todo) {
//       return console.log('Id not found');
//     }
//     console.log('Todo', todo)
//   })
//   .catch(e => console.log(e));

User.findById('5a173790035ed62748d7e257')
  .then(user => {
    if (!user) {
      return console.log('Unable to find user');
    }

    console.log(JSON.stringify(user, undefined, 2));
  }, (err) => {
    console.log(err);
  });
