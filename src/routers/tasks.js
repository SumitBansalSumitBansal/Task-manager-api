const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Task = require("../../src/models/task");

// Endpoint for creating task
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({ ...req.body, owner: req.user._id });
  try {
    await task.save();
    res.status(200).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Endpoint to read tasks

router.get("/tasks", auth, async (req, res) => {
  console.log(req.query.completed);

  let taskFilter = {
    owner: req.user._id
  };

  let sort = {};

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "asc" ? 1 : -1;
  }

  if (req.query.completed) {
    req.query.completed === "true"
      ? (taskFilter.completed = true)
      : (taskFilter.completed = false);
  }

  try {
    const tasks = await Task.find(taskFilter, null, {
      limit: parseInt(req.query.limit),
      skip: parseInt(req.query.skip),
      sort
    });

    res.status(200).send(tasks);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Enpoint for single task, ID basis
router.get("/task/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.status(200).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Endpoint to update a task, ID based
router.patch("/task/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const availableUpdates = ["description", "completed"];
  const isValidUpdate = updates.every(update =>
    availableUpdates.includes(update)
  );

  if (!isValidUpdate) {
    return res.status(400).send({ error: "Invslid field upate" });
  }
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).send();
    }
    updates.forEach(update => (task[update] = req.body[update]));

    task.save();

    res.status(200).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Endpoint for deleting a task
router.delete("/task/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).send();
    }
    res.status(200).send(task);
  } catch (e) {
    res.status(400).send();
  }
});

module.exports = router;
