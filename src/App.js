import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, FileText, Upload, Bookmark, Plus, 
  Sparkles, Clock, Trash2, Download, Copy, Check, Menu, X,
  FolderOpen, MessageSquare, Beaker, Atom,
  Star, ThumbsUp, ThumbsDown, Loader2, User,
  Globe, ExternalLink, Database, FileUp, CheckCircle, AlertCircle,
  Eye, Archive, GraduationCap, FileDown, MessageCircle,
  ChevronDown, ChevronUp, Microscope, RefreshCw, UserCircle,
  Lightbulb, ArrowRight
} from 'lucide-react';

// ============ CONFIGURATION ============
// All webhook URLs are loaded from environment variables
const CONFIG = {
  TEXT_WEBHOOK_URL: process.env.REACT_APP_TEXT_WEBHOOK_URL,
  IMAGE_WEBHOOK_URL: process.env.REACT_APP_IMAGE_WEBHOOK_URL,
  UPLOAD_WEBHOOK_URL: process.env.REACT_APP_UPLOAD_WEBHOOK_URL,
  WEB_DOC_WEBHOOK_URL: process.env.REACT_APP_WEB_DOC_WEBHOOK_URL,
  DOCS_REGISTRY_URL: process.env.REACT_APP_DOCS_REGISTRY_URL,
  FEEDBACK_WEBHOOK_URL: process.env.REACT_APP_FEEDBACK_WEBHOOK_URL,
  REQUEST_COOLDOWN: parseInt(process.env.REACT_APP_REQUEST_COOLDOWN || '180000', 10)
};

// ============ UTILITY FUNCTIONS ============
const logger = {
  info: (msg, data) => console.log(`🟢 [DrGini] ${msg}`, data || ''),
  error: (msg, data) => console.error(`🔴 [DrGini] ${msg}`, data || '')
};

const getSessionId = () => {
  let id = localStorage.getItem('dr_gini_session_id');
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('dr_gini_session_id', id);
  }
  return id;
};

const getUserId = () => {
  let id = localStorage.getItem('dr_gini_user_id');
  if (!id) {
    id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('dr_gini_user_id', id);
  }
  return id;
};

