"use client";
import { Modal } from "./Modal";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen, open, onClose, onCancel, onConfirm, title, message,
  confirmText = "Onayla", cancelText = "İptal", isDestructive = true
}: ConfirmDialogProps) {
  const handleClose = onClose ?? onCancel ?? (() => {});
  const visible = isOpen ?? open ?? false;

  return (
    <Modal isOpen={visible} onClose={handleClose} title={title} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 shadow-inner ${isDestructive ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
          <AlertTriangle className="w-7 h-7" />
        </div>
        <p className="text-gray-600 mb-6 text-sm">{message}</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              handleClose();
            }}
            className={`flex-1 py-2.5 px-4 text-white text-sm font-semibold rounded-xl transition shadow-lg ${
              isDestructive ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
