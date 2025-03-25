import express from 'express'
import MenuItem from '../models/MenuItem.js'

const router = express.Router()

// Get all menu items
router.get('/', async (req, res) => {
    try {
      const menuItems = await MenuItem.find()
      res.json(menuItems)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
})

// Add a menu item
router.post('/', async (req, res) => {
  const menuItem = new MenuItem({
    name: req.body.name,
    price: req.body.price,
    category: req.body.category,
    keywords: req.body.keywords,
    available: req.body.available
  })

  try {
    const newMenuItem = await menuItem.save()
    res.status(201).json(newMenuItem)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})
export default router
