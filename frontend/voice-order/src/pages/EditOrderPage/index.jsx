import React, { useState, useEffect} from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import  processVoiceCommand  from '../../utils/voiceCommandProcessing'
import './index.css'

export default function EditOrder () {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const {transcript,setTranscript,isListening,setIsListening,message,setMessage,startListening,stopListening} = useSpeechRecognition()
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
  }, [id])

  // Handle voice commands
  const handleStartListening = async() => {
    setTranscript('')
    await startListening()
  }
  const handleStopListening = async() => {
    const finalTranscript = await stopListening()
    handleVoiceCommand(finalTranscript)
  }
// Process the voice command
  const handleVoiceCommand = async (text) => {
    await processVoiceCommand(text, order, updateOrderItems, setMessage)
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
          onClick={isListening ? handleStopListening : handleStartListening}
        >
            {isListening ? '🛑 Stop Listening and Send' : '🔊 Start Listening'}
        </button>
        <button
          className='clear-btn'
          onClick={(event) => {
            event.stopPropagation()
            setMessage('')
            setTranscript('')
            setIsListening(false)
          }}
        >
          ↻ Refresh
        </button>
        <div className="voice-help">
          <p>Try saying:</p>
          <ul>
            <li>"Add a sandwich"</li>
            <li>"Change sandwich to 2 or I want 2 sandwiches"</li>
            <li>"Remove the sandwich"</li>
          </ul>
        </div>
        
      </div>
      {transcript && (
          <div className="transcript">
            <h4>I heard:</h4>
            <p>{transcript}</p>
          </div>
        )}
      
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

