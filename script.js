// Function to add product to the table
function addProduct() {
    let name = document.getElementById("productName").value;
    let price = document.getElementById("productPrice").value;
    let quantity = document.getElementById("productQuantity").value;

    if (name === "" || price === "" || quantity === "") {
        alert("Please fill all fields!");
        return;
    }

    let table = document.getElementById("productTable");
    let row = table.insertRow();
    row.innerHTML = `
        <td>${name}</td>
        <td>$${price}</td>
        <td>${quantity}</td>
        <td><button class="delete-btn" onclick="deleteProduct(this)">Delete</button></td>
    `;

    // Clear input fields
    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productQuantity").value = "";
}

// Function to delete product from the table
function deleteProduct(btn) {
    let row = btn.parentElement.parentElement;
    row.remove();
}
