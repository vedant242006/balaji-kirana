let customers = JSON.parse(localStorage.getItem("customers")) || [];
let currentCustomerIndex = null;
// predefinedItems comes from predefine.js
const savedPrices = JSON.parse(localStorage.getItem("itemPrices"));
if (savedPrices) predefinedItems = savedPrices;

window.addEventListener("storage", function (e) {
  if (e.key === "itemPrices") {
    const updatedPrices = JSON.parse(localStorage.getItem("itemPrices")) || [];
    predefinedItems.splice(0, predefinedItems.length, ...updatedPrices);
    populatePredefinedItems();
    renderPriceManager();
    showToast("🔄 Item prices updated from Admin Panel!");
  }
});

function saveToStorage() {
  localStorage.setItem("customers", JSON.stringify(customers));
}

function validateAddCustomer() {
  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  document.getElementById("addCustomerBtn").disabled = !(name && phone);
}

function addCustomer() {
  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();

  if (!name || !phone) {
    showToast("⚠️ Please enter both Name and Phone Number!");
    return;
  }

  customers.push({ name, phone, credits: [], payments: [] });
  saveToStorage();
  updateCustomerList();
  renderCustomers();
  showToast("✅ Customer added!");

  document.getElementById("customerName").value = "";
  document.getElementById("customerPhone").value = "";
  validateAddCustomer(); // Disable button again
}

