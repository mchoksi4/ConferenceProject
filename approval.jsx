const { useEffect, useState } = React;

function ApprovalPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Load proposals from the server
  function load() {
    // AJAX GET request
    $.ajax({
      url: "/api/proposals",
      method: "GET",
      dataType: "json",

      success: function(data) {
        setItems(data);
      },

      error: function() {
        setMessage("Unable to load proposals.");
      }
    });
  }

  // Load proposals when the page opens
  useEffect(load, []);

  // Approve or reject a proposal
  function review(id, status) {
    setBusyId(id);
    setMessage("");

    // AJAX PATCH request updates approval status
    $.ajax({
      url: "/api/proposals/" + encodeURIComponent(id),
      method: "PATCH",
      contentType: "application/json",
      data: JSON.stringify({ status }),

      success: function(data) {
        setMessage(data.message);
        load();
      },

      error: function(xhr) {
        setMessage(
          xhr.responseJSON?.message ||
          "Unable to update proposal."
        );
      },

      complete: function() {
        setBusyId(null);
      }
    });
  }

  // Filter proposals by their status
  const visible = items.filter(item =>
    filter === "all" || item.status === filter
  );

  return (
    <div>

      {/* Page Heading */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">

        <div>
          <h1 className="h2">
            Session Proposal Review
          </h1>

          <p className="text-muted">
            Review conference speaker proposals.
          </p>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={load}
        >
          Refresh List
        </button>

      </div>

      {/* Status Message */}
      {message && (
        <div role="status" className="alert alert-info">
          {message}
        </div>
      )}

      {/* Filter Dropdown */}
      <div className="mb-3">
        <label
          htmlFor="statusFilter"
          className="form-label"
        >
          Filter Proposals
        </label>

        <select
          id="statusFilter"
          className="form-select w-auto"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Empty List Message */}
      {visible.length === 0 && (
        <div className="alert alert-secondary">
          No proposals in this category.
        </div>
      )}

      {/* Display Submitted Proposals */}
      {visible.map(item => (
        <div
          className="card proposal-card mb-3"
          key={item.id}
        >
          <div className="card-body">

            <div className="d-flex justify-content-between gap-2">
              <h2 className="h5">
                {item.title}
              </h2>

              <span className="badge bg-secondary align-self-start">
                {item.status}
              </span>
            </div>

            {/* Speaker and Category */}
            <p className="mb-2">
              <strong>Speaker:</strong> {item.speaker}
              {" "}({item.email})

              <span className="ms-2">
                <strong>Category:</strong> {item.category}
              </span>
            </p>

            {/* Session Abstract */}
            <p className="abstract">
              {item.abstract}
            </p>

            {/* Submission Date */}
            <small className="text-muted">
              Submitted:{" "}
              {new Date(item.submittedAt).toLocaleString()}
            </small>

            {/* Approval Buttons */}
            {item.status === "pending" && (
              <div className="mt-3 d-flex gap-2">

                <button
                  className="btn btn-success"
                  disabled={busyId === item.id}
                  onClick={() => review(item.id, "approved")}
                >
                  Approve
                </button>

                <button
                  className="btn btn-danger"
                  disabled={busyId === item.id}
                  onClick={() => review(item.id, "rejected")}
                >
                  Reject
                </button>

              </div>
            )}

          </div>
        </div>
      ))}

    </div>
  );
}

ReactDOM.createRoot(
  document.getElementById("root")
).render(<ApprovalPage />);
