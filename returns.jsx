
const { useState, useEffect } = React;

function ReturnsPage() {

  // React state variables
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [orderId, setOrderId] = useState("");
  const [itemId, setItemId] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  // Retrieve orders from Node.js
  function loadOrders() {

    $.ajax({

      url: "/api/orders",

      method: "GET",

      dataType: "json",

      success: function(data) {
        setOrders(data);
      },

      error: function() {

        setError(true);

        setMessage("Unable to load orders.");

      }

    });

  }

  // Load orders when the page opens
  useEffect(loadOrders, []);

  // Search orders by ID, attendee, or session
  const filtered = orders.filter(order =>

    (
      order.id + " " +
      order.fullName + " " +
      order.items.map(item => item.name).join(" ")
    )
      .toLowerCase()
      .includes(search.toLowerCase())

  );

  // Find the selected order
  const selected = orders.find(
    order => order.id === orderId
  );

  // Update selected order
  function chooseOrder(id) {

    setOrderId(id);
    setItemId("");

  }

  // Submit a refund request
  function submit(event) {

    event.preventDefault();

    // Validate required information
    if (
      !orderId ||
      !itemId ||
      !reason.trim() 
    ) {

      setError(true);

      setMessage(
        "Choose an order and session, then provide a reason for cancellation."
      );

      return;
    }

    setBusy(true);

    // AJAX POST request
    $.ajax({

      url: "/api/returns",

      method: "POST",

      contentType: "application/json",

      data: JSON.stringify({

        orderId: orderId,

        itemId: itemId,

        reason: reason.trim(),

        details: details.trim()

      }),

      success: function(data) {

        setError(false);

        setMessage(
          "Refund request submitted! Request ID: " +
          data.request.id
        );

        // Clear form values
        setReason("");
        setDetails("");

      },

      error: function(xhr) {

        setError(true);

        setMessage(
          xhr.responseJSON?.message ||
          "Unable to submit request."
        );

      },

      complete: function() {
        setBusy(false);
      }

    });

  }

  return (

    <div className="card commerce-card">

      <div className="card-body p-4 p-md-5">

        <h1 className="h3">
          Registration Returns & Refunds
        </h1>

        <p className="text-muted">
          Request a cancellation or refund for
          a demo conference session registration.
        </p>

        {/* Status Message */}
        {message && (

          <div
            role="alert"
            className={
              "alert " +
              (error ? "alert-danger" : "alert-success")
            }
          >
            {message}
          </div>

        )}

        <form onSubmit={submit}>

          {/* Search Orders */}
          <div className="mb-3">

            <label
              className="form-label"
              htmlFor="search"
            >
              Search Orders or Sessions
            </label>

            <input
              id="search"
              className="form-control"
              placeholder="Search by order ID, attendee, or session"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <div className="form-text">
              Searches orders loaded from the
              JSON-backed Node.js API.
            </div>

          </div>

          {/* Select Order */}
          <div className="mb-3">

            <label
              className="form-label"
              htmlFor="order"
            >
              Select Order
            </label>

            <select
              id="order"
              className="form-select"
              required
              value={orderId}
              onChange={e => chooseOrder(e.target.value)}
            >

              <option value="">
                Choose an order
              </option>

              {filtered.map(order => (

                <option
                  key={order.id}
                  value={order.id}
                >
                  {order.id} — {order.fullName}
                </option>

              ))}

            </select>

          </div>

          {/* Select Session */}
          <div className="mb-3">

            <label
              className="form-label"
              htmlFor="item"
            >
              Session to Cancel
            </label>

            <select
              id="item"
              className="form-select"
              required
              value={itemId}
              onChange={e => setItemId(e.target.value)}
            >

              <option value="">
                Choose a session
              </option>

              {selected && selected.items.map((item, i) => (

                <option
                  key={i}
                  value={item.id}
                >
                  {item.name} — ${Number(item.price).toFixed(2)}
                </option>

              ))}

            </select>

          </div>

          {/* Reason for Return */}
          <div className="mb-3">

            <label
              className="form-label"
              htmlFor="reason"
            >
              Reason for Return / Cancellation
            </label>

            <select
              id="reason"
              className="form-select"
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
            >

              <option value="">
                Choose a reason
              </option>

              <option value="Schedule conflict">
                Schedule conflict
              </option>

              <option value="Registered by mistake">
                Registered by mistake
              </option>

              <option value="Unable to attend">
                Unable to attend
              </option>

              <option value="Other">
                Other
              </option>

            </select>

          </div>

          {/* Additional Details */}
          <div className="mb-3">

            <label
              className="form-label"
              htmlFor="details"
            >
              Additional Details (optional)
            </label>

            <textarea
              id="details"
              className="form-control"
              rows="3"
              maxLength="500"
              value={details}
              onChange={e => setDetails(e.target.value)}
            />

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy}
          >
            {busy ? "Submitting..." : "Submit Refund Request"}
          </button>

        </form>

      </div>

    </div>

  );

}

ReactDOM.createRoot(
  document.getElementById("root")
).render(<ReturnsPage />);
