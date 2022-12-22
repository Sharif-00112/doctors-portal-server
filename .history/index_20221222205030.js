const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const port = process.env.PORT || 3005;

// STRIPE_SECRET
const stripe = require("stripe")(process.env.STRIPE_SECRET);


//firebase admin initialization 
//private_key_file-name: doctors-portal-00112-firebase-adminsdk-rhu8v-7c0acf8d5a.json
var admin = require("firebase-admin");
// var serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
var serviceAccount = require('./doctors-portal-00112-firebase-adminsdk-rhu8v-7c0acf8d5a.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const app = express();

//middleware
app.use(cors());
app.use(express.json());

//connecting database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cny0fg3.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//Verify Firebase token using external function 
async function verifyToken(req, res, next) {
  if(req.headers?.authorization?.startsWith('Bearer ')){
    const idToken = req.headers.authorization.split(' ')[1];
    // console.log('Inside separate function:', idToken);
    try{
      const decodedUser = await admin.auth().verifyIdToken(idToken);
      // console.log(decodedUser);
      // console.log('email:', decodedUser.email);
      req.decodedEmail = decodedUser.email;
    }catch (error){
      console.log(error);
    }
  }
  next();
}


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
      const user = await userCollection.findOne(query);
      let isAdmin = false;
      if(user?.role === 'admin'){
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    })

    //GET appointment API (all)
    // app.get('/appointments', async(req, res) => {
    //   const cursor = appointmentCollection.find({});
    //   const appointments = await cursor.toArray();
    //   // res.send(appointments);
    //   res.json(appointments);
    // })

    //GET appointment API (single)
    app.get('/appointments', verifyToken, async(req, res) => {
      const email = req.query.email;
      // const date = new Date(req.query.date).toDateString();
      const date = (req.query.date);
      const query = {email: email, date: date};
      const cursor = appointmentCollection.find(query);
      const appointments = await cursor.toArray();
      // res.send(appointments);
      res.json(appointments);
    })

    //Get single appointment API by ID
    app.get('/appointments/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await appointmentCollection.findOne(query);
      res.json(result);
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
    app.put('/users/admin', verifyToken, async(req, res) => {
      const user = req.body;
      // console.log('put', user);
      // console.log('put', req.headers);
      // console.log('put', req.headers.authorization);
      // console.log('Decoded Email:', req.decodedEmail);

      const requester =  req.decodedEmail;
      if(requester){
        const requesterAccount = await userCollection.findOne({email: requester});
        if(requesterAccount.role === 'admin'){
          const filter = {email: user.email};
          const updateDoc = {$set: {role: 'admin'}};
          const result = await userCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      }
      else{
        // 403 is forbidden status
        res.status(403).json({message: 'You do not have permission to this page'})
      }
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


// Database login information (.env)
  // DB_USER=doctors-portal-user1
  // DB_PASS=EzVG0BwVrcOO3FdH
// STRIPE_SECRET
  // STRIPE_SECRET=sk_test_51MFhNTGwpStg5Znp1NPhw3DoNE8piLe1RydrSemALhVa1RyEinv9iSZcSfwVQu1K4UaJ3OFlqSnpEjDQacyNQc1B00SicfGLuD

// Firebase service acc info (.env)
  // FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"doctors-portal-00112","private_key_id":"7c0acf8d5a5aa7905b005bd7cdad3feb17fd9140","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCGmp03OGF/nvRR\\nzQxkJvrEOaEul5C4ihLuSBXt/kcCgM1qni2ujELOUHXTtKKQ36slVZQv7S9DDEJs\\nn4gEV2N4zyZ+QiqsS4yLjEu48ZsUD2QYUr6+7l8I1cJw3b/XYiiGmrIBoCg2jf4u\\notMvN/lChw1+HNFmqS1FpIJZQhY4VuQHKXvtN379Zx/5CSY8HLy+G+hH4gyznyHM\\nyCjTeRqkFwaSB43o7LXSaowfUNU0nI8T0hiM0qvu1Feiu1QcDIBqzN8kTS6JbZpe\\nVkFa1usK1uwbd5LbIkCXWR69Dqsk379oiaCzCmiAhRTZ4wQqI67oNNyxpEkgCSP8\\nQOWkD7LtAgMBAAECggEAHNgtMJQocIzDlnP2X8/qlPo0jCN2o9US0XUpHeMLnIG1\\ng096QplUB5o+Zauj2p/TsSBxrQOKyTdrVJOrNiLz8gOSICRVuK5H4++gmnVL4jSa\\nIow4y/mQ6/fCvyUF40XpoU6tLqP/ehFbkurZjpjUFWmTfp72UKWYSgBC3pXG5TOK\\nAAhiyySz9IWJmiD6IzlEdIyza2EIAMMCaGQj9ylhC10A3UE9TMX6ETU4pKfD25tD\\nufVgfZhb1eypO18seTC9Zthtg/pSu3x+vLGbZSSUeQYnk+m0GaSBoUS6zZjMUhvB\\nftfA6VbUMbyNvIu+09dozLCEFUnNtouRS2gmeiroEQKBgQC8uDcorUOu8JCMMxPu\\nqpI9BoES03l+55O+hY09Yj0xBGezEar+oyvrryIXNK1g7HZHymwrbr/5iDUg0glG\\naSVYStXJIUPosPww9+b8oAn67g8g+1uPLIQMj+YGRlpjp9YXkVSNLWdG7VwOTFOL\\nh6Nz4yXiyFlRSfRvgItJ/OTdbwKBgQC2l3PEtkzt/s/B7wjAyddbFNciTebaCDde\\nshM/hkgV3m0dy7dKZ756PUDXBjFDE5hBNmukS6Ds6LDf5sfuMYgtBIQq25fFDAHQ\\nL9Dl9vRtfqfYplH4ZHQlMfz5XCu/9jgJNLubRHUFkNA57+TdVgvr6BZ45OI1lnoO\\n143om4x/YwKBgAQh2HtYh+HdvJyFRct1CqyxZsQdw0xHD9IdJIGSlBptqUOfgGoA\\n8qY/eHSfn6g+pTxfL00oKKXzGI62aqOTC9FKGjJEOzNuJKeB1hnz+yP2cHhdaJzS\\n8bVAtV2vzqzd8O8lLH/G3bsM2XYqr62fc7HG6H51upbwEp0aaHJfSjebAoGAD38H\\nCjjWipRHmZPp0ELRDh/UqkqmPvbXjCfczlVdJM39wLubUKtBVSqBqD4UTDcLgu1V\\ncVohzDlrWXVCnoqBniB1/xUn6kc8mCiWuA2fbPOE1zQ2XLhZyxZU++zAocgJtW5O\\nRb0nmVNS+LfNWqOE236U+amjMR0WOtA8cPNSlzUCgYBs6WR/XxtLLXpTjO2IUFVf\\nFBDEcdbbvgmH69wjPpWJz50HsLBiqoabRSfghjEvxc83a7Dw3cAto5luOfDO3vq3\\ntpGX6yFr/CYY0S8mXtHVZxH3NV37e1hiB4buOYSZH+jmcXpsAT9gD5+LsDHDTt/Z\\nsj1fHEebF1xhaPK3b7zjyw==\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-rhu8v@doctors-portal-00112.iam.gserviceaccount.com","client_id":"106578932092574321703","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-rhu8v%40doctors-portal-00112.iam.gserviceaccount.com"}


// API Naming Convention
//   app.get('/users')  // get all users
//   app.post('/users')  // post or create or add a single user
//   app.get('/users/:id')  // get specific user by id
//   app.put('/users/:id')  // update specific user by id
//   app.delete('/users/:id')  // delete specific user by id