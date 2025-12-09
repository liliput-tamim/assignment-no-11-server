const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 4000;




const uri = "mongodb+srv://assingment-no-11:jMAb7XsUU2q1M7Dk@tamim5.kdnsuo2.mongodb.net/?appName=tamim5";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    
    const db = client.db("loanlink");
    const loansCollection = db.collection("loans");
    
    // Get loans with limit
    app.get('/loans', async (req, res) => {
      const limit = parseInt(req.query.limit) || 0;
      const loans = await loansCollection.find().limit(limit).toArray();
      res.send(loans);
    });
    
    // Get single loan by ID
    app.get('/loans/:id', async (req, res) => {
      const { ObjectId } = require('mongodb');
      const loan = await loansCollection.findOne({ _id: new ObjectId(req.params.id) });
      res.send(loan);
    });
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);



//middleware

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})