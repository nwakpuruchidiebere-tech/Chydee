import React, { useState } from 'react';
import {
  HardDrive,
  Mail,
  Users,
  ExternalLink,
  Trash2,
  Send,
  Download,
  Search,
  CheckCircle2,
  RefreshCw,
  Loader2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { DriveReceiptFile, GmailMessageItem, GoogleContact, Transaction } from '../types';
import { useTheme } from '../context/ThemeContext';

interface GoogleWorkspaceHubProps {
  accessToken: string | null;
  driveFiles: DriveReceiptFile[];
  gmailMessages: GmailMessageItem[];
  googleContacts: GoogleContact[];
  isLoadingDrive: boolean;
  isLoadingGmail: boolean;
  isLoadingContacts: boolean;
  onRefreshDrive: () => void;
  onRefreshGmail: () => void;
  onRefreshContacts: () => void;
  onExportStatementToDrive: () => void;
  onDeleteDriveReceipt: (file: DriveReceiptFile) => void;
  onSendCustomGmail: (toEmail: string, subject: string, message: string) => void;
  onSelectContactToPay: (contact: GoogleContact) => void;
}

export const GoogleWorkspaceHub: React.FC<GoogleWorkspaceHubProps> = ({
  accessToken,
  driveFiles,
  gmailMessages,
  googleContacts,
  isLoadingDrive,
  isLoadingGmail,
  isLoadingContacts,
  onRefreshDrive,
  onRefreshGmail,
  onRefreshContacts,
  onExportStatementToDrive,
  onDeleteDriveReceipt,
  onSendCustomGmail,
  onSelectContactToPay,
}) => {
  const { isDark } = useTheme();
  const [subTab, setSubTab] = useState<'drive' | 'gmail' | 'contacts'>('drive');

  // Gmail Compose form state
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('Payment Notice from PaySocial');
  const [emailBody, setEmailBody] = useState('Hey! Here is the confirmation for our payment on PaySocial.');

  // Contacts search filter
  const [contactSearch, setContactSearch] = useState('');

  const filteredContacts = googleContacts.filter((c) => {
    if (!contactSearch.trim()) return true;
    const q = contactSearch.toLowerCase();
    return (
      c.displayName.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phoneNumber && c.phoneNumber.includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Workspace Hub Navigation Header */}
      <div className={`border rounded-3xl p-6 shadow-xl transition-colors ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold">
                W
              </div>
              <h2 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>Google Workspace Integration</h2>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
              Seamlessly connected with Google Drive, Gmail, and Google Contacts.
            </p>
          </div>

          {/* Subtabs */}
          <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl border transition-colors ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-300'
          }`}>
            <button
              onClick={() => setSubTab('drive')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                subTab === 'drive'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
              }`}
            >
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span>Drive Receipts ({driveFiles.length})</span>
            </button>

            <button
              onClick={() => setSubTab('gmail')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                subTab === 'gmail'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
              }`}
            >
              <Mail className="w-4 h-4 text-rose-400" />
              <span>Gmail Notices ({gmailMessages.length})</span>
            </button>

            <button
              onClick={() => setSubTab('contacts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                subTab === 'contacts'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Google Contacts ({googleContacts.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Google Drive Tab */}
      {subTab === 'drive' && (
        <div className={`border rounded-3xl p-6 shadow-xl space-y-6 transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div>
              <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                <HardDrive className="w-4 h-4 text-blue-500" />
                Google Drive Receipts & Payment Archives
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                Every exported receipt is stored safely as an HTML document inside your Google Drive.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={onRefreshDrive}
                disabled={isLoadingDrive}
                className={`p-2 rounded-xl transition border ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
                title="Refresh Drive files"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingDrive ? 'animate-spin text-blue-500' : ''}`} />
              </button>

              <button
                onClick={onExportStatementToDrive}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Statement to Drive</span>
              </button>
            </div>
          </div>

          {isLoadingDrive ? (
            <div className={`py-12 text-center flex flex-col items-center justify-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs font-medium">Fetching payment receipts from Google Drive...</span>
            </div>
          ) : driveFiles.length === 0 ? (
            <div className={`py-12 text-center border border-dashed rounded-2xl p-8 ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-600'
            }`}>
              <FileText className="w-10 h-10 text-blue-500/40 mx-auto mb-2" />
              <p className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>No PaySocial receipts found in Google Drive</p>
              <p className={`text-xs max-w-sm mx-auto mb-4 ${isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>
                Click "Drive Receipt" on any payment in the Social Feed or use the "Export Statement" button above.
              </p>
              <button
                onClick={onExportStatementToDrive}
                className="px-4 py-2 rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 text-xs font-bold hover:bg-blue-600/20 transition"
              >
                Generate First Drive Statement
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {driveFiles.map((file) => (
                <div
                  key={file.id}
                  className={`border rounded-2xl p-4 flex items-center justify-between gap-3 transition shadow-sm ${
                    isDark
                      ? 'bg-slate-950/70 border-slate-800/90 hover:border-blue-500/40'
                      : 'bg-slate-50 border-slate-300 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-950'}`}>{file.name}</h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                        {file.createdTime ? new Date(file.createdTime).toLocaleDateString() : 'Stored in Drive'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className={`p-2 rounded-lg transition border ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-transparent'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                        title="Open in Google Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => onDeleteDriveReceipt(file)}
                      className={`p-2 rounded-lg transition border ${
                        isDark
                          ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border-transparent'
                          : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-300'
                      }`}
                      title="Delete from Google Drive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Gmail Tab */}
      {subTab === 'gmail' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Payment Notice via Gmail */}
          <div className={`border rounded-3xl p-6 shadow-xl space-y-4 transition-colors ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
          }`}>
            <div className={`flex items-center gap-2 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <Mail className="w-4 h-4 text-rose-500" />
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Send Payment Notice via Gmail</h3>
            </div>

            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
              Send an official PaySocial payment notification or money request email directly from your authenticated Gmail address.
            </p>

            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Recipient Email:</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="friend@gmail.com"
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    isDark
                      ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Subject:</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    isDark
                      ? 'bg-slate-950/80 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-950'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Message Body:</label>
                <textarea
                  rows={3}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    isDark
                      ? 'bg-slate-950/80 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-950'
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (recipientEmail) {
                    onSendCustomGmail(recipientEmail, emailSubject, emailBody);
                  }
                }}
                disabled={!recipientEmail.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Send Email via Gmail
              </button>
            </div>
          </div>

          {/* Recent Payment Emails */}
          <div className={`border rounded-3xl p-6 shadow-xl space-y-4 transition-colors ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-500" />
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Payment Messages in Gmail</h3>
              </div>
              <button
                onClick={onRefreshGmail}
                disabled={isLoadingGmail}
                className={`p-1.5 rounded-lg transition border ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
                title="Refresh Gmail messages"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGmail ? 'animate-spin text-rose-500' : ''}`} />
              </button>
            </div>

            {isLoadingGmail ? (
              <div className={`py-12 text-center flex flex-col items-center justify-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                <span className="text-xs font-medium">Reading Gmail inbox...</span>
              </div>
            ) : gmailMessages.length === 0 ? (
              <div className={`py-8 text-center border border-dashed rounded-2xl p-6 ${
                isDark ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-600'
              }`}>
                <Mail className="w-8 h-8 text-rose-500/40 mx-auto mb-2" />
                <p className={`text-xs font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>No payment emails found</p>
                <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>Emails mentioning PaySocial or receipts will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {gmailMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl border text-xs transition ${
                      isDark
                        ? 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`font-bold truncate max-w-[200px] ${isDark ? 'text-white' : 'text-slate-950'}`}>{msg.subject}</span>
                      <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500 font-semibold'}`}>{msg.date ? new Date(msg.date).toLocaleDateString() : ''}</span>
                    </div>
                    <div className="text-[11px] text-rose-600 dark:text-rose-300 font-semibold mb-1">From: {msg.from}</div>
                    <p className={`text-[11px] line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>{msg.snippet}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Google Contacts Tab */}
      {subTab === 'contacts' && (
        <div className={`border rounded-3xl p-6 shadow-xl space-y-6 transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div>
              <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                <Users className="w-4 h-4 text-indigo-500" />
                Google Contacts
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                Quickly send or split money with your synced Google Contacts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-48 sm:w-64">
                <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Filter contacts..."
                  className={`w-full border rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark
                      ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-950 placeholder-slate-400'
                  }`}
                />
              </div>

              <button
                onClick={onRefreshContacts}
                disabled={isLoadingContacts}
                className={`p-2 rounded-xl transition border ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
                title="Refresh contacts"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingContacts ? 'animate-spin text-indigo-500' : ''}`} />
              </button>
            </div>
          </div>

          {isLoadingContacts ? (
            <div className={`py-12 text-center flex flex-col items-center justify-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs font-medium">Loading contacts from Google People API...</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className={`py-12 text-center border border-dashed rounded-2xl p-8 ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-600'
            }`}>
              <Users className="w-10 h-10 text-indigo-500/40 mx-auto mb-2" />
              <p className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>No contacts found</p>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>
                {contactSearch ? 'No contacts matched your search filter.' : 'Your Google Contacts will show up here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.resourceName}
                  className={`border rounded-2xl p-4 flex items-center justify-between gap-3 transition shadow-sm ${
                    isDark
                      ? 'bg-slate-950/70 border-slate-800/90 hover:border-indigo-500/40'
                      : 'bg-slate-50 border-slate-300 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {contact.photoUrl ? (
                      <img src={contact.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
                        {contact.displayName.charAt(0)}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-950'}`}>{contact.displayName}</h4>
                      <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                        {contact.email || contact.phoneNumber || 'Google Contact'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectContactToPay(contact)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    Pay
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
