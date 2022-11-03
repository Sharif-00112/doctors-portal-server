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

// Database login information 
// DB_USER=doctors-portal-user1
// DB_PASS=EzVG0BwVrcOO3FdH

//connecting database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cny0fg3.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//Verify Firebase token using external function 



// CRUD Operation
async function run() {
  try {
    await client.connect();
    console.log('Database Connected');
    const testDatabase = client.db("test_DB");
    const testCollection = testDatabase.collection("test_collection");


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