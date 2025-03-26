import React, { useState, useEffect } from 'react'
import './Menu.css'

export default function Menu({menuItems}) {
    const [activeCategory, setActiveCategory] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
    fetchActiveCategory()
    }, [])

    const fetchActiveCategory = async () => { 
        // Set the main category as active by default
        if (menuItems.length > 0) {
            const categories = [...new Set(menuItems.map(item => item.category))]
            setActiveCategory(categories[0])
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

    return (
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
    )
}