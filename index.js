require('dotenv').config();
const express = require('express')
const app = express()
const cors = require('cors')
let mongoose = require("mongoose");
const Schema = mongoose.Schema;

// connecting to mongo cluster
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

// schema and model
let userSchema = new Schema({
  username: String,
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
});
let userModel = mongoose.model('URL', userSchema);

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/reset", async (req, res) => {
  userModel.deleteMany({}).then(count => {
    res.json({ deleted: count });
  })
})

app
  .route("/api/users/")
  .get(async (req, res) => {
    userModel.find()
      .select("username _id")
      .exec()
      .then(data => {
        res.json(data);
      })
  })
  .post(async (req, res) => {
    const { username } = req.body;
    new userModel({ username: username })
      .save()
      .then(data => {
        res.json({ username: data.username, _id: data._id });
      })
  })

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  console.log(`des: ${description}, dur ${duration}: , date: ${date}`);

  let _date = null;
  if (date == null || date == '') {
    _date = new Date();
  }
  else {
    _date = new Date(date);
  }

  userModel.findById(_id)
    .then(data => {
      data.log.push({ description: description, duration: parseInt(duration), date: _date.toDateString() })
      data.save()
        .then(data => {
          console.log({ username: data.username, description: description, duration: parseInt(duration), date: _date.toDateString(), _id: data._id });
          res.json({ username: data.username, description: description, duration: parseInt(duration), date: _date.toDateString(), _id: data._id });
        })
    })
})

app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  const _from = (from) ? new Date(from) : null;
  const _to = (to) ? new Date(from) : null;
  console.log(`from: ${_from}, to: ${_to}, limit: ${limit}`);

  userModel.findById(_id)
    .then(data => {
      let log = []
      let i = 0;
      for (e of data.log) {
        if (limit && i >= limit) {
          break;
        }

        if (_from && _to && _from.getTime() <= new Date(e.date).getTime() <= _to.getTime()) {
          log.push({
            description: e.description,
            duration: e.duration,
            date: toString(new Date(e.date).toDateString())
          })
          i++;
        }
        else if (!_from && !_to) {
          log.push({
            description: e.description,
            duration: e.duration,
            date: toString(new Date(e.date).toDateString())
          })
          i++;
        }
      }
      res.json({
        username: data.username,
        count: log.length,
        _id: data._id,
        log: log
      });
      console.log({
        username: data.username,
        count: log.length,
        _id: data._id,
        log: log
      });
    });
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
