const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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
    const usersCollection = db.collection("users");
    const applicationsCollection = db.collection("applications");
    
    // Get loans with limit and filter
    app.get('/loans', async (req, res) => {
      const limit = parseInt(req.query.limit) || 0;
      const createdBy = req.query.createdBy;
      const query = createdBy ? { createdBy } : {};
      const loans = await loansCollection.find(query).limit(limit).toArray();
      res.send(loans);
    });
    
    // Create loan
    app.post('/loans', async (req, res) => {
      const loan = req.body;
      const result = await loansCollection.insertOne(loan);
      res.send(result);
    });
    
    // Get single loan by ID
    app.get('/loans/:id', async (req, res) => {
      try {
        const loan = await loansCollection.findOne({ _id: new ObjectId(req.params.id) });
        res.send(loan);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });
    
    // Create user
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    
    // Get all users
    app.get('/users', async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });
    
    // Get user by email
    app.get('/users/:email', async (req, res) => {
      const user = await usersCollection.findOne({ email: req.params.email });
      res.send(user);
    });
    
    // Update user
    app.patch('/users/:email', async (req, res) => {
      const updates = req.body;
      const result = await usersCollection.updateOne(
        { email: req.params.email },
        { $set: updates }
      );
      res.send(result);
    });
    
    // Update loan (PATCH)
    app.patch('/loans/:id', async (req, res) => {
      try {
        const updates = req.body;
        const result = await loansCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: updates }
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });
    
    // Update loan (PUT)
    app.put('/loans/:id', async (req, res) => {
      try {
        const { title, description, interestRate, category, maxLoan, image } = req.body;
        const updates = {
          title,
          description,
          interestRate: Number(interestRate),
          category,
          maxLoan: Number(maxLoan),
          image
        };
        const result = await loansCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: updates }
        );
        if (result.matchedCount === 0) {
          return res.status(404).send({ error: 'Loan not found' });
        }
        res.send({ success: true, modifiedCount: result.modifiedCount });
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });
    
    // Delete loan
    app.delete('/loans/:id', async (req, res) => {
      try {
        const result = await loansCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });
    
    // Get all applications with filter
    app.get('/applications', async (req, res) => {
      const status = req.query.status;
      const userEmail = req.query.userEmail;
      let query = {};
      if (status) query.status = status;
      if (userEmail) query.userEmail = userEmail;
      const applications = await applicationsCollection.find(query).toArray();
      res.send(applications);
    });
    
    // Update application
    app.patch('/applications/:id', async (req, res) => {
      try {
        const updates = req.body;
        const result = await applicationsCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: updates }
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });
    
    // Create loan application
    app.post('/applications', async (req, res) => {
      const application = req.body;
      const result = await applicationsCollection.insertOne(application);
      res.send(result);
    });
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})