function updateCustomerList() {
  const list = document.getElementById("customerList");
  list.innerHTML = "";
  customers.forEach((cust, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${cust.name} (${cust.phone})`;
    list.appendChild(option);
  });
}

function renderCustomers() {
  const container = document.getElementById("customersContainer");
  container.innerHTML = "";
  customers.forEach((cust, index) => {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = `${cust.name} (${cust.phone})`;

    const addBtn = document.createElement("button");
    addBtn.textContent = "+ Add Item";
    addBtn.onclick = () => openItemModal(index);

    const payBtn = document.createElement("button");
    payBtn.textContent = "💰 Add Payment";
    payBtn.onclick = () => openPaymentModal(index);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️ Delete";
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = () => deleteCustomer(index);

    const table = document.createElement("table");
    table.innerHTML = `<thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Price</th><th>Total</th></tr></thead>`;
    const tbody = document.createElement("tbody");

    let visibleLimit = cust.showAll ? cust.credits.length : 3;
    let total = 0;

    cust.credits.forEach((credit, cIndex) => {
      if (cIndex < visibleLimit) {
        const row = document.createElement("tr");
       row.innerHTML = `
  <td><input type="text" value="${credit.item}" onchange="updateCreditItem(${index}, ${cIndex}, 'item', this.value)" /></td>
  <td><input type="number" value="${credit.quantity}" onchange="updateCreditItem(${index}, ${cIndex}, 'quantity', this.value)" /></td>
  <td>${credit.unit}</td>
  <td><input type="number" value="${credit.price}" onchange="updateCreditItem(${index}, ${cIndex}, 'price', this.value)" /></td>
  <td>₹${credit.total.toFixed(2)}</td>
  <td><button class="delete-btn" onclick="deleteCreditItem(${index}, ${cIndex})">❌</button></td>
`;

        tbody.appendChild(row);
      }
      total += credit.total;
    });

    table.appendChild(tbody);

    if (cust.credits.length > 3) {
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "toggle-btn";
      toggleBtn.textContent = cust.showAll ? "Show Less" : `Show More (${cust.credits.length - 3})`;
      toggleBtn.onclick = () => {
        customers[index].showAll = !customers[index].showAll;
        renderCustomers();
      };
      card.appendChild(toggleBtn);
    }

    const paymentTotal = cust.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = total - paymentTotal;

    const totalDiv = document.createElement("div");
    totalDiv.className = "total";
    totalDiv.innerHTML = `Credit: ₹${total.toFixed(2)} | Paid: ₹${paymentTotal.toFixed(2)} | <strong>Balance: ₹${balance.toFixed(2)}</strong>`;

    card.appendChild(title);
    card.appendChild(addBtn);
    card.appendChild(payBtn);
    card.appendChild(deleteBtn);
    card.appendChild(table);
    card.appendChild(totalDiv);
    container.appendChild(card);
  });
}

function deleteCustomer(index) {
  if (!confirm("Are you sure you want to delete this customer?")) return;
  customers.splice(index, 1);
  saveToStorage();
  updateCustomerList();
  renderCustomers();
}

function openItemModal(index) {
  currentCustomerIndex = index;
  document.getElementById("itemName").value = "";
  document.getElementById("itemQuantity").value = "";
  document.getElementById("itemPrice").value = "";
  document.getElementById("unitType").value = "kg";
  document.getElementById("predefinedItem").value = "";
  document.getElementById("itemEntryModal").style.display = "block";
}

function closeItemModal() {
  document.getElementById("itemEntryModal").style.display = "none";
}

function saveCreditItem() {
  const item = document.getElementById("itemName").value;
  const quantity = parseFloat(document.getElementById("itemQuantity").value);
  const unit = document.getElementById("unitType").value;
  let price = parseFloat(document.getElementById("itemPrice").value);

  if (!item || isNaN(quantity) || isNaN(price)) return;

  // Auto conversion for total calculation
  if (unit === "g") {
    price = price / 1000; // convert kg price → g price
  } else if (unit === "kg") {
    // price stays the same
  } else if (unit === "ml") {
    price = price / 1000; // convert litre price → ml price
  } else if (unit === "litre") {
    // price stays the same
  }

  const total = quantity * price;
  const date = new Date().toLocaleString();

  customers[currentCustomerIndex].credits.push({ item, quantity, unit, price, total, date });

  saveToStorage();
  closeItemModal();
  renderCustomers();
  showToast("✅ Item added!");
}


function openPaymentModal(index) {
  currentCustomerIndex = index;
  document.getElementById("paymentAmount").value = "";
  document.getElementById("paymentEntryModal").style.display = "block";
}

function closePaymentModal() {
  document.getElementById("paymentEntryModal").style.display = "none";
}

function savePaymentEntry() {
  const amount = parseFloat(document.getElementById("paymentAmount").value);
  if (isNaN(amount)) return;

  const date = new Date().toLocaleString();
  customers[currentCustomerIndex].payments.push({ amount, date });

  saveToStorage();
  closePaymentModal();
  renderCustomers();
  showToast("✅ Payment recorded!");
}

function retrieveCustomer() {
  const index = parseInt(document.getElementById("customerList").value);
  if (isNaN(index)) return;

  const cust = customers[index];
  const container = document.getElementById("retrievedContainer");
  container.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card";

  const header = document.createElement("div");
  header.className = "receipt-header";
  header.innerHTML = `
    <h2>🧾 Grocery Store Receipt</h2>
    <p><strong>Store Name:</strong>Balaji kirana<br>
    <strong>Address:</strong> Gandhi nagar akkalkot road solapur <br>
    <strong>Phone:</strong> +91-8975284112</p>
    <hr />
    <p><strong>Customer Name:</strong> ${cust.name}<br>
    <strong>Customer Phone:</strong> ${cust.phone}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
  `;

  const table = document.createElement("table");
  table.innerHTML = '<thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Price</th><th>Total</th></tr></thead>';
  const tbody = document.createElement("tbody");

  let total = 0;
  cust.credits.forEach(credit => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${credit.item}</td><td>${credit.quantity}</td><td>${credit.unit}</td><td>${credit.price}</td><td>${credit.total.toFixed(2)}</td>`;
    tbody.appendChild(row);
    total += credit.total;
  });

  table.appendChild(tbody);

  const paid = cust.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = total - paid;

  const summary = document.createElement("div");
  summary.className = "receipt-summary";
  summary.innerHTML = `
    <p><strong>Total Credit:</strong> ₹${total.toFixed(2)}</p>
    <p><strong>Paid:</strong> ₹${paid.toFixed(2)}</p>
    <p><strong>Balance:</strong> ₹${balance.toFixed(2)}</p>
  `;

  const footer = document.createElement("div");
  footer.className = "receipt-footer";
  footer.innerHTML = `<p>Thank you for shopping with us!</p>`;

  card.appendChild(header);
  card.appendChild(table);
  card.appendChild(summary);
  card.appendChild(footer);
  container.appendChild(card);
}

function sendReceiptToWhatsApp() {
  const index = parseInt(document.getElementById("customerList").value);
  if (isNaN(index)) return;

  const cust = customers[index];
  const total = cust.credits.reduce((sum, c) => sum + c.total, 0);
  const paid = cust.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = total - paid;

  let message = `Hi ${cust.name},\n🧾 Your Grocery Bill:\n`;
  cust.credits.forEach(credit => {
    message += `- ${credit.item}: ${credit.quantity} ${credit.unit} x ₹${credit.price} = ₹${credit.total.toFixed(2)}\n`;
  });
  message += `--------------------\nTotal: ₹${total.toFixed(2)}\nPaid: ₹${paid.toFixed(2)}\nBalance: ₹${balance.toFixed(2)}\nThank you for shopping!`;

  const phone = cust.phone.replace(/\D/g, '');
  const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

function downloadReceiptPDF() {
  window.print();
}

function populatePredefinedItems() {
  const select = document.getElementById("predefinedItem");
  select.innerHTML = `<option value="">Select Item</option>`;
  predefinedItems.forEach(item => {
    const option = document.createElement("option");
    option.value = item.name;
    option.textContent = item.name;
    select.appendChild(option);
  });
}

function onItemSelect() {
  const selectedName = document.getElementById("predefinedItem").value;
  const selectedItem = predefinedItems.find(i => i.name === selectedName);
  if (selectedItem) {
    document.getElementById("unitType").value = selectedItem.unit;
    document.getElementById("itemPrice").value = selectedItem.price;
    document.getElementById("itemName").value = selectedItem.name;
  }
}

function renderPriceManager() {
  const container = document.getElementById("priceManager");
  container.innerHTML = "";

  predefinedItems.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "price-row";
    div.innerHTML = `
      <label>${item.name} (${item.unit}) - ₹</label>
      <input type="number" value="${item.price}" onchange="updateItemPrice(${index}, this.value)" />
    `;
    container.appendChild(div);
  });
}

