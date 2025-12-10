import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, FileText, Upload,
  Sparkles, Clock, Download, Copy, Check, Menu, X, ChevronLeft,
  MessageSquare, Beaker, Atom,
  Star, ThumbsUp, ThumbsDown, Loader2, User,
  Globe, ExternalLink, Database, FileUp, CheckCircle, AlertCircle,
  Eye, Archive, GraduationCap, FileDown, MessageCircle,
  ChevronDown, ChevronUp, Microscope, RefreshCw, UserCircle,
  Lightbulb, ArrowRight
} from 'lucide-react';
import { marked } from 'marked';

// ============ CONFIGURATION ============
// All webhook URLs are loaded from environment variables
const CONFIG = {
  TEXT_WEBHOOK_URL: process.env.REACT_APP_TEXT_WEBHOOK_URL,
  IMAGE_WEBHOOK_URL: process.env.REACT_APP_IMAGE_WEBHOOK_URL,
  UPLOAD_WEBHOOK_URL: process.env.REACT_APP_UPLOAD_WEBHOOK_URL,
  WEB_DOC_WEBHOOK_URL: process.env.REACT_APP_WEB_DOC_WEBHOOK_URL,
  DOCS_REGISTRY_URL: process.env.REACT_APP_DOCS_REGISTRY_URL,
  FEEDBACK_WEBHOOK_URL: process.env.REACT_APP_FEEDBACK_WEBHOOK_URL,
  WEB_SEARCH_WEBHOOK_URL: process.env.REACT_APP_WEB_SEARCH_WEBHOOK_URL,
  DOCUMENT_CHAT_WEBHOOK_URL: process.env.REACT_APP_DOCUMENT_CHAT_WEBHOOK_URL,
  CHAT_HISTORY_WEBHOOK_URL: process.env.REACT_APP_CHAT_HISTORY_WEBHOOK_URL,
  REQUEST_COOLDOWN: parseInt(process.env.REACT_APP_REQUEST_COOLDOWN || '180000', 10),
  LONG_REQUEST_TIMEOUT: 480000 // 8 minutes for deep search operations
};

// ============ MARKDOWN CONFIGURATION ============
// Configure marked for safe and clean HTML output
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
  headerIds: false, // Don't add IDs to headers
  mangle: false, // Don't escape email addresses
});

// Utility function to convert markdown to styled HTML
const formatMarkdownToHTML = (text) => {
  if (!text) return '';

  // First, try to parse as markdown
  let html = marked.parse(text);

  // Add custom styling classes to elements
  html = html
    // Style headers with better spacing and hierarchy
    .replace(/<h1>/g, '<h1 class="text-2xl font-bold text-slate-900 mb-4 mt-6 pb-2 border-b-2 border-blue-500">')
    .replace(/<h2>/g, '<h2 class="text-xl font-bold text-blue-700 mb-3 mt-6 flex items-center gap-2"><span class="w-1 h-6 bg-blue-500 rounded"></span>')
    .replace(/<\/h2>/g, '</h2>')
    .replace(/<h3>/g, '<h3 class="text-lg font-semibold text-slate-800 mb-3 mt-4 pl-3 border-l-3 border-purple-400">')
    .replace(/<h4>/g, '<h4 class="text-base font-semibold text-slate-700 mb-2 mt-3">')
    // Style paragraphs with better spacing
    .replace(/<p>/g, '<p class="text-slate-700 mb-4 leading-relaxed text-sm">')
    // Style lists with better spacing and indentation
    .replace(/<ul>/g, '<ul class="mb-4 space-y-2 text-slate-700">')
    .replace(/<ol>/g, '<ol class="mb-4 space-y-2 text-slate-700">')
    .replace(/<li>/g, '<li class="ml-6 pl-2 text-sm leading-relaxed relative before:content-[\'\'] before:absolute before:left-[-16px] before:top-[10px] before:w-1.5 before:h-1.5 before:bg-blue-500 before:rounded-full">')
    // Style code blocks and inline code
    .replace(/<pre>/g, '<pre class="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm shadow-lg">')
    .replace(/<code>/g, '<code class="bg-purple-50 text-purple-800 px-2 py-0.5 rounded text-xs font-mono border border-purple-200">')
    // Style blockquotes
    .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-blue-500 bg-blue-50 pl-4 py-2 italic text-slate-700 mb-4 rounded-r">')
    // Style strong and em with better contrast
    .replace(/<strong>/g, '<strong class="font-bold text-slate-900 bg-yellow-50 px-1 rounded">')
    .replace(/<em>/g, '<em class="italic text-blue-700">')
    // Style links with hover effect
    .replace(/<a /g, '<a class="text-blue-600 hover:text-blue-800 hover:underline font-medium" target="_blank" rel="noopener noreferrer" ')
    // Add table styling if present
    .replace(/<table>/g, '<table class="min-w-full border-collapse mb-4 text-sm">')
    .replace(/<thead>/g, '<thead class="bg-slate-100">')
    .replace(/<th>/g, '<th class="border border-slate-300 px-4 py-2 text-left font-semibold text-slate-700">')
    .replace(/<td>/g, '<td class="border border-slate-300 px-4 py-2 text-slate-700">')
    .replace(/<tr>/g, '<tr class="hover:bg-slate-50">');

  return html;
};

// ============ FUN WAITING MESSAGES ============
const FUN_WAITING_MESSAGES = [
  { emoji: '🔬', text: 'Analyzing molecular patterns...' },
  { emoji: '🧪', text: 'Mixing the perfect research cocktail...' },
  { emoji: '🔍', text: 'Scanning through scientific databases...' },
  { emoji: '⚗️', text: 'Brewing your answer...' },
  { emoji: '🧬', text: 'Unraveling DNA-level details...' },
  { emoji: '📚', text: 'Speed-reading thousands of papers...' },
  { emoji: '🤖', text: 'AI neurons are firing up...' },
  { emoji: '✨', text: 'Sprinkling some scientific magic...' },
  { emoji: '🎯', text: 'Getting closer to the perfect answer...' },
  { emoji: '🌟', text: 'Almost there, crafting excellence...' },
  { emoji: '💡', text: 'Connecting the dots...' },
  { emoji: '🚀', text: 'Deep diving into research space...' },
  { emoji: '🎨', text: 'Painting a comprehensive picture...' },
  { emoji: '⏳', text: 'Good things take time...' },
  { emoji: '🎭', text: 'The plot thickens! Hold on...' },
  { emoji: '🏆', text: 'Quality research in progress...' },
  { emoji: '🎪', text: 'The show must go on...' },
  { emoji: '🎸', text: 'Tuning the research symphony...' },
  { emoji: '🍳', text: 'Cooking up something great...' },
  { emoji: '☕', text: 'Perfect time for a coffee break!' }
];

