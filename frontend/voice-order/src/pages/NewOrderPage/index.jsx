// Code for the main component of the app, which fetches the menu items from the server and renders the Menu and OrderPage components.
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Menu from './components/Menu'
import OrderPage from './components/OrderPage'
import './index.css'
export default function MainApp() {
    const [menuItems, setMenuItems] = useState([])
    const [loading, setLoading] = useState(true)
  
    useEffect(() => {
      const fetchMenuItems = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/menu')
          setMenuItems(response.data)
          setLoading(false)
        } catch (error) {
          console.error('Error fetching menu:', error)
          setLoading(false)
        }
      }
      
      fetchMenuItems();
    }, [])
  
    if (loading) return <div>Loading menu...</div>;
  
    return (
      <div className="order-page">
        <Menu menuItems={menuItems} />
        <OrderPage menuItems={menuItems} />
      </div>
    );
  }