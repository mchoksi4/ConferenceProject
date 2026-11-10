const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Allow the server to read JSON requests
app.use(express.json());

// Serve the website files
app.use(express.static(__dirname));


// ==========================================
// CONFERENCE REGISTRATION
// ==========================================

// Receive conference registrations
app.post("/api/registrations", (req, res) => {
  const registration = req.body;

  // Validate submitted information
  if (
    !registration.fullName ||
    !registration.email ||
    !registration.participationType ||
    !Array.isArray(registration.selectedSessions) ||
    registration.selectedSessions.length === 0 ||
    registration.attendanceConfirmed !== true
  ) {
    return res.status(400).json({
      message: "Registration information is incomplete."
    });
  }

  const filePath = path.join(
    __dirname,
    "registrations.json"
  );

  let registrations = [];

  // Load previous registrations
  try {
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(
        filePath,
        "utf8"
      );

      registrations = JSON.parse(fileData);

      if (!Array.isArray(registrations)) {
        registrations = [];
      }
    }
  } catch (error) {
    console.error(
      "Error reading registration file:",
      error
    );

    return res.status(500).json({
      message: "Unable to read registration records."
    });
  }

  // Add the new registration
  registrations.push(registration);

  // Save registrations to JSON file
  try {
    fs.writeFileSync(
      filePath,
      JSON.stringify(registrations, null, 2)
    );
  } catch (error) {
    console.error(
      "Error saving registration:",
      error
    );

    return res.status(500).json({
      message: "Unable to save registration."
    });
  }

  // Send successful response
  res.status(201).json({
    message: "Registration successfully submitted!",
    registration: registration
  });
});


// ==========================================
// SESSION PROPOSAL WORKFLOW
// ==========================================

// Location of the proposals JSON file
const proposalFile = path.join(
  __dirname,
  "proposals.json"
);


// Read saved proposals
function readProposals() {
  if (!fs.existsSync(proposalFile)) {
    return [];
  }

  const data = JSON.parse(
    fs.readFileSync(proposalFile, "utf8")
  );

  return Array.isArray(data) ? data : [];
}


// Save proposals to JSON
function saveProposals(items) {
  fs.writeFileSync(
    proposalFile,
    JSON.stringify(items, null, 2)
  );
}


// ==========================================
// GET - RETRIEVE PROPOSALS
// ==========================================

app.get("/api/proposals", (req, res) => {
  try {
    const items = readProposals();
    const status = req.query.status;

    if (status) {
      const filtered = items.filter(
        item => item.status === status
      );

      return res.json(filtered);
    }

    res.json(items);

  } catch (error) {
    res.status(500).json({
      message: "Unable to load proposals."
    });
  }
});


// ==========================================
// POST - SUBMIT NEW PROPOSAL
// ==========================================

app.post("/api/proposals", (req, res) => {
  const {
    title,
    abstract,
    speaker,
    category,
    email
  } = req.body;

  // Validate submitted information
  if (
    ![title, abstract, speaker, category, email].every(
      value =>
        typeof value === "string" &&
        value.trim()
    ) ||
    title.trim().length < 5 ||
    abstract.trim().length < 30 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return res.status(400).json({
      message:
        "Please enter a valid title, abstract (30+ characters), speaker, category, and email."
    });
  }

  try {
    const items = readProposals();

    // Create the new proposal record
    const proposal = {
      id: require("crypto").randomUUID(),
      title: title.trim(),
      abstract: abstract.trim(),
      speaker: speaker.trim(),
      category: category.trim(),
      email: email.trim(),
      status: "pending",
      submittedAt: new Date().toISOString(),
      reviewedAt: null
    };

    // Add the proposal to the list
    items.push(proposal);

    // Save the updated list
    saveProposals(items);

    // Return successful response
    res.status(201).json({
      message: "Proposal submitted for review!",
      proposal: proposal
    });

  } catch (error) {
    res.status(500).json({
      message: "Unable to save proposal."
    });
  }
});


// ==========================================
// PATCH - APPROVE OR REJECT PROPOSAL
// ==========================================

app.patch("/api/proposals/:id", (req, res) => {

  // Make sure the status is valid
  if (
    !["approved", "rejected"].includes(
      req.body.status
    )
  ) {
    return res.status(400).json({
      message: "Status must be approved or rejected."
    });
  }

  try {
    const items = readProposals();

    // Find the selected proposal
    const proposal = items.find(
      item => item.id === req.params.id
    );

    // Check whether the proposal exists
    if (!proposal) {
      return res.status(404).json({
        message: "Proposal not found."
      });
    }

    // Prevent reviewing a proposal twice
    if (proposal.status !== "pending") {
      return res.status(409).json({
        message: "Proposal has already been reviewed."
      });
    }

    // Update proposal status
    proposal.status = req.body.status;
    proposal.reviewedAt = new Date().toISOString();

    // Save the changes
    saveProposals(items);

    // Return updated proposal
    res.json({
      message: `Proposal ${proposal.status}.`,
      proposal: proposal
    });

  } catch (error) {
    res.status(500).json({
      message: "Unable to update proposal."
    });
  }
});


// ==========================================
// START NODE.JS SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(
    `College Career Conference server running at http://localhost:${PORT}`
  );
});
