import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const emailInput = document.getElementById("email");
        validateEmailInput(emailInput); // Valida el campo antes de enviar el formulario

        if (!emailInput.checkValidity()) {
          emailInput.reportValidity(); // Muestra mensajes de error nativos
          return; // Detiene el envío si hay errores
        }

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

  const validateEmailInput = (input) => {
      if (input.validity.valueMissing) {
        // Mensaje personalizado para campo obligatorio
        input.setCustomValidity(t('forgot-password.validation.required'));
      } else if (input.validity.typeMismatch) {
        // Mensaje personalizado para formato de correo electrónico no válido
        input.setCustomValidity(t('forgot-password.validation.invalidEmail'));
      } else {
        // Limpia los mensajes personalizados si no hay errores
        input.setCustomValidity('');
      }
    };

  return (
      <div className="centered-containerF">
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
              onInput={(e) => validateEmailInput(e.target)}
              onInvalid={(e) => validateEmailInput(e.target)}
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
