import React, { useEffect, useRef, memo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './KatexRenderer.css';

interface KatexRendererProps {
  text: string;
}

// Memoize the KatexRenderer component to prevent unnecessary re-renders
export const KatexRenderer: React.FC<KatexRendererProps> = memo(({ text }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Process LaTeX environments like enumerate, itemize, etc.
  const processEnvironment = (content: string, envType: string): string => {
    switch(envType) {
      case 'enumerate':
        return processEnumerateEnvironment(content);
      case 'itemize':
        return processItemizeEnvironment(content);
      case 'equation':
      case 'align':
      case 'gather':
      case 'multline':
        return processMathEnvironment(content, envType);
      case 'matrix':
      case 'pmatrix':
      case 'bmatrix':
      case 'vmatrix':
      case 'Vmatrix':
        return processMatrixEnvironment(content, envType);
      case 'tabular':
        return processTabularEnvironment(content);
      default:
        return content;
    }
  };

  // Process enumerate environment
  const processEnumerateEnvironment = (content: string): string => {
    // Extract items
    const itemRegex = /\\item\s+(.*?)(?=\\item|\\end\{enumerate\}|$)/gs;
    const items: string[] = [];
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(content)) !== null) {
      items.push(itemMatch[1].trim());
    }
    
    // Build HTML ordered list
    let html = '<ol class="enumerate-list">';
    
    items.forEach(item => {
      html += `<li class="enumerate-item">${item}</li>`;
    });
    
    html += '</ol>';
    return html;
  };

  // Process itemize environment
  const processItemizeEnvironment = (content: string): string => {
    // Extract items
    const itemRegex = /\\item\s+(.*?)(?=\\item|\\end\{itemize\}|$)/gs;
    const items: string[] = [];
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(content)) !== null) {
      items.push(itemMatch[1].trim());
    }
    
    // Build HTML unordered list
    let html = '<ul class="itemize-list">';
    
    items.forEach(item => {
      html += `<li class="itemize-item">${item}</li>`;
    });
    
    html += '</ul>';
    return html;
  };

  // Process math environments like equation, align, etc.
  const processMathEnvironment = (content: string, envType: string): string => {
    // Extract the math content between \begin{envType} and \end{envType}
    const regex = new RegExp(`\\\\begin\\{${envType}\\}([\\s\\S]*?)\\\\end\\{${envType}\\}`);
    const match = content.match(regex);
    
    if (!match || !match[1]) return content;
    
    const mathContent = match[1].trim();
    
    // Create a container for the math content
    const mathContainer = document.createElement('div');
    mathContainer.className = `katex-${envType}-container`;
    
    try {
      // Render the math content with KaTeX
      katex.render(mathContent, mathContainer, {
        displayMode: true,
        throwOnError: false,
        trust: true,
        strict: false,
        macros: getKatexMacros()
      });
      
      return mathContainer.outerHTML;
    } catch (error) {
      console.error(`Error rendering ${envType} environment:`, error);
      return `<div class="katex-error">Error rendering ${envType} environment: ${error}</div>`;
    }
  };

  // Process matrix environments
  const processMatrixEnvironment = (content: string, envType: string): string => {
    // Extract the matrix content
    const regex = new RegExp(`\\\\begin\\{${envType}\\}([\\s\\S]*?)\\\\end\\{${envType}\\}`);
    const match = content.match(regex);
    
    if (!match || !match[1]) return content;
    
    const matrixContent = match[1].trim();
    
    // Create a container for the matrix
    const matrixContainer = document.createElement('div');
    matrixContainer.className = `katex-matrix-container`;
    
    try {
      // Determine the appropriate delimiters based on matrix type
      let leftDelim = '';
      let rightDelim = '';
      
      switch(envType) {
        case 'pmatrix': leftDelim = '('; rightDelim = ')'; break;
        case 'bmatrix': leftDelim = '['; rightDelim = ']'; break;
        case 'vmatrix': leftDelim = '|'; rightDelim = '|'; break;
        case 'Vmatrix': leftDelim = '\\Vert'; rightDelim = '\\Vert'; break;
        default: break;
      }
      
      // Construct the matrix command
      const matrixCommand = `\\begin{array}{${matrixContent.split('\\\\').length > 0 ? 'c'.repeat(matrixContent.split('&').length) : 'c'}}${matrixContent}\\end{array}`;
      const fullCommand = leftDelim ? `\\left${leftDelim} ${matrixCommand} \\right${rightDelim}` : matrixCommand;
      
      // Render the matrix with KaTeX
      katex.render(fullCommand, matrixContainer, {
        displayMode: true,
        throwOnError: false,
        trust: true,
        strict: false,
        macros: getKatexMacros()
      });
      
      return matrixContainer.outerHTML;
    } catch (error) {
      console.error(`Error rendering ${envType} environment:`, error);
      return `<div class="katex-error">Error rendering ${envType} environment: ${error}</div>`;
    }
  };

  // Process tabular environment
  const processTabularEnvironment = (content: string): string => {
    // Extract the tabular content
    const regex = /\\begin\{tabular\}\{([^}]*)\}([\s\S]*?)\\end\{tabular\}/;
    const match = content.match(regex);
    
    if (!match || !match[2]) return content;
    
    const columnSpec = match[1];
    const tableContent = match[2].trim();
    
    // Parse the table content into rows and cells
    const rows = tableContent.split('\\\\').map(row => row.trim());
    
    // Create HTML table
    let tableHtml = '<table class="katex-tabular">';
    
    rows.forEach(row => {
      tableHtml += '<tr>';
      const cells = row.split('&').map(cell => cell.trim());
      
      cells.forEach((cell, index) => {
        // Determine alignment based on column spec
        let align = 'center';
        if (columnSpec[index] === 'l') align = 'left';
        if (columnSpec[index] === 'r') align = 'right';
        
        tableHtml += `<td style="text-align: ${align}">`;
        
        // Check if cell contains math and render it
        if (cell.includes('$') || cell.includes('\\')) {
          try {
            const cellContainer = document.createElement('div');
            katex.render(cell, cellContainer, {
              displayMode: false,
              throwOnError: false,
              trust: true,
              strict: false,
              macros: getKatexMacros()
            });
            tableHtml += cellContainer.innerHTML;
          } catch (error) {
            tableHtml += cell;
          }
        } else {
          tableHtml += cell;
        }
        
        tableHtml += '</td>';
      });
      
      tableHtml += '</tr>';
    });
    
    tableHtml += '</table>';
    return tableHtml;
  };

  // Helper function to get all KaTeX macros
  const getKatexMacros = () => {
    return {
      // Add relation macros for better support
      "\\eqcirc": "\\stackrel{\\circ}{=}",
      "\\triangleq": "\\triangle=",
      "\\corresponds": "\\leftrightarrow",
      "\\approxeq": "\\approx",
      "\\cong": "\\cong",
      "\\simeq": "\\simeq",
      "\\Rightarrow": "\\rightarrow",
      "\\Leftarrow": "\\leftarrow",
      "\\Leftrightarrow": "\\leftrightarrow",
      "\\iff": "\\leftrightarrow",
      "\\implies": "\\rightarrow",
      // Set notation and other math symbols
      "\\N": "\\mathbb{N}",
      "\\Z": "\\mathbb{Z}",
      "\\Q": "\\mathbb{Q}",
      "\\R": "\\mathbb{R}",
      "\\C": "\\mathbb{C}",
      "\\emptyset": "\\emptyset",
      "\\varnothing": "\\varnothing",
      // Logic symbols
      "\\land": "\\land",
      "\\lor": "\\lor",
      "\\lnot": "\\lnot",
      "\\forall": "\\forall",
      "\\exists": "\\exists",
      "\\nexists": "\\nexists",
      // Greek letters commonly used in math
      "\\alpha": "\\alpha",
      "\\beta": "\\beta",
      "\\gamma": "\\gamma",
      "\\delta": "\\delta",
      "\\epsilon": "\\epsilon",
      "\\varepsilon": "\\varepsilon",
      "\\zeta": "\\zeta",
      "\\eta": "\\eta",
      "\\theta": "\\theta",
      "\\vartheta": "\\vartheta",
      "\\iota": "\\iota",
      "\\kappa": "\\kappa",
      "\\lambda": "\\lambda",
      "\\mu": "\\mu",
      "\\nu": "\\nu",
      "\\xi": "\\xi",
      "\\pi": "\\pi",
      "\\varpi": "\\varpi",
      "\\rho": "\\rho",
      "\\varrho": "\\varrho",
      "\\sigma": "\\sigma",
      "\\varsigma": "\\varsigma",
      "\\tau": "\\tau",
      "\\upsilon": "\\upsilon",
      "\\phi": "\\phi",
      "\\varphi": "\\varphi",
      "\\chi": "\\chi",
      "\\psi": "\\psi",
      "\\omega": "\\omega",
      "\\Gamma": "\\Gamma",
      "\\Delta": "\\Delta",
      "\\Theta": "\\Theta",
      "\\Lambda": "\\Lambda",
      "\\Xi": "\\Xi",
      "\\Pi": "\\Pi",
      "\\Sigma": "\\Sigma",
      "\\Upsilon": "\\Upsilon",
      "\\Phi": "\\Phi",
      "\\Psi": "\\Psi",
      "\\Omega": "\\Omega",
      // Additional commands
      "\\item": "•",
      "\\in": "\\in",
      "\\cap": "\\cap",
      "\\cup": "\\cup"
    };
  };

  useEffect(() => {
    if (containerRef.current) {
      try {
        // Split the text by lines to process each formula separately
        const lines = text.split(/\n+/);
        let htmlContent = '';

        for (const line of lines) {
          if (line.trim() === '') {
            htmlContent += '<div class="katex-line-break"></div>';
            continue;
          }

          // Check for environment blocks
          const beginEnvMatch = line.match(/\\begin\{([^}]+)\}/);
          if (beginEnvMatch) {
            const envType = beginEnvMatch[1];
            // Find the end of this environment in subsequent lines
            const endPattern = new RegExp(`\\\\end\\{${envType}\\}`);
            let envContent = line;
            let envEndIndex = lines.indexOf(line);
            
            for (let i = lines.indexOf(line) + 1; i < lines.length; i++) {
              if (endPattern.test(lines[i])) {
                envEndIndex = i;
                break;
              }
              envContent += '\n' + lines[i];
            }
            
            // Process the environment content
            const processedEnv = processEnvironment(envContent, envType);
            htmlContent += `<div class="katex-env katex-env-${envType}">${processedEnv}</div>`;
            
            // Skip the lines that were part of this environment
            continue;
          }
          
          // Process LaTeX commands outside of math delimiters
          let processedLine = line;
          
          // Handle \item command which is common in enumerate environments
          processedLine = processedLine.replace(/\\item\s+/g, '• ');
          
          // Handle \end{enumerate} command
          if (processedLine.includes('\\end{enumerate}')) {
            htmlContent += `<div class="katex-text">}</div>`;
            continue;
          }

          // Extract the formula and any text after it
          // Improved regex to better handle complex formulas with nested braces
          // This regex looks for both inline ($...$) and display mode ($$...$$) formulas
          const displayModeMatch = processedLine.match(/\$\$(.*?)\$\$(.*)/s);
          const inlineModeMatch = processedLine.match(/\$(.*?)\$(.*)/s);
          
          if (!displayModeMatch && !inlineModeMatch) {
            htmlContent += `<div class="katex-text">${processedLine}</div>`;
            continue;
          }
          
          // Determine if we're dealing with display mode or inline mode
          const isDisplayMode = !!displayModeMatch;
          const match = isDisplayMode ? displayModeMatch : inlineModeMatch;

          const formula = match[1];
          const afterText = match[2] ? match[2].trim() : '';

          // Create a container for this formula
          const formulaContainer = document.createElement('div');
          formulaContainer.className = 'katex-formula-container';

          // Render the formula
          try {
            // Process the formula to handle specific cases
            let processedFormula = formula;
            
            // Handle the specific case of \left. and \right\} in array environments
            if (processedFormula.includes('\\left.') && processedFormula.includes('\\right\\}')) {
              // Create a temporary div to render the formula
              const tempDiv = document.createElement('div');
              
              // Render the formula with proper delimiters
              katex.render(processedFormula, tempDiv, {
                displayMode: isDisplayMode,
                throwOnError: false,
                trust: true,
                strict: false,
                macros: {
                  // Add relation macros for better support
                  "\\eqcirc": "\\stackrel{\\circ}{=}",
                  "\\triangleq": "\\triangle=",
                  "\\corresponds": "\\leftrightarrow",
                  "\\approxeq": "\\approx",
                  "\\cong": "\\cong",
                  "\\simeq": "\\simeq",
                  "\\Rightarrow": "\\Rightarrow",
                  "\\Leftarrow": "\\Leftarrow",
                  "\\Leftrightarrow": "\\Leftrightarrow",
                  "\\iff": "\\Leftrightarrow",
                  "\\implies": "\\Rightarrow"
                }
              });
              
              formulaContainer.innerHTML = tempDiv.innerHTML;
            } else {
              // Regular formula rendering
              katex.render(processedFormula, formulaContainer, {
                displayMode: isDisplayMode,
                throwOnError: false,
                trust: true,
                strict: false,
                macros: {
                  // Add relation macros for better support
                  "\\eqcirc": "\\stackrel{\\circ}{=}",
                  "\\triangleq": "\\triangle=",
                  "\\corresponds": "\\leftrightarrow",
                  "\\approxeq": "\\approx",
                  "\\cong": "\\cong",
                  "\\simeq": "\\simeq",
                  "\\Rightarrow": "\\Rightarrow",
                  "\\Leftarrow": "\\Leftarrow",
                  "\\Leftrightarrow": "\\Leftrightarrow",
                  "\\iff": "\\Leftrightarrow",
                  "\\implies": "\\Rightarrow",
                  "\\item": "•",
                  "\\in": "\\in",
                  "\\cap": "\\cap",
                  "\\cup": "\\cup",
                  "\\Z": "\\mathbb{Z}"
                }
              });
            }

            // Add the formula to the HTML content with appropriate class based on display mode
            htmlContent += `<div class="katex-line ${isDisplayMode ? 'katex-display-mode' : 'katex-inline-mode'}">`;
            htmlContent += formulaContainer.innerHTML;
            
            // Add any text that comes after the formula
            if (afterText) {
              htmlContent += `<span class="katex-after-text">${afterText}</span>`;
            }
            
            htmlContent += `</div>`;
          } catch (error) {
            console.error('KaTeX formula rendering error:', error);
            htmlContent += `<div class="katex-line"><span class="katex-error">Error rendering formula: ${error}</span></div>`;
          }
        }

        // Set the final HTML content
        containerRef.current.innerHTML = htmlContent;
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<span class="katex-error">Error rendering equation: ${error}</span>`;
        }
      }
    }
  }, [text]);

  return <div ref={containerRef} className="katex-container"></div>;
});