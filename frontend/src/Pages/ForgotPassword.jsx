import React, { useState } from 'react';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:4000/employee/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('An email has been sent with the password reset instructions.');
      } else {
        setError(data.message || 'Error resetting password.');
      }
    } catch (error) {
      setError('Error connecting to the server.');
    }
  };

  return (
      <div className="centered-containerF">
      <div className="forgot-password-containerF">
        <h2>Forgot Password</h2>
        {error && <p className="error-messageF">{error}</p>}
        {message && <p className="success-messageF">{message}</p>}
        <form onSubmit={handleSubmit} className="forgot-password-formF">
          <div className="form-groupF">
            <label htmlFor="email">Enter your email associated with your account</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="reset-buttonF">
            Send Reset Link
          </button>
        </form>
      </div>
      <div className="image-containerF">
        <img src="/LogoSL.png" alt="Descripción de la imagen" />
      </div>
      </div>
    );
  };

export default ForgotPassword;
