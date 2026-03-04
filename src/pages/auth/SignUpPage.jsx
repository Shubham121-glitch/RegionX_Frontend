import { SignUp } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import './auth.css';

function SignUpPage() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTheme = localStorage.getItem('theme') || 'dark';
      if (currentTheme !== theme) {
        setTheme(currentTheme);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [theme]);

  return (
    <div className={`auth-container ${theme}`}>
      <div className="auth-glass">
        <SignUp 
          appearance={{
            elements: {
              card: 'clerk-card',
              headerTitle: 'clerk-title',
              headerSubtitle: 'clerk-subtitle',
              formButtonPrimary: 'clerk-button',
              formFieldInput: 'clerk-input',
              footerActionLink: 'clerk-link',
              dividerLine: 'clerk-divider',
              socialButtonsBlockButton: 'clerk-social-btn',
            },
          }}
        />
      </div>
    </div>
  );
}

export default SignUpPage;
