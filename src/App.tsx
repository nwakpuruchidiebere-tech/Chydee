import React, { useState, useEffect } from 'react';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  db,
  auth,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  uploadReceiptToDrive,
  listPaySocialDriveFiles,
  deleteDriveFile,
  sendGmailPaymentNotice,
  listGmailPaymentMessages,
  fetchGoogleContacts,
} from './lib/workspace';
import { Navbar } from './components/Navbar';
import { SocialFeed } from './components/SocialFeed';
import { SendPaymentModal } from './components/SendPaymentModal';
import { SocialAccountsHub } from './components/SocialAccountsHub';
import { GoogleWorkspaceHub } from './components/GoogleWorkspaceHub';
import { AiStudioModal } from './components/AiStudioModal';
import { DestructiveConfirmModal } from './components/DestructiveConfirmModal';
import {
  Transaction,
  UserProfile,
  GoogleContact,
  DriveReceiptFile,
  GmailMessageItem,
} from './types';
import {
  generateAccountNumber,
  formatAccountNumber,
  maskAccountNumber,
  PAYSOCIAL_DEFAULT_ROUTING,
  PAYSOCIAL_ACCOUNT_TYPE,
} from './lib/accountUtils';
import {
  CreditCard,
  Send,
  Users,
  HardDrive,
  Mail,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Share2,
  Lock,
  Globe,
  Loader2,
  ArrowRight,
  Sun,
  Moon,
  Copy,
} from 'lucide-react';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'socials' | 'workspace' | 'ai'>('feed');

  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Google Workspace data
  const [driveFiles, setDriveFiles] = useState<DriveReceiptFile[]>([]);
  const [gmailMessages, setGmailMessages] = useState<GmailMessageItem[]>([]);
  const [googleContacts, setGoogleContacts] = useState<GoogleContact[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Modals state
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendModalInitialRecipient, setSendModalInitialRecipient] = useState('');
  const [sendModalInitialUsername, setSendModalInitialUsername] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalInitialTool, setAiModalInitialTool] = useState<'live' | 'receipt' | 'omni-video' | 'thinking' | 'grounding'>('live');

  // Destructive / Workspace Confirmation Modal state
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    affectedItem?: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Initial Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setFirebaseUser(user);
        setAccessToken(token);
        setNeedsAuth(false);
        await syncUserProfile(user);
        if (token) {
          loadWorkspaceData(token);
        }
      },
      () => {
        setFirebaseUser(null);
        setCurrentUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync / create User Profile in Firestore with Automatically Generated Account Number
  const syncUserProfile = async (user: User) => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // Automatically generate account number if not present on profile
        if (!data.accountNumber) {
          const autoAccNumber = generateAccountNumber(user.uid);
          const updatedProfile: UserProfile = {
            ...data,
            accountNumber: autoAccNumber,
            routingNumber: data.routingNumber || PAYSOCIAL_DEFAULT_ROUTING,
            accountType: data.accountType || PAYSOCIAL_ACCOUNT_TYPE,
            updatedAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, updatedProfile, { merge: true });
          setCurrentUser(updatedProfile);
        } else {
          setCurrentUser(data);
        }
      } else {
        const autoAccNumber = generateAccountNumber(user.uid);
        const defaultProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || 'PaySocial User',
          username: (user.displayName || 'user')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 15) || 'user',
          email: user.email || undefined,
          photoURL: user.photoURL || undefined,
          bio: 'Connecting payments with social media on PaySocial 🚀',
          balance: 2450.0,
          accountNumber: autoAccNumber,
          routingNumber: PAYSOCIAL_DEFAULT_ROUTING,
          accountType: PAYSOCIAL_ACCOUNT_TYPE,
          socialTwitter: 'alexsmith',
          socialInstagram: 'alex_builds',
          socialTikTok: 'alex_social',
          socialYouTube: 'AlexSmithTech',
          socialGitHub: 'alex-smith',
          socialDiscord: 'alex#1337',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, defaultProfile);
        setCurrentUser(defaultProfile);
      }
    } catch (err) {
      console.error('Error syncing user profile:', err);
      // Fallback local representation with automatically generated account number
      const autoAccNumber = generateAccountNumber(user.uid);
      setCurrentUser({
        uid: user.uid,
        displayName: user.displayName || 'PaySocial User',
        username: 'user_' + user.uid.slice(0, 5),
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
        bio: 'Connecting payments with social media on PaySocial 🚀',
        balance: 2450.0,
        accountNumber: autoAccNumber,
        routingNumber: PAYSOCIAL_DEFAULT_ROUTING,
        accountType: PAYSOCIAL_ACCOUNT_TYPE,
        socialTwitter: 'alexsmith',
        socialInstagram: 'alex_builds',
        socialTikTok: 'alex_social',
        socialYouTube: 'AlexSmithTech',
        socialGitHub: 'alex-smith',
        socialDiscord: 'alex#1337',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Real-time Firestore Transactions Listener
  useEffect(() => {
    // Provide vibrant initial social payment transactions with automatically generated account numbers
    const seedTransactions: Transaction[] = [
      {
        id: 'tx_welcome_1',
        senderId: 'user_sarah',
        senderName: 'Sarah Jenkins',
        senderUsername: 'sarah_j',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        senderAccountNumber: '8810293847',
        receiverId: 'user_alex',
        receiverName: 'Alex Smith',
        receiverUsername: 'alexsmith',
        receiverAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        receiverAccountNumber: '8849201842',
        amount: 42.5,
        currency: 'USD',
        note: 'Sushi dinner & matcha boba split 🍣🍵',
        emoji: '🍱',
        category: 'dinner',
        visibility: 'public',
        status: 'completed',
        likes: ['user_marcus', 'user_elena'],
        createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      },
      {
        id: 'tx_welcome_2',
        senderId: 'user_marcus',
        senderName: 'Marcus Vance',
        senderUsername: 'marcus_v',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        senderAccountNumber: '8839104829',
        receiverId: 'user_elena',
        receiverName: 'Elena Rostova',
        receiverUsername: 'elena_design',
        receiverAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        receiverAccountNumber: '8857291048',
        amount: 120.0,
        currency: 'USD',
        note: 'Concert tickets for Friday night tour 🎸🔥',
        emoji: '🎟️',
        category: 'tickets',
        visibility: 'public',
        status: 'pending',
        likes: ['user_sarah'],
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      {
        id: 'tx_welcome_3',
        senderId: 'user_elena',
        senderName: 'Elena Rostova',
        senderUsername: 'elena_design',
        senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        senderAccountNumber: '8857291048',
        receiverId: 'user_alex',
        receiverName: 'Alex Smith',
        receiverUsername: 'alexsmith',
        receiverAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        receiverAccountNumber: '8849201842',
        amount: 6.75,
        currency: 'USD',
        note: 'Morning iced oat latte on you ☕',
        emoji: '☕',
        category: 'coffee',
        visibility: 'public',
        status: 'completed',
        likes: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      },
      {
        id: 'tx_welcome_4',
        senderId: 'user_alex',
        senderName: 'Alex Smith',
        senderUsername: 'alexsmith',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        senderAccountNumber: '8849201842',
        receiverId: 'user_sarah',
        receiverName: 'Sarah Jenkins',
        receiverUsername: 'sarah_j',
        receiverAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        receiverAccountNumber: '8810293847',
        amount: 15.5,
        currency: 'USD',
        note: 'Airport shuttle ride split 🚕✈️',
        emoji: '🚕',
        category: 'travel',
        visibility: 'public',
        status: 'pending',
        likes: ['user_alex'],
        createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      },
    ];

    if (!firebaseUser) {
      setTransactions((prev) => (prev.length > 0 ? prev : seedTransactions));
      return;
    }

    const txColRef = collection(db, 'transactions');
    const qPublic = query(txColRef, where('visibility', '==', 'public'));

    const unsubscribePublic = onSnapshot(
      qPublic,
      (snapshot) => {
        const items: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });

        // Sort by creation date descending
        items.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        if (items.length === 0) {
          setTransactions(seedTransactions);
        } else {
          setTransactions(items);
        }
      },
      (error) => {
        console.warn('Transactions onSnapshot error handled gracefully:', error.message);
        setTransactions((prev) => (prev.length > 0 ? prev : seedTransactions));
      }
    );

    return () => {
      unsubscribePublic();
    };
  }, [firebaseUser]);

  // Load Google Workspace Data
  const loadWorkspaceData = async (token: string) => {
    // 1. Google Drive files
    setIsLoadingDrive(true);
    listPaySocialDriveFiles(token)
      .then((files) => setDriveFiles(files))
      .catch((err) => console.warn('Drive files load error:', err))
      .finally(() => setIsLoadingDrive(false));

    // 2. Gmail messages
    setIsLoadingGmail(true);
    listGmailPaymentMessages(token)
      .then((msgs) => setGmailMessages(msgs))
      .catch((err) => console.warn('Gmail messages load error:', err))
      .finally(() => setIsLoadingGmail(false));

    // 3. Google Contacts
    setIsLoadingContacts(true);
    fetchGoogleContacts(token)
      .then((contacts) => setGoogleContacts(contacts))
      .catch((err) => console.warn('Contacts load error:', err))
      .finally(() => setIsLoadingContacts(false));
  };

  // Sign In Handler
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setFirebaseUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        await syncUserProfile(result.user);
        if (result.accessToken) {
          loadWorkspaceData(result.accessToken);
        }
      }
    } catch (err) {
      console.error('Google Sign In failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign Out Handler
  const handleLogout = async () => {
    await logout();
    setFirebaseUser(null);
    setCurrentUser(null);
    setAccessToken(null);
    setNeedsAuth(true);
  };

  // Send / Split Payment Action
  const handleExecutePayment = async (data: {
    receiverName: string;
    receiverUsername: string;
    receiverAccountNumber?: string;
    amount: number;
    currency: string;
    note: string;
    emoji: string;
    category: string;
    visibility: 'public' | 'friends' | 'private';
    status?: 'completed' | 'pending';
    customCardUrl?: string;
  }) => {
    const currentUid = currentUser?.uid || 'guest';
    const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const autoRecipientAccount =
      data.receiverAccountNumber || generateAccountNumber(data.receiverUsername || data.receiverName);

    const newTx: Transaction = {
      id: txId,
      senderId: currentUid,
      senderName: currentUser?.displayName || 'Alex Smith',
      senderUsername: currentUser?.username || 'alexsmith',
      senderAvatar: currentUser?.photoURL,
      senderAccountNumber: currentUser?.accountNumber || generateAccountNumber(currentUid),
      receiverId: 'usr_' + data.receiverUsername,
      receiverName: data.receiverName,
      receiverUsername: data.receiverUsername,
      receiverAccountNumber: autoRecipientAccount,
      amount: data.amount,
      currency: data.currency,
      note: data.note,
      emoji: data.emoji,
      category: data.category,
      visibility: data.visibility,
      status: data.status || 'completed',
      likes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Save in Firestore
      await setDoc(doc(db, 'transactions', txId), newTx);

      // Deduct balance
      if (currentUser) {
        const updatedBalance = Math.max(0, currentUser.balance - data.amount);
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { balance: updatedBalance, updatedAt: new Date().toISOString() });
        setCurrentUser({ ...currentUser, balance: updatedBalance });
      }
    } catch (err) {
      console.warn('Firestore write fallback:', err);
      // Update local state smoothly
      setTransactions((prev) => [newTx, ...prev]);
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          balance: Math.max(0, currentUser.balance - data.amount),
        });
      }
    }
  };

  // Automatically Regenerate Payment Account Number (User Action)
  const handleRegenerateAccountNumber = async () => {
    if (!currentUser) return;
    const newAccountNumber = generateAccountNumber();
    const updatedUser: UserProfile = {
      ...currentUser,
      accountNumber: newAccountNumber,
      routingNumber: currentUser.routingNumber || PAYSOCIAL_DEFAULT_ROUTING,
      accountType: currentUser.accountType || PAYSOCIAL_ACCOUNT_TYPE,
      updatedAt: new Date().toISOString(),
    };
    setCurrentUser(updatedUser);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        accountNumber: newAccountNumber,
        routingNumber: updatedUser.routingNumber,
        accountType: updatedUser.accountType,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Failed to update regenerated account number in Firestore:', err);
    }
  };

  // Like / Heart Reaction
  const handleLikeTransaction = async (txId: string) => {
    if (!currentUser) return;
    const target = transactions.find((t) => t.id === txId);
    if (!target) return;

    const currentLikes = target.likes || [];
    const hasLiked = currentLikes.includes(currentUser.uid);
    const newLikes = hasLiked
      ? currentLikes.filter((id) => id !== currentUser.uid)
      : [...currentLikes, currentUser.uid];

    try {
      const txRef = doc(db, 'transactions', txId);
      await updateDoc(txRef, { likes: newLikes });
    } catch (err) {
      console.warn('Firestore like fallback:', err);
      setTransactions((prev) =>
        prev.map((t) => (t.id === txId ? { ...t, likes: newLikes } : t))
      );
    }
  };

  // Google Workspace: Request Save to Drive (MANDATORY User Confirmation)
  const handleRequestSaveToDrive = (tx: Transaction) => {
    if (!accessToken) {
      alert('Please reconnect your Google account to grant Google Drive permissions.');
      return;
    }

    setConfirmModalConfig({
      isOpen: true,
      title: 'Export Receipt to Google Drive?',
      description: `Save an official HTML payment receipt for "$${tx.amount.toFixed(2)} to ${tx.receiverName}" in your personal Google Drive account.`,
      affectedItem: `Receipt: ${tx.note} ($${tx.amount.toFixed(2)})`,
      confirmLabel: 'Save to Google Drive',
      isDestructive: false,
      onConfirm: async () => {
        try {
          const driveResult = await uploadReceiptToDrive(accessToken, {
            transactionId: tx.id,
            senderName: tx.senderName,
            receiverName: tx.receiverName,
            amount: tx.amount,
            currency: tx.currency,
            note: tx.note,
            date: tx.createdAt,
            socialTag: currentUser?.username ? `@${currentUser.username}` : undefined,
          });

          // Update transaction with driveReceiptId
          const txRef = doc(db, 'transactions', tx.id);
          try {
            await updateDoc(txRef, { driveReceiptId: driveResult.id });
          } catch (e) {
            // fallback
          }

          setTransactions((prev) =>
            prev.map((t) => (t.id === tx.id ? { ...t, driveReceiptId: driveResult.id } : t))
          );

          // Refresh Drive list
          listPaySocialDriveFiles(accessToken).then((files) => setDriveFiles(files));
        } catch (err: any) {
          console.error('Failed to save to Drive:', err);
          alert('Could not save to Drive: ' + err.message);
        } finally {
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Google Workspace: Request Export Full Statement to Drive (MANDATORY User Confirmation)
  const handleExportStatementToDrive = () => {
    if (!accessToken) {
      alert('Please reconnect your Google account to access Google Drive.');
      return;
    }

    setConfirmModalConfig({
      isOpen: true,
      title: 'Export PaySocial Statement to Google Drive?',
      description: `Create a new comprehensive transaction statement file with all ${transactions.length} transactions and upload it to your Google Drive account.`,
      affectedItem: `File: PaySocial_Statement_${new Date().toISOString().slice(0, 10)}.html`,
      confirmLabel: 'Export Statement',
      isDestructive: false,
      onConfirm: async () => {
        try {
          await uploadReceiptToDrive(accessToken, {
            transactionId: 'STATEMENT_' + Date.now(),
            senderName: currentUser?.displayName || 'User',
            receiverName: 'PaySocial Financial Archive',
            amount: transactions.reduce((acc, curr) => acc + curr.amount, 0),
            currency: 'USD',
            note: `Monthly Statement: ${transactions.length} social payments and splits`,
            date: new Date().toISOString(),
          });

          listPaySocialDriveFiles(accessToken).then((files) => setDriveFiles(files));
        } catch (err: any) {
          console.error('Drive statement export failed:', err);
          alert('Export failed: ' + err.message);
        } finally {
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Google Workspace: Request Delete Receipt from Drive (MANDATORY User Confirmation)
  const handleDeleteDriveReceipt = (file: DriveReceiptFile) => {
    if (!accessToken) return;

    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Receipt from Google Drive?',
      description: `Are you sure you want to permanently remove "${file.name}" from your Google Drive? This action cannot be undone.`,
      affectedItem: `Drive File ID: ${file.id}`,
      confirmLabel: 'Permanently Delete',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDriveFile(accessToken, file.id);
          setDriveFiles((prev) => prev.filter((f) => f.id !== file.id));
        } catch (err: any) {
          console.error('Failed to delete Drive file:', err);
          alert('Could not delete file: ' + err.message);
        } finally {
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Google Workspace: Send Email Receipt via Gmail (MANDATORY User Confirmation)
  const handleRequestSendEmailReceipt = (tx: Transaction) => {
    if (!accessToken) {
      alert('Please reconnect your Google account to send emails via Gmail.');
      return;
    }

    const defaultRecipient = currentUser?.email || 'friend@example.com';

    setConfirmModalConfig({
      isOpen: true,
      title: 'Send Payment Receipt via Gmail?',
      description: `Send an official HTML payment confirmation email for "$${tx.amount.toFixed(2)}: ${tx.note}" to ${defaultRecipient} from your connected Gmail address.`,
      affectedItem: `Recipient: ${defaultRecipient} | Subject: PaySocial Receipt #${tx.id.slice(0, 8)}`,
      confirmLabel: 'Send Gmail Receipt',
      isDestructive: false,
      onConfirm: async () => {
        try {
          await sendGmailPaymentNotice(
            accessToken,
            defaultRecipient,
            `PaySocial Receipt: $${tx.amount.toFixed(2)} for ${tx.note}`,
            tx.amount,
            tx.senderName,
            tx.note,
            tx.id
          );
          alert(`Email sent successfully via Gmail to ${defaultRecipient}!`);
          listGmailPaymentMessages(accessToken).then((msgs) => setGmailMessages(msgs));
        } catch (err: any) {
          console.error('Gmail send error:', err);
          alert('Failed to send email via Gmail: ' + err.message);
        } finally {
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Google Workspace: Custom Gmail Notice
  const handleSendCustomGmail = (toEmail: string, subject: string, message: string) => {
    if (!accessToken) return;

    setConfirmModalConfig({
      isOpen: true,
      title: 'Send Custom Email via Gmail?',
      description: `Send this payment notification directly from your Gmail account to "${toEmail}".`,
      affectedItem: `To: ${toEmail} | Subject: ${subject}`,
      confirmLabel: 'Send Email',
      isDestructive: false,
      onConfirm: async () => {
        try {
          await sendGmailPaymentNotice(accessToken, toEmail, subject, 0, currentUser?.displayName || 'User', message, 'CUSTOM_' + Date.now());
          alert(`Email sent to ${toEmail}!`);
          listGmailPaymentMessages(accessToken).then((msgs) => setGmailMessages(msgs));
        } catch (err: any) {
          console.error('Gmail error:', err);
          alert('Gmail send failed: ' + err.message);
        } finally {
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Update User Social Accounts
  const handleUpdateSocials = async (updatedSocials: any) => {
    if (!currentUser) return;
    const merged = { ...currentUser, ...updatedSocials, updatedAt: new Date().toISOString() };
    setCurrentUser(merged);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, updatedSocials);
    } catch (err) {
      console.warn('Failed to update socials in Firestore:', err);
    }
  };

  // Quick Pay contact from Contacts list
  const handleSelectContactToPay = (contact: GoogleContact) => {
    setSendModalInitialRecipient(contact.displayName);
    setSendModalInitialUsername(contact.displayName.toLowerCase().replace(/\s+/g, '_'));
    setIsSendModalOpen(true);
  };

  const handlePayUserFromFeed = (recipientName: string, recipientUsername: string) => {
    setSendModalInitialRecipient(recipientName);
    setSendModalInitialUsername(recipientUsername);
    setIsSendModalOpen(true);
  };

  // If user needs authentication, render official "Sign in with Google" screen
  if (needsAuth) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-950'} flex flex-col justify-center items-center px-4 relative overflow-hidden transition-colors`}>
        {/* Top bar theme toggle */}
        <div className="absolute top-6 right-6 z-20">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to High-Contrast Light Mode' : 'Switch to Dark Mode'}
            title={isDark ? 'Switch to High-Contrast Light Mode' : 'Switch to Dark Mode'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border shadow-xs ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-800'
                : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-700" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Glow background */}
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${
          isDark
            ? 'bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/20'
            : 'bg-gradient-to-tr from-indigo-200/50 via-purple-200/40 to-pink-200/50'
        } rounded-full blur-[120px] pointer-events-none`} />

        <div className={`max-w-md w-full ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-300 shadow-xl'
        } border rounded-3xl p-8 shadow-2xl text-center relative z-10 space-y-6 transition-colors`}>
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/25 text-white font-black text-3xl">
            P
          </div>

          <div>
            <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
              Pay<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Social</span>
            </h1>
            <p className={`text-sm mt-2 ${isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
              The social payments network where peer-to-peer transfers meet your social media handles and Google Workspace.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className={`space-y-2.5 text-left p-4 rounded-2xl border text-xs ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <div className={`flex items-center gap-2.5 ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
              <Share2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>Link Twitter, Instagram, TikTok, YouTube & GitHub</span>
            </div>
            <div className={`flex items-center gap-2.5 ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
              <HardDrive className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>Auto-store payment receipts in Google Drive</span>
            </div>
            <div className={`flex items-center gap-2.5 ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
              <Mail className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>Send payment notices and receipts via Gmail</span>
            </div>
            <div className={`flex items-center gap-2.5 ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
              <Users className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Pay & split bills with Google Contacts directly</span>
            </div>
            <div className={`flex items-center gap-2.5 ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
              <Sparkles className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <span>Gemini 3.8 Live Voice, 4 Argon Vision & TTS</span>
            </div>
          </div>

          {/* Official Sign in with Google Button (per Workspace skill) */}
          <div className="pt-2">
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition hover:scale-[1.01] disabled:opacity-50 border ${
                isDark
                  ? 'bg-white hover:bg-slate-100 text-slate-900 border-transparent'
                  : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300'
              }`}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
            <p className={`text-[11px] mt-3 ${isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>
              Protected by Google Workspace OAuth & Firebase Auth
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors ${
      isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-950'
    }`}>
      {/* Navbar */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSendModal={() => {
          setSendModalInitialRecipient('');
          setSendModalInitialUsername('');
          setIsSendModalOpen(true);
        }}
        onOpenLiveVoice={() => {
          setAiModalInitialTool('live');
          setIsAiModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Views */}
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feed Main Column */}
            <div className="lg:col-span-2">
              <SocialFeed
                transactions={transactions}
                currentUser={currentUser}
                onLikeTransaction={handleLikeTransaction}
                onRequestSaveToDrive={handleRequestSaveToDrive}
                onRequestSendEmailReceipt={handleRequestSendEmailReceipt}
                onPayUser={handlePayUserFromFeed}
              />
            </div>

            {/* Sidebar Quick Access */}
            <div className="space-y-6">
              {/* User Balance & Fast Transfer Card */}
              <div className={`border rounded-3xl p-6 shadow-xl relative overflow-hidden transition-colors ${
                isDark
                  ? 'bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-900 border-indigo-500/30'
                  : 'bg-white border-2 border-indigo-200'
              }`}>
                <div className={`text-xs uppercase font-bold tracking-wider ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>Available Balance</div>
                <div className={`text-3xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  ${currentUser?.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>PaySocial Instant Balance</p>

                {/* Automatically Generated Account Number Display */}
                <div className={`mt-4 pt-3.5 border-t flex items-center justify-between gap-2 ${
                  isDark ? 'border-indigo-500/20 text-slate-300' : 'border-indigo-100 text-slate-700'
                }`}>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">PaySocial Account #</div>
                    <div className="text-xs font-mono font-bold tracking-wider truncate">
                      {formatAccountNumber(currentUser?.accountNumber || '8849201842')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentUser?.accountNumber || '8849201842');
                      alert('Account Number copied to clipboard!');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition shrink-0 ${
                      isDark
                        ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/30'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                    }`}
                    title="Copy 10-digit Account Number"
                  >
                    <Copy className="w-3 h-3 text-indigo-400" />
                    <span>Copy</span>
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSendModalInitialRecipient('');
                      setSendModalInitialUsername('');
                      setIsSendModalOpen(true);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send / Split</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('socials')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      isDark
                        ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/60'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>My Socials</span>
                  </button>
                </div>
              </div>

              {/* Connected Socials Snapshot */}
              <div className={`border rounded-3xl p-6 shadow-xl space-y-4 transition-colors ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    <Share2 className="w-4 h-4 text-indigo-500" />
                    Linked Social Profiles
                  </h3>
                  <button
                    onClick={() => setActiveTab('socials')}
                    className={`text-xs font-semibold hover:underline ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}
                  >
                    Manage
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {currentUser?.socialTwitter && (
                    <div className={`flex items-center justify-between p-2 rounded-xl border ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-sky-600 dark:text-sky-400 font-semibold">Twitter / X</span>
                      <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>@{currentUser.socialTwitter}</span>
                    </div>
                  )}
                  {currentUser?.socialInstagram && (
                    <div className={`flex items-center justify-between p-2 rounded-xl border ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-pink-600 dark:text-pink-400 font-semibold">Instagram</span>
                      <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>@{currentUser.socialInstagram}</span>
                    </div>
                  )}
                  {currentUser?.socialGitHub && (
                    <div className={`flex items-center justify-between p-2 rounded-xl border ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>GitHub</span>
                      <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>@{currentUser.socialGitHub}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Gemini Financial AI Banner */}
              <div className={`border rounded-3xl p-6 shadow-xl space-y-3 transition-colors ${
                isDark
                  ? 'bg-gradient-to-br from-pink-950/30 via-slate-900 to-purple-950/30 border-pink-500/30'
                  : 'bg-white border-2 border-pink-200'
              }`}>
                <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">AI Studio Suite</span>
                </div>
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Live Voice, Vision & Omni Video</h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                  Try the hands-free Gemini 3.8 Live voice concierge or scan your physical receipt with Gemini 4 Argon.
                </p>
                <button
                  onClick={() => {
                    setAiModalInitialTool('receipt');
                    setIsAiModalOpen(true);
                  }}
                  className={`w-full py-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isDark
                      ? 'bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border-pink-500/30'
                      : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-300'
                  }`}
                >
                  <span>Open AI Financial Tools</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'socials' && (
          <SocialAccountsHub
            currentUser={currentUser}
            onUpdateSocials={handleUpdateSocials}
            onRegenerateAccountNumber={handleRegenerateAccountNumber}
          />
        )}

        {activeTab === 'workspace' && (
          <GoogleWorkspaceHub
            accessToken={accessToken}
            driveFiles={driveFiles}
            gmailMessages={gmailMessages}
            googleContacts={googleContacts}
            isLoadingDrive={isLoadingDrive}
            isLoadingGmail={isLoadingGmail}
            isLoadingContacts={isLoadingContacts}
            onRefreshDrive={() => accessToken && loadWorkspaceData(accessToken)}
            onRefreshGmail={() => accessToken && loadWorkspaceData(accessToken)}
            onRefreshContacts={() => accessToken && loadWorkspaceData(accessToken)}
            onExportStatementToDrive={handleExportStatementToDrive}
            onDeleteDriveReceipt={handleDeleteDriveReceipt}
            onSendCustomGmail={handleSendCustomGmail}
            onSelectContactToPay={handleSelectContactToPay}
          />
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className={`border rounded-3xl p-8 shadow-2xl transition-colors ${
              isDark
                ? 'bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-indigo-900/60 border-purple-500/30'
                : 'bg-white border-2 border-purple-200'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-pink-500" />
                <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>AI Financial Intelligence Studio</h2>
              </div>
              <p className={`text-xs max-w-2xl leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                Powered by Google Gemini models: Live Voice Conversations (gemini-3.8-live), Receipt Vision (gemini-4-argon), Video Generation (gemini-omni-1.1-flash), Text-to-Speech (gemini-3.8-flash-tts), and High Thinking Advisor (gemini-4-argon with ThinkingLevel.HIGH).
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => {
                    setAiModalInitialTool('live');
                    setIsAiModalOpen(true);
                  }}
                  className={`p-4 rounded-2xl border text-left transition shadow hover:scale-[1.02] ${
                    isDark
                      ? 'bg-slate-950/80 hover:bg-slate-900 border-pink-500/40'
                      : 'bg-slate-50 hover:bg-white border-pink-300'
                  }`}
                >
                  <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest block mb-1">
                    gemini-3.8-live
                  </span>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Live Voice Concierge</h4>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Real-time bidirectional speech</p>
                </button>

                <button
                  onClick={() => {
                    setAiModalInitialTool('receipt');
                    setIsAiModalOpen(true);
                  }}
                  className={`p-4 rounded-2xl border text-left transition shadow hover:scale-[1.02] ${
                    isDark
                      ? 'bg-slate-950/80 hover:bg-slate-900 border-indigo-500/40'
                      : 'bg-slate-50 hover:bg-white border-indigo-300'
                  }`}
                >
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-1">
                    gemini-4-argon
                  </span>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Receipt & Vision Scanner</h4>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Extract line items & bill splits</p>
                </button>

                <button
                  onClick={() => {
                    setAiModalInitialTool('omni-video');
                    setIsAiModalOpen(true);
                  }}
                  className={`p-4 rounded-2xl border text-left transition shadow hover:scale-[1.02] ${
                    isDark
                      ? 'bg-slate-950/80 hover:bg-slate-900 border-purple-500/40'
                      : 'bg-slate-50 hover:bg-white border-purple-300'
                  }`}
                >
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest block mb-1">
                    gemini-omni-1.1-flash
                  </span>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Celebration Video</h4>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>16:9 & 9:16 social video stories</p>
                </button>

                <button
                  onClick={() => {
                    setAiModalInitialTool('thinking');
                    setIsAiModalOpen(true);
                  }}
                  className={`p-4 rounded-2xl border text-left transition shadow hover:scale-[1.02] ${
                    isDark
                      ? 'bg-slate-950/80 hover:bg-slate-900 border-amber-500/40'
                      : 'bg-slate-50 hover:bg-white border-amber-300'
                  }`}
                >
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block mb-1">
                    gemini-4-argon
                  </span>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>High Thinking Advisor</h4>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>ThinkingLevel.HIGH strategic math</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Send Payment Modal */}
      <SendPaymentModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        currentUser={currentUser}
        googleContacts={googleContacts}
        initialRecipientName={sendModalInitialRecipient}
        initialRecipientUsername={sendModalInitialUsername}
        onExecutePayment={handleExecutePayment}
      />

      {/* AI Studio Modal */}
      <AiStudioModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialTool={aiModalInitialTool}
      />

      {/* Workspace Destructive / Mutation Confirmation Modal */}
      <DestructiveConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        description={confirmModalConfig.description}
        affectedItem={confirmModalConfig.affectedItem}
        confirmLabel={confirmModalConfig.confirmLabel}
        isDestructive={confirmModalConfig.isDestructive}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
