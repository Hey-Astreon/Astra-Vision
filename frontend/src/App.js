import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import mermaid from 'mermaid';
import axios from 'axios';
import { 
  GithubLogo, 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileJs, 
  FileCss, 
  FileHtml, 
  FileTs,
  File,
  CaretRight, 
  CaretDown,
  Lightning,
  Bug,
  TreeStructure,
  CircleNotch,
  Warning,
  Graph,
  X
} from '@phosphor-icons/react';
import './App.css';
import { explainCode } from './utils/analysisEngine';

// Local Mock AI Logic

function explainError(errorMessage) {
  return {
    meaning: "The application encountered a localized issue.",
    cause: "This is a simulated local error response for: " + errorMessage,
    fix: "No fix needed. Offline mode is working as expected!"
  };
}

function generateFlow(fileContent) {
  return ["Start", "Function defined", "Logic executed", "Output returned"];
}

// Mock repository data for demo/fallback mode
const MOCK_REPO_FILES = {
  'src/app.js': `function greet(name) {
  return "Hello " + name;
}

console.log(greet("World"));`,
  'src/utils.js': `export function sum(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}`,
  'package.json': `{
  "name": "demo-project",
  "version": "1.0.0",
  "description": "A demo project for Astra Vision",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js"
  }
}`
};

const MOCK_REPO_TREE = [
  {
    name: 'src',
    path: 'src',
    type: 'dir',
    children: [
      {
        name: 'app.js',
        path: 'src/app.js',
        type: 'file',
        download_url: null
      },
      {
        name: 'utils.js',
        path: 'src/utils.js',
        type: 'file',
        download_url: null
      }
    ]
  },
  {
    name: 'package.json',
    path: 'package.json',
    type: 'file',
    download_url: null
  }
];

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#007acc',
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#3c3c3c',
    lineColor: '#858585',
    secondaryColor: '#2d2d2d',
    tertiaryColor: '#252526',
    background: '#1e1e1e',
    mainBkg: '#2d2d2d',
    nodeBorder: '#3c3c3c',
    clusterBkg: '#252526',
    titleColor: '#ffffff',
    edgeLabelBackground: '#2d2d2d',
  }
});

// File icon component
const FileIcon = ({ filename, isFolder, isOpen }) => {
  if (isFolder) {
    return isOpen ? (
      <FolderOpen size={16} weight="fill" className="text-vscode-warning" />
    ) : (
      <Folder size={16} weight="fill" className="text-vscode-warning" />
    );
  }
  
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return <FileJs size={16} weight="fill" className="text-yellow-400" />;
    case 'ts':
    case 'tsx':
      return <FileTs size={16} weight="fill" className="text-blue-400" />;
    case 'css':
    case 'scss':
      return <FileCss size={16} weight="fill" className="text-blue-300" />;
    case 'html':
      return <FileHtml size={16} weight="fill" className="text-orange-400" />;
    case 'py':
      return <FileCode size={16} weight="fill" className="text-green-400" />;
    case 'json':
      return <FileCode size={16} weight="fill" className="text-yellow-300" />;
    case 'md':
      return <FileCode size={16} weight="fill" className="text-vscode-text" />;
    default:
      return <File size={16} weight="fill" className="text-vscode-muted" />;
  }
};

// Get Monaco language from filename
const getLanguage = (filename) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const langMap = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'css': 'css',
    'scss': 'scss',
    'html': 'html',
    'json': 'json',
    'md': 'markdown',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'sh': 'shell',
    'bash': 'shell',
    'sql': 'sql',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'go': 'go',
    'rs': 'rust',
    'rb': 'ruby',
    'php': 'php',
  };
  return langMap[ext] || 'plaintext';
};

