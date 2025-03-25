import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason } from 'microsoft-cognitiveservices-speech-sdk'

const EditOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch the order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/orders/${id}`)
        setOrder(response.data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching order:', error)
        setMessage('Error loading order details')
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id]);

  // Handle voice commands
  const startListening = async () => {
    setIsListening(true)
    setTranscript('')
    
    const speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY
    const speechRegion = import.meta.env.VITE_AZURE_SPEECH_REGION
    
    try {
      const speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion)
      speechConfig.speechRecognitionLanguage = 'en-US'
      
      const audioConfig = AudioConfig.fromDefaultMicrophoneInput()
      const recognizer = new SpeechRecognizer(speechConfig, audioConfig)
      
      recognizer.recognizeOnceAsync(
        result => {
          setIsListening(false);
          
          if (result.reason === ResultReason.RecognizedSpeech) {
            setTranscript(result.text)
            processVoiceCommand(result.text)
          } else {
            setMessage("Sorry, I couldn't understand that. Please try again.")
          }
          
          recognizer.close()
        },
        error => {
          console.error('Speech recognition error:', error)
          setIsListening(false)
          setMessage('Error processing speech. Please try again.')
          recognizer.close()
        }
      )
    } catch (error) {
      console.error('Error setting up speech recognition:', error)
      setIsListening(false)
      setMessage('Error setting up speech recognition. Please try again.')
    }
  };

  // Process the voice command
const processVoiceCommand = async (text) => {
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
            console.log(numberWord)
            quantity = numberWords[numberWord]
            // Remove the number word from the item name
            cleanedItemName = itemName.replace(new RegExp(`\\b${numberWord}\\b`, 'i'), '').trim()
            break
          }
        }
        console.log(cleanedItemName)
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
    } else if (lowerText.includes('remove')) {
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
    } else if (lowerText.includes('change') || lowerText.includes('update')) {
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
    } else {
      setMessage('Sorry, I didn\'t understand that command. Try "add [item]", "remove [item]", or "change [item] to [quantity]"')
    }
  } catch (error) {
    console.error('Error processing voice command:', error)
    setMessage('Error processing command. Please try again.')
  }
}

  // Update order items and recalculate total
  const updateOrderItems = async (items) => {
      // Calculate new total
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      
      // Update order state locally
      setOrder({ ...order, items, total })
      
  }

  // Save changes and return to order view
  const saveChanges = async () => {
    // update order in database
    try {
      await axios.put(`http://localhost:5000/api/orders/${id}`, order)
      setMessage('Order saved successfully')
      navigate(`/history`)
    } catch (error) {
      console.error('Error saving order:', error)
      setMessage('Error saving order. Please try again.')
    }
  }

  if (loading) {
    return <div className="loading">Loading order details...</div>
  }

  if (!order) {
    return <div className="error">Order not found</div>
  }

  return (
    <div className="edit-order-container">
      <h2>Edit Order #{order._id.substring(order._id.length - 6)}</h2>
      
      {message && <div className="message">{message}</div>}
      
      <div className="voice-controls">
        <button 
          className={`speak-btn ${isListening ? 'listening' : ''}`}
          onClick={startListening}
          disabled={isListening}
        >
          {isListening ? 'Listening...' : 'Speak to Edit'}
        </button>
        
        {transcript && (
          <div className="transcript">
            <h4>I heard:</h4>
            <p>{transcript}</p>
          </div>
        )}
        
        <div className="voice-help">
          <p>Try saying:</p>
          <ul>
            <li>"Add a chocolate muffin"</li>
            <li>"Remove the coffee"</li>
            <li>"Change sandwich to 2"</li>
          </ul>
        </div>
      </div>
      
      <div className="current-order">
        <h3>Current Items</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Subtotal</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>${(item.price * item.quantity).toFixed(2)}</td>
                <td>
                  <button onClick={() => {
                    const updatedItems = order.items.filter((_, i) => i !== index);
                    updateOrderItems(updatedItems);
                  }}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3">Total:</td>
              <td>${order.total.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="actions">
        <button onClick={() => navigate(`/history`)}>Cancel</button>
        <button onClick={saveChanges}>Save Changes</button>
      </div>
    </div>
  )
}

export default EditOrder