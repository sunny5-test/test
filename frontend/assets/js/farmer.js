document.addEventListener("DOMContentLoaded", () => {
    const dashboardSections = document.querySelectorAll(".dashboard-section");
    const navItems = document.querySelectorAll(".nav-item");
    const signoutBtn = document.getElementById("signoutBtn");
    const profileSummary = document.getElementById("profileSummary");

    let farmerId;

    // Check for user session and load initial data
    const user = JSON.parse(localStorage.getItem('agroChainUser'));
    if (!user || user.role !== 'farmer') {
        window.location.href = 'login.html';
        return;
    }
    farmerId = user.id;

    // Display profile summary in sidebar
    profileSummary.innerHTML = `
        <p><strong>${user.firstName}</strong></p>
        <p>Farmer</p>
    `;

    // Navigation logic
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const targetSectionId = e.target.getAttribute("data-section");

            navItems.forEach(nav => nav.classList.remove("active"));
            e.target.classList.add("active");

            dashboardSections.forEach(section => {
                section.classList.remove("active");
                if (section.id === targetSectionId) {
                    section.classList.add("active");
                    // Load data for the active section
                    loadSectionData(targetSectionId);
                }
            });
        });
    });

    // Initial data load for the default active section
    loadSectionData('overview');

    async function loadSectionData(sectionId) {
        switch (sectionId) {
            case 'overview':
                fetchOverviewData();
                break;
            case 'products':
                fetchProducts();
                break;
            case 'profile':
                fetchProfile();
                break;
        }
    }

    // Sign out functionality
    signoutBtn.addEventListener("click", () => {
        localStorage.removeItem("agroChainUser");
        window.location.href = "login.html";
    });

    // Overview section logic
    async function fetchOverviewData() {
        try {
            const res = await fetch(`http://localhost:3000/api/farmer/overview/${farmerId}`);
            if (!res.ok) throw new Error("Failed to fetch overview data");
            const data = await res.json();
            
            // Render metrics
            const metricsGrid = document.getElementById("overviewMetrics");
            metricsGrid.innerHTML = `
                <div class="metric-card">
                    <h4>Total Sells</h4>
                    <p>${data.totalSales}</p>
                </div>
                <div class="metric-card">
                    <h4>Overall Revenue</h4>
                    <p>₹${data.overallRevenue.toFixed(2)}</p>
                </div>
                <div class="metric-card">
                    <h4>Products in Inventory</h4>
                    <p>${data.productsInInventory}</p>
                </div>
            `;

            // Render recent sales
            const recentSalesTableBody = document.querySelector("#recentSalesList tbody");
            recentSalesTableBody.innerHTML = '';
            data.recentSales.forEach(sale => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${sale.product ? sale.product.name : 'N/A'}</td>
                    <td>${sale.quantity} ${sale.product ? sale.product.unit : ''}</td>
                    <td>${sale.dealer ? sale.dealer.firstName : 'N/A'}</td>
                    <td>${new Date(sale.date).toLocaleDateString()}</td>
                `;
                recentSalesTableBody.appendChild(row);
            });

            // Render most frequent buyers
            const frequentBuyersTableBody = document.querySelector("#frequentBuyersList tbody");
            frequentBuyersTableBody.innerHTML = '';
            data.frequentBuyers.forEach(buyer => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${buyer.name}</td>
                    <td>${buyer.orderCount}</td>
                `;
                frequentBuyersTableBody.appendChild(row);
            });

        } catch (err) {
            console.error(err);
        }
    }

    // Products section logic
    const addProductForm = document.getElementById("addProductForm");
    const productsList = document.getElementById("productsList");
    const addProductStatus = document.getElementById("addProductStatus");

    addProductForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const productName = document.getElementById("productName").value;
        const productImageInput = document.getElementById("productImage");
        const productPrice = document.getElementById("productPrice").value;
        const productQuantity = document.getElementById("productQuantity").value;
        const productUnit = document.getElementById("productUnit").value;
        
        // Form validation using DOM manipulation
        if (productName.length < 3) {
            return showMessage(addProductStatus, "Product name must be at least 3 characters.", "error");
        }
        if (productPrice <= 0 || productQuantity <= 0) {
            return showMessage(addProductStatus, "Price and quantity must be greater than 0.", "error");
        }
        
        const formData = new FormData();
        formData.append("farmerId", farmerId);
        formData.append("name", productName);
        formData.append("price", productPrice);
        formData.append("quantity", productQuantity);
        formData.append("unit", productUnit);
        
        // Append image only if one is selected
        if (productImageInput.files[0]) {
            formData.append("image", productImageInput.files[0]);
        }
        
        try {
            const res = await fetch(`http://localhost:3000/api/farmer/products`, {
                method: "POST",
                body: formData
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.msg);

            showMessage(addProductStatus, "Product added successfully!", "success");
            addProductForm.reset();
            fetchProducts();

        } catch (err) {
            console.error(err);
            showMessage(addProductStatus, "Failed to add product: " + err.message, "error");
        }
    });

    async function fetchProducts() {
        try {
            const res = await fetch(`http://localhost:3000/api/farmer/products/${farmerId}`);
            if (!res.ok) throw new Error("Failed to fetch products");
            const data = await res.json();
            
            productsList.innerHTML = '';
            if (data.length === 0) {
                productsList.innerHTML = "<p>You have no products listed.</p>";
            }

            data.forEach(product => {
                const productCard = document.createElement("div");
                productCard.classList.add("product-card");
                productCard.innerHTML = `
                    <img src="${product.imageURL}" alt="${product.name}">
                    <div class="product-card-content" data-product-id="${product._id}">
                        <h4>${product.name}</h4>
                        <p class="product-price">Price: ₹${product.price} per <span class="product-unit">${product.unit}</span></p>
                        <p class="product-quantity">Quantity: ${product.quantity} ${product.unit}</p>
                        <div class="product-actions">
                            <button class="edit-btn">Edit</button>
                            <button class="delete-btn">Delete</button>
                        </div>
                    </div>
                `;
                productsList.appendChild(productCard);
            });
            
            // Add event listeners for the new buttons
            productsList.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', editProduct);
            });
            productsList.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', deleteProduct);
            });
        } catch (err) {
            console.error(err);
            productsList.innerHTML = `<p class="error">Failed to load products.</p>`;
        }
    }

    // Function to handle delete, corrected with async/await
    async function deleteProduct(e) {
        const productId = e.target.closest('.product-card-content').dataset.productId;
        if (!confirm("Are you sure you want to delete this product?")) return;
        
        try {
            const res = await fetch(`http://localhost:3000/api/farmer/products/${productId}`, {
                method: "DELETE"
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.msg);

            alert("Product deleted successfully!");
            fetchProducts(); // Reload the product list
        } catch (err) {
            console.error(err);
            alert("Failed to delete product: " + err.message);
        }
    }

    // Function to handle inline editing
    function editProduct(e) {
        const productCardContent = e.target.closest('.product-card-content');
        const productId = productCardContent.dataset.productId;
        
        // Find current values
        const nameElement = productCardContent.querySelector('h4');
        const priceElement = productCardContent.querySelector('.product-price');
        const quantityElement = productCardContent.querySelector('.product-quantity');
        const unitElement = productCardContent.querySelector('.product-unit');
        
        const currentName = nameElement.textContent;
        const currentPrice = parseFloat(priceElement.textContent.split('₹')[1]);
        const currentQuantity = parseInt(quantityElement.textContent.split(':')[1]);
        const currentUnit = unitElement.textContent;
        
        // Replace text with input fields
        nameElement.innerHTML = `<input type="text" class="edit-input" value="${currentName}">`;
        priceElement.innerHTML = `Price: ₹<input type="number" class="edit-input" value="${currentPrice}" step="0.01"> per <span class="product-unit">${currentUnit}</span>`;
        quantityElement.innerHTML = `Quantity: <input type="number" class="edit-input" value="${currentQuantity}"> ${currentUnit}`;
        
        // Change buttons
        const actionsDiv = productCardContent.querySelector('.product-actions');
        actionsDiv.innerHTML = `
            <button class="save-btn">Save</button>
            <button class="cancel-btn">Cancel</button>
        `;

        // Add event listeners to new buttons
        actionsDiv.querySelector('.save-btn').addEventListener('click', () => saveProduct(productId, productCardContent));
        actionsDiv.querySelector('.cancel-btn').addEventListener('click', () => cancelEdit(productId, productCardContent, currentName, currentPrice, currentQuantity, currentUnit));
    }

    // Function to save the edited product
    async function saveProduct(productId, productCardContent) {
        const newName = productCardContent.querySelector('h4 input').value;
        const newPrice = productCardContent.querySelector('.product-price input').value;
        const newQuantity = productCardContent.querySelector('.product-quantity input').value;
        const newUnit = productCardContent.querySelector('.product-unit').textContent;
        
        const updateData = {
            name: newName,
            price: parseFloat(newPrice),
            quantity: parseInt(newQuantity),
            unit: newUnit
        };

        try {
            const res = await fetch(`http://localhost:3000/api/farmer/products/${productId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.msg);
            
            alert("Product updated successfully!");
            fetchProducts();
        } catch (err) {
            console.error(err);
            alert("Failed to update product: " + err.message);
            fetchProducts(); // Reload to revert changes
        }
    }

    // Function to cancel editing
    function cancelEdit(productId, productCardContent, originalName, originalPrice, originalQuantity, originalUnit) {
        // Revert the content to original state
        productCardContent.querySelector('h4').textContent = originalName;
        productCardContent.querySelector('.product-price').innerHTML = `Price: ₹${originalPrice} per <span class="product-unit">${originalUnit}</span>`;
        productCardContent.querySelector('.product-quantity').innerHTML = `Quantity: ${originalQuantity} ${originalUnit}`;
        
        // Revert the buttons
        const actionsDiv = productCardContent.querySelector('.product-actions');
        actionsDiv.innerHTML = `
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        `;
        
        // Re-add event listeners
        actionsDiv.querySelector('.edit-btn').addEventListener('click', editProduct);
        actionsDiv.querySelector('.delete-btn').addEventListener('click', deleteProduct);
    }

    // Profile section logic
    const profileForm = document.getElementById("profileForm");
    const profileStatus = document.getElementById("profileStatus");

    async function fetchProfile() {
        try {
            const res = await fetch(`http://localhost:3000/api/farmer/profile/${farmerId}`);
            if (!res.ok) throw new Error("Failed to fetch profile");
            const data = await res.json();
            
            document.getElementById("profileFirstName").value = data.firstName;
            document.getElementById("profileLastName").value = data.lastName || '';
            document.getElementById("profileEmail").value = data.email;
            document.getElementById("profileMobile").value = data.mobile || '';
            document.getElementById("profileAadhaar").value = data.aadhaar || '';
            document.getElementById("profileFarmLocation").value = data.farmLocation || '';
            document.getElementById("profileCropsGrown").value = data.cropsGrown.join(', ') || '';
            
        } catch (err) {
            console.error(err);
            showMessage(profileStatus, "Failed to load profile data.", "error");
        }
    }

    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            firstName: document.getElementById("profileFirstName").value,
            lastName: document.getElementById("profileLastName").value,
            mobile: document.getElementById("profileMobile").value,
            aadhaar: document.getElementById("profileAadhaar").value,
            farmLocation: document.getElementById("profileFarmLocation").value,
            cropsGrown: document.getElementById("profileCropsGrown").value.split(',').map(c => c.trim()),
        };
        
        // Validation for Aadhaar
        if (data.aadhaar && !/^\d{12}$/.test(data.aadhaar)) {
            return showMessage(profileStatus, "Aadhaar must be a 12-digit number.", "error");
        }
        
        try {
            const res = await fetch(`http://localhost:3000/api/farmer/profile/${farmerId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.msg);
            
            showMessage(profileStatus, "Profile updated successfully!", "success");
            // Update local storage and sidebar
            const updatedUser = { ...user, ...data };
            localStorage.setItem('agroChainUser', JSON.stringify(updatedUser));
            profileSummary.innerHTML = `
                <p><strong>${updatedUser.firstName}</strong></p>
                <p>Farmer</p>
            `;
            
        } catch (err) {
            console.error(err);
            showMessage(profileStatus, "Failed to update profile: " + err.message, "error");
        }
    });

    // Helper function to display messages
    function showMessage(element, msg, type) {
        element.textContent = msg;
        element.className = `message ${type}`;
        setTimeout(() => element.textContent = '', 5000);
    }
});     