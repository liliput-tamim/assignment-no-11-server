# Loan Application Server

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file from template: `cp .env.example .env`
4. Add your actual values to `.env`:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `MONGODB_URI`: Your MongoDB connection string
   - `PORT`: Server port (default: 4000)
5. Start the server: `npm start`

## Environment Variables

Create a `.env` file with:
```
STRIPE_SECRET_KEY=your_stripe_secret_key_here
MONGODB_URI=your_mongodb_connection_string_here
PORT=4000
```

**Never commit the `.env` file to git!**