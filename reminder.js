document.addEventListener('DOMContentLoaded', () => {
    // 1) Manage reminders in localStorage
    let reminders = JSON.parse(localStorage.getItem('reminders')) || [];
  
    // 2) On-page elements
    const reminderList = document.getElementById('reminderList');
    const newReminderBtn = document.getElementById('newReminderBtn');
  
    // 3) Initialization
    updateReminderList(); // Show existing reminders
    // Try requesting notification permission immediately (optional)
    if ('Notification' in window) {
      Notification.requestPermission().then(result => {
        console.log('Notification permission:', result);
      });
    }
  
    // 4) NEW REMINDER BUTTON => MODAL
    newReminderBtn.addEventListener('click', openReminderModal);
  
    // 5) PERIODIC CHECK for due reminders
    setInterval(() => {
      checkReminders();
    }, 60 * 1000); // every minute
    checkReminders(); // also check right away on load
  
    // --- FUNCTIONS ---
  
    // OPEN REMINDER MODAL
    function openReminderModal() {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50';
      modal.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-lg relative max-w-md w-full mx-4">
          <button id="closeReminderModal" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
            <i class="fas fa-times"></i>
          </button>
          <h2 class="text-2xl font-bold text-gray-800 mb-4 text-center">Create a Reminder</h2>
          <form id="reminderForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Title</label>
              <input type="text" id="reminderTitle" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="Task or event name" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Date & Time</label>
              <input type="datetime-local" id="reminderDateTime" class="w-full p-2 border border-gray-300 rounded-lg" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Notify (minutes before due)</label>
              <input type="number" id="reminderNotifyMinutes" class="w-full p-2 border border-gray-300 rounded-lg" placeholder="e.g. 10" value="5">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Notes (Optional)</label>
              <textarea id="reminderNotes" class="w-full p-2 border border-gray-300 rounded-lg" rows="3" placeholder="Additional details..."></textarea>
            </div>
            <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">Add Reminder</button>
          </form>
        </div>
      `;
      document.body.appendChild(modal);
  
      // Close the modal
      document.getElementById('closeReminderModal').addEventListener('click', () => {
        document.body.removeChild(modal);
      });
  
      // Form submission => create new reminder
      document.getElementById('reminderForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('reminderTitle').value.trim();
        const dateTime = document.getElementById('reminderDateTime').value;
        const notifyMins = parseInt(document.getElementById('reminderNotifyMinutes').value, 10) || 0;
        const notes = document.getElementById('reminderNotes').value.trim();
  
        if (!title || !dateTime) {
          alert('Please fill out the required fields.');
          return;
        }
  
        const newReminder = {
          id: Date.now(),
          title,
          dateTime,
          notifyMins,
          notes,
          completed: false,
          notified: false
        };
  
        reminders.push(newReminder);
        localStorage.setItem('reminders', JSON.stringify(reminders));
        updateReminderList();
        alert('Reminder added successfully!');
        document.body.removeChild(modal);
      });
    }
  
    // UPDATE REMINDER LIST on the page
    function updateReminderList() {
      if (!reminderList) return;
      reminderList.innerHTML = '';
      if (reminders.length === 0) {
        reminderList.innerHTML = `<li class="text-gray-500">No reminders found.</li>`;
        return;
      }
      reminders.forEach((reminder, index) => {
        const li = document.createElement('li');
        li.className = 'bg-gray-50 p-3 rounded flex justify-between items-center transition-transform duration-300 hover:scale-105';
        
        const date = new Date(reminder.dateTime);
        const dateString = date.toLocaleString();
  
        li.innerHTML = `
          <div>
            <p class="font-medium ${reminder.completed ? 'line-through text-gray-400' : ''}">${reminder.title}</p>
            <p class="text-sm text-gray-500">${dateString}</p>
            ${reminder.notes ? `<p class="text-sm text-gray-600 mt-1">${reminder.notes}</p>` : ''}
          </div>
          <div class="flex items-center space-x-3">
            <button class="markComplete text-blue-500 hover:text-blue-700" title="Mark as Completed">
              <i class="fas fa-check-circle"></i>
            </button>
            <button class="deleteReminder text-red-500 hover:text-red-700" title="Delete">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        `;
  
        // Mark as complete
        li.querySelector('.markComplete').addEventListener('click', () => {
          reminders[index].completed = !reminders[index].completed;
          localStorage.setItem('reminders', JSON.stringify(reminders));
          updateReminderList();
        });
  
        // Delete
        li.querySelector('.deleteReminder').addEventListener('click', () => {
          if (confirm('Delete this reminder?')) {
            reminders.splice(index, 1);
            localStorage.setItem('reminders', JSON.stringify(reminders));
            updateReminderList();
          }
        });
  
        reminderList.appendChild(li);
      });
    }
  
    // CHECK REMINDERS - run every minute
    function checkReminders() {
      const now = Date.now();
      reminders.forEach((reminder, index) => {
        if (reminder.completed || reminder.notified) return;
        const dueTime = new Date(reminder.dateTime).getTime();
        const notifyTime = dueTime - (reminder.notifyMins * 60 * 1000);
  
        // If it's time to notify
        if (now >= notifyTime) {
          reminders[index].notified = true;
          localStorage.setItem('reminders', JSON.stringify(reminders));
          showReminderNotification(reminder);
        }
      });
    }
  
    // SHOW NOTIFICATION
    function showReminderNotification(reminder) {
      const message = `Reminder: ${reminder.title}\nDue at: ${new Date(reminder.dateTime).toLocaleString()}`;
      // If Notifications API is allowed
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Reminder', {
          body: message,
          icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827301.png' // or any custom icon
        });
      } else {
        // fallback if notifications not granted
        alert(message);
      }
    }
  });
  // Fetch reminders example
fetch('http://localhost:8888/ems_backend/index.php/reminders')
.then(res => res.json())
.then(data => console.log(data));

// Create new reminder example
fetch('http://localhost:8888/ems_backend/index.php/reminders', {
method: 'POST',
headers: {'Content-Type':'application/json'},
body: JSON.stringify({
  title: "Meeting",
  dateTime: "2024-04-05 09:00",
  notes: "Discuss project",
  completed: 0
})
}).then(res => res.json()).then(console.log);
  