import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getOTPSession, removeOTPSession } from '../../services/storage';
import { toast } from 'react-toastify';
import Loader from '../Common/Loader';
import '../../styles/components/Auth.css';

const OTPVerification = () => {
  const { verifyOTP } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    // Get OTP session data
    const session = getOTPSession();
    if (!session) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return;
    }
    setSessionData(session);

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto-submit when all digits are entered
    if (index === 5 && value) {
      const completeOtp = [...newOtp.slice(0, 5), value].join('');
      if (completeOtp.length === 6) {
        handleSubmit(completeOtp);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) {
      toast.error('Please paste numbers only');
      return;
    }

    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);

    // Auto-submit if complete
    if (pastedData.length === 6) {
      handleSubmit(pastedData);
    }
  };

  const handleSubmit = async (otpValue = null) => {
    const otpString = otpValue || otp.join('');

    if (otpString.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    if (!sessionData) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      const result = await verifyOTP(sessionData.userId, otpString);

      if (result.success) {
        removeOTPSession();
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error(result.message || 'Invalid OTP');
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0').focus();
      }
    } catch (error) {
      toast.error('An error occurred during verification');
      console.error('OTP verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    // Reset timer
    setTimeLeft(60);
    setCanResend(false);

    // In production, call API to resend OTP
    toast.success('New OTP sent to your email!');

    // Restart timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (loading) {
    return <Loader message="Verifying OTP..." />;
  }

  return (
    <div className="auth-container">
      <div className="auth-card otp-card">
        <div className="auth-header">
          <h1 className="auth-logo">🏦 Credora</h1>
          <h2>Verify OTP</h2>
          <p>
            Enter the 6-digit code sent to<br />
            <strong>{sessionData?.email}</strong>
          </p>
        </div>

        <div className="otp-form">
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <div className="otp-timer">
            {timeLeft > 0 ? (
              <p>Code expires in <strong>{timeLeft}s</strong></p>
            ) : (
              <p className="expired">Code expired</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleSubmit()}
            className="btn-primary btn-full"
            disabled={otp.join('').length !== 6}
          >
            Verify OTP
          </button>

          <button
            type="button"
            onClick={handleResend}
            className="btn-secondary btn-full"
            disabled={!canResend}
          >
            {canResend ? 'Resend OTP' : `Resend in ${timeLeft}s`}
          </button>
        </div>

        <div className="auth-footer">
          <button
            onClick={() => {
              removeOTPSession();
              navigate('/login');
            }}
            className="btn-link"
          >
            ← Back to Login
          </button>
        </div>
      </div>

      <div className="auth-background">
        <div className="auth-bg-shape shape-1"></div>
        <div className="auth-bg-shape shape-2"></div>
        <div className="auth-bg-shape shape-3"></div>
      </div>
    </div>
  );
};

export default OTPVerification;