// ==========================================
// MeroSpace - Main JavaScript
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("MeroSpace Loaded Successfully.");

    // ==========================
    // Login Form Validation
    // ==========================

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", function (e) {

            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            const message = document.getElementById("message");

            if (email === "" || password === "") {

                message.style.color = "red";
                message.textContent = "Please fill in all fields.";

                return;
            }

            if (!email.includes("@")) {

                message.style.color = "red";
                message.textContent = "Please enter a valid email address.";

                return;
            }

            if (password.length < 6) {

                message.style.color = "red";
                message.textContent = "Password must be at least 6 characters.";

                return;
            }

            message.style.color = "green";
            message.textContent = "Login successful.";

        });

    }

    // ==========================
    // Registration Form
    // ==========================

    const registerForm = document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener("submit", function (e) {

            e.preventDefault();

            const fullname = document.getElementById("fullname").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            const confirmPassword = document.getElementById("confirmPassword").value.trim();

            const message = document.getElementById("message");

            if (
                fullname === "" ||
                email === "" ||
                password === "" ||
                confirmPassword === ""
            ) {

                message.style.color = "red";
                message.textContent = "Please fill in all fields.";

                return;

            }

            if (!email.includes("@")) {

                message.style.color = "red";
                message.textContent = "Enter a valid email address.";

                return;

            }

            if (password.length < 6) {

                message.style.color = "red";
                message.textContent = "Password must be at least 6 characters.";

                return;

            }

            if (password !== confirmPassword) {

                message.style.color = "red";
                message.textContent = "Passwords do not match.";

                return;

            }

            message.style.color = "green";
            message.textContent = "Registration successful.";

        });

    }

    // ==========================
    // Search Button
    // ==========================

    const searchButton = document.getElementById("searchButton");

    if (searchButton) {

        searchButton.addEventListener("click", function () {

            alert("Room search feature will be connected to the backend later.");

        });

    }

    // ==========================
    // Favorite Buttons
    // ==========================

    const favoriteButtons = document.querySelectorAll(".favorite-btn");

    favoriteButtons.forEach(button => {

        button.addEventListener("click", function () {

            if (button.innerHTML === "♡ Save") {

                button.innerHTML = "❤ Saved";
                button.style.background = "#dc3545";

            } else {

                button.innerHTML = "♡ Save";
                button.style.background = "#1f4e79";

            }

        });

    });

    // ==========================
    // Contact Owner Button
    // ==========================

    const contactButton = document.getElementById("contactOwner");

    if (contactButton) {

        contactButton.addEventListener("click", function () {

            alert("Owner contact feature will be connected in the backend.");

        });

    }

});