const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  APP_NAME: 'Credora',
  OTP_LENGTH: 6,
  OTP_EXPIRY_SECONDS: 60
};

export default config;