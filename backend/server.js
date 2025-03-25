import express from "express"
import cors from "cors"
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import menuItemRoutes from './routes/menuItems.js'
import orderRoutes from './routes/orders.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 5000
//Middleware
app.use(cors())
app.use(express.json())
app.use('/api/menu',menuItemRoutes)
app.use('/api/orders',orderRoutes)
//Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err))

// Routes
app.get('/', (req, res) => {
    res.send('Voice Order API is running');
  })

app.listen(5000)