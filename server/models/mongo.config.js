const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

const mongodbUrl = process.env.DB_CONNECT; // TODO: PUT YOUR VALID MONGODB CONNECTION URL HERE OR ADD IT IN .ENV FILE <-

if (!mongodbUrl) {
  console.log(
    "\x1b[33m%s\x1b[0m",
    'Please set the mongodb connection first in -> "server/models/mongo.config.js"\n'
  );
  return;
}

mongoose.set("useFindAndModify", false);

mongoose.connect(mongodbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to Database Video Requests");
});

module.exports = mongoose;
