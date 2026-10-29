export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  email?: string;
  photoURL?: string;
  bio?: string;
  balance: number;
  accountNumber?: string;
  routingNumber?: string;
  accountType?: string;
  socialTwitter?: string;
  socialInstagram?: string;
  socialTikTok?: string;
  socialYouTube?: string;
  socialGitHub?: string;
  socialDiscord?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername?: string;
  senderAvatar?: string;
  senderAccountNumber?: string;
  receiverId: string;
  receiverName: string;
  receiverUsername?: string;
  receiverAvatar?: string;
  receiverAccountNumber?: string;
  amount: number;
  currency: string;
  note: string;
  emoji?: string;
  category?: string;
  visibility: 'public' | 'friends' | 'private';
  status: 'completed' | 'pending' | 'cancelled';
  likes?: string[];
  commentsCount?: number;
  driveReceiptId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterUsername?: string;
  requesterAvatar?: string;
  payerId: string;
  payerName: string;
  amount: number;
  currency: string;
  note: string;
  status: 'pending' | 'paid' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export interface GoogleContact {
  resourceName: string;
  displayName: string;
  email?: string;
  photoUrl?: string;
  phoneNumber?: string;
}

export interface DriveReceiptFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  webViewLink?: string;
  size?: string;
}

export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}
