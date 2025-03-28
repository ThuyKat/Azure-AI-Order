import { useState } from "react"
import "./EditMenuItem.css"
export default function EditItem({isOpen, onClose, itemData, onSave}) {
    const [editFormData, setEditFormData] = useState(itemData)
    const handleUpdateItem = (e) => {
        e.preventDefault()
        onSave(editFormData)
    }
    return(
      <div className="modal-overlay">
        <div className="edit-modal">
          <h3>Edit Menu Item</h3>
          <form onSubmit={handleUpdateItem}>
            {/* Form fields */}
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="price">Price ($):</label>
              <input
                type="number"
                id="price"
                step="0.01"
                min="0"
                value={editFormData.price}
                onChange={(e) => setEditFormData({...editFormData, price: parseFloat(e.target.value)})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Category:</label>
              <input
                type="text"
                id="category"
                value={editFormData.category}
                onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="keywords">Keywords (comma separated):</label>
              <input
                type="text"
                id="keywords"
                value={editFormData.keywords}
                onChange={(e) => setEditFormData({...editFormData, keywords: e.target.value})}
              />
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={editFormData.available}
                  onChange={(e) => setEditFormData({...editFormData, available: e.target.checked})}
                />
                Available
              </label>
            </div>
            
            <div className="modal-buttons">
              <button type="submit" className="save-button">Save Changes</button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )
}