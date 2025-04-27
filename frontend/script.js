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
            <td>${product.id || 'N/A'}</td>
            <td>${product.name}</td>
            <td>${product.brand || 'Generic'}</td>
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
    // Get input values
    const id = document.getElementById("productId").value.trim();
    const name = document.getElementById("productName").value.trim();
    const brand = document.getElementById("productBrand").value.trim();
    const price = parseFloat(document.getElementById("productPrice").value);
    const quantity = parseInt(document.getElementById("productQuantity").value);

    // Reset validation errors
    document.getElementById("productId").classList.remove("is-invalid");
    document.getElementById("productName").classList.remove("is-invalid");
    document.getElementById("productPrice").classList.remove("is-invalid");
    document.getElementById("productQuantity").classList.remove("is-invalid");

    // Validate Product ID (min 3 chars, alphanumeric)
    if (!id || id.length < 3 || !/^[a-zA-Z0-9-]+$/.test(id)) {
        document.getElementById("productId").classList.add("is-invalid");
        alert("❌ Product ID must be at least 3 characters (letters/numbers/hyphens only)");
        return;
    }

    // Validate Product Name (min 3 chars)
    if (!name || name.length < 3) {
        document.getElementById("productName").classList.add("is-invalid");
        alert("❌ Product Name must be at least 3 characters");
        return;
    }

    // Validate Price (must be > 0)
    if (isNaN(price) || price <= 0) {
        document.getElementById("productPrice").classList.add("is-invalid");
        alert("❌ Price must be greater than $0");
        return;
    }

    // Validate Quantity (must be ≥ 1)
    if (isNaN(quantity) || quantity < 1) {
        document.getElementById("productQuantity").classList.add("is-invalid");
        alert("❌ Quantity must be at least 1");
        return;
    }

    // Check inventory
    const inventory = loadInventory();
    const existingProductIndex = inventory.findIndex(p => p.id.toLowerCase() === id.toLowerCase());
    
    if (existingProductIndex !== -1) {
        // Product exists - update quantity
        const existingProduct = inventory[existingProductIndex];
        
        // Check if other details match (optional)
        if (existingProduct.name !== name || existingProduct.brand !== brand || existingProduct.price !== price) {
            if (!confirm(`⚠️ Product with ID ${id} exists but has different details. Update all fields?`)) {
                return;
            }
        }
        
        // Update the existing product
        inventory[existingProductIndex] = {
            id,
            name,
            brand,
            price,
            quantity: existingProduct.quantity + quantity
        };
        
        saveInventory(inventory);
        displayInventory();
        
        // Clear form
        document.getElementById("productId").value = "";
        document.getElementById("productName").value = "";
        document.getElementById("productBrand").value = "";
        document.getElementById("productPrice").value = "";
        document.getElementById("productQuantity").value = "";

        alert(`✅ Updated existing product "${name}". New quantity: ${inventory[existingProductIndex].quantity}`);
    } else {
        // Add as new product
        inventory.push({ id, name, brand, price, quantity });
        saveInventory(inventory);
        displayInventory();

        // Clear form
        document.getElementById("productId").value = "";
        document.getElementById("productName").value = "";
        document.getElementById("productBrand").value = "";
        document.getElementById("productPrice").value = "";
        document.getElementById("productQuantity").value = "";

        alert("✅ Product added successfully!");
    }
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
    
    if (!searchQuery) {
        // If search is empty, show all products
        displayInventory();
        return;
    }
    
    const filtered = inventory.filter(product => 
        (product.name && product.name.toLowerCase().includes(searchQuery)) ||
        (product.brand && product.brand.toLowerCase().includes(searchQuery)) ||
        (product.id && product.id.toLowerCase().includes(searchQuery))
    );
    
    tableBody.innerHTML = filtered.map((product, index) => `
        <tr>
            <td>${product.id || 'N/A'}</td>
            <td>${product.name || 'Unnamed'}</td>
            <td>${product.brand || 'Generic'}</td>
            <td>$${(product.price || 0).toFixed(2)}</td>
            <td>${product.quantity || 0}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${index})">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Add this new function to handle Enter key in search:
document.getElementById("searchBar")?.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        searchProducts();
    }
});

function displayOrders() {
    const orders = loadOrders();
    const tableBody = document.getElementById("orderTable");
    
    if (!tableBody) return;
    
    if (orders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">No orders found</td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = orders.map(order => `
        <tr>
            <td>${order.productId || 'N/A'}</td>
            <td>${order.productName || 'N/A'}</td>
            <td>${order.brand || 'Generic'}</td>
            <td>${order.quantity || 0}</td>
            <td>$${(order.price || 0).toFixed(2)}</td>
            <td>$${(order.quantity * order.price || 0).toFixed(2)}</td>
            <td><span class="badge bg-${order.status === 'Confirmed' ? 'success' : 'warning'}">${order.status || 'Pending'}</span></td>
            <td>${order.timestamp ? new Date(order.timestamp).toLocaleString() : 'N/A'}</td>
        </tr>
    `).join('');
}

function placeOrder() {
    const productId = document.getElementById("productId").value.trim();
    const orderQuantity = parseInt(document.getElementById("orderQuantity").value);

    // Reset validation
    document.getElementById("productId").classList.remove("is-invalid");
    document.getElementById("orderQuantity").classList.remove("is-invalid");

    // Validate
    let isValid = true;
    if (!productId) {
        document.getElementById("productId").classList.add("is-invalid");
        isValid = false;
    }
    if (isNaN(orderQuantity) || orderQuantity < 1) {
        document.getElementById("orderQuantity").classList.add("is-invalid");
        isValid = false;
    }
    if (!isValid) return;

    // Find product by ID
    const inventory = loadInventory();
    const product = inventory.find(p => p.id.toLowerCase() === productId.toLowerCase());

    if (!product) {
        alert(`❌ Product with ID "${productId}" not found!`);
        return;
    }
    
    if (product.quantity < orderQuantity) {
        alert(`❌ Only ${product.quantity} available for ${product.name} (${product.brand})!`);
        return;
    }

    // Update inventory
    product.quantity -= orderQuantity;
    saveInventory(inventory);

    // Create new order with ALL required fields
    const newOrder = {
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        price: product.price,
        quantity: orderQuantity,
        status: "Confirmed",
        timestamp: new Date().toISOString()
    };

    // Save order
    const orders = loadOrders();
    orders.push(newOrder);
    saveOrders(orders);

    // Update UI
    displayInventory();
    displayOrders();

    // Clear form
    document.getElementById("productId").value = "";
    document.getElementById("orderQuantity").value = "";

    alert(`✅ Ordered ${orderQuantity}x ${product.name} (${product.brand})`);
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