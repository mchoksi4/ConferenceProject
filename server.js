
//
// BILLING AND RETURNS BACKEND
//

const crypto = require("crypto");

// JSON file locations
const ordersFile = path.join(
  __dirname,
  "billing-orders.json"
);

const returnsFile = path.join(
  __dirname,
  "return-requests.json"
);

// Read JSON records
function readArray(file) {

  if (!fs.existsSync(file)) {
    return [];
  }

  const data = JSON.parse(
    fs.readFileSync(file, "utf8")
  );

  if (!Array.isArray(data)) {
    throw new Error("Invalid JSON storage");
  }

  return data;
}

// Save JSON records
function writeArray(file, items) {

  fs.writeFileSync(
    file,
    JSON.stringify(items, null, 2)
  );

}


// ==========================================
// BILLING REST API - POST
// ==========================================

app.post("/api/billing", (req, res) => {

  const {
    fullName,
    email,
    address,
    paymentMethod,
    items
  } = req.body || {};

  // Validate billing information
  if (
    !fullName ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "") ||
    !address ||
    ![
      address.street,
      address.city,
      address.state,
      address.zip
    ].every(
      value =>
        typeof value === "string" &&
        value.trim()
    ) ||
    !paymentMethod ||
    paymentMethod.type !== "Demo card (not charged)" ||
    !/^\d{4}$/.test(paymentMethod.last4 || "") ||
    !Array.isArray(items) ||
    !items.length ||
    !items.every(item =>
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.price === "number" &&
      Number.isFinite(item.price) &&
      item.price >= 0
    )
  ) {

    return res.status(400).json({
      message: "Invalid billing or order information."
    });

  }

  // Prevent saving sensitive payment information
  if (
    "cardNumber" in req.body ||
    "securityCode" in req.body ||
    "cvv" in req.body
  ) {

    return res.status(400).json({
      message: "Do not send full payment credentials."
    });

  }

  try {

    const orders = readArray(ordersFile);

    // Create order JSON
    const order = {

      id: crypto.randomUUID(),

      fullName: String(fullName).trim(),

      email: String(email).trim(),

      address: address,

      paymentMethod: {
        type: paymentMethod.type,
        last4: paymentMethod.last4
      },

      items: items,

      total: Number(
        items.reduce(
          (sum, item) => sum + item.price,
          0
        ).toFixed(2)
      ),

      shipping: "Digital registration — no shipping",

      status: "demo_order",

      createdAt: new Date().toISOString()

    };

    // Save new order
    orders.push(order);

    writeArray(ordersFile, orders);

    // Return success message
    res.status(201).json({
      message: "Demo order saved. No payment was charged.",
      order: order
    });

  } catch (error) {

    res.status(500).json({
      message: "Unable to save demo order."
    });

  }

});


// ==========================================
// ORDERS REST API - GET
// ==========================================

app.get("/api/orders", (req, res) => {

  try {

    const orders = readArray(ordersFile);

    // Return order details for the Returns page
    const orderList = orders.map(order => ({

      id: order.id,

      fullName: order.fullName,

      items: order.items,

      total: order.total

    }));

    res.json(orderList);

  } catch (error) {

    res.status(500).json({
      message: "Unable to load orders."
    });

  }

});


// ==========================================
// RETURNS REST API - GET
// ==========================================

app.get("/api/returns", (req, res) => {

  try {

    const requests = readArray(returnsFile);

    res.json(requests);

  } catch (error) {

    res.status(500).json({
      message: "Unable to load return requests."
    });

  }

});


// ==========================================
// RETURNS REST API - POST
// ==========================================

app.post("/api/returns", (req, res) => {

  const {
    orderId,
    itemId,
    reason,
    condition,
    details
  } = req.body || {};

  // Validate return request
  if (
    !orderId ||
    !itemId ||
    typeof reason !== "string" ||
    !reason.trim() ||
    !["unused", "partially_used"].includes(condition) ||
    (
      details !== undefined &&
      (
        typeof details !== "string" ||
        details.length > 500
      )
    )
  ) {

    return res.status(400).json({
      message: "Provide an order, session, reason, and condition."
    });

  }

  try {

    // Find the original order
    const orders = readArray(ordersFile);

    const order = orders.find(
      order => order.id === orderId
    );

    // Find the session being returned
    const item = order && order.items.find(
      item => item.id === itemId
    );

    if (!item) {

      return res.status(404).json({
        message: "Order or session not found."
      });

    }

    const requests = readArray(returnsFile);

    // Prevent duplicate return requests
    const duplicate = requests.some(
      request =>
        request.orderId === orderId &&
        request.itemId === itemId
    );

    if (duplicate) {

      return res.status(409).json({
        message: "A return request already exists for this session."
      });

    }

    // Create return request JSON
    const request = {

      id: crypto.randomUUID(),

      orderId: orderId,

      itemId: itemId,

      productName: item.name,

      price: item.price,

      reason: reason.trim(),

      condition: condition,

      details: details || "",

      status: "pending",

      createdAt: new Date().toISOString()

    };

    // Save return request
    requests.push(request);

    writeArray(returnsFile, requests);

    // Return success response
    res.status(201).json({
      message: "Return request submitted.",
      request: request
    });

  } catch (error) {

    res.status(500).json({
      message: "Unable to save return request."
    });

  }

});


// ==========================================
// START NODE.JS SERVER
// ==========================================

app.listen(PORT, () => {

  console.log(
    `Conference server running at http://localhost:${PORT}`
  );

});
