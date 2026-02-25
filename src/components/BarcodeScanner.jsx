import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScanner({ onScan, onClose, onError, expectedProduct }) {
  const [status, setStatus] = useState('starting');
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanId = 'barcode-scanner';
    const html5Qr = new Html5Qrcode(scanId);

    html5Qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      (decodedText) => {
        // MVP: Accept any barcode - in production verify against product barcode DB
        onScan(decodedText);
        html5Qr.stop();
      },
      () => {}
    ).then(() => {
      setStatus('scanning');
      scannerRef.current = html5Qr;
    }).catch((err) => {
      console.warn('Camera error:', err);
      setStatus('error');
      onError?.();
    });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan, onError]);

  return (
    <div className="scanner-overlay">
      <div className="scanner-content">
        <div id="barcode-scanner" className="scanner-view" />
        <p className="scanner-hint">Point camera at barcode</p>
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
