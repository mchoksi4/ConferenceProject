const form = document.getElementById("registrationForm");
const attendeeTable = document.getElementById("attendeeTable");
const submitButton = document.getElementById("submitButton");
const successMessage = document.getElementById("successMessage");

let attendees = [];
let editIndex = -1;

form.addEventListener("submit", function(event) {
    event.preventDefault();

    if(!validateForm()) {
        return;
    }

    const attendee = {
        fullName: document.getElementById("fullName").value.trim(),
        age: document.getElementById("age").value,
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim()
    };

    if (editIndex === -1) {
        attendees.push(attendee);
    }
    else {
        attendees[editIndex] = attendee;
        editIndex = -1;
        submitButton.textContent = "Register for Conference";
    }

    // Storing attendee information in JSON format
    localStorage.setItem("conferenceAttendees", JSON.stringify(attendees));

    displayAttendees();

    form.reset();

    successMessage.classList.remove("d-none");

    setTimeout(function() {
        successMessage.classList.add("d-none");
    }, 3000);
});

function validateForm() {
    const fullName = document.getElementById("fullName");
    const age = document.getElementById("age");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");
    const address = document.getElementById("address");

    let valid = true;

    // Full name validation
    if (fullName.value.trim() === "") {
        fullName.classList.add("is-invalid");
        valid = false;
    }
    else {
        fullName.classList.remove("is-invalid");
    }

    // Age validation
    const ageValue = Number(age.value);

    if (age.value === "" || ageValue < 16 || ageValue > 100) {
        age.classList.add("is-invalid");
        valid = false;
    }
    else {
        age.classList.remove("is-invalid");
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.value.trim())) {
        email.classList.add("is-invalid");
        valid = false;
    }
    else {
        email.classList.remove("is-invalid");
    }

    // Phone optional but still validate if entered
    const phonePattern = /^\d{3}[-.]?\d{3}[-.]?\d{4}$/;

    if (phone.value.trim() !== "" && !phonePattern.test(phone.value.trim())
    ) {
        phone.classList.add("is-invalid");
        valid = false;
    }
    else {
        phone.classList.remove("is-invalid");
    }

    // Address validation
    if (address.value.trim() === "") {
        address.classList.add("is-invalid");
        valid = false;
    }
    else {
        phone.classList.remove("is-invalid")
    }

    return valid;
}

function displayAttendees() {
    attendeeTable.innerHTML = "";

    attendees.forEach(function(attendee, index) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${attendee.fullName}</td>
            <td>${attendee.age}</td>
            <td>${attendee.email}</td>
            <td>${attendee.phone || "N/A"}</td>
            <td>${attendee.address}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editAttendee(${index})">
                Update</button>
            </td>
        `;

        attendeeTable.appendChild(row);
    });
}

function editAttendee(index) {
    const attendee = attendees[index];

    document.getElementById("fullName").value = attendee.fullName;

    document.getElementById("age").value = attendee.age;

    document.getElementById("email").value = attendee.email;

    document.getElementById("phone").value = attendee.phone;

    document.getElementById("address").value = attendee.address;

    editIndex = index;

    submitButton.textContent = "Save Changes";

    window.scrollTo({top: 0, behavior: "smooth"});
}

// Load saved JSON data when page opens
const savedAttendees = localStorage.getItem("conferenceAttendees");

if (savedAttendees) {
    attendees = JSON.parse(savedAttendees);
    displayAttendees();
}