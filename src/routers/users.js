const express = require("express");
const router = express.Router();
const multer = require("multer");
const sharp = require("sharp");
const auth = require("../middlewares/auth");
const User = require("../../src/models/user");
const { sendWelcomeEmail } = require("../emails/accounts");

// Endpoint for creating user
router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    console.log("Can't creaet user");

    res.status(400).send(e);
  }
});

// Endpoint to read own profile
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

// Endpoint for updating a user data
router.patch("/users/me", auth, async (req, res) => {
  //TODO :- to make sure non-existing fields can't be inserted, by default
  // mongodb does that but doesn't give an error to retrun an error
  // write code

  const updates = Object.keys(req.body);
  const availableFields = ["name", "age", "email", "password"];

  const isValidUpdate = updates.every(update =>
    availableFields.includes(update)
  );

  if (!isValidUpdate) {
    console.log("INAVLID filed");

    return res.status(400).send({ error: "Invalid field update" });
  }

  try {
    // not using findByIdAndUpdate, cz it overpasses the middleware call
    updates.forEach(update => (req.user[update] = req.body[update]));

    await req.user.save();

    res.status(200).send(req.user);
  } catch (e) {
    console.log(e);

    res.status(400).send(e);
  }
});

// Endpoint for deleting a user
router.delete("/users/me", auth, async (req, res) => {
  try {
    // const user = await User.findByIdAndDelete(req.user._id);

    await req.user.remove();
    res.status(200).send(req.user);
  } catch (e) {
    res.status(400).send();
  }
});

//Endpoint to login a user
router.post("/users/login", async (req, res) => {
  try {
    //findByCredentials - custom function defined in the userSchema
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );

    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

// Endpoint to logout
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

const upload = multer({
  limits: {
    fileSize: 2000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|PNG|jfif)$/)) {
      return cb(new Error("Please upload jpb, jpeg and png or jfif"));
    }

    cb(undefined, true);
  }
});

// Upload file
router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 50, height: 50 })
      .png()
      .toBuffer();

    req.user.avatar = buffer;
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// delete file
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

// See file
router.get("/users/:id/avatar", auth, async (req, res) => {
  console.log("avatar login :", req.user);

  if (!req.user.avatar) {
    res.status(404).send();
  }

  res.set("Content-Type", "image/jpg");
  res.send(req.user.avatar);
});

module.exports = router;
