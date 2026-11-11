
const { useState, useEffect } = React;

function BillingPage() {

  // Billing form information
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    cardNumber: "",
    expiration: "",
    securityCode: ""
  });

  // React state variables
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  // Load the existing conference cart
  useEffect(() => {

    try {

      const sessions = JSON.parse(
        localStorage.getItem("conferenceSessions") || "[]"
      );

      const cart = JSON.parse(
        localStorage.getItem("conferenceCart") || "[]"
      );

      const cartItems = cart
        .map(id => sessions.find(s => s.id === id))
        .filter(Boolean)
        .map(s => ({
          id: s.id,
          name: s.description,
          price: Number(s.price) || 0
        }));

      setItems(cartItems);

    } catch (e) {

      setMessage("Unable to read the conference cart.");
      setError(true);

    }

  }, []);

  // Calculate the total price
  const total = items.reduce(
    (sum, item) => sum + item.price,
    0
  );

  // Format prices
  function money(amount) {
    return "$" + amount.toFixed(2);
  }

  // Update input fields
  function change(event) {

    setForm({
      ...form,
      [event.target.name]: event.target.value
    });

  }

  // Submit billing information
  function submit(event) {

    event.preventDefault();

    // Remove spaces and dashes from card number
    const digits = form.cardNumber.replace(
      /\s|-/g,
      ""
    );

    // Validate expiration format
    const expiry = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(
      form.expiration
    );

    // Check expiration date
    const validExpiry = expiry && (() => {

      const year = 2000 + Number(expiry[2]);
      const month = Number(expiry[1]);
      const now = new Date();

      return (
        year > now.getFullYear() ||
        (
          year === now.getFullYear() &&
          month >= now.getMonth() + 1
        )
      );

    })();

    // Validate all required fields
    if (
      !event.currentTarget.checkValidity() ||
      !/^\d{13,19}$/.test(digits) ||
      !validExpiry ||
      !/^\d{3,4}$/.test(form.securityCode)
    ) {

      setError(true);

      setMessage(
        "Check all required fields, card number, expiration (MM/YY), and security code."
      );

      return;
    }

    // Make sure the cart is not empty
    if (items.length === 0) {

      setError(true);

      setMessage(
        "Your cart is empty. Add a session before checkout."
      );

      return;
    }

    // Create billing JSON object
    // Demo only: do not send full card details
    const payload = {

      fullName: form.fullName.trim(),

      email: form.email.trim(),

      address: {
        street: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim()
      },

      paymentMethod: {
        type: "Demo card (not charged)",
        last4: digits.slice(-4)
      },

      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price
      }))

    };

    setBusy(true);

    // AJAX POST request
    $.ajax({

      url: "/api/billing",

      method: "POST",

      contentType: "application/json",

      data: JSON.stringify(payload),

      success: function(response) {

        setError(false);

        setMessage(
          "Demo order saved! Order ID: " +
          response.order.id +
          ". Use this ID on the Returns page."
        );

        // Clear payment fields
        setForm(old => ({
          ...old,
          cardNumber: "",
          expiration: "",
          securityCode: ""
        }));

        // Clear the cart
        localStorage.removeItem("conferenceCart");

        setItems([]);

      },

      error: function(xhr) {

        setError(true);

        setMessage(
          xhr.responseJSON?.message ||
          "Could not save demo order."
        );

      },

      complete: function() {
        setBusy(false);
      }

    });

  }

  return (

    <div className="row g-4">

      {/* Billing Form */}
      <div className="col-lg-8">

        <div className="card commerce-card">

          <div className="card-body p-4">

            <h1 className="h3">
              Billing Details
            </h1>

            <p className="text-muted">
              Classroom demonstration only.
              No payments are processed.
              Use fictional card details.
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

              <div className="row g-3">

                {/* Form Fields */}
                {[
                  ["fullName", "Full Name", "text", "col-md-6"],
                  ["email", "Email", "email", "col-md-6"],
                  ["address", "Street Address", "text", "col-12"],
                  ["city", "City", "text", "col-md-5"],
                  ["state", "State", "text", "col-md-3"],
                  ["zip", "ZIP Code", "text", "col-md-4"],
                  ["cardNumber", "Demo Card Number", "text", "col-12"],
                  ["expiration", "Expiration (MM/YY)", "text", "col-md-6"],
                  ["securityCode", "Demo Security Code", "password", "col-md-6"]

                ].map(([name, label, type, width]) => (

                  <div className={width} key={name}>

                    <label
                      className="form-label"
                      htmlFor={name}
                    >
                      {label}
                    </label>

                    <input
                      id={name}
                      name={name}
                      type={type}
                      required
                      className="form-control"
                      autoComplete={
                        name === "cardNumber" ||
                        name === "securityCode"
                          ? "off"
                          : undefined
                      }
                      placeholder={
                        name === "expiration"
                          ? "MM/YY"
                          : undefined
                      }
                      value={form[name]}
                      onChange={change}
                    />

                  </div>

                ))}

              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary mt-4"
                disabled={busy || items.length === 0}
              >
                {busy ? "Saving..." : "Place Demo Order"}
              </button>

            </form>

          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="col-lg-4">

        <div className="card commerce-card">

          <div className="card-body p-4">

            <h2 className="h5">
              Order Summary
            </h2>

            {items.length === 0 ? (

              <p className="text-muted">
                No sessions in your cart.
                Visit the Cart page first.
              </p>

            ) : (

              items.map((item, i) => (

                <div
                  className="d-flex justify-content-between mb-2"
                  key={i}
                >

                  <span>
                    {item.name}
                  </span>

                  <span>
                    {money(item.price)}
                  </span>

                </div>

              ))

            )}

            {/* Total Amount */}
            <div className="d-flex justify-content-between summary-total">

              <span>Total</span>

              <span>
                {money(total)}
              </span>

            </div>

            <p className="small text-muted mt-3">
              Digital conference registration —
              no shipping required.
            </p>

          </div>
        </div>
      </div>

    </div>

  );

}

ReactDOM.createRoot(
  document.getElementById("root")
).render(<BillingPage />);
