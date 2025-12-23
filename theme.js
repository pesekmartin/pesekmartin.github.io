document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.createElement('button');
  toggleButton.id = 'theme-toggle';
  toggleButton.setAttribute('aria-label', 'Toggle Dark Mode');
  
  const sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
  
  const moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

  toggleButton.innerHTML = sunIcon; // Default icon for dark mode (to switch to light)
  
  // Find nav and append button
  const nav = document.querySelector('nav');
  if (nav) {
    nav.appendChild(toggleButton);
  }

  // Check for saved user preference, if any, on load of the website
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'light') {
    document.body.classList.add('light-mode');
    toggleButton.innerHTML = moonIcon;
  }

  toggleButton.addEventListener('click', function() {
    document.body.classList.toggle('light-mode');
    let theme = 'dark';
    if (document.body.classList.contains('light-mode')) {
      theme = 'light';
      toggleButton.innerHTML = moonIcon;
    } else {
      toggleButton.innerHTML = sunIcon;
    }
    localStorage.setItem('theme', theme);
  });
});
