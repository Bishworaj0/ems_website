document.addEventListener('DOMContentLoaded', () => {
    const userLoginForm = document.getElementById('userLoginForm');
    userLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('userUsername').value.trim();
      const password = document.getElementById('userPassword').value.trim();
  
      // Example trivial credential check for user
      if (username === 'user' && password === 'user123') {
        alert("Logged in successfully as User!");
        // Optionally redirect to a user dashboard page
        // window.location.href = "user_dashboard.html";
      } else {
        alert("Invalid user credentials. Please try again.");
      }
    });
  });
  