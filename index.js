require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const dns = require('dns');

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const shorturlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  }
});
const ShortURL = mongoose.model('ShortURL', shorturlSchema);

app.post('/api/shorturl', function(req, res) {
  let original_url = req.body.url;
  
  // add protocol if not present
  if (!/^https?:\/\//i.test(original_url)) {
    original_url = 'http://' + original_url;
  }

  let hostname;
  try {
    hostname = new URL(original_url).hostname;
  } catch (err) {
    return res.json({ error: 'Invalid URL' });
  }

  dns.lookup(hostname, (err, address) => {
    if (err) {
      res.json({ error: 'Invalid Hostname' });
    } else {
      new ShortURL({ original_url }).save()
        .then(() => {
          ShortURL.findOne({ original_url })
            .then(data => res.json({ original_url, short_url: data._id }))
            .catch(err => res.json(err));
        })
        .catch(err => res.json(err));
    }
  });
});

app.get('/api/shorturl/:id', (req, res) => {
  ShortURL.findOne({ _id: req.params.id })
    .then(data => res.redirect(data.original_url))
    .catch(err => res.json(err));
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
