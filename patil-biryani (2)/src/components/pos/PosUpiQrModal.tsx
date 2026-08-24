import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, X, Copy, Check, Sparkles } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

interface PosUpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  invoiceNumber: string;
  upiId: string;
  businessName: string;
}

export const PosUpiQrModal: React.FC<PosUpiQrModalProps> = ({
  isOpen,
  onClose,
  amount,
  invoiceNumber,
  upiId,
  businessName,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const effectiveUpiId = upiId || 'patilbiryani@upi';
  const payeeName = businessName || 'Patil Biryani';
  const upiString = `upi://pay?pa=${effectiveUpiId}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount}&cu=INR&tn=Bill-${invoiceNumber}`;

  useEffect(() => {
    if (isOpen && amount > 0) {
      QRCode.toDataURL(upiString, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate UPI QR', err));
    }
  }, [isOpen, amount, upiString]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(effectiveUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 text-center relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-left">
            <QrCode className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="font-display font-bold text-sm text-slate-100">Scan & Pay via UPI</h3>
              <p className="text-[10px] text-slate-400">GPay, PhonePe, Paytm, BHIM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Amount Banner */}
        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-0.5">
          <div className="text-[11px] font-semibold text-emerald-300">Total Payable Amount</div>
          <div className="font-mono-num text-3xl font-black text-emerald-400">
            {formatINR(amount)}
          </div>
          <div className="text-[10px] text-slate-400">Bill #{invoiceNumber}</div>
        </div>

        {/* QR Code Canvas */}
        <div className="p-3 bg-white rounded-2xl shadow-inner inline-block mx-auto border-4 border-slate-800">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="UPI Payment QR Code"
              className="w-56 h-56 object-contain rounded-lg"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
              Generating Dynamic UPI QR...
            </div>
          )}
        </div>

        {/* UPI Details & Copy */}
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 flex items-center justify-between text-xs">
          <div className="text-left">
            <div className="text-[10px] text-slate-500">UPI VPA:</div>
            <div className="font-mono text-slate-200 font-bold text-xs">{effectiveUpiId}</div>
          </div>
          <button
            onClick={handleCopyUpi}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20"
        >
          Payment Received / Done
        </button>
      </div>
    </div>
  );
};
