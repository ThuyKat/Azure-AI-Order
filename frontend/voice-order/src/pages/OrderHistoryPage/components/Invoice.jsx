import React from 'react'
import './Invoice.css'

const Invoice = ({ order, onConfirm, onEdit, onDelete, onClose }) => {
    if(!order) {
        return null;
    }
    return (
        <div className="invoice">
            <div className="invoice-header">
                <h2>Order Summary</h2>
                <span>Order #{order._id.substring(0, 8)}</span>
                <span className={`status status-${order.status}`}>
                {order.status.toUpperCase()}
                </span>
            </div>
            <div className="invoice-item">
                <table>
                    <thead>
                        <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map((item, index) => (
                        <tr key={index}>
                            <td>
                            {item.name}
                            {item.modifications.map((mod, i) => (
                                <div key={i} className="modification">• {mod}</div>
                            ))}
                            </td>
                            <td>{item.quantity}</td>
                            <td>${item.price.toFixed(2)}</td>
                            <td>${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="invoice-summary">
                <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                    <span>Tax (8%):</span>
                    <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                    <span>Total:</span>
                    <span>${order.total.toFixed(2)}</span>
                </div>
            </div>
            <div className="invoice-actions">
                {order.status === 'pending' && (
                <button className="btn-primary" onClick={() => onConfirm && onConfirm(order._id)}>
                    Confirm Order
                </button>
                )}
                <button className="btn-secondary" onClick={() => onEdit && onEdit(order._id)}>
                Edit Order
                </button>
                <button className="btn-delete" onClick={() => onDelete && onDelete(order._id)}>
                Delete Order
                </button>
                {onClose && (
                <button className="btn-close" onClick={onClose}>
                    Close
                </button>
                )}
            </div>
        </div>
    )
}
export default Invoice