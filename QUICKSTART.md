# Finance Management App - Quick Start Guide

## Prerequisites Check

Before running the app, ensure you have:

- ✅ Node.js installed (v18+)
- ✅ MongoDB installed and running
- ✅ OpenAI API key (get from https://platform.openai.com/)

## Step 1: Configure Backend

1. Open `backend/.env` and update:
   - `MONGODB_URI` - Your MongoDB connection string
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `JWT_SECRET` - Change to a secure random string

## Step 2: Start MongoDB

### For Windows (if installed locally):

```bash
mongod
```

### For MongoDB Atlas (cloud):

- Use your Atlas connection string in `MONGODB_URI`

## Step 3: Start Backend Server

Open a terminal in the project root:

```bash
cd backend
npm run dev
```

✅ Backend should be running on http://localhost:5000

## Step 4: Start Frontend

Open a NEW terminal in the project root:

```bash
cd frontend
npm run dev
```

✅ Frontend should be running on http://localhost:5173

## Step 5: Use the App

1. Open http://localhost:5173 in your browser
2. Click "Register" to create a new account
3. Login with your credentials
4. Start adding transactions!

### Try these features:

- Add a manual transaction
- Upload the sample CSV file (`sample-transactions.csv`)
- Set a monthly budget
- Generate AI insights

## Troubleshooting

### MongoDB not connecting?

- Make sure MongoDB service is running
- Check the connection string in `.env`

### OpenAI errors?

- Verify your API key is valid
- Check you have credits available
- The app will work without AI (provides fallback analysis)

### Port already in use?

- Backend: Change `PORT` in `backend/.env`
- Frontend: Vite will auto-assign a new port

## Default Login (After Registration)

Create your own account - no default credentials provided for security!

## Quick Test

1. Register a new account
2. Upload `sample-transactions.csv`
3. Go to Dashboard
4. Click "Generate Insights"
5. Set a budget in Budget page
6. See the alerts and charts!

Enjoy your personal finance management app! 🎉
