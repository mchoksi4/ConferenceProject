const { useState, useEffect } = React;

function ConferenceRegistration() {
  const [sessions, setSessions] = useState([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [participationType, setParticipationType] = useState("");
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [attendanceConfirmed, setAttendanceConfirmed] = useState(false);
  const [comments, setComments] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [registrationJSON, setRegistrationJSON] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load available sessions from sessions.json using jQuery.
  useEffect(function () {
    $.getJSON("sessions.json")
      .done(function (data) {
        setSessions(data);
      })
      .fail(function (xhr, status, error) {
        console.error("Unable to load sessions:", error);
        setMessage("Unable to load conference sessions.");
        setMessageType("error");
      });
  }, []);

  // Select or deselect conference sessions.
  function handleSessionChange(sessionId) {
    if (selectedSessions.includes(sessionId)) {
      setSelectedSessions(
        selectedSessions.filter(function (id) {
          return id !== sessionId;
        }),
      );
    } else {
      setSelectedSessions([...selectedSessions, sessionId]);
    }
  }

  // Validate and submit the registration form.
  function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setMessageType("");
    setRegistrationJSON(null);

    // Check required fields.
    if (
      !fullName.trim() ||
      !email.trim() ||
      !participationType ||
      selectedSessions.length === 0 ||
      !attendanceConfirmed
    ) {
      setMessage(
        "Please complete all required fields and confirm your attendance.",
      );
      setMessageType("error");
      return;
    }

    // Validate email address.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      setMessage("Please enter a valid email address.");
      setMessageType("error");
      return;
    }

    // Create the registration JSON document.
    const registration = {
      attendeeId: "ATT" + Date.now(),
      fullName: fullName.trim(),
      email: email.trim(),
      participationType: participationType,
      selectedSessions: selectedSessions,
      attendanceConfirmed: attendanceConfirmed,
      comments: comments.trim(),
    };

    setRegistrationJSON(registration);
    setIsSubmitting(true);

    // Send registration data to the REST API using AJAX.
    $.ajax({
      url: "/api/registrations",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(registration),

      success: function (response) {
        setMessage(response.message || "Registration successfully submitted!");
        setMessageType("success");
      },

      error: function (xhr, status, error) {
        console.error("Registration request failed:", xhr);
        console.error("Status:", status);
        console.error("Error:", error);

        const errorMessage =
          xhr.responseJSON && xhr.responseJSON.message
            ? xhr.responseJSON.message
            : "Unable to submit registration. Please try again.";

        setMessage(errorMessage);
        setMessageType("error");
      },

      complete: function () {
        setIsSubmitting(false);
      },
    });
  }

  return (
    <div className="registration-container">
      <div className="text-center mb-4">
        <h1>Conference Registration</h1>
        <p className="text-muted">
          Complete the form below to finalize your conference registration.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Attendee Information */}
        <div className="registration-card">
          <h4>Attendee Information</h4>

          <div className="mb-3">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Participation Details */}
        <div className="registration-card">
          <h4>Participation Details</h4>

          <div className="mb-3">
            <label className="form-label">Participation Type *</label>

            <select
              className="form-select"
              value={participationType}
              onChange={(e) => setParticipationType(e.target.value)}
              required
            >
              <option value="">Select participation type</option>
              <option value="In-person">In-person</option>
              <option value="Virtual">Virtual</option>
              <option value="VIP">VIP</option>
            </select>
          </div>

          <label className="form-label">
            Select Your Conference Sessions *
          </label>

          {sessions.length === 0 ? (
            <p className="text-muted">Loading available sessions...</p>
          ) : (
            sessions.map(function (session) {
              return (
                <div className="form-check mb-2" key={session.sessionId}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={session.sessionId}
                    checked={selectedSessions.includes(session.sessionId)}
                    onChange={() => handleSessionChange(session.sessionId)}
                  />

                  <label
                    className="form-check-label"
                    htmlFor={session.sessionId}
                  >
                    <strong>{session.sessionTitle}</strong>
                    <br />
                    <small className="text-muted">{session.sessionInfo}</small>
                  </label>
                </div>
              );
            })
          )}
        </div>

        {/* Attendance Confirmation */}
        <div className="registration-card">
          <h4>Attendance Confirmation</h4>

          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="confirmation"
              checked={attendanceConfirmed}
              onChange={(e) => setAttendanceConfirmed(e.target.checked)}
            />

            <label className="form-check-label" htmlFor="confirmation">
              I confirm my attendance at the conference. *
            </label>
          </div>

          <div className="mb-3">
            <label className="form-label">Additional Comments (Optional)</label>

            <textarea
              className="form-control"
              rows="3"
              placeholder="Enter any additional comments..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg w-100"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Registration"}
        </button>
      </form>

      {/* Validation and submission messages */}
      {message && (
        <div
          className={`alert mt-3 alert-${
            messageType === "error" ? "danger" : "success"
          }`}
          role="status"
        >
          {message}
        </div>
      )}
    </div>
  );
}

// Display the React application.
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<ConferenceRegistration />);
