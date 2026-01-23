"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCode({ value, size = 120, className }: QRCodeProps) {
  return (
    <div className={className}>
      <div className="bg-white p-2 rounded-lg inline-block shadow-sm border">
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          includeMargin={false}
        />
      </div>
    </div>
  );
}