// ============ UTILITY FUNCTIONS ============
const logger = {
  info: (msg, data) => console.log(`🟢 [DrGini] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`🟡 [DrGini] ${msg}`, data || ''),
  error: (msg, data) => console.error(`🔴 [DrGini] ${msg}`, data || ''),
  debug: (msg, data) => console.log(`🔵 [DEBUG] ${msg}`, data || ''),
  image: (msg, data) => console.log(`🖼️ [IMAGE] ${msg}`, data || '')
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

// Date grouping helpers for chat history
const getDateGroup = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset times to midnight for comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) return 'today';
  if (dateOnly.getTime() === yesterdayOnly.getTime()) return 'yesterday';

  const diffTime = todayOnly.getTime() - dateOnly.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) return 'last7days';
  return 'older'; // We'll filter these out
};

const groupConversationsByDate = (conversations) => {
  const groups = { today: [], yesterday: [], last7days: [] };

  conversations.forEach(conv => {
    const group = getDateGroup(conv.timestamp);
    if (group !== 'older' && groups[group]) {
      groups[group].push(conv);
    }
  });

  return groups;
};
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

// ============ DOCUMENT SELECTOR MODAL ============
const DocumentSelectorModal = ({ isOpen, onClose, documents, selectedDocIds, onSelectDocs, onUploadClick }) => {
  const [tempSelected, setTempSelected] = useState(new Set(selectedDocIds));
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Only show session docs (not knowledge docs) - knowledge docs are in vector DB
  const sessionDocs = documents.filter(d => d.status === 'ready' && !d.addedToKnowledge);
  const filteredDocs = searchQuery
    ? sessionDocs.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : sessionDocs;

  const handleToggle = (docId) => {
    const newSet = new Set(tempSelected);
    if (newSet.has(docId)) {
      newSet.delete(docId);
    } else {
      newSet.add(docId);
    }
    setTempSelected(newSet);
  };

  const handleStartChat = () => {
    onSelectDocs(tempSelected);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Select Documents</h2>
              <p className="text-sm text-slate-500 mt-1">Choose documents to chat with</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Search */}
          {sessionDocs.length > 3 && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Database className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          )}
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                {searchQuery ? 'No documents match your search' : 'No documents uploaded yet'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => { onClose(); onUploadClick(); }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Upload Documents
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map(doc => (
                <label
                  key={doc.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    tempSelected.has(doc.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={tempSelected.has(doc.id)}
                    onChange={() => handleToggle(doc.id)}
                    className="w-5 h-5 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {doc.source === 'web' && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                          <Globe className="w-3 h-3" />Web
                        </span>
                      )}
                      {doc.addedToKnowledge ? (
                        <span className="inline-flex items-center gap-1 text-xs text-purple-600">
                          <Database className="w-3 h-3" />Knowledge
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <Eye className="w-3 h-3" />Session
                        </span>
                      )}
                    </div>
                  </div>
                  <CheckCircle
                    className={`w-5 h-5 ${
                      tempSelected.has(doc.id) ? 'text-blue-600' : 'text-slate-300'
                    }`}
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-600">
              {tempSelected.size} document{tempSelected.size !== 1 ? 's' : ''} selected
            </span>
            {sessionDocs.length > 0 && (
              <button
                onClick={() => { onClose(); onUploadClick(); }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Upload More
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleStartChat}
              disabled={tempSelected.size === 0}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Chat with {tempSelected.size || 'Documents'}
            </button>
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
    content: "I'm Dr. Gini, your AI research copilot",
    timestamp: new Date(),
    isWelcome: true
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState({ open: false, messageId: null });
  const [userFeedback, setUserFeedback] = useState({});
  const [documents, setDocuments] = useState([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  // ============ MODE & DOCUMENT SELECTION ============
  const [chatMode, setChatMode] = useState(() => localStorage.getItem('dr_gini_chat_mode') || 'research');
  // eslint-disable-next-line no-unused-vars
  const [selectedDocuments, setSelectedDocuments] = useState(new Set());

  // ============ DOCUMENT CHAT MODE ============
  const [documentChatActive, setDocumentChatActive] = useState(false);
  const [docSelectorOpen, setDocSelectorOpen] = useState(false);
  const [chatDocuments, setChatDocuments] = useState(new Set()); // Docs selected for chat
  const [autoSendSummary, setAutoSendSummary] = useState(false); // Auto-send summary after doc selection

  // ============ CHAT HISTORY ============
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [loadingConversationId, setLoadingConversationId] = useState(null);

  // ============ AUTHENTICATION ============
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const messagesEndRef = useRef(null);

  // Initialize Netlify Identity
  useEffect(() => {
    const netlifyIdentity = window.netlifyIdentity;
    if (netlifyIdentity) {
      netlifyIdentity.init();

      // Check if user is already logged in
      const currentUser = netlifyIdentity.currentUser();
      console.log('[DEBUG] Netlify Identity currentUser:', currentUser);
      console.log('[DEBUG] currentUser keys:', currentUser ? Object.keys(currentUser) : 'null');
      console.log('[DEBUG] currentUser.email:', currentUser?.email);
      if (currentUser) {
        setUser(currentUser);
      }
      setAuthLoading(false);

      // Listen for login/logout events
      netlifyIdentity.on('login', (loggedInUser) => {
        console.log('[DEBUG] User logged in:', loggedInUser);
        console.log('[DEBUG] loggedInUser keys:', Object.keys(loggedInUser));
        console.log('[DEBUG] loggedInUser.email:', loggedInUser.email);
        setUser(loggedInUser);
        netlifyIdentity.close();
        // Clear old anonymous session data
        localStorage.removeItem('dr_gini_session_id');
        localStorage.removeItem('dr_gini_user_id');
      });

      netlifyIdentity.on('logout', () => {
        setUser(null);
        // Clear session data on logout
        localStorage.removeItem('dr_gini_session_id');
        localStorage.removeItem('dr_gini_user_id');
      });
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Get authenticated user ID
  const getAuthenticatedUserId = () => {
    // Debug logging to see user object structure
    console.log('[DEBUG] getAuthenticatedUserId called, user:', user);
    console.log('[DEBUG] user object keys:', user ? Object.keys(user) : 'null');
    console.log('[DEBUG] user.email:', user?.email);

    if (user) {
      // Try multiple ways to get email from Netlify Identity user object
      const email = user.email || user.user_metadata?.email || user.app_metadata?.email;
      if (email) {
        console.log('[DEBUG] Using authenticated email:', email);
        return email;
      }
    }

    // Fallback to anonymous ID if not authenticated (shouldn't happen with auth required)
    console.log('[DEBUG] Falling back to anonymous getUserId()');
    return getUserId();
  };

  // Login/Logout handlers
  const handleLogin = () => {
    if (window.netlifyIdentity) {
      window.netlifyIdentity.open('login');
    }
  };

  const handleLogout = () => {
    if (window.netlifyIdentity) {
      window.netlifyIdentity.logout();
    }
  };

  // Fetch user documents on load
  const fetchUserDocuments = useCallback(async () => {
    console.log('[DEBUG] fetchUserDocuments called');
    try {
      const response = await fetch(CONFIG.DOCS_REGISTRY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', userId: user && user.email ? user.email : getUserId(), sessionId: getSessionId(), timestamp: new Date().toISOString() })
      });
      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] N8N response:', data);
        // N8N returns an array with the response object inside
        const result = Array.isArray(data) ? data[0] : data;
        if (result.documents && Array.isArray(result.documents)) {
          const mappedDocs = result.documents.map(doc => ({
            id: doc.id, name: doc.name, size: 'N/A', status: 'ready',
            driveFileId: doc.id, addedToKnowledge: doc.type === 'knowledge', source: doc.source || 'upload',
            mimeType: doc.mimeType || 'application/pdf'
          }));
          console.log('[DEBUG] Mapped documents:', mappedDocs);
          setDocuments(mappedDocs);
        } else {
          console.log('[DEBUG] No documents in response or not an array');
        }
      } else {
        console.log('[DEBUG] Response not OK:', response.status);
      }
    } catch (e) {
      console.error('[DEBUG] Error fetching documents:', e);
      logger.error('Failed to load documents', e);
    }
  }, [user]); // Include user so function updates when user logs in

  // Fetch documents only after user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      fetchUserDocuments();
    }
  }, [user, authLoading, fetchUserDocuments]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    localStorage.setItem('dr_gini_chat_mode', chatMode);
  }, [chatMode]);

  // Update welcome message based on mode
  useEffect(() => {
    setMessages(prev => {
      const welcomeMsg = prev.find(m => m.isWelcome);
      if (welcomeMsg) {
        const newContent = "I'm Dr. Gini, your AI research copilot";

        return prev.map(m => m.isWelcome ? { ...m, content: newContent } : m);
      }
      return prev;
    });
  }, [chatMode]);

  // Document chat mode handlers
  const handleOpenDocSelector = () => {
    setDocSelectorOpen(true);
  };

  const handleSelectDocsForChat = (selectedIds) => {
    setChatDocuments(selectedIds);
    setDocumentChatActive(selectedIds.size > 0);

    // If auto-send summary is requested
    if (autoSendSummary && selectedIds.size > 0) {
      setInputMessage('Summarize these documents');
      setAutoSendSummary(false);

      // Auto-send after a brief delay to ensure state is updated
      setTimeout(() => {
        sendMessage();
      }, 100);
    }
  };

  const handleRemoveDocFromChat = (docId) => {
    setChatDocuments(prev => {
      const newSet = new Set(prev);
      newSet.delete(docId);
      if (newSet.size === 0) {
        setDocumentChatActive(false);
      }
      return newSet;
    });
  };

  const handleClearDocumentChat = () => {
    setChatDocuments(new Set());
    setDocumentChatActive(false);
  };

  // Document actions (kept for future use in modal)
  // eslint-disable-next-line no-unused-vars
  const deleteDocument = async (docId, driveFileId) => {
    try {
      await fetch(CONFIG.DOCS_REGISTRY_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', userId: getAuthenticatedUserId(), documentId: docId, driveFileId, timestamp: new Date().toISOString() })
      });
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (e) { logger.error('Failed to delete document', e); }
  };

  const handleAddWebDocToChat = async (result) => {
    try {
      const response = await fetch(CONFIG.WEB_DOC_WEBHOOK_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addToChat', userId: getAuthenticatedUserId(), sessionId: getSessionId(), document: result, timestamp: new Date().toISOString() })
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
        body: JSON.stringify({ action: 'addToKnowledge', userId: getAuthenticatedUserId(), sessionId: getSessionId(), document: result, timestamp: new Date().toISOString() })
      });
      if (response.ok) {
        setMessages(prev => [...prev, { id: Date.now(), type: 'bot', content: `✅ "${result.title}" added to Knowledge Repository.`, timestamp: new Date() }]);
      }
    } catch (e) { logger.error('Add to knowledge failed', e); }
  };

  const handleDownloadWebDoc = (result) => { if (result.pdfUrl || result.url) window.open(result.pdfUrl || result.url, '_blank'); };

  // ============ CHAT HISTORY FUNCTIONS ============
  const fetchConversations = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const actualUserId = user && user.email ? user.email : getUserId();
      const actualSessionId = getSessionId();

      const payload = {
        action: 'list',
        userId: actualUserId,
        sessionId: actualSessionId,
        timestamp: new Date().toISOString()
      };

      console.log('[DEBUG] fetchConversations payload:', payload);

      const response = await fetch(CONFIG.CHAT_HISTORY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] Raw N8N response:', data);

        const result = Array.isArray(data) ? data[0] : data;
        if (result.conversations && Array.isArray(result.conversations)) {
          // Map N8N response properties to UI expected properties
          const mappedConversations = result.conversations.map(conv => ({
            id: conv.conversationId,           // conversationId → id
            conversationId: conv.conversationId, // Keep original too
            title: conv.title,
            messageCount: parseInt(conv.messageCount) || 0, // Convert string to number
            chatMode: conv.chatMode,
            timestamp: conv.updatedAt || conv.timestamp, // updatedAt → timestamp
            updatedAt: conv.updatedAt,          // Keep original too
            isFavorite: conv.isFavorite || false
          }));

          // De-duplicate conversations (keep latest entry for each unique conversationId)
          const conversationMap = new Map();
          mappedConversations.forEach(conv => {
            const existing = conversationMap.get(conv.conversationId);
            if (!existing || new Date(conv.timestamp) > new Date(existing.timestamp)) {
              conversationMap.set(conv.conversationId, conv);
            }
          });
          const deduplicatedConversations = Array.from(conversationMap.values());

          console.log('[DEBUG] Mapped conversations:', mappedConversations.length);
          console.log('[DEBUG] After deduplication:', deduplicatedConversations.length);
          setConversations(deduplicatedConversations);
        } else {
          console.log('[DEBUG] No conversations found in response');
        }
      }
    } catch (e) {
      logger.error('Failed to fetch conversations', e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]); // Added user dependency to get latest user state

  const saveConversation = useCallback(async () => {
    if (messages.length <= 1) return; // Don't save if only welcome message

    try {
      const actualUserId = user && user.email ? user.email : getUserId();
      const actualSessionId = getSessionId();
      const conversationTitle = messages.find(m => m.type === 'user')?.content.substring(0, 50) || 'New Conversation';

      // Generate and set conversation ID IMMEDIATELY to prevent duplicates
      let convId = currentConversationId;
      if (!convId) {
        convId = `conv_${Date.now()}`;
        setCurrentConversationId(convId); // Set immediately to prevent race condition
      }

      const payload = {
        action: 'save',
        userId: actualUserId,
        sessionId: actualSessionId,
        conversationId: convId,
        title: conversationTitle,
        messages: messages.filter(m => !m.isWelcome), // Don't save welcome message
        chatMode: chatMode,
        timestamp: new Date().toISOString()
      };

      console.log('[DEBUG] saveConversation payload:', {
        action: payload.action,
        userId: payload.userId,
        sessionId: payload.sessionId,
        conversationId: payload.conversationId,
        title: payload.title,
        messageCount: payload.messages.length,
        chatMode: payload.chatMode
      });

      const response = await fetch(CONFIG.CHAT_HISTORY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        logger.info('Conversation saved', { conversationId: convId });
      }
    } catch (e) {
      logger.error('Failed to save conversation', e);
    }
  }, [messages, chatMode, currentConversationId, user]); // Added user dependency

  const loadConversation = async (conversationId) => {
    setLoadingConversationId(conversationId);
    try {
      const actualUserId = user && user.email ? user.email : getUserId();
      const actualSessionId = getSessionId();

      const payload = {
        action: 'load',
        userId: actualUserId,
        sessionId: actualSessionId,
        conversationId: conversationId,
        timestamp: new Date().toISOString()
      };

      console.log('[DEBUG] loadConversation payload:', payload);

      const response = await fetch(CONFIG.CHAT_HISTORY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] Raw load response:', data);

        const result = Array.isArray(data) ? data[0] : data;
        console.log('[DEBUG] Load result:', result);

        // Parse messages if it's a JSON string
        let parsedMessages = result.messages;
        if (typeof parsedMessages === 'string') {
          try {
            parsedMessages = JSON.parse(parsedMessages);
            console.log('[DEBUG] Parsed messages from JSON string:', parsedMessages);

            // Check if molecular components are intact
            parsedMessages.forEach((msg, idx) => {
              if (msg.content && msg.content.includes('__MOLECULAR_REACT_COMPONENT__')) {
                console.log(`[DEBUG] Message ${idx} has molecular component:`, {
                  isHTML: msg.isHTML,
                  hasImages: msg.hasImages,
                  contentLength: msg.content.length,
                  hasMarker: msg.content.includes('__MOLECULAR_REACT_COMPONENT__')
                });
              }
            });
          } catch (e) {
            console.error('[DEBUG] Failed to parse messages string:', e);
            parsedMessages = [];
          }
        }

        if (parsedMessages && Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          // Add welcome message at the beginning
          const welcomeMsg = messages.find(m => m.isWelcome);
          setMessages([welcomeMsg, ...parsedMessages]);
          setCurrentConversationId(conversationId);
          if (result.chatMode) {
            setChatMode(result.chatMode);
          }
          logger.info('Conversation loaded');
        } else {
          // No messages found
          console.log('[DEBUG] No valid messages found. parsedMessages:', parsedMessages);
          setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'bot',
            content: '⚠️ No messages found in this conversation.',
            timestamp: new Date(),
            isError: true
          }]);
        }
      } else {
        throw new Error('Failed to load conversation from server');
      }
    } catch (e) {
      logger.error('Failed to load conversation', e);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        content: `❌ Failed to load conversation: ${e.message}`,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setLoadingConversationId(null);
    }
  };

  const toggleFavorite = async (conversationId, currentFavoriteStatus) => {
    try {
      const actualUserId = user && user.email ? user.email : getUserId();
      const newFavoriteStatus = !currentFavoriteStatus;

      const payload = {
        action: 'toggleFavorite',
        userId: actualUserId,
        sessionId: getSessionId(),
        conversationId: conversationId,
        isFavorite: newFavoriteStatus,
        timestamp: new Date().toISOString()
      };

      console.log('[DEBUG] toggleFavorite payload:', payload);

      // Optimistically update UI
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId ? { ...conv, isFavorite: newFavoriteStatus } : conv
      ));

      const response = await fetch(CONFIG.CHAT_HISTORY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Revert on error
        setConversations(prev => prev.map(conv =>
          conv.id === conversationId ? { ...conv, isFavorite: currentFavoriteStatus } : conv
        ));
        logger.error('Failed to toggle favorite');
      }
    } catch (e) {
      logger.error('Failed to toggle favorite', e);
      // Revert on error
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId ? { ...conv, isFavorite: currentFavoriteStatus } : conv
      ));
    }
  };

  // eslint-disable-next-line no-unused-vars
  const deleteConversation = async (conversationId) => {
    try {
      await fetch(CONFIG.CHAT_HISTORY_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          userId: getAuthenticatedUserId(),
          conversationId: conversationId,
          timestamp: new Date().toISOString()
        })
      });
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      logger.info('Conversation deleted');
    } catch (e) {
      logger.error('Failed to delete conversation', e);
    }
  };

  // Fetch conversations when user logs in
  useEffect(() => {
    if (user && !authLoading) {
      fetchConversations();
    }
  }, [user, authLoading, fetchConversations]);

  // Auto-save conversation after messages change
  useEffect(() => {
    if (messages.length > 1 && user) {
      const timeoutId = setTimeout(() => {
        saveConversation();
      }, 2000); // Debounce: save 2 seconds after last message
      return () => clearTimeout(timeoutId);
    }
  }, [messages, user, saveConversation]);

  const handleFileUpload = async (files, addToKnowledge) => {
    setIsUploading(true);
    for (const fileItem of files) {
      const { file, name } = fileItem;
      const docId = Date.now();
      setDocuments(prev => [...prev, { id: docId, name, size: formatSize(file.size), status: 'uploading', addedToKnowledge: addToKnowledge, mimeType: file.type }]);

      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const response = await fetch(CONFIG.UPLOAD_WEBHOOK_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: getSessionId(), userId: getAuthenticatedUserId(), fileName: name, fileData: base64, fileType: file.type, fileSize: file.size, addToKnowledge, timestamp: new Date().toISOString() })
        });

        if (response.ok) {
          const result = await response.json();
          // Upload workflow now saves to database directly, no need to register separately
          setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'ready', driveFileId: result.fileId, mimeType: d.mimeType || file.type } : d));
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
        // JSON response
        const json = JSON.parse(raw);
        const item = Array.isArray(json) ? json[0] : json;

        // Handle HF Space error response
        if (item.success === false && item.error) {
          result.html = `<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <strong>Error</strong><br/>
            <p class="text-sm mt-1">${item.error}</p>
          </div>`;
          return result;
        }

        if (isImage && item.success && item.image_url) {
          // Special handling for molecular images
          result.html = `__MOLECULAR_REACT_COMPONENT__${JSON.stringify(item)}__END_MOLECULAR_REACT_COMPONENT__`;
        } else {
          // Extract text content from JSON
          // Support HF Space format (answer) and n8n format (output, response, content, message)
          const textContent = item.answer || item.output || item.response || item.content || item.message || '';

          // Convert markdown to HTML for better presentation
          if (textContent && !textContent.includes('<')) {
            // If it's plain text or markdown (not already HTML)
            result.html = formatMarkdownToHTML(textContent);
          } else {
            // Already HTML, use as-is
            result.html = textContent;
          }

          // Handle HF Space documentsUsed for citation display
          if (item.documentsUsed && Array.isArray(item.documentsUsed) && item.documentsUsed.length > 0) {
            result.html += `<div class="mt-4 pt-3 border-t border-slate-200">
              <p class="text-xs text-slate-500 font-medium mb-1">📄 Sources:</p>
              <p class="text-xs text-slate-400">${item.documentsUsed.join(', ')}</p>
            </div>`;
          }

          result.usedWebSearch = item.used_web_search || false;
          if (item.web_results || item.papers) result.webResults = item.web_results || item.papers;
        }
      } else {
        // Plain text response
        if (raw.includes('<')) {
          // Already HTML
          result.html = raw;
        } else {
          // Convert markdown to HTML
          result.html = formatMarkdownToHTML(raw);
        }
      }

      logger.debug('Processed response', { hasHtml: !!result.html, length: result.html.length });
      return result;
    } catch (e) {
      logger.error('Process error', e);
      return { html: `<div class="p-3 bg-red-50 rounded-lg text-red-600">Error: ${e.message}</div>`, usedWebSearch: false, webResults: null };
    }
  };

  // Handle mode switching with explicit save
  const handleModeSwitch = async (newMode) => {
    if (chatMode === newMode) return; // Already in this mode

    // Save current conversation if there are messages
    if (messages.length > 1) {
      logger.info('Saving conversation before mode switch', { from: chatMode, to: newMode });
      await saveConversation();
    }

    // Clear chat and reset for new conversation
    setMessages([messages.find(m => m.isWelcome)]);
    setCurrentConversationId(null);
    setChatMode(newMode);

    logger.info('Mode switched', { newMode });
  };

  const sendMessage = async () => {
    logger.debug('sendMessage called', { isLoading, messageLength: inputMessage.length, mode: chatMode });
    if (!inputMessage.trim() || isLoading) return;

    // Only detect image requirements for research mode (not web-search, not document chat)
    const imageReq = (chatMode === 'research' && !documentChatActive && chatDocuments.size === 0)
      ? detectImageRequirement(inputMessage)
      : { needsImage: false };
    const userDocs = documents.filter(d => d.status === 'ready').map(d => ({ id: d.driveFileId, name: d.name, type: d.addedToKnowledge ? 'knowledge' : 'explore' }));

    const userMessageId = Date.now();
    logger.debug('Adding user message', { id: userMessageId, mode: chatMode });
    setMessages(p => [...p, { id: userMessageId, type: 'user', content: inputMessage, timestamp: new Date(), webSearchEnabled }]);
    const currentMsg = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // Prepare message data with selected documents
    // Priority: 1. Document chat mode docs, 2. Legacy checkbox selection, 3. None
    const selectedDocIds = documentChatActive && chatDocuments.size > 0
      ? Array.from(chatDocuments)
      : chatMode === 'research' ? Array.from(selectedDocuments) : [];

    // Build selected docs array with full document info for HF Space
    const selectedDocsForHF = selectedDocIds.map(docId => {
      const doc = documents.find(d => d.id === docId || d.driveFileId === docId);
      return doc ? {
        driveFileId: doc.driveFileId,
        fileName: doc.name,
        mimeType: doc.mimeType || 'application/pdf'
      } : null;
    }).filter(Boolean);

    // Use different payload format for document chat (HF Space) vs other modes
    const isDocumentChatMode = documentChatActive && chatDocuments.size > 0;

    const msgData = isDocumentChatMode ? {
      // HF Space format for document chat
      userId: getAuthenticatedUserId(),
      sessionId: getSessionId(),
      query: currentMsg,
      selectedDocs: selectedDocsForHF
    } : {
      // Original format for other webhooks
      message: currentMsg,
      sessionId: getSessionId(),
      userId: getAuthenticatedUserId(),
      messageId: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      useWebSearch: webSearchEnabled,
      userDocuments: userDocs,
      chatMode: chatMode,
      selectedDocuments: selectedDocIds,
      documentChatMode: false
    };

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
            <span class="text-blue-700 font-medium">Processing your request...</span>
          </div>
        </div>`,
      timestamp: new Date(),
      isHTML: true,
      isProcessing: true
    };
    logger.info('Adding processing message', { id: processingMessageId, mode: chatMode });
    setMessages(p => {
      logger.debug('Current message count before adding processing', { count: p.length });
      return [...p, processingMessage];
    });

    try {
      let textContent = '';
      let imageContent = '';
      let textError = null;
      let imageError = null;
      let textResult = { html: '', usedWebSearch: false, webResults: null };

      // STEP 1: Determine which webhook to use
      let webhookUrl;
      if (chatMode === 'web-search') {
        webhookUrl = CONFIG.WEB_SEARCH_WEBHOOK_URL;
      } else if (documentChatActive && chatDocuments.size > 0) {
        // Document chat mode - user clicked "My Documents" button -> HF Space
        webhookUrl = CONFIG.DOCUMENT_CHAT_WEBHOOK_URL;
        logger.info('Using HF Space document chat', { count: chatDocuments.size });
      } else {
        // Default general research webhook
        webhookUrl = CONFIG.TEXT_WEBHOOK_URL;
      }

      logger.info(`Fetching ${chatMode} response from ${webhookUrl}`);
      logger.debug('Message data being sent', { messageId: msgData.messageId, mode: chatMode, useWebSearch: msgData.useWebSearch, selectedDocsCount: selectedDocIds.length });

      // Set up rotating fun messages for long operations
      let messageIndex = 0;
      const messageRotationInterval = setInterval(() => {
        const funMsg = FUN_WAITING_MESSAGES[messageIndex % FUN_WAITING_MESSAGES.length];
        setMessages(prev => prev.map(msg =>
          msg.id === processingMessageId ? {
            ...msg,
            content: `<div class="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-center">
              <div class="flex items-center justify-center gap-2">
                <div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-blue-700 font-medium">${funMsg.emoji} ${funMsg.text}</span>
              </div>
              <p class="text-xs text-slate-500 mt-2">Deep search in progress • ${Math.floor((messageIndex + 1) * 15)} seconds</p>
            </div>`
          } : msg
        ));
        messageIndex++;
      }, 15000); // Rotate message every 15 seconds

      try {
        // Create abort controller with extended timeout for deep search
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.LONG_REQUEST_TIMEOUT);

        const textRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msgData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        clearInterval(messageRotationInterval); // Stop rotating messages
        logger.debug('Webhook response received', { status: textRes.ok, mode: chatMode });

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
        clearInterval(messageRotationInterval); // Stop rotating messages on error
        logger.error('Text request failed', error);
        textError = error;

        // Check if it was a timeout
        if (error.name === 'AbortError') {
          textContent = `<div class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
            <strong>⏰ Request Timeout</strong><br/>
            <p class="text-sm mt-1">The search took longer than expected (over 8 minutes). Please try refining your query or try again later.</p>
          </div>`;
        } else {
          textContent = `<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <strong>Text Response Error</strong><br/>
            <p class="text-sm mt-1">Unable to process text response: ${error.message}</p>
          </div>`;
        }
      }

      // Update processing message to show text is complete
      if (imageReq.needsImage) {
        logger.debug('Updating processing message for image generation', { processingMessageId });
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
      logger.debug('Replacing processing message', { processingMessageId, finalMessageId: finalBotMessage.id });
      setMessages(prev => {
        const processingCount = prev.filter(m => m.id === processingMessageId).length;
        logger.debug('Processing messages found', { count: processingCount, totalMessages: prev.length });
        return prev.map(msg =>
          msg.id === processingMessageId ? finalBotMessage : msg
        );
      });

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
    // Immediately update UI for responsiveness
    setUserFeedback(p => ({ ...p, [messageId]: { ...p[messageId], thumbs: rating } }));

    try {
      const response = await fetch(CONFIG.FEEDBACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, sessionId: getSessionId(), userId: getAuthenticatedUserId(), thumbsRating: rating, feedbackType: 'quick', timestamp: new Date().toISOString() })
      });
      if (!response.ok) {
        logger.warn('Feedback webhook returned non-OK status', { status: response.status });
      }
      logger.info('Quick feedback submitted', { messageId, rating });
    } catch (e) {
      logger.error('Feedback error', e);
      // Keep the UI state even if webhook fails - feedback is still recorded locally
    }
  };

  const submitDetailedFeedback = async (feedbackData) => {
    // Close modal immediately for better UX
    const msgId = feedbackModal.messageId;
    setFeedbackModal({ open: false, messageId: null });

    try {
      const response = await fetch(CONFIG.FEEDBACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...feedbackData, messageId: msgId, sessionId: getSessionId(), userId: getAuthenticatedUserId(), feedbackType: 'detailed', timestamp: new Date().toISOString() })
      });
      if (!response.ok) {
        logger.warn('Detailed feedback webhook returned non-OK status', { status: response.status });
      }
      logger.info('Detailed feedback submitted', { messageId: msgId, rating: feedbackData.rating });
    } catch (e) {
      logger.error('Feedback error', e);
    }
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

  const copyToClipboard = (text, id) => { navigator.clipboard.writeText(htmlToText(text)); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
  const downloadChat = () => {
    const content = messages.filter(m => !m.isError).map(m => `[${formatTime(m.timestamp)}] ${m.type === 'user' ? 'You' : 'Dr. Gini'}: ${htmlToText(m.content)}`).join('\n\n');
    const blob = new Blob([`Dr. Gini Session\nUser: ${getAuthenticatedUserId()}\n${'='.repeat(40)}\n\n${content}`], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'research-session.txt'; a.click();
  };

  const suggestedQueries = [
    { icon: Beaker, text: 'Show caffeine structure', color: 'text-purple-500', action: 'query' },
    { icon: Microscope, text: 'Show chromene molecular structure', color: 'text-blue-500', action: 'query' },
    { icon: Database, text: 'Show protein folding mechanism', color: 'text-green-500', action: 'query' },
    { icon: Lightbulb, text: 'Summarize my uploaded documents', color: 'text-amber-500', action: 'summarizeDocs' },
  ];

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-blue-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="bg-white/10 backdrop-blur-lg p-10 rounded-2xl border border-white/20 shadow-2xl text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Atom className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Dr. Gini</h1>
          <p className="text-blue-200 mb-8">AI-powered Research Copilot</p>
          <p className="text-slate-300 mb-6">Sign in to access your personalized research assistant, manage documents, and track your research history.</p>
          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Sign In / Sign Up
          </button>
          <p className="text-xs text-slate-400 mt-6">
            Your documents and chat history will be securely associated with your account
          </p>
        </div>
      </div>
    );
  }

  // Main app (user is authenticated)
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col overflow-hidden`}>
        {/* Header - Clean and minimal */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Atom className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">Dr. Gini</h1>
              <p className="text-xs text-slate-500">Research Copilot</p>
            </div>
          </div>
        </div>

        {/* Chat History - Clean & Beautiful */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Chat History */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-purple-900">Chat History</h3>
              </div>
              <button
                onClick={fetchConversations}
                disabled={isLoadingHistory}
                className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors"
                title="Refresh history"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-purple-600 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="text-center py-6">
                <Loader2 className="w-5 h-5 text-purple-400 mx-auto animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                <p className="text-xs text-purple-600">No history yet</p>
              </div>
            ) : (() => {
              const favorites = conversations.filter(c => c.isFavorite);
              const regular = conversations.filter(c => !c.isFavorite);
              const grouped = groupConversationsByDate(regular);

              const renderConversation = (conv, showDate = true) => {
                const isActive = currentConversationId === conv.id;
                const isLoading = loadingConversationId === conv.id;
                const isFavorite = conv.isFavorite;

                return (
                  <div
                    key={conv.id}
                    className={`relative p-3 rounded-lg border transition-all group ${
                      isActive
                        ? 'bg-purple-100 border-purple-300 shadow-sm'
                        : 'bg-white hover:bg-purple-50 border-purple-100 hover:border-purple-200'
                    } ${isLoading ? 'opacity-50' : ''}`}
                  >
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg z-10">
                        <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                      </div>
                    )}

                    {/* Star Button - Top Right */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(conv.id, isFavorite);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-purple-200 transition-colors z-20"
                      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-purple-300 hover:text-amber-400'}`} />
                    </button>

                    {/* Clickable Area */}
                    <button
                      onClick={() => loadConversation(conv.id)}
                      disabled={isLoading}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between pr-8">
                        <p className="text-sm font-medium text-purple-900 truncate flex-1">
                          {conv.title || 'Untitled'}
                        </p>
                        {isActive && (
                          <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-purple-600">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {conv.messageCount || 0} msgs
                        </span>
                        {showDate && (
                          <span className="text-purple-500">
                            {formatTime(new Date(conv.timestamp))}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                );
              };

              return (
                <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {/* Favorites */}
                  {favorites.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <p className="text-xs font-bold text-purple-800 uppercase tracking-wide">Favorites</p>
                      </div>
                      <div className="space-y-2">
                        {favorites.map(conv => renderConversation(conv, true))}
                      </div>
                    </div>
                  )}

                  {/* Today */}
                  {grouped.today.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-purple-700 mb-2 px-1 uppercase tracking-wide">Today</p>
                      <div className="space-y-2">
                        {grouped.today.map(conv => renderConversation(conv, true))}
                      </div>
                    </div>
                  )}

                  {/* Yesterday */}
                  {grouped.yesterday.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-purple-700 mb-2 px-1 uppercase tracking-wide">Yesterday</p>
                      <div className="space-y-2">
                        {grouped.yesterday.map(conv => renderConversation(conv, true))}
                      </div>
                    </div>
                  )}

                  {/* Last 7 Days */}
                  {grouped.last7days.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-purple-700 mb-2 px-1 uppercase tracking-wide">Last 7 Days</p>
                      <div className="space-y-2">
                        {grouped.last7days.map(conv => renderConversation(conv, true))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

        </div>

        {/* Bottom Section - User Info & Actions */}
        <div className="border-t border-slate-100">
          {/* Export Button (conditional) */}
          {messages.length > 1 && (
            <div className="p-3 border-b border-slate-100">
              <button
                onClick={downloadChat}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Chat
              </button>
            </div>
          )}

          {/* User Info & Logout */}
          <div className="p-3">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate" title={user?.email}>
                  {user?.email || 'Guest'}
                </p>
                <p className="text-xs text-slate-500">Research Account</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign out"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex items-center px-4 relative">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg" title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}>{sidebarOpen ? <ChevronLeft className="w-5 h-5 text-slate-500" /> : <Menu className="w-5 h-5 text-slate-500" />}</button>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
              <span className="text-sm text-slate-600">{isLoading ? 'Processing...' : 'Ready'}</span>
            </div>
          </div>

          {/* Center - Mode Toggle */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-1 shadow-sm border border-slate-200">
            <button
              onClick={() => handleModeSwitch('research')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                chatMode === 'research'
                  ? 'bg-white text-blue-600 shadow-md scale-105'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Research</span>
            </button>
            <button
              onClick={() => handleModeSwitch('web-search')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                chatMode === 'web-search'
                  ? 'bg-white text-blue-600 shadow-md scale-105'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Web Search</span>
            </button>
          </div>

          {/* Right Section */}
          <div className="ml-auto flex items-center gap-2">
            {messages.length > 1 && (
              <button
                onClick={() => {
                  setMessages([messages[0]]);
                  setCurrentConversationId(null); // Reset conversation ID for new conversation
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                title="Clear chat and start fresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clear Chat</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {/* Active Conversation Banner */}
            {currentConversationId && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <MessageCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-purple-900">
                        Continuing: {conversations.find(c => c.id === currentConversationId)?.title || 'Previous conversation'}
                      </p>
                      <p className="text-xs text-purple-600">Type below to continue this conversation</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentConversationId(null);
                      setMessages([messages.find(m => m.isWelcome)]);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-medium text-purple-700 transition-colors"
                  >
                    New Topic
                  </button>
                </div>
              </div>
            )}

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

        {messages.length <= 2 && chatMode === 'research' && (
          <div className="px-4 pb-4">
            <div className="max-w-3xl mx-auto">
              <p className="text-xs text-slate-500 mb-3 font-medium">TRY THESE</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (q.action === 'summarizeDocs') {
                        // Open doc selector and set flag to auto-send summary
                        setAutoSendSummary(true);
                        setDocSelectorOpen(true);
                      } else {
                        // Regular query - just set input message
                        setInputMessage(q.text);
                      }
                    }}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm text-left group"
                  >
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
          <div className="max-w-5xl mx-auto px-4">
            {/* Three Column Layout: Left Panel | Center Input | Right Panel */}
            <div className="flex items-stretch gap-4">

              {/* LEFT PANEL - Upload & My Docs Buttons (Always visible in research mode) */}
              {chatMode === 'research' && (
                <div className="flex flex-col gap-2 justify-center ml-2">
                  {/* Upload Button - No badge, just action */}
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors border border-green-200"
                    title="Upload documents"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">Upload</span>
                  </button>

                  {/* My Docs Button - Shows knowledge (purple) and session (green) badges */}
                  <button
                    onClick={handleOpenDocSelector}
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-xl transition-colors border ${documentChatActive ? 'text-purple-700 bg-purple-100 hover:bg-purple-200 border-purple-300' : 'text-purple-500 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200'}`}
                    title={`My Documents: ${documents.filter(d => d.addedToKnowledge).length} Knowledge, ${documents.filter(d => !d.addedToKnowledge).length} Session`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-medium hidden sm:inline">My Docs</span>
                    {/* Badge container */}
                    <div className="absolute -top-1 -right-1 flex gap-0.5">
                      {/* Knowledge docs badge (purple) */}
                      {documents.filter(d => d.addedToKnowledge).length > 0 && (
                        <span className="w-4 h-4 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center font-semibold" title="Knowledge docs">
                          {documents.filter(d => d.addedToKnowledge).length}
                        </span>
                      )}
                      {/* Session docs badge (green) */}
                      {documents.filter(d => !d.addedToKnowledge).length > 0 && (
                        <span className="w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-semibold" title="Session docs">
                          {documents.filter(d => !d.addedToKnowledge).length}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              )}

              {/* CENTER - Clean Input Area */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-end gap-2 bg-slate-50 rounded-2xl p-2 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                  <textarea value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={
                      documentChatActive
                        ? 'Ask about your selected documents...'
                        : chatMode === 'web-search'
                        ? 'Search the web...'
                        : 'Ask about molecules, search papers...'
                    }
                    className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-slate-700 placeholder:text-slate-400 py-2 max-h-32" rows={1} disabled={isLoading} />
                  <button onClick={sendMessage} disabled={!inputMessage.trim() || isLoading}
                    className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"><Send className="w-4 h-4" /></button>
                </div>
                {/* Web Search Toggle - Below Input */}
                <div className="flex items-center justify-between mt-2 px-1">
                  {chatMode === 'research' && !documentChatActive ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={webSearchEnabled} onChange={(e) => setWebSearchEnabled(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
                      <Globe className={`w-4 h-4 ${webSearchEnabled ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className={`text-sm ${webSearchEnabled ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>Include web results</span>
                    </label>
                  ) : (
                    <div></div>
                  )}
                  <span className="text-xs text-slate-400">Session: {getSessionId().slice(-8)}</span>
                </div>
              </div>

              {/* RIGHT PANEL - Selected Documents (Only when docs selected) */}
              {documentChatActive && chatDocuments.size > 0 && (
                <div className="hidden md:flex flex-col w-64 p-3 bg-blue-50 border border-blue-200 rounded-xl mr-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-700">Selected Docs</span>
                    <button
                      onClick={handleClearDocumentChat}
                      className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-24 space-y-1">
                    {Array.from(chatDocuments).map(docId => {
                      const doc = documents.find(d => d.id === docId);
                      if (!doc) return null;
                      return (
                        <div key={docId} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs">
                          <FileText className="w-3 h-3 text-blue-600 flex-shrink-0" />
                          <span className="text-slate-700 truncate flex-1" title={doc.name}>{doc.name}</span>
                          <button
                            onClick={() => handleRemoveDocFromChat(docId)}
                            className="p-0.5 hover:bg-red-100 rounded-full transition-colors flex-shrink-0"
                            title="Remove"
                          >
                            <X className="w-3 h-3 text-slate-400 hover:text-red-600" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile: Selected Documents (shown below input on small screens) */}
            {documentChatActive && chatDocuments.size > 0 && (
              <div className="md:hidden mt-3 p-2 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-700">Selected Docs ({chatDocuments.size})</span>
                  <button
                    onClick={handleClearDocumentChat}
                    className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from(chatDocuments).map(docId => {
                    const doc = documents.find(d => d.id === docId);
                    if (!doc) return null;
                    return (
                      <div key={docId} className="flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs">
                        <FileText className="w-3 h-3 text-blue-600" />
                        <span className="text-slate-700 max-w-[100px] truncate">{doc.name}</span>
                        <button onClick={() => handleRemoveDocFromChat(docId)} className="p-0.5 hover:bg-red-100 rounded-full">
                          <X className="w-3 h-3 text-slate-400 hover:text-red-600" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UploadModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} onUpload={handleFileUpload} isUploading={isUploading} />
      <DocumentSelectorModal
        isOpen={docSelectorOpen}
        onClose={() => setDocSelectorOpen(false)}
        documents={documents}
        selectedDocIds={chatDocuments}
        onSelectDocs={handleSelectDocsForChat}
        onUploadClick={() => setUploadModalOpen(true)}
      />
      <FeedbackModal isOpen={feedbackModal.open} onClose={() => setFeedbackModal({ open: false, messageId: null })} onSubmit={submitDetailedFeedback} />
    </div>
  );
}

export default App;