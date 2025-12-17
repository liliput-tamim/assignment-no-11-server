require('dotenv').config();
const express = require('express');

if (!process.env.STRIPE_SECRET_KEY || !process.env.MONGODB_URI) {
  console.error('Error: Missing required environment variables. Check your .env file.');
  process.exit(1);
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

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
    
    app.get('/loans', async (req, res) => {
      const limit = parseInt(req.query.limit) || 0;
      const createdBy = req.query.createdBy;
      const query = createdBy ? { createdBy } : {};
      const loans = await loansCollection.find(query).limit(limit).toArray();
      res.send(loans);
    });
    
    app.post('/loans', async (req, res) => {
      const loan = req.body;
      const result = await loansCollection.insertOne(loan);
      res.send(result);
    });
    
    app.get('/loans/:id', async (req, res) => {
      try {
        const loan = await loansCollection.findOne({ _id: new ObjectId(req.params.id) });
        res.send(loan);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });
    
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    
    app.get('/users', async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });
    
    app.get('/users/:email', async (req, res) => {
      const user = await usersCollection.findOne({ email: req.params.email });
      res.send(user);
    });
    
    app.patch('/users/:email', async (req, res) => {
      const updates = req.body;
      const result = await usersCollection.updateOne(
        { email: req.params.email },
        { $set: updates }
      );
      res.send(result);
    });
    
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
    
    app.delete('/loans/:id', async (req, res) => {
      try {
        const result = await loansCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });
    
    app.get('/applications', async (req, res) => {
      const status = req.query.status;
      const userEmail = req.query.userEmail;
      let query = {};
      if (status) query.status = status;
      if (userEmail) query.userEmail = userEmail;
      const applications = await applicationsCollection.find(query).toArray();
      res.send(applications);
    });
    
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
    
    app.post('/applications', async (req, res) => {
      const application = req.body;
      const result = await applicationsCollection.insertOne(application);
      res.send(result);
    });
    
    app.post('/create-payment-session', async (req, res) => {
      try {
        const { applicationId } = req.body;
        
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Loan Application Fee',
              },
              unit_amount: 1000,
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: `http://localhost:5173/payment-success?session_id={CHECKOUT_SESSION_ID}&application_id=${applicationId}`,
          cancel_url: 'http://localhost:5173/payment-cancel',
          metadata: { applicationId }
        });
        
        res.json({ url: session.url });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.post('/verify-payment', async (req, res) => {
      try {
        const { sessionId, applicationId } = req.body;
        
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session.payment_status === 'paid') {
          const result = await applicationsCollection.updateOne(
            { _id: new ObjectId(applicationId) },
            { $set: { feeStatus: 'Paid' } }
          );
          res.json({ success: true, result });
        } else {
          res.json({ success: false, message: 'Payment not completed' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})