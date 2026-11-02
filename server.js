const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Read incoming JSON requests
app.use(express.json());

// Serve the website files
app.use(express.static(__dirname));

// REST API: Receive conference registrations
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
      message: "Registration information is incomplete.",
    });
  }

  const filePath = path.join(__dirname, "registrations.json");

  let registrations = [];

  // Load previous registrations
  try {
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf8");
      registrations = JSON.parse(fileData);

      if (!Array.isArray(registrations)) {
        registrations = [];
      }
    }
  } catch (error) {
    console.error("Error reading registration file:", error);

    return res.status(500).json({
      message: "Unable to read registration records.",
    });
  }

  // Add the new registration
  registrations.push(registration);

  // Save registrations to JSON file
  try {
    fs.writeFileSync(filePath, JSON.stringify(registrations, null, 2));
  } catch (error) {
    console.error("Error saving registration:", error);

    return res.status(500).json({
      message: "Unable to save registration.",
    });
  }

  // Send successful response
  res.status(201).json({
    message: "Registration successfully submitted!",
    registration: registration,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(
    `College Career Conference server running at http://localhost:${PORT}`,
  );
});
