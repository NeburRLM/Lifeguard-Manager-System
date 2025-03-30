import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setMessage('Token no proporcionado.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    const response = await fetch('http://localhost:4000/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();
    setMessage(data.message);

    if (data.message === 'Contraseña actualizada con éxito.') {
          setTimeout(() => {
            navigate('/'); // Redirige a la página de Login
          }, 2000); // Espera 2 segundos antes de redirigir
        }
  };

  return (
    <div className="centered-containerR">
        <div className="reset-password-containerR">
              <h2>Restablecer contraseña</h2>
              <form onSubmit={handleSubmit} className="reset-password-formR">
                <input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button type="submit" className="reset-buttonR">
                  Cambiar contraseña
                </button>
              </form>
              {message && <p className="messageR">{message}</p>}
            </div>
      </div>
  );
};

export default ResetPassword;