import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ResetPassword.css';

const ResetPassword = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [isLoading, setIsLoading] = useState(false); // Estado para el indicador de carga
  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar u ocultar la contraseña
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Estado para mostrar u ocultar la confirmación de contraseña
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setMessage(t('resetPassword.noToken'));
    }
  }, [token, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage(t('resetPassword.passwordsDoNotMatch'));
      return;
    }

    setIsLoading(true); // Activa el indicador de carga

    try {
      const response = await fetch('http://localhost:4000/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      setMessage(data.message);
      setMessageType(data.message === 'Contraseña actualizada con éxito.' ? 'success' : 'error');

      if (data.message === 'Contraseña actualizada con éxito.') {
        setTimeout(() => {
          navigate('/'); // Redirige a la página principal
          setIsLoading(false); // Desactiva el indicador de carga
        }, 2000); // Espera 2 segundos antes de redirigir
      } else {
        setIsLoading(false); // Desactiva el indicador de carga en caso de error
      }
    } catch (error) {
      setMessage(t('resetPassword.serverError'));
      setMessageType('error');
      setIsLoading(false); // Desactiva el indicador de carga en caso de error
    }
  };

  return (
    <div className="centered-containerR">
      <div className="reset-password-containerR">
        <h2>{t('resetPassword.title')}</h2>
        {isLoading ? (
          <div className="loading-indicator">
            <progress value={null} />
            <p>{t('resetPassword.loading')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="reset-password-formR">
                      <div className="input-groupR">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t('resetPassword.newPasswordPlaceholder')}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                      </div>

                      <div className="input-groupR">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <span className="eye-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                      </div>

                      <button type="submit" className="reset-buttonR">
                        {t('resetPassword.changePasswordButton')}
                      </button>
                    </form>
        )}
        {message && <p className={`messageR ${messageType}`}>{message}</p>}
      </div>
    </div>
  );
};

export default ResetPassword;
