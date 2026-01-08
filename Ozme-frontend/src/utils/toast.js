import toast from 'react-hot-toast';

export const showSuccessToast = (message) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
    style: {
      background: '#10B981',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10B981',
    },
  });
};

export const showErrorToast = (message) => {
  toast.error(message, {
    duration: 3000,
    position: 'top-center',
    style: {
      background: '#EF4444',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
  });
};

export const showInfoToast = (message) => {
  toast(message, {
    duration: 3000,
    position: 'top-center',
    style: {
      background: '#3B82F6',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
  });
};