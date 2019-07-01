const express = require("express");
require("./db/mongoose");
require("../config/dev.env");
const usersRouter = require("./routers/users");
const tasksRouter = require("./routers/tasks");

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(usersRouter);
app.use(tasksRouter);

app.listen(port, () => {
  console.log("server is up on: " + port);
});

const Task = require("./models/task");
const User = require("./models/user");

// const main = async () => {
//   // const task = await Task.findById("5d1725dac94e6e49583daea8");
//   // await task.populate("owner").execPopulate();
//   // console.log("TASK owner: ", task.owner);

//   const user = await User.findById("5d1751418f14510538413d81");
//   await user.populate("tasks").execPopulate();
//   console.log(user.tasks);
// };

// main();
