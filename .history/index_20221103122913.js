const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const port = process.env.PORT || 3005;

//firebase admin initialization 
var admin = require("firebase-admin");
var serviceAccount = require('./react-firebase-integrati-7bab8-firebase-adminsdk-7owjd-24dacbc2fe.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();

//middleware
app.use(cors());
app.use(express.json());

//user: prodManagement1
//pass: jJg4x3Ns8wCk6HCN

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aruppvu.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//Verify Firebase token using external function 
async function verifyToken(req, res, next) {
  if(req.headers?.authorization?.startsWith('Bearer ')){
    const idToken = req.headers.authorization.split('Bearer ')[1];
    // console.log('Inside separate function:', idToken);
    try{
      const decodedUser = await admin.auth().verifyIdToken(idToken);
      // console.log(decodedUser);
      console.log('email:', decodedUser.email);
      req.decodedUserEmail = decodedUser.email;
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
    console.log('Database Connected');
    const testDatabase = client.db("test_DB");
    const testCollection = database.collection("test_collection");


  } finally {
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hellooooow doctors portal!');
}); 

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});