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
    
    const filteredOrders = orders
        .filter(order => {
            const orderDate = new Date(order.timestamp || order.date);
            return orderDate >= startDate && orderDate <= endDate;
        })
        .map(order => normalizeOrder(order, inventory));

    // Group products by ID if available, otherwise by name+brand
    const productGroups = {};
    filteredOrders.forEach(order => {
        const key = order.productId || `${order.name}-${order.brand}`.toLowerCase();
        productGroups[key] = productGroups[key] || {
            displayName: order.name,
            brand: order.brand,
            quantity: 0,
            revenue: 0
        };
        productGroups[key].quantity += order.quantity;
        productGroups[key].revenue += (order.price * order.quantity);
    });

    const sortedProducts = Object.values(productGroups)
        .sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = sortedProducts.reduce((sum, p) => sum + p.revenue, 0);
    const totalOrders = filteredOrders.length;

    return {
        metrics: {
            totalOrders,
            totalRevenue,
            avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            topProduct: sortedProducts[0] ? 
                `${sortedProducts[0].displayName} (${sortedProducts[0].brand}) - $${sortedProducts[0].revenue.toFixed(2)}` : 
                "No products sold"
        },
        productsData: sortedProducts,
        orders: filteredOrders
    };
}

function normalizeOrder(order, inventory) {
    // First try to get the full product details from inventory
    let productName = order.productName || order.name || "Unknown";
    let brand = "Unknown";
    let price = order.price || 0;

    // Try matching by ID first (most reliable)
    if (order.productId) {
        const inventoryProduct = inventory.find(p => p.id === order.productId);
        if (inventoryProduct) {
            productName = inventoryProduct.name;
            brand = inventoryProduct.brand || "Generic";
            price = inventoryProduct.price;
        }
    }
    
    // If still not found, try matching by name
    if (productName === "Unknown" || brand === "Unknown") {
        const inventoryProduct = inventory.find(p => 
            p.name && p.name.toLowerCase() === (order.productName || order.name || "").toLowerCase()
        );
        if (inventoryProduct) {
            productName = inventoryProduct.name;
            brand = inventoryProduct.brand || "Generic";
            price = inventoryProduct.price;
        }
    }

    return {
        ...order,
        name: productName,
        brand: brand,
        price: price,
        status: order.status || "Confirmed"
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
            labels: topProducts.map(p => {
                // Ensure we never show "Unknown" if we have a brand
                if (p.displayName === "Unknown" && p.brand !== "Unknown") {
                    return `Product (${p.brand})`;
                }
                return `${p.displayName} (${p.brand})`;
            }),
            datasets: [{
                label: 'Revenue ($)',
                data: topProducts.map(p => p.revenue),
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => `$${ctx.raw.toFixed(2)} (${productsData[ctx.dataIndex].quantity} sold)`
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
        // Fallback display logic
        let displayName = order.name;
        if (order.name === "Unknown" && order.brand !== "Unknown") {
            displayName = `Product (${order.brand})`;
        }

        const orderEl = document.createElement('div');
        orderEl.className = 'recent-order mb-3 p-3 border-bottom';
        orderEl.innerHTML = `
            <div class="d-flex justify-content-between">
                <div>
                    <strong>${displayName}</strong>
                    ${order.brand && order.brand !== "Unknown" ? 
                      `<span class="text-muted ms-2">(${order.brand})</span>` : ''}
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