// The cutout holes and perforated line are now handled entirely by pure CSS!
// This makes it faster and perfectly mimics a punched ticket, allowing drop-shadows to pass through the holes correctly.

document.addEventListener('DOMContentLoaded', () => {
  const acceptBtn = document.getElementById('ck-accept-btn');
  const manageBtn = document.getElementById('ck-manage-btn');
  const declineBtn = document.getElementById('ck-decline-btn');
  const ticket = document.getElementById('ticket');

  if (acceptBtn && ticket) {
    acceptBtn.addEventListener('click', () => {
      const acceptedPanel = ticket.querySelector('.ck-accepted');
      if (acceptedPanel) {
        acceptedPanel.style.display = 'flex';
      }
      ticket.style.opacity = '0';
      setTimeout(() => {
        ticket.style.display = 'none';
      }, 400);
    });
  }

  if (manageBtn) {
    manageBtn.addEventListener('click', () => {
      if (typeof window.openCookieManager === 'function') {
        window.openCookieManager();
      } else {
        window.dispatchEvent(new CustomEvent('open-cookie-manager'));
      }
    });
  }

  if (declineBtn) {
    declineBtn.addEventListener('click', () => {
      if (typeof window.declineAllCookies === 'function') {
        window.declineAllCookies();
      } else {
        window.dispatchEvent(new CustomEvent('cookie-consent-declined'));
      }
      
      // Visually dismiss the ticket
      if (ticket) {
        ticket.style.opacity = '0';
        setTimeout(() => {
          ticket.style.display = 'none';
        }, 400);
      }
    });
  }
});
