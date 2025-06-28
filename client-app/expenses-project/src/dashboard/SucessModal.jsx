// SuccessModal.jsx
import React from 'react';
import { CheckCircle } from 'lucide-react';

const SuccessModal = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-0 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg px-6 pt-6 pb-4 sm:my-8 sm:max-w-lg sm:w-full shadow-xl transition-all">
        <div className="flex flex-col items-center">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">¡Éxito!</h3>
          <p className="mt-2 text-sm text-gray-600 text-center">{message}</p>
          <button
            onClick={onClose}
            className="mt-6 inline-flex justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
