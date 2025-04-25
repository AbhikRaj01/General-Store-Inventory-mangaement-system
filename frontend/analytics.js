// Initialize chart instances
let salesChart, productsChart;

document.addEventListener("DOMContentLoaded", function() {
    // Normalize historical data (run once)
    normalizeHistoricalData();
    
    // Initialize UI
    initDateRange();
    updateAnalytics();
    
    // Setup event listeners
    document.getElementById("refreshAnalytics").addEventListener("click", updateAnalytics);
});

function initDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Default 30-day range
    
    document.getElementById("startDate").valueAsDate = startDate;
    document.getElementById("endDate").valueAsDate = endDate;
}

function updateAnalytics() {
    showLoading(true);
    
    setTimeout(() => {
        const startDate = new Date(document.getElementById("startDate").value);
        const endDate = new Date(document.getElementById("endDate").value);
        
        const { metrics, productsData, orders } = processAnalyticsData(startDate, endDate);
        
        // Update metrics
        document.getElementById("totalOrders").textContent = metrics.totalOrders;
        document.getElementById("totalRevenue").textContent = `$${metrics.totalRevenue.toFixed(2)}`;
        document.getElementById("avgOrderValue").textContent = `$${metrics.avgOrderValue.toFixed(2)}`;
        document.getElementById("topProduct").textContent = metrics.topProduct;
        
        // Render charts
        renderSalesChart(orders);
        renderProductsChart(productsData);
        renderRecentOrders(orders);
        
        showLoading(false);
    }, 500);
}

function processAnalyticsData(startDate, endDate) {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
    
    // Filter by date range and normalize
    const filteredOrders = orders
        .filter(order => {
            const orderDate = new Date(order.timestamp || order.date);
            return orderDate >= startDate && orderDate <= endDate;
        })
        .map(order => normalizeOrder(order, inventory));
    
    // Group products case-insensitively
    const productGroups = {};
    filteredOrders.forEach(order => {
        const key = order.name.toLowerCase();
        productGroups[key] = productGroups[key] || {
            displayName: order.name,
            quantity: 0,
            revenue: 0
        };
        productGroups[key].quantity += order.quantity;
        productGroups[key].revenue += (order.price * order.quantity);
    });
    
    // Sort products by quantity sold
    const sortedProducts = Object.values(productGroups)
        .sort((a, b) => b.quantity - a.quantity);
    
    // Calculate metrics
    const totalRevenue = sortedProducts.reduce((sum, p) => sum + p.revenue, 0);
    const totalOrders = filteredOrders.length;
    
    return {
        metrics: {
            totalOrders,
            totalRevenue,
            avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            topProduct: sortedProducts[0] ? 
                `${sortedProducts[0].displayName} (${sortedProducts[0].quantity} sold)` : 
                "No products sold"
        },
        productsData: sortedProducts,
        orders: filteredOrders
    };
}

function normalizeOrder(order, inventory) {
    const productName = order.name ? order.name.trim() : "Unknown";
    const inventoryProduct = inventory.find(p => 
        p.name && p.name.toLowerCase() === productName.toLowerCase()
    );
    
    return {
        ...order,
        name: inventoryProduct ? inventoryProduct.name : productName,
        status: order.status === "Completed" ? "Confirmed" : order.status,
        price: inventoryProduct ? inventoryProduct.price : order.price || 0
    };
}

function normalizeHistoricalData() {
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    if (orders.some(o => o.status === "Completed" || !o.name)) {
        const inventory = JSON.parse(localStorage.getItem("inventory")) || [];
        const normalized = orders.map(o => normalizeOrder(o, inventory));
        localStorage.setItem("orders", JSON.stringify(normalized));
    }
}

function renderSalesChart(orders) {
    const ctx = document.getElementById('salesChart');
    const salesData = prepareSalesData(orders);
    
    if (salesChart) salesChart.destroy();
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: salesData.dates,
            datasets: [{
                label: 'Daily Sales ($)',
                data: salesData.amounts,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => `$${context.raw.toFixed(2)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => `$${value}`
                    }
                }
            }
        }
    });
}

function prepareSalesData(orders) {
    const dailySales = {};
    orders.forEach(order => {
        const date = new Date(order.timestamp || order.date).toLocaleDateString();
        dailySales[date] = (dailySales[date] || 0) + (order.price * order.quantity);
    });
    
    return {
        dates: Object.keys(dailySales).sort(),
        amounts: Object.keys(dailySales).sort().map(date => dailySales[date])
    };
}

function renderProductsChart(productsData) {
    const ctx = document.getElementById('productsChart');
    const topProducts = productsData.slice(0, 5);
    
    if (productsChart) productsChart.destroy();
    
    productsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topProducts.map(p => p.displayName),
            datasets: [{
                label: 'Units Sold',
                data: topProducts.map(p => p.quantity),
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderRecentOrders(orders) {
    const container = document.getElementById('recentOrders');
    container.innerHTML = '';
    
    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date))
        .slice(0, 10);
    
    if (recentOrders.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-3">No recent orders</div>';
        return;
    }
    
    recentOrders.forEach(order => {
        const orderEl = document.createElement('div');
        orderEl.className = 'recent-order';
        orderEl.innerHTML = `
            <div>
                <strong>${order.name}</strong>
                <div class="text-muted small">
                    ${new Date(order.timestamp || order.date).toLocaleString()}
                    <span class="badge bg-${order.status === 'Confirmed' ? 'success' : 'warning'} ms-2">
                        ${order.status}
                    </span>
                </div>
            </div>
            <div class="text-end">
                <div>${order.quantity} × $${order.price.toFixed(2)}</div>
                <strong>$${(order.quantity * order.price).toFixed(2)}</strong>
            </div>
        `;
        container.appendChild(orderEl);
    });
}

function showLoading(show) {
    document.querySelectorAll('.analytics-loading').forEach(el => {
        el.style.display = show ? 'flex' : 'none';
    });
}