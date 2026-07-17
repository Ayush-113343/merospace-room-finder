const form = document.getElementById("registerForm");

form.addEventListener("submit", function(event){

    event.preventDefault();

    const fullName = document.getElementById("fullname").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const message = document.getElementById("message");

    message.className = "";
    message.innerHTML = "";

    if(fullName==="" || email==="" || phone==="" || password==="" || confirmPassword===""){
        message.className="error";
        message.innerHTML="Please fill in all required fields.";
        return;
    }

    const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!emailPattern.test(email)){
        message.className="error";
        message.innerHTML="Please enter a valid email address.";
        return;
    }

    if(phone.length<10){
        message.className="error";
        message.innerHTML="Phone number must be at least 10 digits.";
        return;
    }

    if(password.length<8){
        message.className="error";
        message.innerHTML="Password must be at least 8 characters.";
        return;
    }

    if(password!==confirmPassword){
        message.className="error";
        message.innerHTML="Passwords do not match.";
        return;
    }

    message.className="success";
    message.innerHTML="Registration Successful!";

    // TODO: Connect to backend API in Sprint 2

    form.reset();

});