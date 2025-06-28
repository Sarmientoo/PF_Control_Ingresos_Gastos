import React from 'react';
import { Trash2 } from 'lucide-react';

export default function ConfirmDeleteModal({ message = "¿Estás seguro de eliminar esta transacción?", onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Confirmar Eliminación</h2>
          <p className="text-sm text-gray-600">{message}</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
