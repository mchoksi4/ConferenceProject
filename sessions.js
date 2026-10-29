const STORAGE_KEY = "conferenceSessions";

let sessions = [];
let editingSessionId = null;

const sessionForm = document.getElementById("sessionForm");
const sessionIdInput = document.getElementById("sessionId");
const sessionTitleInput = document.getElementById("sessionTitle");
const sessionCategoryInput = document.getElementById("sessionCategory");
const sessionFormatInput = document.getElementById("sessionFormat");
const sessionInfoInput = document.getElementById("sessionInfo");
const sessionTable = document.getElementById("sessionTable");
const sessionTableBody = document.getElementById("sessionTableBody");
const formHeading = document.getElementById("formHeading");
const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");
const formMessage = document.getElementById("formMessage");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");
const sessionPriceInput = document.getElementById("sessionPrice");

function saveSessions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `mt-3 alert alert-${type}`;
}

function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value || "—";
  return cell;
}

function renderSessions() {
  sessionTableBody.replaceChildren();

  const searchText = searchInput.value.toLowerCase().trim();
  let visibleCount = 0;

  sessions.forEach((session) => {
    const row = document.createElement("tr");

    row.appendChild(createCell(session.sessionId));
    row.appendChild(createCell(session.sessionTitle));
    row.appendChild(createCell(session.sessionCategory));
    row.appendChild(createCell(session.sessionFormat));
    row.appendChild(createCell(session.sessionInfo));
    row.appendChild(createCell("$" + Number(session.price ?? 0).toFixed(2)));

    const actionsCell = document.createElement("td");

    const updateButton = document.createElement("button");
    updateButton.type = "button";
    updateButton.className = "btn btn-sm btn-warning me-2 mb-1";
    updateButton.textContent = "Update";
    updateButton.addEventListener("click", () => {
      editSession(session.sessionId);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-sm btn-danger mb-1";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      deleteSession(session.sessionId);
    });

    actionsCell.append(updateButton, deleteButton);
    row.appendChild(actionsCell);

    if (row.textContent.toLowerCase().includes(searchText)) {
      sessionTableBody.appendChild(row);
      visibleCount++;
    }
  });

  emptyMessage.hidden = visibleCount > 0;

  if (sessions.length === 0) {
    emptyMessage.textContent = "No sessions found. Add a session below.";
  } else if (visibleCount === 0) {
    emptyMessage.textContent = "No sessions match your search.";
  } else {
    emptyMessage.textContent = "";
  }
}

function resetSessionForm() {
  sessionForm.reset();
  sessionForm.classList.remove("was-validated");

  editingSessionId = null;
  sessionIdInput.readOnly = false;
  formHeading.textContent = "Add a Conference Session";
  submitButton.textContent = "Add Session";
  cancelButton.hidden = true;

  formMessage.textContent = "";
  formMessage.className = "mt-3";
}

function editSession(id) {
  const session = sessions.find((item) => item.sessionId === id);
  if (!session) return;

  editingSessionId = id;
  sessionIdInput.value = session.sessionId;
  sessionTitleInput.value = session.sessionTitle;
  sessionCategoryInput.value = session.sessionCategory;
  sessionFormatInput.value = session.sessionFormat;
  sessionInfoInput.value = session.sessionInfo || ""
  sessionPriceInput.value = session.price ?? 0;

  sessionIdInput.readOnly = true;
  formHeading.textContent = "Update Conference Session";
  submitButton.textContent = "Save Changes";
  cancelButton.hidden = false;

  formMessage.textContent = "";
  formMessage.className = "mt-3";
  sessionForm.classList.remove("was-validated");

  sessionForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

sessionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sessionForm.classList.add("was-validated");

  if (!sessionForm.checkValidity()) {
    const invalidFields = sessionForm.querySelectorAll(":invalid");

    invalidFields.forEach(function(field) {
      console.log("Invalid field:", field.id, field.value);
    });

    showMessage("Please complete all required fields.", "danger");
    return;
  }

  const session = {
    sessionId: sessionIdInput.value.trim(),
    sessionTitle: sessionTitleInput.value.trim(),
    sessionCategory: sessionCategoryInput.value,
    sessionFormat: sessionFormatInput.value,
    sessionInfo: sessionInfoInput.value.trim(),
    price: Number(sessionPriceInput.value)
  };

  if (!session.sessionId || !session.sessionTitle) {
    showMessage("Session ID and title cannot be empty.", "danger");
    return;
  }

  if (editingSessionId === null) {
    const duplicate = sessions.some(
      function(item) {
        const id = item.sessionId || item.id || "";

        return id.toLowerCase() === session.sessionId.toLowerCase();
      });
    

    if (duplicate) {
      showMessage("That Session ID already exists.", "danger");
      return;
    }

    sessions.push(session);
    showMessage("Session added successfully!", "success");
  } else {
    const index = sessions.findIndex(
      (item) => item.sessionId === editingSessionId,
    );

    if (index === -1) {
      showMessage("Could not find that session.", "danger");
      return;
    }

    sessions[index] = session;
    showMessage("Session updated successfully!", "success");
  }

  saveSessions();
  renderSessions();
  resetSessionForm();
  showMessage("Session saved successfully!", "success");
});

function deleteSession(id) {
  const session = sessions.find((item) => item.sessionId === id);
  if (!session) return;

  if (!window.confirm(`Delete "${session.sessionTitle}"?`)) return;

  sessions = sessions.filter((item) => item.sessionId !== id);

  if (editingSessionId === id) {
    resetSessionForm();
  }

  saveSessions();
  renderSessions();
  showMessage("Session deleted successfully.", "success");
}

cancelButton.addEventListener("click", resetSessionForm);

sessionForm.addEventListener("reset", () => {
  sessionForm.classList.remove("was-validated");
});

$("#searchInput").on("input", renderSessions);

// Download current sessions as a JSON file.
const exportButton = document.createElement("button");
exportButton.type = "button";
exportButton.className = "btn btn-outline-primary mb-3";
exportButton.textContent = "Download Updated JSON";

sessionTable.parentElement.insertAdjacentElement("beforebegin", exportButton);

exportButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(sessions, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sessions.json";
  link.click();

  URL.revokeObjectURL(url);
});

async function loadSessions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved !== null) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        sessions = parsed;
        renderSessions();
        return;
      }
    }

    const response = await fetch("./sessions.json");

    if (!response.ok) {
      throw new Error(`Could not load sessions.json: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("sessions.json must contain an array.");
    }

    sessions = data;
    saveSessions();
    renderSessions();

    console.log("Sessions loaded:", sessions);
  } catch (error) {
    console.error("Error loading sessions:", error);
    showMessage(
      "Unable to load sessions. Check sessions.json and the browser console.",
      "danger",
    );
  }
}

loadSessions();
