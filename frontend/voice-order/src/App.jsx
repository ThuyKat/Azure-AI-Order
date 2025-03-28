import React from "react"
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import OrderHistory from "./pages/OrderHistoryPage"
import EditOrder from "./pages/EditOrderPage"
import "./App.css"
import MainApp from "./pages/NewOrderPage"
import MenuScanner from "./pages/MenuScanPage"
function App() {
  return (
    <Router>
      <div className="App">
      <header className="App-header">
          <div className="header-content">
            <h1>OrderGenie</h1>
            
            {/* Regular nav for desktop and iPad */}
            <nav className="desktop-nav">
              <ul>
                <li>
                  <Link to="/">New Order</Link>
                </li>
                <li>
                  <Link to="/history">Order History</Link>
                </li>
                <li>
                  <Link to="/menu-scan">Scan Menu</Link>
                </li>
              </ul>
            </nav>
            
            {/* Hamburger menu only for mobile */}
            <div className="mobile-menu">
              <input type="checkbox" id="menu-toggle" />
              <label htmlFor="menu-toggle" className="menu-button">
                <span></span>
                <span></span>
                <span></span>
              </label>
              <nav className="nav-menu">
                <ul>
                  <li>
                    <Link to="/">New Order</Link>
                  </li>
                  <li>
                    <Link to="/history">Order History</Link>
                  </li>
                  <li>
                    <Link to="/menu-scan">Scan Menu</Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<MainApp/>} />
            <Route path="/history" element={<OrderHistory />} />
            <Route path="/history/:id/edit" element={<EditOrder />} />
            <Route path="/menu-scan" element={<MenuScanner/>} />
          </Routes>
        </main>

        <footer>
          <p>OrderGenie @2025 ❤️ by Katie </p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
