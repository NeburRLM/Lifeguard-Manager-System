import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { t, i18n} = useTranslation();

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
        setMessage(t('forgot-password.successMessage'));
      } else {
        setError(data.message || t('forgot-password.errorReset'));
      }
    } catch (error) {
      setError(t('forgot-password.serverError'));
    }
  };

  return (
      <div className="centered-containerF">
      <div className="language-selector">
              <select onChange={(e) => i18n.changeLanguage(e.target.value)} value={i18n.language}>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="ca">Català</option>
              </select>
              <img
                src={`/flags/${i18n.language === "en" ? "gb" : i18n.language}.png`}
                alt="flag"
                className="flag-icon"
              />
            </div>
      <div className="forgot-password-containerF">
        <h2>{t("forgot-password.title")}</h2>
        {error && <p className="error-messageF">{error}</p>}
        {message && <p className="success-messageF">{message}</p>}
        <form onSubmit={handleSubmit} className="forgot-password-formF">
          <div className="form-groupF">
            <label htmlFor="email">{t('forgot-password.emailLabel')}</label>
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
            {t('forgot-password.sendButton')}
          </button>
        </form>
      </div>
      <div className="image-containerF">
        <img src="/LogoSL.png" alt={t('forgot-password.imageAlt')} />
      </div>
      </div>
    );
  };

export default ForgotPassword;
