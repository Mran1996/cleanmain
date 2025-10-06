/**
 * Utility functions to clean up corrupted authentication data
 */

export function clearSupabaseAuth() {
  try {
    // Clear localStorage
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || 
      key.includes('auth') ||
      key.includes('sb-')
    );
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('Removed localStorage key:', key);
    });

    // Clear sessionStorage
    const sessionKeysToRemove = Object.keys(sessionStorage).filter(key => 
      key.includes('supabase') || 
      key.includes('auth') ||
      key.includes('sb-')
    );
    
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      console.log('Removed sessionStorage key:', key);
    });

    // Clear cookies (including malformed ones)
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
        // Clear with multiple path and domain combinations to ensure removal
        const clearOptions = [
          '; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;',
          '; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + window.location.hostname,
          '; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.' + window.location.hostname,
          '; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
        ];
        
        clearOptions.forEach(option => {
          document.cookie = `${name}=${option}`;
        });
        
        console.log('Removed cookie:', name);
      }
    });

    console.log('✅ Supabase auth data cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    return false;
  }
}

export function addAuthCleanupButton() {
  // Add a temporary cleanup button to the page
  const button = document.createElement('button');
  button.innerHTML = '🧹 Clear Auth Data';
  button.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    background: #ef4444;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  `;
  
  button.onclick = () => {
    if (clearSupabaseAuth()) {
      alert('Auth data cleared! Please refresh the page and log in again.');
      window.location.reload();
    }
  };
  
  document.body.appendChild(button);
  
  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (document.body.contains(button)) {
      document.body.removeChild(button);
    }
  }, 30000);
}