const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatTimeLeft = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
const formatSize = (bytes) => {
  if (typeof bytes === 'string') return bytes;
  return bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
const htmlToText = (html) => html?.replace(/<[^>]*>/g, '').replace(/\n\n+/g, '\n').trim() || '';

// ============ WEB SEARCH RESULTS COMPONENT ============
const WebSearchResults = ({ results, onAddToChat, onAddToKnowledge, onDownload }) => {
  const [expanded, setExpanded] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  if (!results || results.length === 0) return null;

  const handleAction = async (action, result) => {
    setProcessingId(result.id);
    await action(result);
    setProcessingId(null);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 my-4">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-800">Web Search Results</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">{results.length} found</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
      </button>
      {expanded && (
        <div className="space-y-3">
          {results.map((result, index) => (
            <div key={result.id || index} className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-800 text-sm">{result.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {result.source || 'Web'} {result.year && `• ${result.year}`} {result.authors && `• ${result.authors}`}
                  </p>
                  {result.abstract && <p className="text-xs text-slate-600 mt-2 line-clamp-2">{result.abstract}</p>}
                  <div className="flex items-center gap-2 mt-3">
                    {result.url && (
                      <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">
                        <ExternalLink className="w-3 h-3" /> View
                      </a>
                    )}
                    {result.pdfUrl && (
                      <button onClick={() => handleAction(onDownload, result)} disabled={processingId === result.id} className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50">
                        {processingId === result.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />} Download
                      </button>
                    )}
                    <button onClick={() => handleAction(onAddToChat, result)} disabled={processingId === result.id} className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50">
                      {processingId === result.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageCircle className="w-3 h-3" />} Chat
                    </button>
                    <button onClick={() => handleAction(onAddToKnowledge, result)} disabled={processingId === result.id} className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-50">
                      {processingId === result.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />} Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============ MOLECULAR IMAGE COMPONENT ============
const MolecularImage = ({ imageData }) => {
  const [imageStatus, setImageStatus] = useState('loading');
  const [showFullscreen, setShowFullscreen] = useState(false);

  if (!imageData || !imageData.image_url) return null;
  const { image_url, metadata = {} } = imageData;

  return (
    <>
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-200 rounded-xl p-5 my-4 shadow-sm">
        <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Beaker className="w-5 h-5 text-blue-600" />
            <h3 className="text-blue-800 font-bold text-lg">{metadata.compound || 'Molecular Structure'}</h3>
          </div>
          <div className="text-center p-3 relative min-h-48 bg-white rounded-lg">
            {imageStatus === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <span className="text-sm text-slate-500">Rendering structure...</span>
                </div>
              </div>
            )}
            {imageStatus === 'error' && (
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-600 font-medium">Failed to load</p>
                <button onClick={() => setImageStatus('loading')} className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Retry</button>
              </div>
            )}
            <img src={image_url} alt={metadata.compound || 'Structure'}
              className={`max-w-full h-auto rounded-lg mx-auto cursor-pointer hover:shadow-lg ${imageStatus === 'loaded' ? 'block' : 'hidden'}`}
              style={{ maxHeight: '300px' }}
              onLoad={() => setImageStatus('loaded')}
              onError={() => setImageStatus('error')}
              onClick={() => setShowFullscreen(true)}
            />
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-white rounded-lg p-2"><p className="text-xs text-slate-500">Compound</p><p className="font-medium text-slate-700">{metadata.compound || 'N/A'}</p></div>
            {metadata.formula && <div className="bg-white rounded-lg p-2"><p className="text-xs text-slate-500">Formula</p><p className="font-medium text-slate-700 font-mono">{metadata.formula}</p></div>}
            {metadata.cid && <div className="bg-white rounded-lg p-2"><p className="text-xs text-slate-500">PubChem CID</p><p className="font-medium text-slate-700">{metadata.cid}</p></div>}
            {metadata.molecular_weight && <div className="bg-white rounded-lg p-2"><p className="text-xs text-slate-500">Mol. Weight</p><p className="font-medium text-slate-700">{metadata.molecular_weight}</p></div>}
          </div>
        </div>
      </div>
      {showFullscreen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowFullscreen(false)}>
          <div className="relative max-w-4xl w-full">
            <button onClick={() => setShowFullscreen(false)} className="absolute -top-10 right-0 text-white hover:text-slate-300"><X className="w-6 h-6" /></button>
            <img src={image_url} alt={metadata.compound} className="max-w-full max-h-[80vh] mx-auto rounded-lg bg-white p-4" />
          </div>
        </div>
      )}
    </>
  );
};

// ============ UPLOAD MODAL ============
const UploadModal = ({ isOpen, onClose, onUpload, isUploading }) => {
  const [files, setFiles] = useState([]);
  const [addToKnowledge, setAddToKnowledge] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).map(f => ({ file: f, name: f.name, size: f.size, type: f.type }));
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleUpload = () => {
    if (files.length > 0) {
      onUpload(files, addToKnowledge);
      setFiles([]);
      setAddToKnowledge(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-xl font-semibold text-slate-900">Upload Documents</h2></div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
          </div>
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 cursor-pointer">
            <FileUp className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-medium">Click to select files</p>
            <p className="text-xs text-slate-400 mt-1">PDF, DOCX, TXT, CSV</p>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.csv,.xlsx" onChange={handleFileSelect} className="hidden" />
          </div>
          {files.length > 0 && (
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div className="flex-1"><p className="text-sm font-medium text-slate-700 truncate">{f.name}</p><p className="text-xs text-slate-400">{formatSize(f.size)}</p></div>
                  <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-1 hover:bg-slate-200 rounded"><X className="w-4 h-4 text-slate-400" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={addToKnowledge} onChange={(e) => setAddToKnowledge(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600" />
              <div>
                <div className="flex items-center gap-2"><Database className="w-4 h-4 text-slate-600" /><span className="text-sm font-medium text-slate-700">Add to Knowledge Repository</span></div>
                <p className="text-xs text-slate-500 mt-1">Document will be indexed for future queries.</p>
              </div>
            </label>
            <div className={`mt-3 p-2 rounded-lg ${addToKnowledge ? 'bg-blue-100' : 'bg-amber-50'}`}>
              {addToKnowledge ? <div className="flex items-center gap-2"><Archive className="w-4 h-4 text-blue-600" /><span className="text-xs text-blue-700"><strong>Permanent:</strong> Shared knowledge</span></div>
                : <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-amber-600" /><span className="text-xs text-amber-700"><strong>Explore:</strong> This session only</span></div>}
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleUpload} disabled={files.length === 0 || isUploading} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl disabled:opacity-40 font-medium">
              {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4" />Upload</>}
            </button>
            <button onClick={onClose} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ FEEDBACK MODAL ============
const FeedbackModal = ({ isOpen, onClose, onSubmit }) => {
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Feedback</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
              <div className="flex gap-1">{[1, 2, 3, 4, 5].map(star => (<button key={star} onClick={() => setFeedback(p => ({ ...p, rating: star }))} className={`p-0.5 ${star <= feedback.rating ? 'text-yellow-400' : 'text-slate-300'}`}><Star className="w-6 h-6 fill-current" /></button>))}</div>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-2">Comments</label><textarea value={feedback.comment} onChange={(e) => setFeedback(p => ({ ...p, comment: e.target.value }))} placeholder="Your feedback..." className="w-full px-3 py-2 border border-slate-300 rounded-xl resize-none" rows={3} /></div>
            <div className="flex gap-3">
              <button onClick={() => { onSubmit(feedback); setFeedback({ rating: 0, comment: '' }); }} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-medium">Submit</button>
              <button onClick={onClose} className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ MAIN APP COMPONENT ============
function App() {
  const [messages, setMessages] = useState([{
    id: 1, type: 'bot',
    content: "Hello! I'm Dr. Gini, your AI research copilot. I can analyze documents, visualize molecules, and search for papers. Your uploaded documents are saved and will be available in future sessions.",
    timestamp: new Date()
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [copiedId, setCopiedId] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState({ open: false, messageId: null });
  const [userFeedback, setUserFeedback] = useState({});
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const messagesEndRef = useRef(null);

  // Fetch user documents on load
  const fetchUserDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const response = await fetch(CONFIG.DOCS_REGISTRY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', userId: getUserId(), sessionId: getSessionId(), timestamp: new Date().toISOString() })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.documents && Array.isArray(data.documents)) {
          setDocuments(data.documents.map(doc => ({
            id: doc.id, name: doc.file_name, size: doc.file_size || 'N/A', status: 'ready',
            driveFileId: doc.drive_id, addedToKnowledge: doc.type === 'knowledge', source: doc.source || 'upload'
          })));
        }
      }
    } catch (e) { logger.error('Failed to load documents', e); }
    finally { setIsLoadingDocs(false); }
  };

  useEffect(() => { fetchUserDocuments(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    if (cooldownTimeLeft > 0) {
      const t = setTimeout(() => setCooldownTimeLeft(cooldownTimeLeft - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldownTimeLeft]);

  // Document actions
  const registerDocument = async (docData) => {
    try {
      const response = await fetch(CONFIG.DOCS_REGISTRY_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', userId: getUserId(), sessionId: getSessionId(), document: docData, timestamp: new Date().toISOString() })
      });
      if (response.ok) return await response.json();
    } catch (e) { logger.error('Failed to register document', e); }
    return null;
  };

  const deleteDocument = async (docId, driveFileId) => {
    try {
      await fetch(CONFIG.DOCS_REGISTRY_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', userId: getUserId(), documentId: docId, driveFileId, timestamp: new Date().toISOString() })
      });
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (e) { logger.error('Failed to delete document', e); }
  };

  const handleAddWebDocToChat = async (result) => {
    try {
      const response = await fetch(CONFIG.WEB_DOC_WEBHOOK_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addToChat', userId: getUserId(), sessionId: getSessionId(), document: result, timestamp: new Date().toISOString() })
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(prev => [...prev, { id: data.id || Date.now(), name: result.title, size: 'Web', status: 'ready', driveFileId: data.fileId, addedToKnowledge: false, source: 'web' }]);
        setMessages(prev => [...prev, { id: Date.now(), type: 'bot', content: `✅ "${result.title}" added to session.`, timestamp: new Date() }]);
      }
    } catch (e) { logger.error('Add to chat failed', e); }
  };

  const handleAddWebDocToKnowledge = async (result) => {
    try {
      const response = await fetch(CONFIG.WEB_DOC_WEBHOOK_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addToKnowledge', userId: getUserId(), sessionId: getSessionId(), document: result, timestamp: new Date().toISOString() })
      });
      if (response.ok) {
        setMessages(prev => [...prev, { id: Date.now(), type: 'bot', content: `✅ "${result.title}" added to Knowledge Repository.`, timestamp: new Date() }]);
      }
    } catch (e) { logger.error('Add to knowledge failed', e); }
  };

  const handleDownloadWebDoc = (result) => { if (result.pdfUrl || result.url) window.open(result.pdfUrl || result.url, '_blank'); };

  const handleFileUpload = async (files, addToKnowledge) => {
    setIsUploading(true);
    for (const fileItem of files) {
      const { file, name } = fileItem;
      const docId = Date.now();
      setDocuments(prev => [...prev, { id: docId, name, size: formatSize(file.size), status: 'uploading', addedToKnowledge: addToKnowledge }]);

      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const response = await fetch(CONFIG.UPLOAD_WEBHOOK_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: getSessionId(), userId: getUserId(), fileName: name, fileData: base64, fileType: file.type, fileSize: file.size, addToKnowledge, timestamp: new Date().toISOString() })
        });

        if (response.ok) {
          const result = await response.json();
          await registerDocument({ fileName: name, fileSize: file.size, fileType: file.type, driveId: result.fileId, type: addToKnowledge ? 'knowledge' : 'explore', source: 'upload' });
          setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'ready', driveFileId: result.fileId } : d));
        } else { throw new Error('Upload failed'); }
      } catch (error) {
        logger.error('Upload error', error);
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'error' } : d));
      }
    }
    setIsUploading(false);
    setUploadModalOpen(false);
  };

  // Detection & Processing
  const detectImageRequirement = (message) => {
    const keywords = ['structure', 'molecular', 'chemical', 'visualize', 'diagram', 'image', '2d', '3d', 'molecule', 'compound', 'show me', 'draw'];
    const compounds = ['chromene', 'benzene', 'caffeine', 'aspirin', 'penicillin', 'dopamine', 'serotonin', 'acetaminophen', 'ibuprofen', 'morphine', 'nicotine', 'glucose'];
    const lower = message.toLowerCase();
    const hasKeyword = keywords.some(k => lower.includes(k));
    const compound = compounds.find(c => lower.includes(c)) || 'unknown';
    return { needsImage: hasKeyword, compound };
  };

  const processResponse = async (response, isImage = false) => {
    try {
      const raw = await response.text();
      let result = { html: '', usedWebSearch: false, webResults: null };
      if (raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
        const json = JSON.parse(raw);
        const item = Array.isArray(json) ? json[0] : json;
        if (isImage && item.success && item.image_url) {
          result.html = `__MOLECULAR_REACT_COMPONENT__${JSON.stringify(item)}__END_MOLECULAR_REACT_COMPONENT__`;
        } else {
          result.html = item.output || item.response || item.content || item.message || '';
          result.usedWebSearch = item.used_web_search || false;
          if (item.web_results || item.papers) result.webResults = item.web_results || item.papers;
        }
      } else {
        result.html = raw.includes('<') ? raw : `<p>${raw.replace(/\n/g, '<br>')}</p>`;
      }
      return result;
    } catch (e) {
      logger.error('Process error', e);
      return { html: `<div class="p-3 bg-red-50 rounded-lg text-red-600">Error: ${e.message}</div>`, usedWebSearch: false, webResults: null };
    }
  };

  const checkCooldown = () => {
    const elapsed = Date.now() - lastRequestTime;
    if (elapsed < CONFIG.REQUEST_COOLDOWN) { setCooldownTimeLeft(Math.ceil((CONFIG.REQUEST_COOLDOWN - elapsed) / 1000)); return false; }
    setCooldownTimeLeft(0); return true;
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    if (!checkCooldown()) {
      setMessages(p => [...p, { id: Date.now(), type: 'bot', content: `Please wait ${formatTimeLeft(cooldownTimeLeft)}.`, timestamp: new Date(), isError: true }]);
      return;
    }

    const imageReq = detectImageRequirement(inputMessage);
    const userDocs = documents.filter(d => d.status === 'ready').map(d => ({ id: d.driveFileId, name: d.name, type: d.addedToKnowledge ? 'knowledge' : 'explore' }));

    setMessages(p => [...p, { id: Date.now(), type: 'user', content: inputMessage, timestamp: new Date(), webSearchEnabled }]);
    const currentMsg = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    setLastRequestTime(Date.now());

    const msgData = { message: currentMsg, sessionId: getSessionId(), userId: getUserId(), messageId: `msg_${Date.now()}`, timestamp: new Date().toISOString(), useWebSearch: webSearchEnabled, userDocuments: userDocs };

    // Show initial processing message
    const processingMessageId = Date.now() + 1;
    const processingMessage = {
      id: processingMessageId,
      type: 'bot',
      content: imageReq.needsImage ?
        `<div class="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-center">
          <div class="flex items-center justify-center gap-2">
            <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-blue-700 font-medium">Processing your request and generating molecular structure for ${imageReq.compound}...</span>
          </div>
          <p class="text-xs text-slate-500 mt-2">This may take a moment as we prepare both text and visual content</p>
        </div>` :
        `<div class="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-center">
          <div class="flex items-center justify-center gap-2">
            <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-blue-700 font-medium">Dr. Gini is processing your request...</span>
          </div>
        </div>`,
      timestamp: new Date(),
      isHTML: true,
      isProcessing: true
    };
    setMessages(p => [...p, processingMessage]);

    try {
      let textContent = '';
      let imageContent = '';
      let textError = null;
      let imageError = null;
      let textResult = { html: '', usedWebSearch: false, webResults: null };

      // STEP 1: Get text response FIRST and wait for completion
      logger.info('Fetching text response');
      try {
        const textRes = await fetch(CONFIG.TEXT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msgData)
        });

        if (!textRes.ok) {
          throw new Error(`Text webhook error: ${textRes.status}`);
        }

        textResult = await processResponse(textRes, false);
        textContent = textResult.html;
        logger.info('Text content processed successfully');

        if (!textContent || textContent.trim().length < 10) {
          logger.warn('Text content is too short or empty');
          textContent = `<div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p class="text-sm text-yellow-800"><strong>Limited Response</strong></p>
            <p class="text-sm text-yellow-700">The text response was shorter than expected. Please try rephrasing your question.</p>
          </div>`;
        }
      } catch (error) {
        logger.error('Text request failed', error);
        textError = error;
        textContent = `<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <strong>Text Response Error</strong><br/>
          <p class="text-sm mt-1">Unable to process text response: ${error.message}</p>
        </div>`;
      }

      // Update processing message to show text is complete
      if (imageReq.needsImage) {
        setMessages(prev => prev.map(msg =>
          msg.id === processingMessageId ? {
            ...msg,
            content: `<div class="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-center">
              <div class="flex items-center justify-center gap-2 mb-2">
                <div class="text-green-600 font-medium">✅ Text content ready</div>
              </div>
              <div class="flex items-center justify-center gap-2">
                <div class="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-purple-700 font-medium">Now generating molecular structure for ${imageReq.compound}...</span>
              </div>
            </div>`
          } : msg
        ));
      }

      // STEP 2: Get image if needed (ONLY after text is complete)
      if (imageReq.needsImage) {
        logger.info('Starting image request after text completion', { compound: imageReq.compound });

        try {
          const imgRes = await fetch(CONFIG.IMAGE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...msgData, compound: imageReq.compound })
          });

          if (imgRes.ok) {
            const imgResult = await processResponse(imgRes, true);
            imageContent = imgResult.html;
            logger.info('Image content processed successfully');
          } else {
            throw new Error(`Image webhook error: ${imgRes.status}`);
          }
        } catch (error) {
          logger.error('Image request failed', error);
          imageError = error;
          imageContent = `<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mt-4">
            <strong>Molecular Structure Unavailable</strong><br/>
            <p class="text-sm mt-1">Unable to generate molecular structure: ${error.message}</p>
          </div>`;
        }
      }

      // STEP 3: Carefully combine content with visual separator
      logger.debug('Combining content', { textLength: textContent.length, imageLength: imageContent.length });

      let combinedContent = '';

      // Always include text content first
      if (textContent && textContent.trim()) {
        combinedContent = textContent;
      } else {
        combinedContent = `<div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-sm text-yellow-800"><strong>Text Content Missing</strong></p>
          <p class="text-sm text-yellow-700">The text portion of the response was not received properly.</p>
        </div>`;
      }

      // Add image content if available with visual separator
      if (imageReq.needsImage && imageContent && imageContent.trim()) {
        const spacing = '<div style="margin: 24px 0; border-top: 1px solid #e5e7eb; padding-top: 24px;"></div>';
        combinedContent += spacing + imageContent;
        logger.debug('Added image content to combined response');
      }

      // STEP 4: Create final combined message
      const finalBotMessage = {
        id: Date.now() + 2,
        type: 'bot',
        content: combinedContent,
        timestamp: new Date(),
        isHTML: true,
        messageId: `gini_${Date.now()}`,
        hasImages: imageReq.needsImage && !imageError,
        usedWebSearch: webSearchEnabled || textResult.usedWebSearch,
        webResults: textResult.webResults
      };

      // Replace processing message with final combined message
      setMessages(prev => prev.map(msg =>
        msg.id === processingMessageId ? finalBotMessage : msg
      ));

      logger.info('Combined message created successfully', {
        hasText: !!textContent,
        hasImage: !!imageContent,
        textError: !!textError,
        imageError: !!imageError
      });

    } catch (e) {
      logger.error('Send error', e);
      const errorMsg = {
        id: Date.now() + 3,
        type: 'bot',
        content: `<div class="p-3 bg-red-50 rounded-lg text-red-600">
          <strong>Connection Error</strong><br/>
          <p class="text-sm mt-1">${e.message}</p>
        </div>`,
        timestamp: new Date(),
        isHTML: true,
        isError: true
      };

      setMessages(prev => prev.map(msg =>
        msg.id === processingMessageId ? errorMsg : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFeedback = async (messageId, rating) => {
    try {
      await fetch(CONFIG.FEEDBACK_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId, sessionId: getSessionId(), userId: getUserId(), thumbsRating: rating, feedbackType: 'quick', timestamp: new Date().toISOString() }) });
      setUserFeedback(p => ({ ...p, [messageId]: { ...p[messageId], thumbs: rating } }));
    } catch (e) { logger.error('Feedback error', e); }
  };

  const submitDetailedFeedback = async (feedbackData) => {
    try {
      await fetch(CONFIG.FEEDBACK_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...feedbackData, messageId: feedbackModal.messageId, sessionId: getSessionId(), userId: getUserId(), feedbackType: 'detailed', timestamp: new Date().toISOString() }) });
      setFeedbackModal({ open: false, messageId: null });
    } catch (e) { logger.error('Feedback error', e); }
  };

  const renderMessage = (msg) => {
    if (!msg.isHTML) return <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>;
    const content = msg.content;
    if (content.includes('__MOLECULAR_REACT_COMPONENT__')) {
      const match = content.match(/__MOLECULAR_REACT_COMPONENT__(.*?)__END_MOLECULAR_REACT_COMPONENT__/);
      if (match) {
        const parts = content.split(/__MOLECULAR_REACT_COMPONENT__.*?__END_MOLECULAR_REACT_COMPONENT__/);
        const imageData = JSON.parse(match[1]);
        return (<div>{parts[0] && <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: parts[0] }} />}<MolecularImage imageData={imageData} />{parts[1] && <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: parts[1] }} />}</div>);
      }
    }
    return <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />;
  };

  const saveAnalysis = (msg) => setSavedAnalyses(p => [{ id: Date.now(), title: `Analysis ${p.length + 1}`, date: 'Just now', snippet: htmlToText(msg.content).substring(0, 80) + '...' }, ...p]);
  const copyToClipboard = (text, id) => { navigator.clipboard.writeText(htmlToText(text)); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
  const downloadChat = () => {
    const content = messages.filter(m => !m.isError).map(m => `[${formatTime(m.timestamp)}] ${m.type === 'user' ? 'You' : 'Dr. Gini'}: ${htmlToText(m.content)}`).join('\n\n');
    const blob = new Blob([`Dr. Gini Session\nUser: ${getUserId()}\n${'='.repeat(40)}\n\n${content}`], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'research-session.txt'; a.click();
  };

  const suggestedQueries = [
    { icon: Beaker, text: 'Show caffeine structure', color: 'text-purple-500' },
    { icon: Microscope, text: 'Show chromene molecular structure', color: 'text-blue-500' },
    { icon: GraduationCap, text: 'Search latest chromene research', color: 'text-green-500' },
    { icon: Lightbulb, text: 'Summarize my uploaded documents', color: 'text-amber-500' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25"><Atom className="w-5 h-5 text-white" /></div>
            <div><h1 className="font-semibold text-slate-900">Dr. Gini</h1><p className="text-xs text-slate-500">Research Copilot</p></div>
          </div>
          <div className="mt-3 flex items-center gap-2 px-2 py-1.5 bg-slate-100 rounded-lg">
            <UserCircle className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-600 truncate">{getUserId().slice(-12)}</span>
          </div>
        </div>

        <div className="p-3 space-y-2">
          <button onClick={() => setMessages([messages[0]])} className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800"><Plus className="w-4 h-4" /><span className="font-medium">New Research</span></button>
          <button onClick={() => setUploadModalOpen(true)} className="w-full flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 text-slate-600 rounded-xl hover:border-blue-400 hover:text-blue-600"><Upload className="w-4 h-4" /><span className="font-medium">Upload Document</span></button>
        </div>

        <div className="flex border-b border-slate-100 px-3">
          {[{ id: 'chat', icon: MessageSquare, label: 'Chat' }, { id: 'docs', icon: FolderOpen, label: 'My Docs' }, { id: 'saved', icon: Bookmark, label: 'Saved' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'}`}>
              <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
              {tab.id === 'docs' && documents.length > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">{documents.length}</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'docs' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">YOUR DOCUMENTS</span>
                <button onClick={fetchUserDocuments} disabled={isLoadingDocs} className="p-1 hover:bg-slate-100 rounded"><RefreshCw className={`w-3 h-3 text-slate-400 ${isLoadingDocs ? 'animate-spin' : ''}`} /></button>
              </div>
              {isLoadingDocs ? <div className="text-center py-8"><Loader2 className="w-6 h-6 text-slate-300 mx-auto animate-spin" /></div>
                : documents.length === 0 ? <div className="text-center py-8"><FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-sm text-slate-400">No documents yet</p></div>
                  : documents.map(d => (
                    <div key={d.id} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 group">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${d.status === 'ready' ? 'bg-green-100' : d.status === 'error' ? 'bg-red-100' : 'bg-blue-100'}`}>
                          {d.status === 'uploading' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                          {d.status === 'ready' && <CheckCircle className="w-4 h-4 text-green-600" />}
                          {d.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{d.name}</p>
                          <p className="text-xs text-slate-400">{d.size}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {d.source === 'web' && <span className="inline-flex items-center gap-1 text-xs text-blue-600"><Globe className="w-3 h-3" />Web</span>}
                            {d.addedToKnowledge ? <span className="inline-flex items-center gap-1 text-xs text-purple-600"><Database className="w-3 h-3" />Knowledge</span> : <span className="inline-flex items-center gap-1 text-xs text-amber-600"><Eye className="w-3 h-3" />Explore</span>}
                          </div>
                        </div>
                        <button onClick={() => deleteDocument(d.id, d.driveFileId)} className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4 text-red-400" /></button>
                      </div>
                    </div>
                  ))}
            </div>
          )}
          {activeTab === 'saved' && (
            <div className="space-y-2">
              {savedAnalyses.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No saved analyses</p> : savedAnalyses.map(a => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer">
                  <p className="text-sm font-medium text-slate-700">{a.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.date}</p>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{a.snippet}</p>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'chat' && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium text-blue-700">Current Session</span></div>
              <p className="text-xs text-blue-600 mt-1">{messages.length} messages • {documents.filter(d => d.status === 'ready').length} docs</p>
            </div>
          )}
        </div>

        {messages.length > 1 && (
          <div className="p-3 border-t border-slate-100">
            <button onClick={downloadChat} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm"><Download className="w-4 h-4" />Export</button>
          </div>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg">{sidebarOpen ? <X className="w-5 h-5 text-slate-500" /> : <Menu className="w-5 h-5 text-slate-500" />}</button>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
              <span className="text-sm text-slate-600">{isLoading ? 'Processing...' : 'Ready'}</span>
            </div>
            {documents.filter(d => d.status === 'ready').length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs"><FileText className="w-3 h-3" />{documents.filter(d => d.status === 'ready').length} docs</div>
            )}
          </div>
          {cooldownTimeLeft > 0 && <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm"><Clock className="w-4 h-4" />{formatTimeLeft(cooldownTimeLeft)}</div>}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${msg.type === 'user' ? 'bg-slate-900' : msg.isError ? 'bg-red-500' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
                  {msg.type === 'user' ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                </div>
                <div className={`flex-1 ${msg.type === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-full ${msg.type === 'user' ? 'bg-slate-900 text-white rounded-2xl rounded-tr-md px-4 py-3' : 'bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm'}`}>
                    {msg.type === 'bot' && msg.usedWebSearch && !msg.isError && (
                      <div className="mb-2 pb-2 border-b border-slate-100">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-600 border border-blue-200"><Globe className="w-3 h-3" />Web results</span>
                      </div>
                    )}
                    <div className={msg.type === 'user' ? '' : 'text-slate-700'}>{renderMessage(msg)}</div>
                    {msg.webResults && msg.webResults.length > 0 && (
                      <WebSearchResults results={msg.webResults} onAddToChat={handleAddWebDocToChat} onAddToKnowledge={handleAddWebDocToKnowledge} onDownload={handleDownloadWebDoc} />
                    )}
                  </div>
                  {msg.type === 'bot' && !msg.isError && msg.messageId && (
                    <div className="flex items-center gap-1 mt-2">
                      <button onClick={() => handleQuickFeedback(msg.messageId, 'up')} className={`p-1.5 rounded-lg ${userFeedback[msg.messageId]?.thumbs === 'up' ? 'bg-green-100 text-green-600' : 'text-slate-400 hover:bg-slate-100'}`}><ThumbsUp className="w-4 h-4" /></button>
                      <button onClick={() => handleQuickFeedback(msg.messageId, 'down')} className={`p-1.5 rounded-lg ${userFeedback[msg.messageId]?.thumbs === 'down' ? 'bg-red-100 text-red-600' : 'text-slate-400 hover:bg-slate-100'}`}><ThumbsDown className="w-4 h-4" /></button>
                      <button onClick={() => copyToClipboard(msg.content, msg.id)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">{copiedId === msg.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</button>
                      <button onClick={() => saveAnalysis(msg)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><Bookmark className="w-4 h-4" /></button>
                      <button onClick={() => setFeedbackModal({ open: true, messageId: msg.messageId })} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><MessageSquare className="w-4 h-4" /></button>
                      <span className="text-xs text-slate-400 ml-2">{formatTime(msg.timestamp)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {messages.length <= 2 && (
          <div className="px-4 pb-4">
            <div className="max-w-3xl mx-auto">
              <p className="text-xs text-slate-500 mb-3 font-medium">TRY THESE</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedQueries.map((q, i) => (
                  <button key={i} onClick={() => { setInputMessage(q.text); if (q.text.includes('Search')) setWebSearchEnabled(true); }}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm text-left group">
                    <q.icon className={`w-5 h-5 ${q.color}`} />
                    <span className="text-sm text-slate-700 flex-1">{q.text}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-slate-50 rounded-2xl p-2 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <button onClick={() => setUploadModalOpen(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl"><Upload className="w-5 h-5" /></button>
              <textarea value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask about molecules, search papers, or chat with documents..."
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-slate-700 placeholder:text-slate-400 py-2 max-h-32" rows={1} disabled={isLoading || cooldownTimeLeft > 0} />
              <button onClick={sendMessage} disabled={!inputMessage.trim() || isLoading || cooldownTimeLeft > 0}
                className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"><Send className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={webSearchEnabled} onChange={(e) => setWebSearchEnabled(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                <Globe className={`w-4 h-4 ${webSearchEnabled ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className={`text-sm ${webSearchEnabled ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>Web search</span>
              </label>
              <span className="text-xs text-slate-400">Session: {getSessionId().slice(-8)}</span>
            </div>
          </div>
        </div>
      </div>

      <UploadModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} onUpload={handleFileUpload} isUploading={isUploading} />
      <FeedbackModal isOpen={feedbackModal.open} onClose={() => setFeedbackModal({ open: false, messageId: null })} onSubmit={submitDetailedFeedback} />
    </div>
  );
}

export default App;