export const getFrontendURL = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  return process.env.FRONTEND_URL;
};

export const getBackendURL = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }

  return process.env.BACKEND_URL;
};