// Tree node component
const TreeNode = ({ node, level = 0, selectedFile, onSelectFile, expandedFolders, onToggleFolder }) => {
  const isFolder = node.type === 'dir';
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFile?.path === node.path;
  
  const handleClick = () => {
    if (isFolder) {
      onToggleFolder(node.path);
    } else {
      onSelectFile(node);
    }
  };
  
  return (
    <div>
      <div
        data-testid={isFolder ? `folder-${node.name}` : `file-${node.name}`}
        className={`file-tree-item flex items-center gap-1 px-2 py-1 cursor-pointer ${
          isSelected ? 'selected bg-vscode-selected text-white' : 'text-vscode-text hover:text-white'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {isFolder && (
          <span className="text-vscode-muted">
            {isExpanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
          </span>
        )}
        {!isFolder && <span className="w-3" />}
        <FileIcon filename={node.name} isFolder={isFolder} isOpen={isExpanded} />
        <span className="truncate text-sm font-mono">{node.name}</span>
      </div>
      
      {isFolder && isExpanded && node.children && (
        <div className="tree-children">
          {node.children.map((child, index) => (
            <TreeNode
              key={child.path || index}
              node={child}
              level={level + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Mermaid diagram component
const MermaidDiagram = ({ chart }) => {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!chart) return;
    
    const renderDiagram = async () => {
      try {
        setError(null);
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (err) {
        console.error('Mermaid error:', err);
        setError('Failed to render diagram');
      }
    };
    
    renderDiagram();
  }, [chart]);
  
  if (error) {
    return (
      <div className="text-vscode-danger text-sm p-2">
        <Warning size={16} className="inline mr-2" />
        {error}
      </div>
    );
  }
  
  if (!svg) return null;
  
  return (
    <div 
      ref={containerRef}
      className="mermaid-container overflow-auto p-2"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

// Loading spinner component
const Spinner = ({ size = 20 }) => (
  <CircleNotch size={size} className="animate-spin text-vscode-primary" />
);

// Main App component
function App() {
  // State
  const [repoUrl, setRepoUrl] = useState('');
  const [repoTree, setRepoTree] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  
  // Loading states
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [loadingFlow, setLoadingFlow] = useState(false);
  
  // Error states
  const [repoError, setRepoError] = useState('');
  const [errorInput, setErrorInput] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // AI responses
  const [codeExplanation, setCodeExplanation] = useState(null);
  const [errorExplanation, setErrorExplanation] = useState(null);
  const [flowDiagram, setFlowDiagram] = useState(null);
  
  // Parse GitHub URL
  const parseGitHubUrl = (url) => {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)/,
      /github\.com\/([^\/]+)\/([^\/]+)\.git/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { owner: match[1], repo: match[2].replace('.git', '') };
      }
    }
    return null;
  };
  
  // Load demo repository (fallback mode)
  const loadDemoRepo = () => {
    setIsDemoMode(true);
    setRepoTree(MOCK_REPO_TREE);
    setExpandedFolders(new Set(['src']));
    setRepoError('');
  };

  // Fetch repository structure
  const fetchRepo = async () => {
    if (!repoUrl.trim()) {
      setRepoError('Please enter a GitHub repository URL');
      return;
    }
    
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      setRepoError('Invalid GitHub URL. Use format: https://github.com/owner/repo');
      return;
    }
    
    setLoadingRepo(true);
    setRepoError('');
    setRepoTree([]);
    setSelectedFile(null);
    setFileContent('');
    setOpenTabs([]);
    setActiveTab(null);
    setCodeExplanation(null);
    setErrorExplanation(null);
    setFlowDiagram(null);
    setIsDemoMode(false);
    
    try {
      const { owner, repo } = parsed;
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contents`,
        { headers: { Accept: 'application/vnd.github.v3+json' } }
      );
      
      // Process root level
      const tree = await processContents(response.data, owner, repo, 0, 2);
      setRepoTree(tree);
      
      // Auto-expand first level folders
      const folders = tree.filter(item => item.type === 'dir').map(item => item.path);
      setExpandedFolders(new Set(folders));
      
    } catch (error) {
      console.error('Error fetching repo:', error);
      // Fallback to demo mode on any error
      if (error.response?.status === 403) {
        setRepoError('GitHub rate limit reached. Showing demo repository.');
      } else if (error.response?.status === 404) {
        setRepoError('Repository not found. Showing demo repository.');
      } else {
        setRepoError('Failed to fetch repository. Showing demo repository.');
      }
      loadDemoRepo();
    } finally {
      setLoadingRepo(false);
    }
  };
  
  // Process contents recursively (limited depth)
  const processContents = async (contents, owner, repo, currentDepth, maxDepth) => {
    const items = [];
    
    // Sort: folders first, then files
    const sorted = [...contents].sort((a, b) => {
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });
    
    for (const item of sorted) {
      const node = {
        name: item.name,
        path: item.path,
        type: item.type,
        url: item.url,
        download_url: item.download_url,
      };
      
      // Fetch children for directories (if within depth limit)
      if (item.type === 'dir' && currentDepth < maxDepth) {
        try {
          const childResponse = await axios.get(item.url, {
            headers: { Accept: 'application/vnd.github.v3+json' }
          });
          node.children = await processContents(
            childResponse.data, owner, repo, currentDepth + 1, maxDepth
          );
        } catch (error) {
          console.error(`Error fetching ${item.path}:`, error);
          node.children = [];
        }
      } else if (item.type === 'dir') {
        node.children = [];
      }
      
      items.push(node);
    }
    
    return items;
  };
  
  // Select file and fetch content
  const handleSelectFile = useCallback(async (file) => {
    if (file.type === 'dir') return;
    
    setSelectedFile(file);
    setLoadingFile(true);
    
    // Add to tabs if not already open
    if (!openTabs.find(tab => tab.path === file.path)) {
      setOpenTabs(prev => [...prev, file]);
    }
    setActiveTab(file.path);
    
    // Clear previous explanations
    setCodeExplanation(null);
    setErrorExplanation(null);
    setFlowDiagram(null);
    
    // Check if this is a demo mode file
    if (MOCK_REPO_FILES[file.path]) {
      setFileContent(MOCK_REPO_FILES[file.path]);
      setLoadingFile(false);
      return;
    }
    
    try {
      const response = await axios.get(file.download_url);
      setFileContent(typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Error fetching file:', error);
      setFileContent('// Error loading file content');
    } finally {
      setLoadingFile(false);
    }
  }, [openTabs]);
  
  // Close tab
  const closeTab = (tabPath, e) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(tab => tab.path !== tabPath);
    setOpenTabs(newTabs);
    
    if (activeTab === tabPath) {
      if (newTabs.length > 0) {
        const lastTab = newTabs[newTabs.length - 1];
        setActiveTab(lastTab.path);
        handleSelectFile(lastTab);
      } else {
        setActiveTab(null);
        setSelectedFile(null);
        setFileContent('');
      }
    }
  };
  
  // Toggle folder expand
  const toggleFolder = (path) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };
  
  // Explain code - Mock Local Logic
  const handleExplainCode = async () => {
    // GUARANTEE VALID INPUT - single source of truth
    if (!fileContent || fileContent.trim() === '') {
      setCodeExplanation({ error: 'No code loaded. Please select a file first.' });
      return;
    }
    
    setLoadingExplain(true);
    setCodeExplanation(null);
    
    try {
      // Simulate slight processing delay
      await new Promise(r => setTimeout(r, 500));
      
      const result = explainCode(fileContent);
      
      setCodeExplanation({
        overview: result.overview,
        key_parts: result.keyPoints.join('\n• '),
        summary: result.summary
      });
    } catch (error) {
      console.error('Error explaining code:', error);
      setCodeExplanation({ error: 'Something went wrong. Try again.' });
    } finally {
      setLoadingExplain(false);
    }
  };
  
  // Explain error - Mock Local Logic
  const handleExplainError = async () => {
    // GUARANTEE VALID INPUT
    if (!errorInput || errorInput.trim() === '') {
      setErrorExplanation({ error: 'Please enter an error message.' });
      return;
    }
    
    setLoadingError(true);
    setErrorExplanation(null);
    
    try {
      // Simulate slight processing delay
      await new Promise(r => setTimeout(r, 500));
      
      const result = explainError(errorInput);
      setErrorExplanation(result);
    } catch (error) {
      console.error('Error explaining error:', error);
      setErrorExplanation({ error: 'Something went wrong. Try again.' });
    } finally {
      setLoadingError(false);
    }
  };
  
  // Generate flow - Mock Local Logic
  const handleGenerateFlow = async () => {
    // GUARANTEE VALID INPUT - single source of truth
    if (!fileContent || fileContent.trim() === '') {
      setFlowDiagram({ error: 'No code loaded. Please select a file first.' });
      return;
    }
    
    setLoadingFlow(true);
    setFlowDiagram(null);
    
    try {
      // Simulate slight processing delay
      await new Promise(r => setTimeout(r, 500));
      
      const steps = generateFlow(fileContent);
      
      // Convert array steps to local Mermaid diagram format
      let diagramStr = "graph TD\n";
      steps.forEach((step, idx) => {
        const nodeName = `step${idx}`;
        diagramStr += `  ${nodeName}["${step}"]\n`;
        if (idx > 0) {
          diagramStr += `  step${idx - 1} --> ${nodeName}\n`;
        }
      });
      
      setFlowDiagram({ diagram: diagramStr });
    } catch (error) {
      console.error('Error generating flow:', error);
      setFlowDiagram({ error: 'Something went wrong. Try again.' });
    } finally {
      setLoadingFlow(false);
    }
  };
  
  return (
    <div className="h-screen flex overflow-hidden bg-vscode-bg text-vscode-text font-sans">
      {/* Left Sidebar - File Explorer */}
      <div className="w-72 flex-shrink-0 border-r border-vscode-border bg-vscode-sidebar flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-vscode-border">
          <div className="flex items-center gap-2 mb-3">
            <Graph size={24} weight="bold" className="text-vscode-primary" />
            <h1 className="text-white font-mono font-bold text-lg">Astra Vision</h1>
          </div>
          
          {/* GitHub URL Input */}
          <div className="space-y-2">
            <div className="relative">
              <GithubLogo size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-vscode-muted" />
              <input
                data-testid="repo-input"
                type="text"
                placeholder="github.com/owner/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchRepo()}
                className="w-full bg-vscode-input border border-transparent text-vscode-text placeholder-vscode-placeholder focus:border-vscode-focus rounded-sm pl-10 pr-3 py-1.5 text-sm transition-colors"
              />
            </div>
            <button
              data-testid="fetch-repo-btn"
              onClick={fetchRepo}
              disabled={loadingRepo}
              className="w-full bg-vscode-primary text-white hover:bg-[#005f9e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm px-4 py-1.5 font-medium text-sm flex items-center justify-center gap-2"
            >
              {loadingRepo ? (
                <>
                  <Spinner size={16} />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Lightning size={16} weight="bold" />
                  <span>Fetch Repository</span>
                </>
              )}
            </button>
          </div>
          
          {/* Error/Demo mode message */}
          {repoError && (
            <div data-testid="repo-error" className={`mt-2 text-xs rounded-sm p-2 ${
              isDemoMode 
                ? 'text-vscode-warning bg-vscode-warning/10 border border-vscode-warning/30' 
                : 'text-vscode-danger bg-vscode-danger/10 border border-vscode-danger/30'
            }`}>
              <Warning size={14} className="inline mr-1" />
              {repoError}
            </div>
          )}
          
          {/* Demo mode indicator */}
          {isDemoMode && !repoError && (
            <div data-testid="demo-mode-indicator" className="mt-2 text-xs text-vscode-secondary bg-vscode-secondary/10 border border-vscode-secondary/30 rounded-sm p-2">
              <Lightning size={14} className="inline mr-1" />
              Demo Mode Active
            </div>
          )}
        </div>
        
        {/* File Explorer */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 py-1 text-xs font-mono text-vscode-muted uppercase tracking-widest">
            Explorer
          </div>
          
          {repoTree.length > 0 ? (
            <div data-testid="file-tree" className="mt-1">
              {repoTree.map((node, index) => (
                <TreeNode
                  key={node.path || index}
                  node={node}
                  level={0}
                  selectedFile={selectedFile}
                  onSelectFile={handleSelectFile}
                  expandedFolders={expandedFolders}
                  onToggleFolder={toggleFolder}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-vscode-muted text-sm">
              <GithubLogo size={48} className="mx-auto mb-3 text-vscode-border" />
              <p>Enter a GitHub URL to explore</p>
              <p className="text-xs mt-1">or</p>
              <button
                data-testid="try-demo-btn"
                onClick={loadDemoRepo}
                className="mt-2 text-vscode-primary hover:text-vscode-secondary transition-colors text-xs underline"
              >
                Try Demo Repository
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Center - Code Viewer */}
      <div className="flex-1 flex flex-col min-w-0 bg-vscode-bg">
        {/* Tabs */}
        <div className="flex overflow-x-auto bg-vscode-sidebar border-b border-vscode-border scrollbar-none">
          {openTabs.map((tab) => (
            <div
              key={tab.path}
              data-testid={`tab-${tab.name}`}
              onClick={() => {
                setActiveTab(tab.path);
                handleSelectFile(tab);
              }}
              className={`flex items-center gap-2 px-4 py-2 border-r border-vscode-border cursor-pointer text-sm font-mono min-w-fit group ${
                activeTab === tab.path 
                  ? 'tab-active text-white' 
                  : 'tab-inactive text-vscode-muted hover:text-vscode-text'
              }`}
            >
              <FileIcon filename={tab.name} isFolder={false} />
              <span className="truncate max-w-32">{tab.name}</span>
              <button
                data-testid={`close-tab-${tab.name}`}
                onClick={(e) => closeTab(tab.path, e)}
                className="opacity-0 group-hover:opacity-100 hover:bg-vscode-hover rounded p-0.5 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {openTabs.length === 0 && (
            <div className="px-4 py-2 text-sm font-mono text-vscode-muted">
              No files open
            </div>
          )}
        </div>
        
        {/* Monaco Editor */}
        <div className="flex-1 relative">
          {loadingFile && (
            <div className="absolute inset-0 flex items-center justify-center bg-vscode-bg/80 z-10">
              <Spinner size={32} />
            </div>
          )}
          
          {selectedFile ? (
            <Editor
              height="100%"
              language={getLanguage(selectedFile.name)}
              value={fileContent}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                fontSize: 14,
                fontFamily: 'JetBrains Mono, monospace',
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                cursorStyle: 'line',
                automaticLayout: true,
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-vscode-muted h-full">
              <FileCode size={64} className="mb-4 text-vscode-border" />
              <p className="text-lg">Select a file to view</p>
              <p className="text-sm mt-1">Use the explorer on the left</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Sidebar - AI Panel */}
      <div className="w-96 flex-shrink-0 border-l border-vscode-border bg-vscode-sidebar flex flex-col overflow-hidden">
        <div className="p-3 border-b border-vscode-border">
          <h2 className="text-xs font-mono text-vscode-muted uppercase tracking-widest">AI Analysis</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* Code Explanation Section */}
          <div className="panel-section p-4 border-b border-vscode-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono text-vscode-muted uppercase tracking-widest flex items-center gap-2">
                <Lightning size={14} />
                Code Explanation
              </h3>
              <button
                data-testid="explain-code-btn"
                onClick={handleExplainCode}
                disabled={!fileContent || loadingExplain}
                className="bg-vscode-primary text-white hover:bg-[#005f9e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm px-3 py-1 text-xs font-medium flex items-center gap-1"
              >
                {loadingExplain ? <Spinner size={12} /> : <Lightning size={12} />}
                Explain
              </button>
            </div>
            
            {codeExplanation && !codeExplanation.error && (
              <div className="explanation-section space-y-3 text-sm">
                <div>
                  <h4 className="text-vscode-secondary font-medium mb-1">Overview</h4>
                  <p className="text-vscode-text leading-relaxed">{codeExplanation.overview}</p>
                </div>
                <div>
                  <h4 className="text-vscode-secondary font-medium mb-1">Key Parts</h4>
                  <p className="text-vscode-text leading-relaxed">{codeExplanation.key_parts}</p>
                </div>
                <div>
                  <h4 className="text-vscode-secondary font-medium mb-1">Summary</h4>
                  <p className="text-vscode-text leading-relaxed">{codeExplanation.summary}</p>
                </div>
              </div>
            )}
            
            {codeExplanation?.error && (
              <div className="text-vscode-danger text-sm">{codeExplanation.error}</div>
            )}
            
            {!codeExplanation && !loadingExplain && (
              <p className="text-vscode-muted text-sm">Click "Explain" to analyze the code</p>
            )}
          </div>
          
          {/* Error Debug Section */}
          <div className="panel-section p-4 border-b border-vscode-border">
            <h3 className="text-xs font-mono text-vscode-muted uppercase tracking-widest flex items-center gap-2 mb-3">
              <Bug size={14} />
              Error Debug
            </h3>
            
            <div className="space-y-2">
              <textarea
                data-testid="error-input"
                value={errorInput}
                onChange={(e) => setErrorInput(e.target.value)}
                placeholder="Paste your error message here..."
                className="w-full bg-vscode-input border border-transparent text-vscode-text placeholder-vscode-placeholder focus:border-vscode-focus rounded-sm px-3 py-2 text-sm resize-none h-20 transition-colors font-mono"
              />
              <button
                data-testid="explain-error-btn"
                onClick={handleExplainError}
                disabled={!errorInput.trim() || loadingError}
                className="w-full bg-vscode-danger/80 text-white hover:bg-vscode-danger disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm px-3 py-1.5 text-sm font-medium flex items-center justify-center gap-2"
              >
                {loadingError ? <Spinner size={14} /> : <Bug size={14} />}
                Explain Error
              </button>
            </div>
            
            {errorExplanation && !errorExplanation.error && (
              <div className="explanation-section mt-3 space-y-3 text-sm">
                <div>
                  <h4 className="text-vscode-danger font-medium mb-1">Meaning</h4>
                  <p className="text-vscode-text leading-relaxed">{errorExplanation.meaning}</p>
                </div>
                <div>
                  <h4 className="text-vscode-warning font-medium mb-1">Cause</h4>
                  <p className="text-vscode-text leading-relaxed">{errorExplanation.cause}</p>
                </div>
                <div>
                  <h4 className="text-vscode-secondary font-medium mb-1">Fix</h4>
                  <p className="text-vscode-text leading-relaxed whitespace-pre-line">{errorExplanation.fix}</p>
                </div>
              </div>
            )}
            
            {errorExplanation?.error && (
              <div className="text-vscode-danger text-sm mt-2">{errorExplanation.error}</div>
            )}
          </div>
          
          {/* Flow Diagram Section */}
          <div className="panel-section p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono text-vscode-muted uppercase tracking-widest flex items-center gap-2">
                <TreeStructure size={14} />
                Flow Diagram
              </h3>
              <button
                data-testid="generate-flow-btn"
                onClick={handleGenerateFlow}
                disabled={!fileContent || loadingFlow}
                className="bg-vscode-secondary/80 text-black hover:bg-vscode-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm px-3 py-1 text-xs font-medium flex items-center gap-1"
              >
                {loadingFlow ? <Spinner size={12} /> : <TreeStructure size={12} />}
                Generate
              </button>
            </div>
            
            {flowDiagram && !flowDiagram.error && (
              <div className="explanation-section">
                <div className="bg-vscode-bg rounded-sm border border-vscode-border overflow-hidden">
                  <MermaidDiagram chart={flowDiagram.diagram} />
                </div>
              </div>
            )}
            
            {flowDiagram?.error && (
              <div className="text-vscode-danger text-sm">{flowDiagram.error}</div>
            )}
            
            {!flowDiagram && !loadingFlow && (
              <p className="text-vscode-muted text-sm">Click "Generate" to create a flow diagram</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
