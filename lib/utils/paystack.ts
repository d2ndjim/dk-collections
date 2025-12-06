// Using Paystack Inline JS approach for React 19 compatibility

export interface PaystackResponse {
  status: string;
  reference: string;
  trans?: string;
  transaction?: string;
  message?: string;
}

export interface PaystackConfig {
  key: string;
  email: string;
  amount: number; // Amount in kobo (multiply by 100)
  reference: string;
  metadata?: Record<string, unknown>;
  callback?: (response: PaystackResponse) => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackConfig) => {
        openIframe: () => void;
      };
    };
  }
}

export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.PaystackPop) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack script"));
    document.body.appendChild(script);
  });
}

export function initializePaystackPayment(config: PaystackConfig): void {
  if (!window.PaystackPop) {
    throw new Error("Paystack script not loaded");
  }

  // Ensure callback is a function (Paystack requires this)
  if (config.callback && typeof config.callback !== "function") {
    throw new Error("Callback must be a function");
  }

  const handler = window.PaystackPop.setup({
    key: config.key,
    email: config.email,
    amount: config.amount,
    reference: config.reference,
    metadata: config.metadata || {},
    callback: config.callback || (() => {}), 
    onClose: config.onClose || (() => {}),
  });

  handler.openIframe();
}

export function generatePaymentReference(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `dk_${timestamp}_${random}`;
}
