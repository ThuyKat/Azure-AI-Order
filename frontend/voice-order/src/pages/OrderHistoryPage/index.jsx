import React, { useEffect, useState } from "react"
import axios from "axios"
import "./index.css"
import Invoice from "./components/Invoice"
import { useNavigate } from "react-router-dom"
import {useRef} from 'react'
const OrderHistory = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showInvoice, setShowInvoice] = useState(false)
  const navigate = useNavigate()
  const newOrderId = location.state?.newOrderId
  const newOrderRef = useRef(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  // After component mounts, highlight and scroll to the new order if ID is provided
  useEffect(() => {
    if (newOrderId && newOrderRef.current) {
      // Scroll the element into view
      newOrderRef.current.scrollIntoView({ behavior: 'smooth' })
      
      // Add highlight animation
      newOrderRef.current.classList.add('highlight-order')
      
      // Remove highlight after animation completes
      setTimeout(() => {
        if (newOrderRef.current) {
          newOrderRef.current.classList.remove('highlight-order')
        }
      }, 3000)
    }
  }, [newOrderId, orders])

  const fetchOrders = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/orders");
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLoading(false);
    }
  };
  const viewInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  const closeInvoice = () => {
    setShowInvoice(false);
    setSelectedOrder(null);
  };
  const confirmOrder = async (orderId) => {
    try {
      //update order in database
      await axios.patch(`http://localhost:5000/api/orders/${orderId}/confirm`, {
        status: "confirmed",
      });
      // Update orders in state
      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, status: "confirmed" } : order
        )
      );
      closeInvoice();
    } catch (error) {
      console.error("Error confirming order:", error);
    }
  };
  const deleteOrder = async (orderId) => {
    try {
      //delete order in database
      const response = await axios.delete(
        `http://localhost:5000/api/orders/${orderId}`
      )
      // Update orders in state
      setOrders(orders.filter((order) => order._id !== orderId))
      closeInvoice()
      alert(`Order id ${orderId} is deleted`)
    } catch (error) {
      console.error("Error deleting order:", error)
    }
  };

  const editOrder = (orderId) => {
    // Navigate to the edit page for this order
    navigate(`/history/${orderId}/edit`)
  }

  if (loading) return <div>Loading orders...</div>

  return (
    <div className="order-history">
      <h2>Order History</h2>
      {showInvoice && selectedOrder && (
        <div className="invoice-modal">
          <div className="invoice-modal-content">
            <Invoice
              order={selectedOrder}
              onConfirm={confirmOrder}
              onEdit={editOrder}
              onDelete={deleteOrder}
              onClose={closeInvoice}
            />
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div
              key={order._id}
              className="order-card"
              onClick={() => viewInvoice(order)}
              ref={order.id === newOrderId ? newOrderRef : null}
            >
              <div className="order-header">
                <span>Order #{order._id.substring(0, 8)}</span>
                <span className={`status status-${order.status}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>

              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <span>Total: ${order.total.toFixed(2)}</span>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
