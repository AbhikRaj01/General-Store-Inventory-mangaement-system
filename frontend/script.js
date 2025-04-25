// Storage Functions
function loadInventory() {
    return JSON.parse(localStorage.getItem("inventory")) || [];
}

function saveInventory(inventory) {
    localStorage.setItem("inventory", JSON.stringify(inventory));
}

function loadOrders() {
    return JSON.parse(localStorage.getItem("orders")) || [];
}

function saveOrders(orders) {
    localStorage.setItem("orders", JSON.stringify(orders));
}

// Product Functions
function displayInventory() {
    const inventory = loadInventory();
    const tableBody = document.getElementById("productTable");
    
    if (!tableBody) return;
    
    tableBody.innerHTML = inventory.map((product, index) => `
        <tr>
            <td>${product.name}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.quantity}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${index})">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function addProduct() {
    const name = document.getElementById("productName").value.trim();
    const price = parseFloat(document.getElementById("productPrice").value);
    const quantity = parseInt(document.getElementById("productQuantity").value);
    
    // Validate inputs
    let isValid = true;
    document.getElementById("productName").classList.remove("is-invalid");
    document.getElementById("productPrice").classList.remove("is-invalid");
    document.getElementById("productQuantity").classList.remove("is-invalid");
    
    if (!name || name.length < 3) {
        document.getElementById("productName").classList.add("is-invalid");
        isValid = false;
    }
    
    if (isNaN(price) || price <= 0) {
        document.getElementById("productPrice").classList.add("is-invalid");
        isValid = false;
    }
    
    if (isNaN(quantity) || quantity < 1) {
        document.getElementById("productQuantity").classList.add("is-invalid");
        isValid = false;
    }
    
    if (!isValid) return;

    // Process valid product
    const inventory = loadInventory();
    const existingProduct = inventory.find(p => p.name.toLowerCase() === name.toLowerCase());
    
    if (existingProduct) {
        existingProduct.quantity += quantity;
    } else {
        inventory.push({ name, price, quantity });
    }
    
    saveInventory(inventory);
    displayInventory();
    
    // Clear form
    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productQuantity").value = "";
}

function deleteProduct(index) {
    const inventory = loadInventory();
    inventory.splice(index, 1);
    saveInventory(inventory);
    displayInventory();
}

function searchProducts() {
    const searchQuery = document.getElementById("searchBar").value.trim().toLowerCase();
    const inventory = loadInventory();
    const tableBody = document.getElementById("productTable");
    
    if (!tableBody) return;
    
    const filtered = inventory.filter(product => 
        product.name.toLowerCase().includes(searchQuery)
    );
    
    tableBody.innerHTML = filtered.map((product, index) => `
        <tr>
            <td>${product.name}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.quantity}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${inventory.indexOf(product)})">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Order Functions
function displayOrders() {
    const orders = loadOrders();
    const tableBody = document.getElementById("orderTable");
    
    if (!tableBody) return;
    
    if (orders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">No orders found</td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = orders.map(order => `
        <tr>
            <td>${order.name || order.productName}</td>
            <td>${order.quantity}</td>
            <td><span class="badge bg-${order.status === 'Confirmed' ? 'success' : 'warning'}">${order.status}</span></td>
            <td>${new Date(order.timestamp || order.date).toLocaleString()}</td>
        </tr>
    `).join('');
}

function placeOrder() {
    const orderName = document.getElementById("orderName").value.trim();
    const orderQuantity = parseInt(document.getElementById("orderQuantity").value);
    
    // Reset validation
    document.getElementById("orderName").classList.remove("is-invalid");
    document.getElementById("orderQuantity").classList.remove("is-invalid");
    
    // Validate
    let isValid = true;
    if (!orderName) {
        document.getElementById("orderName").classList.add("is-invalid");
        isValid = false;
    }
    if (isNaN(orderQuantity) || orderQuantity < 1) {
        document.getElementById("orderQuantity").classList.add("is-invalid");
        isValid = false;
    }
    if (!isValid) return;

    // Process order
    const inventory = loadInventory();
    const orders = loadOrders();
    const product = inventory.find(p => p.name.toLowerCase() === orderName.toLowerCase());
    
    if (!product) {
        alert(`Product "${orderName}" not found in inventory!`);
        return;
    }
    
    if (product.quantity < orderQuantity) {
        alert(`Only ${product.quantity} ${product.name}(s) available!`);
        return;
    }
    
    // Update inventory
    product.quantity -= orderQuantity;
    saveInventory(inventory);
    
    // Create order
    const newOrder = {
        id: Date.now().toString(),
        name: product.name,
        productName: product.name, // For backward compatibility
        quantity: orderQuantity,
        price: product.price,
        totalPrice: (product.price * orderQuantity).toFixed(2),
        status: "Confirmed",
        timestamp: new Date().toISOString(),
        date: new Date().toISOString() // For backward compatibility
    };
    
    // Save order
    orders.push(newOrder);
    saveOrders(orders);
    
    // Update UI
    displayInventory();
    displayOrders();
    
    // Clear form
    document.getElementById("orderName").value = "";
    document.getElementById("orderQuantity").value = "";
}

// Data Reset Functions
function resetAllData() {
    if (confirm("WARNING: This will delete ALL data. Continue?")) {
        localStorage.removeItem("inventory");
        localStorage.removeItem("orders");
        
        if (document.getElementById("productTable")) {
            displayInventory();
        }
        if (document.getElementById("orderTable")) {
            displayOrders();
        }
        
        alert("All data has been reset!");
    }
}

function createSampleData() {
    const sampleInventory = [
        { name: "Laptop", price: 999, quantity: 10 },
        { name: "Mouse", price: 25, quantity: 50 },
        { name: "Keyboard", price: 45, quantity: 30 }
    ];
    
    const sampleOrders = [
        {
            id: "1",
            name: "Laptop",
            quantity: 1,
            price: 999,
            status: "Confirmed",
            timestamp: new Date(Date.now() - 86400000).toISOString() // Yesterday
        },
        {
            id: "2",
            name: "Mouse",
            quantity: 2,
            price: 25,
            status: "Confirmed",
            timestamp: new Date().toISOString() // Today
        }
    ];
    
    localStorage.setItem("inventory", JSON.stringify(sampleInventory));
    localStorage.setItem("orders", JSON.stringify(sampleOrders));
    
    displayInventory();
    displayOrders();
    alert("Sample data created!");
}

// Initialize all pages
document.addEventListener("DOMContentLoaded", function() {
    // Initialize products page
    if (document.getElementById("productTable")) {
        displayInventory();
        
        // Set up product form
        document.getElementById("addProductForm")?.addEventListener("submit", function(e) {
            e.preventDefault();
            addProduct();
        });
        
        // Set up search
        document.getElementById("searchBar")?.addEventListener("input", searchProducts);
    }
    
    // Initialize orders page
    if (document.getElementById("orderTable")) {
        displayOrders();
        
        // Set up order button
        document.getElementById("placeOrderBtn")?.addEventListener("click", placeOrder);
        
        // Clear validation on input
        document.getElementById("orderName")?.addEventListener("input", function() {
            this.classList.remove("is-invalid");
        });
        
        document.getElementById("orderQuantity")?.addEventListener("input", function() {
            this.classList.remove("is-invalid");
        });
    }
    
    // Auto-create sample data if empty (for testing)
    if ((!localStorage.getItem("inventory") || JSON.parse(localStorage.getItem("inventory")).length === 0) &&
        window.location.pathname.includes("products.html")) {
        if (confirm("No inventory found. Create sample data?")) {
            createSampleData();
        }
    }
});