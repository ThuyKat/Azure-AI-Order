import express from 'express'
import Order from '../models/Order.js'
import MenuItem from '../models/MenuItem.js'

const router = express.Router()

router.post('/process',async(req,res)=>{
    try{
        const {transcript} = req.body;
        const menuItems = await MenuItem.find()
        // Extract order items from transcript
        const orderItems = extractOrderItems(transcript, menuItems)
        if(orderItems.length === 0){
            return res.status(400).json({message: 'No items found in transcript'})
        }
        // Calculate totals
        const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const tax = subtotal * 0.10 // 10% tax
        const total = subtotal + tax
        // Create a new order
        const newOrder = {
        items: orderItems,
        subtotal,
        tax,
        total
        }
        res.status(201).json(newOrder);
    }catch(err){
        res.status(400).json({ message: err.message });
    }
})
// Save  order to database
router.post('/save', async (req, res) => {
    try {
      const { orderData } = req.body
      
      // Validate order data
      if (!orderData || !orderData.items || !orderData.total) {
        return res.status(400).json({ message: 'Invalid order data' })
      }
      
      // Create a new Order instance from the order data
      let newOrder = new Order({
        items: orderData.items,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        total: orderData.total,
        status: orderData.status || 'pending'
      })
      
      // Save to database
      newOrder = await newOrder.save()
      
      res.status(201).json({
        success: true,
        message: 'Order saved successfully',
        order: newOrder
      })
      
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });
// Helper function to extract order items from transcript
function extractOrderItems(transcript,menuItems){
    const items = []
    const text = transcript.toLowerCase()
    
    // Simple number words mapping
    const numberWords = {
      'a':1,'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    }
    menuItems.forEach(menuItem=>{
        //check main name and keywords
        const nameAndKeywords = [menuItem.name.toLowerCase(),...menuItem.keywords.map(keyword=>keyword.toLowerCase())]
        for (const term of nameAndKeywords){
            if(text.includes(term)){
                //if found, look for quantity
                let quantity = 1
                //check for numeric quantity incase two is transcribed as 2
                const numericMatch = text.match(new RegExp(`(\\d+)\\s+${term}`)) // e.g. "2 burgers"
                if(numericMatch){
                    quantity = parseInt(numericMatch[1])
                }else{
                    //check for number words quantity incase two is transcribed as two
                    for(const numberWord in numberWords){
                        if(text.includes(`${numberWord} ${term}`)){
                            quantity = numberWords[numberWord]
                            break
                        }
                    }
                }
                //Check for modifications
                const modifications = []
                if(text.includes(`no ${term}`)){
                    modifications.push(`No ${term}`)
                }
                if(text.includes(`without ${term}`)){
                    modifications.push(`No ${term}`)
                }
                if(text.includes(`extra ${term}`)){
                    modifications.push(`Extra ${term}`)
                }
                if(text.includes(`add ${term}`)){
                    modifications.push(`Add ${term}`)
                }
                if(text.includes(`with ${term}`)){
                    modifications.push(`With ${term}`)
                }
                if(text.includes(`plus ${term}`)){
                    modifications.push(`With ${term}`)
                }
                items.push({
                    menuItem: menuItem._id,
                    name: menuItem.name,
                    price: menuItem.price,
                    quantity,
                    modifications
                })
                break
            }else{
                console.log(`Not found: ${term}`)
            }
        }
    })
    return items
}
// Get all orders
router.get('/', async (req, res) => {
    try {
      const orders = await Order.find()
      res.json(orders)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  })
// Get a specific order
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
        if (!order) {
            return res.status(404).json({ message: 'Order not found' })
        }
        res.json(order)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})
// Update an order items
router.put('/:id', async (req, res) => {
    try {
      const order = await Order.findById(req.params.id)
      if (!order) {
        return res.status(404).json({ message: 'Order not found' })
      }
      
      // Extract updated items from request
      const { items } = req.body
      
      // Update order items if provided
      if (items && Array.isArray(items)) {
        order.items = items
        
        // Recalculate financial values
        order.subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        order.tax = order.subtotal * 0.10 // 10% tax
        order.total = order.subtotal + order.tax
      }
      
      // Save the updated order
      await order.save()
      
      res.json(order)
    } catch (err) {
      console.error('Error updating order:', err);
      res.status(500).json({ message: err.message });
    }
  })
// Delete an order
router.delete('/:id', async (req, res) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id)
        if (!deletedOrder) {
          return res.status(404).json({ message: 'Order not found' })
        }
        res.json({ message: 'Order deleted successfully', order: deletedOrder })
    } catch (err) {
        console.error('Error deleting order:', err) // Log the specific error
        res.status(500).json({ message: err.message })
    }
})
//confirm an order (update status of existing order)
router.patch('/:id/confirm', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
        if (!order) {
            return res.status(404).json({ message: 'Order not found' })
        }
        order.status = 'confirmed'
        await order.save()
        res.json(order)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})
export default router