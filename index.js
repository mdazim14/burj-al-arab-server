const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xwkyk.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const port = 5000

const app = express()
app.use(cors());
app.use(bodyParser.json());



var serviceAccount = require("./configs/burj-al-arab-8f579-firebase-adminsdk-l3ghe-45da3f9a15.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
      .then(result => {
        // console.log(result);
        res.send(result.insertedCount > 0);
      })
    // console.log(newBooking);
  })

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          // console.log(tokenEmail, queryEmail);
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              })
          }
          else{
            res.status(401).send('Un authorized access');
          }
        })
        .catch((error) => {
          res.status(401).send('Un authorized access');
        });
    }
    else{
      res.status(401).send('Un authorized access');
    }

  })
});


app.get('/', (req, res) => {
  res.send('Hello World! Burj-al-arab-server')
})

app.listen(port)