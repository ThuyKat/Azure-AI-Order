import React, { useState} from 'react'
import './OrderPage.css'
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition'
import { processOrder,saveOrder } from '../../../utils/orderProcessing'
import {useNavigate} from 'react-router-dom'

const OrderPage = ({menuItems}) => {
  const {transcript,setTranscript,isListening,setIsListening,message,setMessage,startListening,stopListening} = useSpeechRecognition()
  const [order, setOrder] = useState(null)
  const navigate = useNavigate()
  const handleStartListening = async() => {
    await startListening()
  }
  const handleStopListening = async() => {
    const finalTranscript = await stopListening()
    const newOrder = await processOrder(finalTranscript)
    setOrder(newOrder)
  }
  const handleSaveOrder = async() =>{
    if(order){
      try {
        const response = await saveOrder(order)
        console.log(response)
        //update order id
        setOrder({...order,id:response.order._id})
        alert("Order is saved!")
        
      } catch (error) {
        console.log("error saving order")
      }
    }
  }
  const handleViewOrder = ()=>{
    navigate("/history",{ state: { newOrderId: order.id } })
  }
  // Get the top 6 most popular items for the quick menu
  const popularItems = [...menuItems]
    .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
    .slice(0, 6)
    
  return (
    
      <div className="order speech-section">
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
            <button 
              onClick={(event) => {
                event.stopPropagation()
                setMessage('')
                setTranscript('')
                setIsListening(false)
              }}
              className="speech-button refresh-button"
            >
              Try again
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
                <button 
                  className={`checkout-button ${order?.id ? 'view-button' : ''}`} 
                  onClick={order?.id ? handleViewOrder : handleSaveOrder}
                >
                      {order?.id ? 'View Order' : 'Confirm to Save'}
                </button>
                <button 
                  className="speech-button refresh-button checkout" 
                  onClick={(event) => {
                    event.stopPropagation()
                    setMessage('')
                    setTranscript('')
                    setOrder(null)
                  }}>
                    Try Again
                </button>
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