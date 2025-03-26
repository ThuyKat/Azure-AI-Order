import axios from 'axios';

// Process the voice command using Azure Language Understanding
const processVoiceCommand = async (text, order, updateOrderItems, setMessage) => {
  try {
    setMessage(`Processing: "${text}"`)
    const numberWords = {
        'a': 1, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    // Call Azure Language service
    const languageEndpoint = import.meta.env.VITE_AZURE_LANGUAGE_ENDPOINT
    const apiKey = import.meta.env.VITE_AZURE_LANGUAGE_KEY
    
    const response = await axios.post(
      `${languageEndpoint}/language/:analyze-conversations?api-version=2022-10-01-preview`,
      {
        kind: "Conversation",
        analysisInput: {
          conversationItem: {
            id: "1",
            text: text,
            modality: "text",
            participantId: "user"
          }
        },
        parameters: {
          projectName: "VoiceCommand",
          deploymentName: "production",
          verbose: true
        }
      },
      {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    )
    
    // Extract intent and entities
    const result = response.data.result
    const topIntent = result.prediction.topIntent
    const entities = result.prediction.entities//[{category:itemName, text:Burger}, {category:itemQuantity, text:1}]
    console.log(topIntent,entities)
    // Handle different intents
    switch (topIntent) {
      case 'AddItem':
        await handleAddItem(entities,numberWords, order, updateOrderItems, setMessage)
        break
      case 'RemoveItem':
        handleRemoveItem(entities, order, updateOrderItems, setMessage)
        break
      case 'ChangeQuantity':
        handleChangeQuantity(entities,numberWords, order, updateOrderItems, setMessage)
        break
      default:
        setMessage("I didn't understand that command. Please try again.")
        break
    }
  } catch (error) {
    console.error('Error processing voice command:', error)
    setMessage('Error processing command. Please try again.')
  }
}

// Handle adding items
const handleAddItem = async (entities,numberWords, order, updateOrderItems, setMessage) => {
  console.log(entities)
  // Extract item name and quantity
  let itemName = ''
  let quantity = 1
  
  entities.forEach(entity => {
    if (entity.category === 'ItemName') {
      itemName = entity.text
    }
    if (entity.category === 'ItemQuantity') {
        let quantityWord = entity.text.toLowerCase()
        quantity = numberWords[quantityWord] || 1
    }
  })
  
  if (!itemName) {
    setMessage('Please specify what item you want to add')
    return
  }
  console.log("add",itemName,quantity)
  // Fetch menu and find item
  const menuResponse = await axios.get('http://localhost:5000/api/menu')
  const menuItems = menuResponse.data
  const menuItem = findMatchingMenuItem(itemName, menuItems)
  
  if (menuItem) {
    // Update order
    const newItem = {
      name: menuItem.name,
      quantity: quantity,
      price: menuItem.price
    }
    
    const existingItemIndex = order.items.findIndex(
      item => item.name.toLowerCase() === menuItem.name.toLowerCase()
    )
    
    let updatedItems
    if (existingItemIndex >= 0) {
      updatedItems = [...order.items]
      updatedItems[existingItemIndex].quantity += quantity
    } else {
      updatedItems = [...order.items, newItem]
    }
    
    updateOrderItems(updatedItems)
    setMessage(`Added ${quantity} ${menuItem.name}(s) to your order`)
  } else {
    setMessage(`Item "${itemName}" not found in the menu`)
  }
}

const handleRemoveItem = (entities, order, updateOrderItems, setMessage) => {
    // Extract item name and quantity
  let itemName = ''  
  entities.forEach(entity => {
    if (entity.category === 'ItemName') {
      itemName = entity.text
    }
  })
  
  if (!itemName) {
    setMessage('Please specify what item you want to add')
    return
  }
   
      
  const updatedItems = order.items.filter(
    item => !item.name.toLowerCase().includes(itemName)
  )
  
  if (updatedItems.length === order.items.length) {
    setMessage(`Couldn't find item "${itemName}" to remove`);
  } else {
    updateOrderItems(updatedItems);
    setMessage(`Removed ${itemName} from your order`);
  }
}

const handleChangeQuantity = (entities,numberWords, order, updateOrderItems, setMessage) => {
    // Extract item name and quantity
    let itemName = ''
    let quantity = 1
    
    entities.forEach(entity => {
        if (entity.category === 'ItemName') {
        itemName = entity.text
        }
        if (entity.category === 'ItemQuantity') {
            let quantityWord = entity.text.toLowerCase()
            quantity = numberWords[quantityWord] || 1
        }
    })
    
    if (!itemName) {
        setMessage('Please specify what item you want to add')
        return
    }
    //find the item in the current order
    const itemFound = order.items.some(item => 
      item.name.toLowerCase().includes(itemName.toLowerCase())
    )
    
    if (itemFound) {
      const updatedItems = order.items.map(item => {
        if (item.name.toLowerCase().includes(itemName.toLowerCase())) {
          return { ...item, quantity: quantity }
        }
        return item
      })
      updateOrderItems(updatedItems);
      setMessage(`Changed ${itemName} quantity to ${quantity}`)
    } else {
      //try to add new item in the order
      handleAddItem(entities,numberWords, order, updateOrderItems, setMessage)
    }
  

}

const findMatchingMenuItem = (itemName, menuItems) => {
  // More flexible menu item matching - check if the item name contains any menu item name
  menuItems.forEach(menuItem=>{
    const nameAndKeywords = [menuItem.name.toLowerCase(),...menuItem.keywords.map(keyword=>keyword.toLowerCase())]
    for(const term of nameAndKeywords){
      if(itemName.includes(term)){  
        itemName = menuItem.name.toLowerCase()
        break
      }
    }
    })
    const menuItem = menuItems.find(item => item.name.toLowerCase().includes(itemName.toLowerCase()))
  return menuItem
}

export default processVoiceCommand