import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import OrderHistory from "./pages/OrderHistoryPage";
import EditOrder from "./pages/EditOrderPage/index";
import "./App.css";
import MainApp from "./pages/NewOrderPage/index";
function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Voice Order System</h1>
          <nav>
            <ul>
              <li>
                <Link to="/">New Order</Link>
              </li>
              <li>
                <Link to="/history">Order History</Link>
              </li>
            </ul>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<MainApp/>} />
            <Route path="/history" element={<OrderHistory />} />
            <Route path="/history/:id/edit" element={<EditOrder />} />
          </Routes>
        </main>

        <footer>
          <p>Voice Order System - Built for Hackathon</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
