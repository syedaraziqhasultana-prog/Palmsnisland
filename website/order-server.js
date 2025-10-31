const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001; // Running on a different port than the reservations server

app.use(cors());
app.use(express.json());

const ordersFilePath = path.join(__dirname, 'customer-orders.json');

// Helper function to read orders from the file
const readOrders = () => {
    if (!fs.existsSync(ordersFilePath)) {
        return [];
    }
    const data = fs.readFileSync(ordersFilePath, 'utf8');
    return JSON.parse(data);
};

// Helper function to write orders to the file
const writeOrders = (orders) => {
    fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8');
};

// Endpoint to get all customer orders
app.get('/api/customer-orders', (req, res) => {
    console.log('GET /api/customer-orders - Fetching all orders');
    const orders = readOrders();
    res.json(orders);
});

// Endpoint to submit a new customer order
app.post('/api/customer-orders', (req, res) => {
    console.log('POST /api/customer-orders - Received new order:', req.body);
    const orders = readOrders();
    const newOrder = {
        ...req.body,
        orderId: `ORD-${Date.now()}`, // Generate a unique order ID
        timestamp: new Date().toISOString()
    };

    orders.push(newOrder);
    writeOrders(orders);

    res.status(201).json({ message: 'Order placed successfully!', order: newOrder });
});

// Endpoint to submit a new SINGLE ITEM order (from booking.html)
app.post('/api/single-order', (req, res) => {
    console.log('POST /api/single-order - Received new single-item order:', req.body);
    const orders = readOrders();

    // We'll re-shape the data from booking.html to match our standard order format
    const newOrder = {
        tableNumber: req.body.tableNo,
        items: [{
            name: req.body.menuItem,
            quantity: parseInt(req.body.quantity, 10),
            price: 0 // Price is not available from this form, default to 0
        }],
        total: 0,
        gst: 0,
        grandTotal: 0,
        paymentMethod: 'Pay at Counter', // Assume this for single orders
        orderId: `ORD-${Date.now()}`,
        timestamp: new Date().toISOString()
    };
    orders.push(newOrder);
    writeOrders(orders);
    res.status(201).json({ message: 'Order placed successfully!', order: newOrder });
});

app.listen(PORT, () => {
    console.log(`Order server is running on http://localhost:${PORT}`);
    // Ensure the orders file exists
    if (!fs.existsSync(ordersFilePath)) {
        console.log('Creating empty customer-orders.json file.');
        writeOrders([]);
    }
});

// This is a simple in-memory/file-based server. For a production environment,
// you would want to use a database like MongoDB or PostgreSQL for more robust storage.