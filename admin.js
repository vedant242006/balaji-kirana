function renderAdminEditor() {
  const container = document.getElementById("adminItemEditor");
  container.innerHTML = "";
  predefinedItems.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "price-row";
    row.innerHTML = `
      <input type="text" value="${item.name}" onchange="updateItemName(${index}, this.value)" />
      <select onchange="updateItemUnit(${index}, this.value)">
        <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>kg</option>
        <option value="g" ${item.unit === 'g' ? 'selected' : ''}>g</option>
        <option value="litre" ${item.unit === 'litre' ? 'selected' : ''}>litre</option>
        <option value="ml" ${item.unit === 'ml' ? 'selected' : ''}>ml</option>
        <option value="piece" ${item.unit === 'piece' ? 'selected' : ''}>piece</option>
      </select>
      <input type="number" value="${item.price}" onchange="updateItemPrice(${index}, this.value)" />
      <button class="delete-btn" onclick="deleteItem(${index})">🗑️</button>
    `;
    container.appendChild(row);
  });
}
function updateItemName(index, value) {
  predefinedItems[index].name = value.trim();
  saveItemUpdates();
}
function updateItemUnit(index, value) {
  predefinedItems[index].unit = value;
  saveItemUpdates();
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
function deleteItem(index) {
  if (!confirm("❗ Are you sure you want to delete this item?")) return;
  predefinedItems.splice(index, 1);
  saveItemUpdates();
  renderAdminEditor();
}
function addNewItem() {
  const name = document.getElementById("newItemName").value.trim();
  const unit = document.getElementById("newItemUnit").value;
  const price = parseFloat(document.getElementById("newItemPrice").value);
  if (!name || isNaN(price)) {
    alert("⚠️ Please enter valid item name and price.");
    return;
  }
  predefinedItems.push({ name, unit, price });
  saveItemUpdates();
  document.getElementById("newItemName").value = "";
  document.getElementById("newItemPrice").value = "";
  renderAdminEditor();
}
function saveItemUpdates() {
  localStorage.setItem("itemPrices", JSON.stringify(predefinedItems));
  alert("✅ Item list updated successfully!");
}
const correctPin = "ved123"; // Change this to your desired PIN
function verifyPin() {
  const input = document.getElementById("adminPinInput").value;
  if (input === correctPin) {
    document.getElementById("authModal").style.display = "none";
    showToast("✅ Admin Access Granted!");
  } else {
    alert("❌ Wrong PIN. Access Denied!");
  }
}
function encryptData(data) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}
function decryptData(data) {
  return JSON.parse(decodeURIComponent(escape(atob(data))));
}
renderAdminEditor();
