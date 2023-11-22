import express from "express";
import path from "path";
const app = express();
import cookieParser from "cookie-parser";
import mongoose, { mongo } from "mongoose";
import Jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "backend",
  })
  .then(() => console.log("data base connected"))
  .catch((err) => console.log("seomthing went wrong"));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const User = mongoose.model("user", userSchema);

app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// setting up view engine
app.set("view engine", "ejs");
const isAuthenticated = async (req, res, next) => {
  const check = req.cookies;
  if (check.token) {
    const decoded = Jwt.verify(check.token, "hvujdvehw");
    req.user = await User.findById(decoded._id);
    next();
  } else {
    res.render("login");
  }
};
app.get("/", isAuthenticated, (req, res) => {
  console.log(req.user);
  res.render("logout", { name: req.user.name });
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        const token = Jwt.sign({ _id: user._id }, "hvujdvehw");

        res.cookie("token", token, {
          httpOnly: true,
          expires: new Date(Date.now() + 60 * 1000),
        });
        res.redirect("/");
      } else {
        res.render("login", { message: "password is not correct" });
      }
    } else {
      console.log("user is not regitser");
      res.redirect("/register");
    }
  } catch (error) {
    console.log(error + "something went wrong");
  }
});
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  let check = await User.findOne({ email });

  if (check) {
    return res.redirect("/");
  }
  const hashPassword = await bcrypt.hash(password, 10);

  let user = await User.create({ name, email, password: hashPassword });
 
  const token = Jwt.sign({ _id: user._id }, "hvujdvehw");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.listen(5000, () => {
  console.log("Server is started");
});
