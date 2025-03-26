import React, { useState, useRef } from 'react'
import './OrderPage.css'
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition'
import { processOrder } from '../../../utils/orderProcessing'

const OrderPage = ({menuItems}) => {
  const {transcript,isListening,startListening,stopListening} = useSpeechRecognition()
  const [order, setOrder] = useState(null)
  const recognizerRef = useRef(null)

  const handleStartListening = async() => {
    await startListening()
  }
  const handleStopListening = async() => {
    const finalTranscript = await stopListening()
    const newOrder = await processOrder(finalTranscript)
    setOrder(newOrder)
  }
  // Get the top 6 most popular items for the quick menu
  const popularItems = [...menuItems]
    .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
    .slice(0, 6)
    
  return (
    
      <div className="speech-section">
        <h2>Your Order</h2>
        
        {!isListening ? (
          <button 
            onClick={handleStartListening}
            className="speech-button start-button"
          >
            Start Order
          </button>
        ) : (
          <>
            {/* Quick reference menu of most popular items appear on listening*/}
            <div className="quick-menu">
              <h4>Popular Items</h4>
              <div className="quick-menu-items">
                {popularItems.map(item => (
                  <div key={item._id} className="quick-menu-item">
                    <span>{item.name}</span>
                    <span>${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          
            <button 
              onClick={handleStopListening}
              className="speech-button confirm-button"
            >
              Confirm Order
            </button>
          </>
        )
        }
        
        {transcript && (
          <div className="transcript">
            <h3>I heard:</h3>
            <p>{transcript}</p>
          </div>
        )}
        
        {order &&(
          <div className="order-summary">
            <h3>Order Summary</h3>
            {order.items.length > 0 ? (
              <>
                <ul className="order-items-list">
                  {order.items.map((item, index) => (
                    <li key={index}>
                      <span>{item.quantity}x {item.name}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="order-total">
                  <div>Subtotal: ${order.subtotal.toFixed(2)}</div>
                  <div>Tax: ${order.tax.toFixed(2)}</div>
                  <div className="total">Total: ${order.total.toFixed(2)}</div>
                </div>
                <button className="checkout-button">Proceed to Checkout</button>
              </>
            ) : (
              <p>No items detected in your order. Please try again.</p>
            )}
          </div>
        )}
      </div>
    
  )
}

export default OrderPage;