function updateItemPrice(index, newPrice) {
  const price = parseFloat(newPrice) || 0;
  predefinedItems[index].price = price;

  // Auto convert kg ↔ g
  if (predefinedItems[index].unit === "kg") {
    const gramItem = predefinedItems.find(i => i.name === predefinedItems[index].name && i.unit === "g");
    if (gramItem) gramItem.price = price / 1000;
  } else if (predefinedItems[index].unit === "g") {
    const kgItem = predefinedItems.find(i => i.name === predefinedItems[index].name && i.unit === "kg");
    if (kgItem) kgItem.price = price * 1000;
  }

  // Auto convert litre ↔ ml
  if (predefinedItems[index].unit === "litre") {
    const mlItem = predefinedItems.find(i => i.name === predefinedItems[index].name && i.unit === "ml");
    if (mlItem) mlItem.price = price / 1000;
  } else if (predefinedItems[index].unit === "ml") {
    const litreItem = predefinedItems.find(i => i.name === predefinedItems[index].name && i.unit === "litre");
    if (litreItem) litreItem.price = price * 1000;
  }
  localStorage.setItem("itemPrices", JSON.stringify(predefinedItems));
  populatePredefinedItems();
}

function backupData() {
  const data = {
    customers: JSON.parse(localStorage.getItem("customers")) || [],
    itemPrices: JSON.parse(localStorage.getItem("itemPrices")) || []
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `GroceryBackup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function restoreData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.customers && data.itemPrices) {
        localStorage.setItem("customers", JSON.stringify(data.customers));
        localStorage.setItem("itemPrices", JSON.stringify(data.itemPrices));
        alert("✅ Data restored successfully! Please reload the page.");
      } else {
        alert("⚠️ Invalid backup file.");
      }
    } catch (err) {
      alert("❌ Error reading backup file.");
    }
  };
  reader.readAsText(file);
}

function showToast(message, duration = 3000) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.background = "#007bff";
  toast.style.color = "white";
  toast.style.padding = "10px 20px";
  toast.style.borderRadius = "5px";
  toast.style.boxShadow = "0 0 5px rgba(0,0,0,0.3)";
  toast.style.zIndex = 1000;
  document.body.appendChild(toast);
  setTimeout(() => document.body.removeChild(toast), duration);
}

function saveItemUpdates() {
  localStorage.setItem("itemPrices", JSON.stringify(predefinedItems));
  if (typeof populatePredefinedItems === "function") {
    populatePredefinedItems();
  }
  if (typeof renderPriceManager === "function") {
    renderPriceManager();
  }
  showToast("✅ Item prices updated!");
}

function encryptData(data) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

function decryptData(data) {
  return JSON.parse(decodeURIComponent(escape(atob(data))));
}

function updateCreditItem(customerIndex, creditIndex, field, value) {
  const credit = customers[customerIndex].credits[creditIndex];
  if (field === 'item') credit.item = value;
  if (field === 'quantity') credit.quantity = parseFloat(value) || 0;
  if (field === 'price') credit.price = parseFloat(value) || 0;
  credit.total = credit.quantity * credit.price;
}

function saveAllCustomerData() {
  saveToStorage();
  renderCustomers();
  showToast("✅ All changes saved successfully!");
}
function deleteCreditItem(customerIndex, creditIndex) {
  if (!confirm("Are you sure you want to delete this item?")) return;

  customers[customerIndex].credits.splice(creditIndex, 1);
  saveToStorage();
  renderCustomers();
  showToast("🗑️ Item removed!");
}

// Initialize showAll property for all customers
customers.forEach(c => c.showAll = false);

// Initialize on page load
populatePredefinedItems();
updateCustomerList();
renderCustomers();
renderPriceManager();