// ErrorModal.jsx
import React from 'react';
import { XCircle } from 'lucide-react'; // opcional

const ErrorModal = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-0 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg px-6 pt-6 pb-4 sm:my-8 sm:max-w-lg sm:w-full shadow-xl transition-all">
        <div className="flex flex-col items-center">
          <div className="bg-red-100 p-3 rounded-full">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">Error</h3>
          <p className="mt-2 text-sm text-gray-600 text-center">{message}</p>
          <button
            onClick={onClose}
            className="mt-6 inline-flex justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
