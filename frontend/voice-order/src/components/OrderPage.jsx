import React, { useState, useEffect, useRef } from 'react'
import { SpeechConfig, AudioConfig, SpeechRecognizer, ResultReason } from 'microsoft-cognitiveservices-speech-sdk'
import axios from 'axios'
import './OrderPage.css'

const OrderPage = () => {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [order, setOrder] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const recognizerRef = useRef(null)
  
  // Fetch menu items when component mounts
  useEffect(() => {
    fetchMenuItems()
    
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stopContinuousRecognitionAsync()
        recognizerRef.current.close()
      }
    }
  }, [])
  
  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/menu')
      setMenuItems(response.data)
      
      // Set the main category as active by default
      if (response.data.length > 0) {
        const categories = [...new Set(response.data.map(item => item.category))]
        setActiveCategory(categories[0])
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching menu:', error)
      setLoading(false)
    }
  }
  
  const startListening = async () => {
    setIsListening(true)
    const speechKey = import.meta.env.VITE_AZURE_SPEECH_KEY || ''
    const speechRegion = import.meta.env.VITE_AZURE_SPEECH_REGION || ''
    
    const speechConfig = SpeechConfig.fromSubscription(speechKey, speechRegion)
    speechConfig.speechRecognitionLanguage = 'en-US'
    
    const audioConfig = AudioConfig.fromDefaultMicrophoneInput()
    const recognizer = new SpeechRecognizer(speechConfig, audioConfig)
    recognizerRef.current = recognizer
    
    recognizer.recognized = (s, e) => {
      if (e.result.reason === ResultReason.RecognizedSpeech) {
        setTranscript(prev => {
          const updatedText = prev ? prev + ' ' + e.result.text : e.result.text
          return updatedText
        })
      }
    }
    
    recognizer.startContinuousRecognitionAsync(
      () => console.log('Continuous recognition started'),
      error => {
        console.error('Error starting continuous recognition:', error)
        setIsListening(false)
      }
    )
  }
  
  const stopListening = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync(
        () => {
          console.log('Continuous recognition stopped')
          setIsListening(false)
          
          if (transcript) {
            processOrder(transcript)
          }
        },
        error => {
          console.error('Error stopping continuous recognition:', error)
          setIsListening(false)
        }
      )
    }
  }
  
  const processOrder = async (text) => {
    try {
      const response = await axios.post('http://localhost:5000/api/orders/process', {
        transcript: text
      })
      setOrder(response.data)
    } catch (error) {
      console.error('Error processing order:', error)
    }
  }
  
  // Group menu items by category
  const categories = [...new Set(menuItems.map(item => item.category))]
  
  // Filter menu items based on active category and search term
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = !activeCategory || item.category === activeCategory;
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.keywords && item.keywords.some(kw => kw.toLowerCase().includes(searchTerm.toLowerCase())))
    
    return matchesCategory && matchesSearch
  })
  
  // Get the top 6 most popular items for the quick menu
  const popularItems = [...menuItems]
    .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
    .slice(0, 6)
  
  if (loading) return <div>Loading menu...</div>;
  
  return (
    <div className="order-page">
      <div className="menu-section">
        <h2>Menu</h2>
        
        <div className="menu-filters">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="category-tabs">
            <button 
              className={!activeCategory ? 'active' : ''} 
              onClick={() => setActiveCategory(null)}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category}
                className={activeCategory === category ? 'active' : ''}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        <div className="menu-items-grid">
          {filteredMenuItems.map(item => (
            <div key={item._id} className="menu-item">
              <div className="menu-item-details">
                <h4>{item.name}</h4>
                <p className="price">${item.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="speech-section">
        <h2>Your Order</h2>
        
        {!isListening ? (
          <button 
            onClick={startListening}
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
              onClick={stopListening}
              className="speech-button confirm-button"
            >
              Confirm Order
            </button>
          </>
        )}
        
        {transcript && (
          <div className="transcript">
            <h3>I heard:</h3>
            <p>{transcript}</p>
          </div>
        )}
        
        {order && (
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
    </div>
  );
};

export default OrderPage;