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
  X,
  GraduationCap,
  Circle,
  Play,
  BookOpen,
  Info
} from '@phosphor-icons/react';
import './App.css';
import { explainCode, parseCode, analyzeCode, generateDiagram, analyzeLine } from './utils/analysisEngine';

// Local Mock AI Logic

// Removed legacy mock functions (explainError, generateFlow) to use AnalysisEngine orchestrators.

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

// Initialize mermaid with specific VSCode/Dark theme configuration
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' }
});

/**
 * Visual Teaching System: Mermaid Diagram Component
 * Handles manual rendering and re-rendering of diagrams for high stability.
 */
const MermaidDiagram = ({ chart }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chart) return;

    const renderDiagram = async () => {
      try {
        setError(null);
        // Requirement: Unique ID per render to prevent collisions
        const id = "diagram-" + Date.now();
        // Requirement: Manual render() call
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
      } catch (err) {
        console.error("Mermaid Render Error:", err);
        setError("Unable to render diagram. Showing simplified flow.");
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div className="p-3 border border-vscode-danger/30 bg-vscode-danger/5 text-vscode-danger text-[10px] italic rounded-sm mb-4">
        {error}
      </div>
    );
  }

  if (!svg) return null;

  return (
    <div 
      className="mermaid-container bg-vscode-input p-4 rounded-sm border border-vscode-border overflow-x-auto flex justify-center mb-4 transition-all duration-300"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

// File icon component
const FileIcon = ({ filename, isFolder, isOpen }) => {
  if (isFolder) {
    return isOpen ? (
      typeof FolderOpen !== "undefined" && <FolderOpen size={16} weight="fill" className="text-vscode-warning" />
    ) : (
      typeof Folder !== "undefined" && <Folder size={16} weight="fill" className="text-vscode-warning" />
    );
  }
  
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return typeof FileJs !== "undefined" && <FileJs size={16} weight="fill" className="text-yellow-400" />;
    case 'ts':
    case 'tsx':
      return typeof FileTs !== "undefined" && <FileTs size={16} weight="fill" className="text-blue-400" />;
    case 'css':
    case 'scss':
      return typeof FileCss !== "undefined" && <FileCss size={16} weight="fill" className="text-blue-300" />;
    case 'html':
      return typeof FileHtml !== "undefined" && <FileHtml size={16} weight="fill" className="text-orange-400" />;
    case 'py':
      return typeof FileCode !== "undefined" && <FileCode size={16} weight="fill" className="text-green-400" />;
    case 'json':
      return typeof FileCode !== "undefined" && <FileCode size={16} weight="fill" className="text-yellow-300" />;
    case 'md':
      return typeof FileCode !== "undefined" && <FileCode size={16} weight="fill" className="text-vscode-text" />;
    default:
      return typeof File !== "undefined" && <File size={16} weight="fill" className="text-vscode-muted" />;
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
            {isExpanded ? (typeof CaretDown !== "undefined" && <CaretDown size={12} />) : (typeof CaretRight !== "undefined" && <CaretRight size={12} />)}
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


// Loading spinner component
const Spinner = ({ size = 20 }) => (
  typeof CircleNotch !== "undefined" && <CircleNotch size={size} className="animate-spin text-vscode-primary" />
);

// Main App component
function App() {
  // State
  const [repoUrl, setRepoUrl] = useState('');
  const [repoTree, setRepoTree] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [selectedLineInfo, setSelectedLineInfo] = useState(null);
  
  const editorRef = useRef(null);
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
  const [diagramCode, setDiagramCode] = useState('');
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
    setDiagramCode('');
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
  
  // Explain code - Visual Teaching Engine Refinement
  const handleExplainCode = async () => {
    if (!fileContent || fileContent.trim() === '') {
      setCodeExplanation({ error: 'No code loaded. Please select a file first.' });
      return;
    }
    
    setLoadingExplain(true);
    setCodeExplanation(null);
    setDiagramCode('');
    
    try {
      // Simulate slight processing delay for "thinking" feel
      await new Promise(r => setTimeout(r, 400));
      
      // End-to-End Orchestrator Call
      const result = explainCode(fileContent);
      console.log("Explain Output:", result);

      if (!result) {
        throw new Error("Empty result from analysis engine");
      }
      
      setCodeExplanation(result);
      setDiagramCode(result.diagram || '');
    } catch (error) {
      console.error('Error in Teaching Engine:', error);
      setCodeExplanation({ error: 'Something went wrong during analysis.' });
    } finally {
      setLoadingExplain(false);
    }
  };
  
  // Explain error - Orchestrated via Error Intelligence Engine
  const handleExplainError = async () => {
    if (!errorInput || errorInput.trim() === '') {
      setErrorExplanation({ error: 'Please enter an error message.' });
      return;
    }
    
    setLoadingError(true);
    setErrorExplanation(null);
    
    try {
      await new Promise(r => setTimeout(r, 500));
      
      // Integration: Use the context-aware analyzeError engine
      const result = analyzeError(errorInput, fileContent);
      setErrorExplanation(result);
    } catch (error) {
      console.error('Error explaining error:', error);
      setErrorExplanation({ error: 'Something went wrong. Try again.' });
    } finally {
      setLoadingError(false);
    }
  };
  
  // Generate flow - Integrated with Analysis Engine Orchestrator
  const handleGenerateFlow = async () => {
    if (!fileContent || fileContent.trim() === '') {
      setFlowDiagram({ error: 'No code loaded. Please select a file first.' });
      return;
    }
    
    setLoadingFlow(true);
    setFlowDiagram(null);
    
    try {
      await new Promise(r => setTimeout(r, 500));
      
      const analysis = analyzeCode(parseCode(fileContent));
      if (!analysis) throw new Error("File too simple for flow analysis.");
      
      const diagram = generateDiagram(analysis);
      setFlowDiagram({ diagram });
    } catch (error) {
      console.error('Error generating flow:', error);
      setFlowDiagram({ error: 'System cannot visualize this specific code yet.' });
    } finally {
      setLoadingFlow(false);
    }
  };

  // Line-by-line interactive controller
  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    
    // Requirement Phase 6: Interactive learning click detector
    editor.onMouseDown((e) => {
      const { position } = e.target;
      if (position) {
        const lineContent = editor.getModel().getLineContent(position.lineNumber);
        const analysis = analyzeLine(lineContent);
        if (analysis) {
          setSelectedLineInfo({
            line: position.lineNumber,
            ...analysis
          });
        }
      }
    });

    // Optional: Reset selection when code changes
    editor.onDidChangeModelContent(() => {
      setSelectedLineInfo(null);
    });
  };
  
  return (
    <div className="h-screen flex overflow-hidden bg-vscode-bg text-vscode-text font-sans">
      {/* Left Sidebar - File Explorer */}
      <div className="w-72 flex-shrink-0 border-r border-vscode-border bg-vscode-sidebar flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-vscode-border">
          <div className="flex items-center gap-2 mb-3">
            {typeof Graph !== "undefined" && <Graph size={24} weight="bold" className="text-vscode-primary" />}
            <h1 className="text-white font-mono font-bold text-lg">Astra Vision</h1>
          </div>
          
          {/* GitHub URL Input */}
          <div className="space-y-2">
            <div className="relative">
              {typeof GithubLogo !== "undefined" && <GithubLogo size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-vscode-muted" />}
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
                  {typeof Lightning !== "undefined" && <Lightning size={16} weight="bold" />}
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
              {typeof Warning !== "undefined" && <Warning size={14} className="inline mr-1" />}
              {repoError}
            </div>
          )}
          
          {/* Demo mode indicator */}
          {isDemoMode && !repoError && (
            <div data-testid="demo-mode-indicator" className="mt-2 text-xs text-vscode-secondary bg-vscode-secondary/10 border border-vscode-secondary/30 rounded-sm p-2">
              {typeof Lightning !== "undefined" && <Lightning size={14} className="inline mr-1" />}
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
              {typeof GithubLogo !== "undefined" && <GithubLogo size={48} className="mx-auto mb-3 text-vscode-border" />}
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
                {typeof X !== "undefined" && <X size={14} />}
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
              onMount={handleEditorMount}
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
              {typeof FileCode !== "undefined" && <FileCode size={64} className="mb-4 text-vscode-border" />}
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
          {/* Phase 6: Interactive Line Insights */}
          {selectedLineInfo ? (
            <div className="p-4 border-b border-vscode-border bg-vscode-input/30 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-mono text-vscode-primary uppercase tracking-widest flex items-center gap-1.5">
                  <Play size={10} weight="fill" /> Line {selectedLineInfo.line} Insight
                </h3>
                <button 
                  onClick={() => setSelectedLineInfo(null)}
                  className="text-vscode-muted hover:text-white transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
              
              <div className="bg-black/40 p-2 rounded border border-vscode-border/50 mb-3 font-mono text-[11px] text-vscode-secondary overflow-x-auto whitespace-nowrap">
                {selectedLineInfo.code}
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-[9px] uppercase text-vscode-muted font-bold tracking-tight mb-1">What this does</h4>
                  <p className="text-xs text-vscode-text leading-snug">{selectedLineInfo.explanation}</p>
                </div>

                {selectedLineInfo.example && (
                  <div className="bg-vscode-primary/5 p-2 rounded border border-vscode-primary/20">
                    <h4 className="text-[9px] uppercase text-vscode-primary font-bold tracking-tight mb-1">Quick Demo</h4>
                    <p className="text-[10px] font-mono text-vscode-text">{selectedLineInfo.example}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex-1">
                    <h4 className="text-[9px] uppercase text-vscode-muted font-bold tracking-tight mb-1">Impact</h4>
                    <p className="text-[10px] text-vscode-muted italic">{selectedLineInfo.affects}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-vscode-border/30">
                  <h4 className="text-[9px] uppercase text-vscode-warning font-bold tracking-tight mb-1 flex items-center gap-1">
                    <Warning size={10} /> Safety Note
                  </h4>
                  <p className="text-[10px] text-vscode-text/80">{selectedLineInfo.mistake}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-vscode-border text-center py-8">
               <Info size={24} className="mx-auto text-vscode-border mb-2" />
               <p className="text-[11px] text-vscode-muted italic">Click any line in the editor<br/>to explore it deeply.</p>
            </div>
          )}

          {/* Code Explanation Section */}
          <div className="panel-section p-4 border-b border-vscode-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono text-vscode-muted uppercase tracking-widest flex items-center gap-2">
                {typeof Lightning !== "undefined" && <Lightning size={14} />}
                Code Explanation
              </h3>
              <button
                data-testid="explain-code-btn"
                onClick={handleExplainCode}
                disabled={!fileContent || loadingExplain}
                className="bg-vscode-primary text-white hover:bg-[#005f9e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm px-3 py-1 text-xs font-medium flex items-center gap-1"
              >
                {loadingExplain ? <Spinner size={12} /> : (typeof Lightning !== "undefined" && <Lightning size={12} />)}
                Explain
              </button>
            </div>
            
            {codeExplanation && !codeExplanation.error && (
              <div className="explanation-section space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="text-vscode-secondary font-medium mb-1 uppercase text-[10px] tracking-widest">Astra Overview</h4>
                    <p className="text-vscode-text leading-relaxed italic border-l-2 border-vscode-primary pl-3">{codeExplanation.overview}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                  <div className="flex flex-wrap gap-2">
                    {(codeExplanation.difficulty || codeExplanation.difficultyLevel) && (
                      <div className={`px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-tighter border ${(codeExplanation.difficulty || codeExplanation.difficultyLevel) === 'basic' ? 'bg-vscode-primary/10 text-vscode-primary border-vscode-primary/30' : 'bg-vscode-secondary/10 text-vscode-secondary border-vscode-secondary/30'}`}>
                        {(codeExplanation.difficulty || codeExplanation.difficultyLevel)}
                      </div>
                    )}
                    {codeExplanation.confidenceLevel && (
                      <div className={`px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-widest border border-vscode-border/40 ${codeExplanation.confidenceLevel === 'high' ? 'bg-green-500/10 text-green-500' : codeExplanation.confidenceLevel === 'medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-vscode-danger/10 text-vscode-danger'}`}>
                        Confidence: {codeExplanation.confidenceLevel}
                      </div>
                    )}
                  </div>
                </div>
                </div>

                {(codeExplanation.flow || codeExplanation.breakdown) && (codeExplanation.flow || codeExplanation.breakdown).length > 0 && (
                  <div>
                    <h4 className="text-vscode-secondary font-medium mb-1 flex items-center gap-1">
                      {typeof TreeStructure !== "undefined" && <TreeStructure size={14} />} Logic Flow
                    </h4>
                    <div className="space-y-2 mb-4">
                      {(codeExplanation.flow || codeExplanation.breakdown).map((step, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-vscode-primary font-bold opacity-50">{i + 1}.</span>
                          <p className="text-vscode-text">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {codeExplanation.behaviorDetails && codeExplanation.behaviorDetails.length > 0 && (
                  <div className="mb-4 bg-vscode-input p-3 rounded-sm border border-vscode-border">
                    <h4 className="text-vscode-primary font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1">
                      {typeof Play !== "undefined" && <Play size={10} weight="fill" />} Step-by-Step Behavior
                    </h4>
                    <div className="space-y-2">
                       {codeExplanation.behaviorDetails.map((detail, i) => (
                         <p key={i} className="text-vscode-text text-xs flex items-start gap-2">
                           <span className="bg-vscode-primary/20 text-vscode-primary px-1 rounded-[2px] text-[8px] mt-0.5">{i+1}</span>
                           {detail}
                         </p>
                       ))}
                    </div>
                  </div>
                )}

                {diagramCode && (
                  <div className="mb-4">
                    <h4 className="text-vscode-secondary font-medium mb-2 uppercase text-[10px] tracking-widest">Visual Flow (Diagram)</h4>
                    <MermaidDiagram chart={diagramCode} />
                  </div>
                )}

                {codeExplanation.reasoning && (
                  <div className="mb-4">
                    <h4 className="text-vscode-secondary font-medium mb-1">Architect's Reasoning</h4>
                    <p className="text-vscode-text leading-relaxed bg-vscode-input p-2 rounded-sm border border-vscode-border">{codeExplanation.reasoning}</p>
                  </div>
                )}

                {codeExplanation.relationships && codeExplanation.relationships.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-vscode-secondary font-medium mb-1 uppercase text-[10px] tracking-widest">Architectural Patterns</h4>
                    <div className="space-y-1">
                      {codeExplanation.relationships.map((rel, i) => (
                        <p key={i} className="text-vscode-text text-sm flex items-center gap-2">
                          {typeof Circle !== "undefined" && <Circle size={4} weight="fill" className="text-vscode-primary" />} {rel}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {codeExplanation.analogy && (
                  <div className="bg-vscode-primary/10 p-3 rounded-sm border border-vscode-primary/20 mb-4">
                    <h4 className="text-vscode-primary font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-1">
                      {typeof Lightning !== "undefined" && <Lightning size={12} weight="fill" />}
                      Visual Analogy
                    </h4>
                    <p className="text-vscode-text leading-relaxed font-medium">{codeExplanation.analogy}</p>
                  </div>
                )}

                {(codeExplanation.keyPoints || codeExplanation.keyConcepts) && (codeExplanation.keyPoints || codeExplanation.keyConcepts).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-vscode-secondary font-medium mb-1">Key Concepts</h4>
                    <div className="flex flex-wrap gap-1">
                      {(codeExplanation.keyPoints || codeExplanation.keyConcepts).map((concept, i) => (
                        <span key={i} className="bg-vscode-selected px-2 py-0.5 rounded-sm text-[10px] text-white">
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {codeExplanation.educationalExamples && codeExplanation.educationalExamples.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-vscode-secondary font-medium mb-2 uppercase text-[10px] tracking-widest flex items-center gap-1">
                      {typeof BookOpen !== "undefined" && <BookOpen size={12} />} Concrete Examples
                    </h4>
                    <div className="space-y-2">
                      {codeExplanation.educationalExamples.map((ex, i) => (
                        <div key={i} className="bg-black/20 p-2 rounded-sm border border-vscode-border/50">
                          <div className="text-[10px] font-bold text-vscode-primary mb-1">{ex.title}</div>
                          <div className="font-mono text-[11px] mb-1">
                            <span className="text-vscode-muted">Input:</span> <span className="text-vscode-secondary">{ex.input}</span>
                            <span className="mx-2 text-vscode-muted">→</span>
                            <span className="text-vscode-muted">Result:</span> <span className="text-green-400">{ex.result}</span>
                          </div>
                          <div className="text-[9px] text-vscode-muted italic">{ex.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {codeExplanation.risks && codeExplanation.risks.length > 0 && (
                  <div className="p-3 rounded-sm border border-vscode-warning/30 bg-vscode-info/5 mb-4">
                    <h4 className="text-vscode-warning font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-1">
                      {typeof Warning !== "undefined" && <Warning size={12} weight="fill" />}
                      What Could Go Wrong?
                    </h4>
                    <div className="space-y-1">
                      {codeExplanation.risks.map((risk, i) => (
                        <p key={i} className="text-vscode-text text-sm flex items-start gap-2">
                           <span className="text-vscode-warning mt-1">•</span>
                           {risk}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {codeExplanation.commonMistakes && codeExplanation.commonMistakes.length > 0 && (
                  <div className="p-3 rounded-sm border border-vscode-danger/30 bg-vscode-danger/5 mb-4">
                    <h4 className="text-vscode-danger font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-1">
                      {typeof Warning !== "undefined" && <Warning size={12} weight="fill" />}
                      Common Pitfalls
                    </h4>
                    <div className="space-y-1">
                      {codeExplanation.commonMistakes.map((mistake, i) => (
                        <p key={i} className="text-vscode-text text-sm">• {mistake}</p>
                      ))}
                    </div>
                  </div>
                )}

                {codeExplanation.realWorldUsage && (
                  <div className="mb-4">
                    <h4 className="text-vscode-secondary font-medium mb-1 uppercase text-[10px] tracking-widest">Real-World Case</h4>
                    <p className="text-vscode-text leading-relaxed text-xs opacity-80">{codeExplanation.realWorldUsage}</p>
                  </div>
                )}

                {codeExplanation.devInsight && (
                  <div className="mb-4 bg-vscode-primary/5 p-3 rounded-sm border-l-2 border-vscode-primary">
                    <h4 className="text-vscode-primary font-bold text-[10px] uppercase tracking-widest mb-1 flex items-center gap-1">
                      {typeof Lightning !== "undefined" && <Lightning size={12} weight="fill" />}
                      Real Dev Insight
                    </h4>
                    <p className="text-vscode-text leading-relaxed text-xs italic">{codeExplanation.devInsight}</p>
                  </div>
                )}

                {codeExplanation.learningHints && codeExplanation.learningHints.length > 0 && (
                  <div className="p-3 rounded-sm border border-vscode-primary/20 bg-vscode-input mb-4">
                    <h4 className="text-vscode-primary font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-1">
                      {typeof GraduationCap !== "undefined" && <GraduationCap size={12} weight="fill" />}
                      Try This Next
                    </h4>
                    <div className="space-y-1">
                      {codeExplanation.learningHints.map((hint, i) => (
                        <p key={i} className="text-vscode-text text-sm flex items-start gap-2">
                          <span className="text-vscode-primary mt-1">•</span>
                          {hint}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-vscode-border pt-3">
                  <h4 className="text-vscode-secondary font-medium mb-1 uppercase text-[10px] tracking-widest">Astra Verdict</h4>
                  <p className="text-vscode-text leading-relaxed font-bold">{codeExplanation?.summary || "Analysis complete."}</p>
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
              {typeof Bug !== "undefined" && <Bug size={14} />}
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
                {loadingError ? <Spinner size={14} /> : (typeof Bug !== "undefined" && <Bug size={14} />)}
                Explain Error
              </button>
            </div>
            
            {errorExplanation && !errorExplanation.error && (
              <div className="explanation-section mt-3 space-y-3 text-sm">
                <div className="flex justify-between items-center bg-vscode-input p-2 rounded-sm border border-vscode-border/50">
                  <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${errorExplanation.severity === 'blocking' ? 'bg-vscode-danger/20 text-vscode-danger' : 'bg-vscode-warning/20 text-vscode-warning'}`}>
                    {errorExplanation.severity || 'Unknown'} Severity
                  </div>
                  <div className="text-[10px] text-vscode-muted uppercase font-mono tracking-tighter">
                    Category: {errorExplanation.category}
                  </div>
                </div>

                <div>
                  <h4 className="text-vscode-danger font-medium mb-1 flex items-center gap-1 uppercase text-[10px] tracking-widest">Meaning</h4>
                  <p className="text-vscode-text leading-relaxed font-medium">{errorExplanation.meaning}</p>
                </div>

                {errorExplanation.causes && errorExplanation.causes.length > 0 && (
                  <div>
                    <h4 className="text-vscode-warning font-medium mb-1 uppercase text-[10px] tracking-widest">Potential Causes</h4>
                    <div className="space-y-1">
                      {errorExplanation.causes.map((cause, i) => (
                        <p key={i} className="text-vscode-text text-xs leading-relaxed opacity-80">• {cause}</p>
                      ))}
                    </div>
                  </div>
                )}

                {errorExplanation.fix && (
                  <div>
                    <h4 className="text-vscode-primary font-medium mb-1 uppercase text-[10px] tracking-widest">Recommended Fix</h4>
                    <div className="bg-vscode-bg p-2 rounded-sm border border-vscode-border/30">
                      {Array.isArray(errorExplanation.fix) ? (
                        <div className="space-y-1">
                          {errorExplanation.fix.map((f, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="text-vscode-primary font-bold opacity-50">{i + 1}.</span>
                              <p className="text-vscode-text text-xs">{f}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-vscode-text text-xs whitespace-pre-line">{errorExplanation.fix}</p>
                      )}
                    </div>
                  </div>
                )}

                {errorExplanation.example && (
                  <div>
                    <h4 className="text-vscode-secondary font-medium mb-1 uppercase text-[10px] tracking-widest">Astra Analogy Code</h4>
                    <pre className="text-[10px] bg-vscode-input p-2 border border-vscode-border rounded-sm overflow-x-auto font-mono text-vscode-text italic opacity-60">
                      {errorExplanation.example}
                    </pre>
                  </div>
                )}
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
                {typeof TreeStructure !== "undefined" && <TreeStructure size={14} />}
                Flow Diagram
              </h3>
              <button
                data-testid="generate-flow-btn"
                onClick={handleGenerateFlow}
                disabled={!fileContent || loadingFlow}
                className="bg-vscode-secondary/80 text-black hover:bg-vscode-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm px-3 py-1 text-xs font-medium flex items-center gap-1"
              >
                {loadingFlow ? <Spinner size={12} /> : (typeof TreeStructure !== "undefined" && <TreeStructure size={12} />)}
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
