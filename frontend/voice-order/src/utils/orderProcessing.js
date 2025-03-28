import axios from 'axios'

// Process the transcript and send to backend
export const processOrder = async (transcript) => {
  try {
    // Send to backend for processing
    const response = await axios.post('http://localhost:5000/api/orders/process', {transcript}, {
      headers: {'Content-Type': 'application/json'}}
    )
    return response.data
  } catch (error) {
    console.error('Error processing order:', error)
    throw error
  }
}
//save order to database
export const saveOrder = async(order)=>{
  console.log(order)
  try{
    const response = await axios.post('http://localhost:5000/api/orders/save',{orderData: order},{
      headers:{
        "Content-Type":"application/json"
      }
    })
    if(response.status === 201){
      console.log(response)
      return response.data
    }

  }catch (error) {
    console.error('Error saving order:', error)
    throw error
  }
}

//Process voice command before sesnding to backend
export const processVoiceCommand = async (text,order,updateOrderItems,setMessage) => {
  try {
    setMessage(`Processing: "${text}"`);
    
    // Simple number words mapping
    const numberWords = {
      'a': 1, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    
    // command parsing
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('add')) {
      handleAddCommand(lowerText, numberWords, order, updateOrderItems, setMessage)
    } else if (lowerText.includes('remove')) {
      handleRemoveCommand(lowerText, order, updateOrderItems, setMessage)
    } else if (lowerText.includes('change') || lowerText.includes('update')) {
      handleChangeCommand(lowerText, order, updateOrderItems, setMessage)
    } else {
      setMessage('Sorry, I didn\'t understand that command. Try "add [item]", "remove [item]", or "change [item] to [quantity]"')
    }
  } catch (error) {
    console.error('Error processing voice command:', error)
    setMessage('Error processing command. Please try again.')
  }
}

const handleAddCommand = async (lowerText, numberWords, order, updateOrderItems, setMessage) => {

  // Handle add command
  const itemMatch = lowerText.match(/add\s+(\d+)?\s*(.+)/i) // e.g. "add 2 chocolate muffins"
      
  if (itemMatch) {
    // Initialize quantity variable with let
    let quantity = itemMatch[1] ? parseInt(itemMatch[1]) : 1 // Default to 1 if no quantity specified
    const itemName = itemMatch[2].trim() // e.g. "chocolate muffins"
    console.log('Item name:', itemName)
    // Check for number words quantity in case two is transcribed as two
    let cleanedItemName = itemName
    for (const numberWord in numberWords) {
      if (itemName.includes(numberWord)) {
        quantity = numberWords[numberWord]
        // Remove the number word from the item name
        cleanedItemName = itemName.replace(new RegExp(`\\b${numberWord}\\b`, 'i'), '').trim()
        break
      }
    }
    // Find item in menu 
    const menuResponse = await axios.get('http://localhost:5000/api/menu')
    const menuItems = menuResponse.data
    
    // More flexible menu item matching - check if the item name contains any menu item name
    menuItems.forEach(menuItem=>{
    const nameAndKeywords = [menuItem.name.toLowerCase(),...menuItem.keywords.map(keyword=>keyword.toLowerCase())]
    for(const term of nameAndKeywords){
      if(cleanedItemName.includes(term)){  
        cleanedItemName = menuItem.name.toLowerCase()
        break
      }
    }
    })
    const menuItem = menuItems.find(item => item.name.toLowerCase().includes(cleanedItemName.toLowerCase()))
    
    if (menuItem) {
      const newItem = {
        name: menuItem.name, 
        quantity: quantity,
        price: menuItem.price
      }
      
      // Check if the item already exists in the order
      const existingItemIndex = order.items.findIndex(
        item => item.name.toLowerCase() === menuItem.name.toLowerCase()
      )
      
      let updatedItems
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        updatedItems = [...order.items];
        updatedItems[existingItemIndex].quantity += quantity
      } else {
        // Add as new item
        updatedItems = [...order.items, newItem]
      }
      
      updateOrderItems(updatedItems)
      setMessage(`Added ${quantity} ${menuItem.name}(s) to your order`)
    } else {
      setMessage(`Item "${itemName}" not found in the menu`)
    }
  } else { // If the command doesn't match the expected format
    setMessage('Sorry, I didn\'t understand that. Please try again.')
  }
}

const handleRemoveCommand = (lowerText, order, updateOrderItems, setMessage) => {

  // Handle remove command
  const itemToRemove = lowerText.replace(/remove\s+/i, '').trim()
      
  const updatedItems = order.items.filter(
    item => !item.name.toLowerCase().includes(itemToRemove)
  )
  
  if (updatedItems.length === order.items.length) {
    setMessage(`Couldn't find item "${itemToRemove}" to remove`);
  } else {
    updateOrderItems(updatedItems);
    setMessage(`Removed ${itemToRemove} from your order`);
  }
}

const handleChangeCommand = (lowerText, order, numberWords, updateOrderItems, setMessage) => {
  // Handle change quantity command
  const changeMatch = lowerText.match(/(change|update)\s+(.+)\s+to\s+(\d+)/i) // e.g. "change sandwich to 2"
      
  if (changeMatch) {
    const itemName = changeMatch[2].trim()
    let newQuantity = parseInt(changeMatch[3])
    
    // Check for number words in the quantity
    for (const numberWord in numberWords) {
      if (changeMatch[3].includes(numberWord)) {
        newQuantity = numberWords[numberWord]
        break
      }
    }
    
    const updatedItems = order.items.map(item => {
      if (item.name.toLowerCase().includes(itemName.toLowerCase())) {
        return { ...item, quantity: newQuantity }
      }
      return item
    })
    
    const itemFound = order.items.some(item => 
      item.name.toLowerCase().includes(itemName.toLowerCase())
    )
    
    if (itemFound) {
      updateOrderItems(updatedItems);
      setMessage(`Changed ${itemName} quantity to ${newQuantity}`)
    } else {
      setMessage(`Couldn't find item "${itemName}" to update`)
    }
  } else {
    setMessage('Sorry, I couldn\'t understand the quantity to change to.')
  }
}
