const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const port = process.env.PORT || 5000;
const dotenv = require("dotenv");
dotenv.config();
const VideoRequestData = require("./data/video-requests.data");
const UserData = require("./data/user.data");
const cors = require("cors");
const mongoose = require("./models/mongo.config");
const multer = require("multer");

if (!Object.keys(mongoose).length) return;

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) =>
  res.send("Welcome to my awesome API, use /video-request to get data")
);

const upload = multer();

app.post("/video-request", upload.none(), async (req, res, next) => {
  const response = await VideoRequestData.createRequest(req.body);
  res.send(response);
  next();
});

app.get("/video-request", async (req, res, next) => {
  const { sortBy, searchTerm } = req.query;
  let data;
  if (searchTerm) {
    data = await VideoRequestData.searchRequests(searchTerm);
  } else {
    data = await VideoRequestData.getAllVideoRequests();
  }
  if (sortBy === "topVotedFirst") {
    data = data.sort((prev, next) => {
      if (
        prev.votes.ups - prev.votes.downs >
        next.votes.ups - next.votes.downs
      ) {
        return -1;
      } else {
        return 1;
      }
    });
  }
  res.send(data);
  next();
});

app.get("/users", async (req, res, next) => {
  const response = await UserData.getAllUsers(req.body);
  res.send(response);
  next();
});

app.post("/users/login", async (req, res, next) => {
  console.log(req.body);
  const response = await UserData.createUser(req.body);
  res.send({
    id: response._id,
    author_name: response.author_name,
    author_email: response.author_email,
    admin: response.admin,
  });
  next();
});

app.use(express.json());

app.put("/video-request/vote", async (req, res, next) => {
  const { id, vote_type, user_id } = req.body;
  const response = await VideoRequestData.updateVoteForRequest(
    id,
    vote_type,
    user_id
  );
  res.send(response.votes);
  next();
});

app.put("/video-request", async (req, res, next) => {
  const { id, status, resVideo } = req.body;

  const response = await VideoRequestData.updateRequest(id, status, resVideo);
  res.send(response);
  next();
});

app.delete("/video-request", async (req, res, next) => {
  const response = await VideoRequestData.deleteRequest(req.body.id);
  res.send(response);
  next();
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
