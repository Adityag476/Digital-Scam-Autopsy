export interface SampleScam {
  id: string;
  category: "KYC/Account" | "UPI Fraud" | "Phishing/Bait" | "Utility" | "Control / Safe";
  label: string;
  description: string;
  text: string;
  isBenign?: boolean;
}

export const SAMPLE_SCAMS: SampleScam[] = [
  {
    id: "kyc-expiry",
    category: "KYC/Account",
    label: "SBI KYC Expiry Threat",
    description: "Urgent account blocking panic pushing recipient to an external phishing link.",
    text: "URGENT: Dear Customer, your SBI KYC has expired. Your account will be BLOCKED within 24 hours. Update immediately at http://sbi-kyc-update.info or call 9876543210. — SBI KYC Dept",
  },
  {
    id: "hdfc-suspension",
    category: "KYC/Account",
    label: "HDFC Debit Card Block Alert",
    description: "Panic coercion claiming debit card deactivation requiring immediate PAN linking.",
    text: "Dear HDFC Customer, your NetBanking access and Debit Card will be suspended today due to unlinked PAN. Update details immediately: http://hdfc-pan-portal.com or your account will be frozen.",
  },
  {
    id: "refund-scam",
    category: "UPI Fraud",
    label: "Fake E-Commerce UPI Refund",
    description: "Reverse collect request scam masquerading as an e-commerce cashback/refund.",
    text: "Dear customer, ₹2,499 refund pending for your Flipkart order. Accept collect request on your UPI app within 2 hours or money will be cancelled. Accept: 9876543210@ybl",
  },
  {
    id: "upi-collect-pin",
    category: "UPI Fraud",
    label: "UPI Payment Approval Trap",
    description: "Fraudulent collect request asking user to enter UPI PIN to receive money.",
    text: "You have received ₹15,000 lottery cashback on PhonePe. Click to approve collect request and enter your 6-digit UPI PIN to claim money instantly into your account.",
  },
  {
    id: "bank-reward-points",
    category: "Phishing/Bait",
    label: "ICICI Reward Points Expiring",
    description: "Cashback temptation funneling victim to credential harvest form.",
    text: "Dear ICICI user, ₹7,850 worth of reward points are expiring tonight. Redeem now into your bank account by logging in at bit.ly/icici-points-credit before 11:59 PM.",
  },
  {
    id: "screen-share-support",
    category: "Phishing/Bait",
    label: "Bank Anti-Fraud AnyDesk Trap",
    description: "Impersonates bank security team demanding remote screen-sharing software.",
    text: "This is calling from your bank's fraud department. We have detected suspicious activity on your account. Please install AnyDesk and share the 9-digit code so we can secure your account immediately.",
  },
  {
    id: "electricity-disconnect",
    category: "Utility",
    label: "Electricity Power Disconnection",
    description: "Evening power disconnection threat demanding direct transfer to personal VPA.",
    text: "Dear consumer, your electricity service will be disconnected tonight at 9:30 PM due to unpaid bill. Contact our officer immediately on 8123456789 or pay via UPI: powerboard@okaxis",
  },
  // Legitimate / Advisory Control Cases (Negative Tests)
  {
    id: "safe-advisory",
    category: "Control / Safe",
    label: "Official Bank Advisory (Safe Control)",
    description: "Legitimate fraud prevention advisory warning customers never to share OTP.",
    text: "SBI Advisory: Never share your OTP, UPI PIN, CVV, or passwords with anyone, including bank officials. SBI never asks for confidential details via SMS or phone call.",
    isBenign: true,
  },
  {
    id: "safe-upi-txn",
    category: "Control / Safe",
    label: "Legitimate UPI Transaction (Safe Control)",
    description: "Standard transactional receipt for an authorized payment with no call-to-action.",
    text: "Your UPI payment of ₹500 to Swiggy was successful on 20-Sep-2026. Ref No: 426189032114. A/c debited: **4312. If not done by you, report to your bank.",
    isBenign: true,
  },
  {
    id: "safe-branch-kyc",
    category: "Control / Safe",
    label: "Official Branch Visit Notice (Safe Control)",
    description: "Legitimate non-urgent KYC compliance notice asking customer to visit their physical branch.",
    text: "Dear Customer, periodic KYC review is due for your account. Please visit your home branch with original identity and address documents at your convenience.",
    isBenign: true,
  },
  {
    id: "safe-peer-warning",
    category: "Control / Safe",
    label: "Scam Awareness Alert (Safe Control)",
    description: "Adversarial test: Contains scam keywords and UPI in an educational warning context.",
    text: "Police Cyber Alert: Beware of fake electricity bill SMS messages asking you to transfer money to an individual UPI address to prevent power cut. Fraudsters use these threats. Do not click links or send funds. Stay safe.",
    isBenign: true,
  },
];
