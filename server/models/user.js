const _ = require('lodash');
const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    require: true,
    minlength: 6,
  },
  tokens: [{
    access: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
  }],
});


UserSchema.methods = {
  toJSON() {
    const userObject = this.toObject();
    return _.pick(userObject, ['_id', 'email']);
  },

  generateAuthToken() {
    const access = 'auth';
    const token = jwt.sign({ _id: this._id.toHexString(), access }, 'abc123').toString();

    this.tokens.push({ access, token });

    return this.save().then(() => {
      return token;
    });
  }
};

UserSchema.statics = {
  findByToken(token) {
    const User = this;

    try {
      const decoded = jwt.verify(token, 'abc123');

      return User.findOne({
        _id: decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
      });
    } catch (e) {
      return Promise.reject();
    }

  }
};

const User = mongoose.model('User', UserSchema);

module.exports = {
  User,
};
