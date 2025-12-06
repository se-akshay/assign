# Personal Finance Management App

A full-stack MERN application for managing personal finances with AI-powered insights.

## Features

### User Authentication

- Secure registration and login with JWT
- Password hashing with bcrypt
- Protected routes and sessions

### Transaction Management

- Manual transaction entry
- CSV file upload for bulk imports
- Automatic category detection
- Filter by date range and category
- Transaction history with delete functionality

### AI-Powered Analysis

- OpenAI integration for spending insights
- Category-wise breakdown
- Spending pattern analysis
- Personalized saving suggestions
- Monthly saving goal recommendations

### Budget Management

- Set monthly total budgets
- Category-specific budget allocation
- Real-time spending tracking
- Budget alerts (warning at 80%, danger at 100%)
- Visual progress indicators

### Dashboard & Visualizations

- Total spending overview
- Interactive charts (Pie, Bar, Line)
- Category breakdown
- Spending trends over time
- AI insights display

## Tech Stack

### Backend

- Node.js & Express
- MongoDB & Mongoose
- JWT Authentication
- OpenAI API
- Multer (file uploads)
- CSV Parser

### Frontend

- React 19
- React Router DOM
- Tailwind CSS
- Recharts (data visualization)
- Lucide React (icons)
- Axios (API calls)
- date-fns (date formatting)

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- OpenAI API key

### Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables in `.env`:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finance-app
JWT_SECRET=your-secret-key-change-this-in-production
OPENAI_API_KEY=your-openai-api-key-here
NODE_ENV=development
```

4. Start MongoDB (if running locally):

```bash
mongod
```

5. Start the server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage Guide

### 1. Register/Login

- Create a new account or login with existing credentials
- All data is user-specific and secure

### 2. Add Transactions

- **Manual Entry**: Click "Add Transaction" button
- **CSV Upload**: Click "Upload CSV" and select your file
  - Format: `date,description,amount`
  - Example: `2024-12-01,Starbucks,5.50`

### 3. View Dashboard

- See total spending and budget usage
- View charts and spending trends
- Generate AI insights by clicking "Generate Insights"

### 4. Manage Budget

- Navigate to Budget page
- Set total monthly budget
- Optionally set category-specific budgets
- View spending vs budget in real-time
- Get automatic alerts when approaching limits

### 5. Filter Transactions

- Go to Transactions page
- Use filters for category and date range
- View transaction history
- Delete unwanted transactions

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Transactions

- `GET /api/transactions` - Get all transactions (with filters)
- `GET /api/transactions/stats` - Get spending statistics
- `POST /api/transactions/manual` - Add manual transaction
- `POST /api/transactions/upload` - Upload CSV file
- `DELETE /api/transactions/:id` - Delete transaction

### Budget

- `GET /api/budget/:month` - Get budget for month
- `POST /api/budget` - Set/update budget

### Analysis

- `POST /api/analysis/generate` - Generate AI analysis
- `GET /api/analysis/:month` - Get analysis for month
- `GET /api/analysis` - Get all analyses

## Categories

The app supports the following transaction categories:

- Food
- Rent
- Transport
- Shopping
- Subscriptions
- Entertainment
- Utilities
- Healthcare
- Others

Categories are automatically assigned based on transaction descriptions.

## Sample CSV Format

Create a CSV file with the following format:

```csv
date,description,amount
2024-12-01,Starbucks Coffee,5.50
2024-12-02,Walmart Grocery,85.30
2024-12-03,Uber Ride,15.75
```

## Screenshots & Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Clean UI**: Simple, modern interface with Tailwind CSS
- **Real-time Updates**: Instant feedback on all actions
- **Visual Feedback**: Charts and graphs for better understanding
- **Smart Alerts**: Proactive budget warnings

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- Input validation
- Secure session management

## Future Enhancements

- Recurring transactions
- Multiple account support
- Export data to PDF/Excel
- More AI features (anomaly detection)
- Email notifications
- Bill reminders
- Investment tracking

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access if using MongoDB Atlas

### OpenAI API Errors

- Verify API key is correct
- Check API quota/billing
- App provides fallback analysis if API fails

### Port Conflicts

- Change PORT in backend `.env`
- Update API_URL in frontend `src/utils/api.js`

## License

MIT License - feel free to use for learning or personal projects.

## Author

Built as a demonstration of full-stack MERN development with AI integration.
