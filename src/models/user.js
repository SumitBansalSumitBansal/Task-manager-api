const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Task = require("./task");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: "String",
      required: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid Email");
        }
      }
    },
    password: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (value.length <= 6 || value.toLowerCase().includes("password")) {
          throw new Error("Invalid password");
        }
      }
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a positive number!");
        }
      }
    },
    tokens: [
      {
        token: {
          type: String,
          required: true
        }
      }
    ],
    avatar: {
      type: Buffer
    }
  },
  { timestamps: true }
);

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner"
});

// toJSON special method no need to call it in the router,
// res.send() calls JSON.stringyfy and that call toJSON automatically,
// so to alter what should be exposed to the user
userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
};

// .methods for instances e.g. user
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, "thisismynewcourse", {
    expiresIn: "5h"
  });
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

// userSchema.statics.anyCustomFunction - can be used anywhere will be called cz statics is being used here
// .statics for the model/collection
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).send({ error: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).send({ error: "Invalid credentials" });
  }

  //if both email and password are valid return the user

  return user;
};

// Middleware, runs pre saving the user
userSchema.pre("save", async function(next) {
  // this, refers to the current document - mongoose feature
  const user = this;

  // isModified - mongoose feature
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// Deletes all the tasks of the removed user
userSchema.pre("remove", async function(next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });

  next();
});

// Model
const User = mongoose.model("User", userSchema);

module.exports = User;
