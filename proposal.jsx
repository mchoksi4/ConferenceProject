
const { useState } = React;

function ProposalForm() {
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    speaker: "",
    category: "",
    email: ""
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  // Update form values when the user types
  function update(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  // Handle form submission
  function submit(event) {
    event.preventDefault();

    // Validate the form
    if (
      !event.currentTarget.checkValidity() ||
      form.abstract.trim().length < 30
    ) {
      setError(true);
      setMessage(
        "Complete all fields. Abstract must be at least 30 characters."
      );
      return;
    }

    setBusy(true);
    setMessage("");

    // AJAX POST sends JSON to the Node.js server
    $.ajax({
      url: "/api/proposals",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(form),

      success: function(data) {
        setError(false);
        setMessage(data.message);

        // Clear the form after successful submission
        setForm({
          title: "",
          abstract: "",
          speaker: "",
          category: "",
          email: ""
        });
      },

      error: function(xhr) {
        setError(true);

        setMessage(
          xhr.responseJSON?.message || "Submission failed."
        );
      },

      complete: function() {
        setBusy(false);
      }
    });
  }

  return (
    <div className="card workflow-card">
      <div className="card-body p-4 p-md-5">

        <h1 className="h2">
          Submit a Session Proposal
        </h1>

        <p className="text-muted">
          Suggest a presentation for the College Career Conference.
        </p>

        {message && (
          <div
            role="alert"
            className={`alert ${
              error ? "alert-danger" : "alert-success"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={submit}>

          {/* Session Title */}
          <div className="mb-3">
            <label className="form-label" htmlFor="title">
              Session Title
            </label>

            <input
              id="title"
              name="title"
              className="form-control"
              required
              minLength="5"
              maxLength="120"
              value={form.title}
              onChange={update}
            />
          </div>

          {/* Speaker Information */}
          <div className="row">

            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="speaker">
                Speaker Name
              </label>

              <input
                id="speaker"
                name="speaker"
                className="form-control"
                required
                value={form.speaker}
                onChange={update}
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label" htmlFor="email">
                Speaker Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                required
                value={form.email}
                onChange={update}
              />
            </div>

          </div>

          {/* Session Category */}
          <div className="mb-3">
            <label className="form-label" htmlFor="category">
              Category
            </label>

            <select
              id="category"
              name="category"
              className="form-select"
              required
              value={form.category}
              onChange={update}
            >
              <option value="">
                Choose a category
              </option>

              <option>Cybersecurity</option>
              <option>Software Development</option>
              <option>Career Development</option>
              <option>Networking</option>
              <option>Other</option>
            </select>
          </div>

          {/* Session Abstract */}
          <div className="mb-3">
            <label className="form-label" htmlFor="abstract">
              Session Abstract
            </label>

            <textarea
              id="abstract"
              name="abstract"
              className="form-control"
              rows="5"
              required
              minLength="30"
              maxLength="1500"
              value={form.abstract}
              onChange={update}
            />

            <div className="form-text">
              At least 30 characters ({form.abstract.length}/30).
            </div>
          </div>

          {/* Submit Button */}
          <button
            className="btn btn-primary"
            disabled={busy}
          >
            {busy ? "Submitting..." : "Submit for Review"}
          </button>

        </form>
      </div>
    </div>
  );
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(<ProposalForm />);
