document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('adminUsername').value.trim();
      const password = document.getElementById('adminPassword').value.trim();
  
      // Example of a trivial credential check
      // In production, you'd validate against a real backend
      if (username === 'admin' && password === 'admin123') {
        alert("Logged in successfully as Admin!");
        // Optionally redirect to an admin dashboard page
        // window.location.href = "admin_dashboard.html";
      } else {
        alert("Invalid admin credentials. Please try again.");
      }
    });
  });
  