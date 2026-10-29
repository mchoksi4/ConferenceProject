// This page uses the same conferenceSessions JSON storage as sessions.html.
let sessions = [];
let cart = [];

function message(text, success) {
  $("#message")
    .text(text)
    .removeClass("d-none alert-success alert-danger")
    .addClass(success ? "alert-success" : "alert-danger");
}

function saveData() {
  localStorage.setItem("conferenceSessions", JSON.stringify(sessions));
  localStorage.setItem("conferenceCart", JSON.stringify(cart));
}

function money(price) {
  if (price === undefined || price === null || price === "") {
    return "$0.00";
  }

  let amount = Number(price);

  if (isNaN(amount)) {
    return "$0.00";
  }

  return "$" + Number(price).toFixed(2);
}

// jQuery searches the JSON-backed session collection.
function showSessions() {
  const search = $("#search").val().toLowerCase();
  const table = $("#availableSessions").empty();

  sessions
    .filter(function (s) {
      return (
        s.id +
        " " +
        s.description +
        " " +
        s.category +
        " " +
        s.format +
        " " +
        s.speaker
      )
        .toLowerCase()
        .includes(search);
    })
    .forEach(function (s) {
      const row = $("<tr>");

      [s.id, s.description, s.category, s.format, money(s.price)].forEach(
        function (value) {
          row.append($("<td>").text(value));
        },
      );

      const button = $("<button>")
        .addClass("btn btn-primary btn-sm")
        .text("Add to Cart")
        .on("click", function () {
          addToCart(s.id);
        });

      row.append($("<td>").append(button));
      table.append(row);
    });

  if (!table.children().length) {
    table.append(
      $("<tr>").append($("<td colspan='6'>").text("No matching sessions.")),
    );
  }
}

function showCart() {
  const table = $("#cartItems").empty();
  let total = 0;

  cart.forEach(function (id) {
    const session = sessions.find(function (s) {
      return s.id === id;
    });

    if (!session) return;

    total += Number(session.price);

    const row = $("<tr>");

    row.append($("<td>").text(session.description));
    row.append($("<td>").text(money(session.price)));

    const remove = $("<button>")
      .addClass("btn btn-outline-danger btn-sm")
      .text("Remove")
      .on("click", function () {
        removeFromCart(id);
      });

    row.append($("<td>").append(remove));
    table.append(row);
  });

  if (!table.children().length) {
    table.append(
      $("<tr>").append($("<td colspan='3'>").text("Your cart is empty.")),
    );
  }

  $("#total").text(money(total));
}

function addToCart(id) {
  if (cart.includes(id)) {
    message("This session is already in your cart.", false);
    return;
  }

  cart.push(id);
  saveData();
  showCart();
  message("Session added to cart!", true);
}

function removeFromCart(id) {
  cart = cart.filter(function (item) {
    return item !== id;
  });

  saveData();
  showCart();
  message("Session removed from cart.", true);
}

$("#search").on("input", showSessions);

// Validate new session details before storing them as JSON.
$("#productForm").on("submit", function (event) {
  event.preventDefault();

  const id = $("#sessionId").val().trim();
  const description = $("#title").val().trim();
  const category = $("#category").val();
  const format = $("#format").val();
  const priceText = $("#price").val();
  const price = Number(priceText);

  if (
    !id ||
    !description ||
    !category ||
    !format ||
    priceText === "" ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    message(
      "Please fill in all required fields and enter a valid price.",
      false,
    );
    return;
  }

  if (
    sessions.some(function (s) {
      return s.id === id;
    })
  ) {
    message("That Session ID already exists.", false);
    return;
  }

  sessions.push({
    id: id,
    description: description,
    category: category,
    format: format,
    price: price,
    speaker: $("#speaker").val().trim(),
  });

  saveData();
  showSessions();
  this.reset();

  message("New session saved successfully!", true);
});

function cartJSON() {
  const items = cart
    .map(function (id) {
      return sessions.find(function (s) {
        return s.id === id;
      });
    })
    .filter(Boolean);

  return {
    items: items,
    total: items.reduce(function (sum, s) {
      return sum + Number(s.price);
    }, 0),
  };
}

$("#downloadButton").on("click", function () {
  const file = new Blob([JSON.stringify(cartJSON(), null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = "conference-cart.json";
  link.click();

  URL.revokeObjectURL(url);
});

$("#sendButton").on("click", function () {
  if (cart.length === 0) {
    message("Add a session before submitting your cart.", false);
    return;
  }

  const json = JSON.stringify(cartJSON());

  $.ajax({
    url: "/api/cart",
    type: "POST",
    contentType: "application/json",
    data: json,

    success: function () {
      message("Cart submitted successfully!", true);
    },

    error: function (xhr, status, error) {
      console.log("AJAX request attempted:", status, error);
      console.log("Cart JSON:", json);

      message(
        "Cart data is ready. The API will be connected in a future assignment.",
        true,
      );
    },
  });
});

// Fix issues with different session formats for loading previous data.
function fixSessionData(data) {
  return data.map(function (s) {
    return {
      id: s.id || s.sessionId,
      description: s.description || s.sessionTitle,
      category: s.category || s.sessionCategory,
      format: s.format || s.sessionFormat,
      price: s.price === undefined ? 0 : Number(s.price),
      speaker: s.speaker || s.sessionInfo || "",
    };
  });
}

// Load existing changes, or start with the sessions.json document.
const savedSessions = localStorage.getItem("conferenceSessions");
const savedCart = localStorage.getItem("conferenceCart");

try {
  if (savedCart) cart = JSON.parse(savedCart);
  if (!Array.isArray(cart)) cart = [];
} catch (error) {
  cart = [];
}

if (savedSessions !== null) {
  try {
    sessions = fixSessionData(JSON.parse(savedSessions));

    if (!Array.isArray(sessions)) {
      throw new Error("Invalid sessions");
    }

    showSessions();
    showCart();
  } catch (error) {
    message("Saved session data is invalid.", false);
  }
} else {
  $.getJSON("sessions.json", function (data) {
    sessions = fixSessionData(data);
    showSessions();
    showCart();
  }).fail(function () {
    message(
      "Could not load sessions.json. Open this page using VS Code Live Server.",
      false,
    );
  });
}
