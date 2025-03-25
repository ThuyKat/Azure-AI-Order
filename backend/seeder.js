import mongoose from 'mongoose'
import dotenv from 'dotenv'
import MenuItem from './models/MenuItem.js'

dotenv.config()

const menuItems = [
    {
        name: 'Cheeseburger',
        price: 8.99,
        category: 'Main',
        keywords: ['burger', 'cheese burger', 'hamburger', 'beef burger']
    },
    {
        name: 'French Fries',
        price: 3.99,
        category: 'Side',
        keywords: ['fries', 'french fries', 'chips', 'potato', 'potatoes']
    },
    {
        name: 'Chicken Sandwich',
        price: 9.99,
        category: 'Main',
        keywords: ['chicken', 'chicken sandwich', 'fried chicken', 'sandwich']
    },
    {
        name: 'Caesar Salad',
        price: 7.99,
        category: 'Side',
        keywords: ['salad', 'caesar', 'caesar salad']
    },
    {
        name: 'Chocolate Milkshake',
        price: 5.99,
        category: 'Drink',
        keywords: ['shake', 'milkshake', 'chocolate', 'chocolate shake']
    }
]

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        try {
            // Clear existing menu items
            await MenuItem.deleteMany({})
            console.log('Deleted existing menu items')
            
            // Insert new menu items
            await MenuItem.insertMany(menuItems)
            console.log('Added sample menu items')
            
            mongoose.connection.close();
        } catch (error) {
            console.error('Error seeding database:', error);
            process.exit(1)
        }
    })
    .catch(err => {
        console.error('Database connection error:', err)
        process.exit(1)
    })
