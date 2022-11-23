const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const port = process.env.PORT || 3005;

//firebase admin initialization 



const app = express();

//middleware
app.use(cors());
app.use(express.json());

//connecting database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cny0fg3.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//Verify Firebase token using external function 



// CRUD Operation
async function run() {
  try {
    await client.connect();
    console.log('Alhamdulillah, Database Connected Successfully!');

    const testDatabase = client.db("test_DB");
    const testCollection = testDatabase.collection("test_collection");

    const doctorsDatabase = client.db("doctors_Portal");
    const appointmentCollection = doctorsDatabase.collection("appointments");
    const userCollection = doctorsDatabase.collection("users");

    // POST an appointment to database
    app.post('/appointments', async(req, res) => {
      const appointment = req.body;
      const result = await appointmentCollection.insertOne(appointment);
      // console.log(result);
      res.json(result);
    })

    // POST an user to database (custom sign in)
    app.post('/users', async(req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      // console.log(result);
      res.json(result);
    })

    // GET a single user by email API
    app.get('/users/:email', async(req, res) => {
      const email = req.params.email;
      const query = { email: email };
      
    })

    //GET appointment API (all)
    // app.get('/appointments', async(req, res) => {
    //   const cursor = appointmentCollection.find({});
    //   const appointments = await cursor.toArray();
    //   // res.send(appointments);
    //   res.json(appointments);
    // })

    //GET appointment API (single)
    app.get('/appointments', async(req, res) => {
      const email = req.query.email;
      const date = new Date(req.query.date).toDateString();
      const query = {email: email, date: date};
      const cursor = appointmentCollection.find(query);
      const appointments = await cursor.toArray();
      // res.send(appointments);
      res.json(appointments);
    })

    // UPSERT an user to database (check if exists; then replace or add)
    app.put('/users', async(req, res) => {
      const user = req.body;
      // console.log('put', user);
      // check if the user exists
      const filter = { email: user.email };
      // create if does not match
      const options = { upsert : true };
      const updateDoc = {$set: user};
      const result = await userCollection.updateOne(filter, updateDoc, options);
      // console.log(result);
      res.json(result);
    })

    //Make Admin
    app.put('/users/admin', async(req, res) => {
      const user = req.body;
      console.log('put', user);
      const filter = {email: user.email};
      const updateDoc = {$set: {role: 'admin'}};
      const result = await userCollection.updateOne(filter, updateDoc);
      res.json(result);
    })

  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello Doctors Portal!');
}); 

app.listen(port, () => {
  console.log(`My app is listening on port ${port}`);
});


// Database login information 
  // DB_USER=doctors-portal-user1
  // DB_PASS=EzVG0BwVrcOO3FdH

// API Naming Convention
//   app.get('/users')  // get all users
//   app.post('/users')  // post or create or add a single user
//   app.get('/users/:id')  // get specific user by id
//   app.put('/users/:id')  // update specific user by id
//   app.delete('/users/:id')  // delete specific user by id