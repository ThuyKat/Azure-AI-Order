import { useState } from 'react'
import axios from 'axios'
import EditMenuItem from './components/EditMenuItem'
import "./index.css"
function MenuScanner() {
  const [file, setFile] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingItemIndex, setEditingItemIndex] = useState(null)
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  }
  //handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    
    setLoading(true)
    setError('')

    //access the file using FormData
    const formData = new FormData()
    formData.append('menuImage', file)
    //send the file to the server
    try {
      const response = await axios.post('http://localhost:5000/api/menu/scan-menu', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      console.log(response.data)
      if(response.status==200){
        setMenuItems(response.data.items || []);
      }
    } catch (err) {
        console.log(err)
      setError('Failed to scan menu: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }
  //handle the edit item button
    const handleEditItem = (index) => {
        setEditingItemIndex(index)
    }
    //handle the save to database button
    const handleSaveToDatabase = async()=>{
        console.log(menuItems)
        //get existing menuItems from database
        try{
            const response = await axios.get('http://localhost:5000/api/menu')
            if(response.status == 200){
                const dbMenuItems = response.data
                //if items already exist in current menu, ignore it 
                const newMenuItems = menuItems.filter(item => {
                    const currentItemNames = dbMenuItems.map(item => item.name)
                    return !currentItemNames.includes(item.name)
                })
                // Create an array to store all promises
                const savePromises = newMenuItems.map(async (item) => {
                    try {
                        const saveResponse = await axios.post('http://localhost:5000/api/menu', 
                            { item },
                            {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                            })
                        
                        if (saveResponse.status === 201) {
                            console.log("Added item: ", saveResponse.data);
                            return saveResponse.data;
                        } else {
                            throw new Error("Error adding item: " + item.name);
                        }
                    } catch (itemError) {
                        console.error("Failed to add item:", item.name, itemError);
                        throw itemError
                    }
                })
        
                // Wait for all items to be saved
                await Promise.all(savePromises);
                alert("All items are saved successfully!")
            }else{
                throw new Error("error fetching menu")
            }

        }catch(err){
            console.log( err)
        }
    }
  
  return (
    <div className="menu-scanner">
      <h2>Menu Scanner</h2>
      
      <form onSubmit={handleSubmit}>
      <div className="upload-instructions">
        <h4>Upload Menu Image</h4>
        <p>Supported file types: JPG, JPEG, PNG, PDF</p>
        <p>For best results:</p>
        <ul>
          <li>Use high-resolution images with clear text</li>
          <li>Ensure menu items and prices are visible</li>
          <li>Avoid glare or shadows on the menu</li>
          <li>Maximum file size: 10MB</li>
        </ul>
      </div>
        <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
        <button type="submit" disabled={!file || loading}>
          {loading ? 'Analyzing...' : 'Scan Menu'}
        </button>
      </form>
      
      {error && <div className="error">{error}</div>}
      
      {menuItems.length > 0 && (
        <div className="results">
            <h3>Extracted Menu Items</h3>
            <ul className="menu-items-list">
            {menuItems.map((item, index) => (
                <li key={index} className="menu-item">
                <div className="menu-item-header">
                    <div className="menu-item-info">
                    <strong>{item.name}</strong> - ${item.price.toFixed(2)}
                    {item.category && <span className="category"> ({item.category})</span>}
                    </div>
                    <button 
                    className="edit-button" 
                    onClick={() => handleEditItem(index)}
                    >
                    Edit
                    </button>
                </div>
                {item.description && <p className="description">{item.description}</p>}
                </li>
            ))}
            </ul>
            
            <button 
            className="save-to-db-button" 
            onClick={handleSaveToDatabase}
            >
            Save All Items to Database
            </button>
            
            {/* Edit Modal */}
            {editingItemIndex !== null && (
                <EditMenuItem 
                    isOpen={editingItemIndex !== null}
                    onClose={() => setEditingItemIndex(null)}
                    itemData={editingItemIndex !== null ? menuItems[editingItemIndex] : null} 
                    onSave={(updatedItem) => {
                        const updatedItems = [...menuItems]
                        updatedItems[editingItemIndex] = updatedItem
                        setMenuItems(updatedItems)
                        setEditingItemIndex(null) // Close the modal
                        alert("Change to item is saved!")
                    }}
                />
                )
            }
        </div>
        )}
    </div>
  )
}

export default MenuScanner;