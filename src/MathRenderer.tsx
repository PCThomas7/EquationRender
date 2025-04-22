import React, { useEffect, memo } from 'react';
import './MathRenderer.css';

interface MathRendererProps {
  text: string;
  className?: string;
}

// Memoize the MathRenderer component to prevent unnecessary re-renders
export const MathRenderer: React.FC<MathRendererProps> = memo(({ text, className = '' }) => {
  // Trigger MathJax to process the new content when text changes
  useEffect(() => {
    // Use a small delay to allow React to finish rendering
    const timer = setTimeout(() => {
      if (window.MathJax) {
        try {
          window.MathJax.typesetPromise?.();
        } catch (error) {
          console.error('MathJax typesetting error:', error);
        }
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [text]);

  // Function to process enumerate environment content
  const processEnumerateEnvironment = (content: string): string => {
    // Check for setcounter command
    let startingNumber = 1;
    const setCounterMatch = content.match(/\\setcounter\{enumi\}\{(\d+)\}/);
    if (setCounterMatch && setCounterMatch[1]) {
      startingNumber = parseInt(setCounterMatch[1], 10);
    }
    
    // Replace the setcounter command with empty string
    let processedContent = content.replace(/\\setcounter\{enumi\}\{(\d+)\}/, '');
    
    // Extract items
    const itemRegex = /\\item\s+(.*?)(?=\\item|\\end\{enumerate\}|$)/gs;
    const items: string[] = [];
    let itemMatch;
    while ((itemMatch = itemRegex.exec(processedContent)) !== null) {
      items.push(itemMatch[1].trim());
    }
    
    // Build HTML list with proper numbering
    let html = '<ol class="enumerate-list"';
    if (startingNumber > 1) {
      html += ` start="${startingNumber}"`;
    }
    html += '>';
    
    items.forEach(item => {
      html += `<li class="enumerate-item">${item}</li>`;
    });
    
    html += '</ol>';
    return html;
  };

  // Function to process itemize environment content
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

  // Function to process section command
  const processSection = (content: string): string => {
    // Extract section title from the command
    const match = content.match(/\\section\*\{(.*?)\}/);
    if (!match || !match[1]) return content;
    
    const sectionTitle = match[1].trim();
    return `<h2 class="latex-section">${sectionTitle}</h2>`;
  };

  // Function to process subsection command
  const processSubsection = (content: string): string => {
    // Extract subsection title from the command
    const match = content.match(/\\subsection\*\{(.*?)\}/);
    if (!match || !match[1]) return content;
    
    const subsectionTitle = match[1].trim();
    return `<h3 class="latex-subsection">${subsectionTitle}</h3>`;
  };

  // Process description environment (like itemize but with term labels)
  const processDescriptionEnvironment = (content: string): string => {
    const itemRegex = /\\item\s*(?:\[(.*?)\])?\s*(.*?)(?=\\item|\\end\{description\}|$)/gs;
    const items: {term?: string, description: string}[] = [];
    let itemMatch;
    
    while ((itemMatch = itemRegex.exec(content)) !== null) {
      items.push({
        term: itemMatch[1] ? itemMatch[1].trim() : undefined,
        description: itemMatch[2].trim()
      });
    }
    
    let html = '<dl class="description-list">';
    
    items.forEach(item => {
      if (item.term) {
        html += `<dt class="description-term">${item.term}</dt>`;
      }
      html += `<dd class="description-item">${item.description}</dd>`;
    });
    
    html += '</dl>';
    return html;
  };

  // Helper function to process multicolumn command in tabular
  const processMultiColumn = (
    multicolumnText: string, 
    cellIndex: number, 
    totalColumns: number
  ): { html: string, colSpan: number, align: string } => {
    // Regular expression to extract the parameters of \multicolumn
    const multicolRegex = /\\multicolumn\{(\d+)\}\{([^}]*)\}\{([^}]*)\}/;
    const match = multicolumnText.match(multicolRegex);
    
    if (!match) {
      return { html: multicolumnText, colSpan: 1, align: 'center' };
    }
    
    const colSpan = parseInt(match[1], 10);
    const format = match[2]; // Format like {|c|} or {l}
    const content = match[3];
    
    // Determine alignment from format
    let align = 'center';
    if (format.includes('l')) align = 'left';
    if (format.includes('r')) align = 'right';
    
    // Process the content - always wrap mathematical content in $ if it has LaTeX commands
    let processedContent = content;
    
    // Check if content has LaTeX math commands but isn't already wrapped in $
    if (!processedContent.startsWith('$') && /(\$|\\|_|\^)/.test(processedContent)) {
      processedContent = `$${processedContent}$`;
    }
    
    return { 
      html: processedContent, 
      colSpan: colSpan, 
      align: align 
    };
  };

  // Function to process LaTeX commands in text
  const processLatexInText = (text: string): string => {
    let processed = text;
    
    // Process common LaTeX text commands
    processed = processed
      // Handle \text{} command
      .replace(/\\text\s*\{([^}]*)\}/g, '$1')
      // Handle \textbf{} command
      .replace(/\\textbf\s*\{([^}]*)\}/g, '<strong>$1</strong>')
      // Handle \textit{} command
      .replace(/\\textit\s*\{([^}]*)\}/g, '<em>$1</em>')
      // Handle \emph{} command
      .replace(/\\emph\s*\{([^}]*)\}/g, '<em>$1</em>')
      // Handle \triangle 
      .replace(/\\triangle\s+/g, '△')
      // Fix subscripts and superscripts outside of math mode
      .replace(/\_\{([^}]*)\}/g, '<sub>$1</sub>')
      .replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>');
    
    return processed;
  };

  // Function to process tabular environment
  const processTabularEnvironment = (content: string, colSpec: string): string => {
    // Extract column specification
    const colSpecMatch = colSpec.match(/\{(.*?)\}/);
    if (!colSpecMatch) return content;
    
    const columnSpec = colSpecMatch[1];
    
    // Parse column specification to determine alignments and borders
    // Count number of columns based on c/l/r specifications
    const colTypes = columnSpec.split('').filter(char => char === 'c' || char === 'l' || char === 'r');
    const columns = colTypes.length;
    const hasBorders = columnSpec.includes('|');
    
    // Split content into rows
    const rows = content.split('\\\\').map(row => row.trim());
    
    // Build HTML table with proper class based on borders
    let html = hasBorders 
      ? '<table class="latex-tabular latex-tabular-bordered">'
      : '<table class="latex-tabular">';
    
    rows.forEach(row => {
      // Handle horizontal lines - store for styling the row
      const hasHLine = row.includes('\\hline');
      if (hasHLine) {
        row = row.replace(/\\hline/g, ''); // Remove all \hline commands
      }
      
      if (row.trim() === '') return; // Skip empty rows
      
      // Split row into cells by & separator, but protect & within LaTeX commands
      // First, temporarily replace & in commands like \multicolumn{2}{c|}{text & more}
      let processedRow = row;
      
      // Handle \multicolumn commands by protecting their internal ampersands
      processedRow = processedRow.replace(/\\multicolumn\{(\d+)\}\{([^}]*)\}\{([^}]*)\}/g, 
        (match, cols, format, content) => {
          // Replace & in content with a temporary placeholder
          let protectedContent = content.replace(/&/g, '##AMP##');
          return `\\multicolumn{${cols}}{${format}}{${protectedContent}}`;
        }
      );
      
      // Now split by &
      const cells = processedRow.split('&').map(cell => {
        // Restore & in protected content
        return cell.trim().replace(/##AMP##/g, '&');
      });
      
      // Add row with appropriate class if it has a horizontal line
      html += hasHLine 
        ? '<tr class="with-hline">'
        : '<tr>';
      
      // Track which columns are actually rendered to handle colspans correctly
      let currentColumn = 0;
      
      cells.forEach((cell, index) => {
        if (currentColumn >= columns) return; // Skip extra cells beyond column spec
        
        // Check for \multicolumn command
        if (cell.includes('\\multicolumn')) {
          const { html: cellContent, colSpan, align } = processMultiColumn(cell, currentColumn, columns);
          
          // Create cell with appropriate colspan
          const tdTag = `<td class="tabular-cell multicolumn-cell" colspan="${colSpan}" style="text-align: ${align}">`;
          html += tdTag + processTabularCellContent(cellContent) + '</td>';
          
          // Update the current column position
          currentColumn += colSpan;
        } else {
          // Regular cell
          // Determine alignment based on column spec
          const colIndex = Math.min(currentColumn, colTypes.length - 1);
          const align = colTypes[colIndex] === 'l' ? 'left' : 
                        colTypes[colIndex] === 'r' ? 'right' : 'center';
          
          // Process cell content
          const processedCell = processTabularCellContent(cell);
          
          // Render the cell with its proper content and alignment
          html += `<td class="tabular-cell" style="text-align: ${align}">${processedCell}</td>`;
          
          // Move to next column
          currentColumn++;
        }
      });
      
      html += '</tr>';
    });
    
    html += '</table>';
    return html;
  };
  
  // Helper function for processing cell content within tabular environment
  const processTabularCellContent = (cell: string): string => {
    // Check if the cell already contains complete math delimiters
    if (cell.startsWith('$') && cell.endsWith('$')) {
      return cell; // Already properly formatted with math delimiters
    }
    
    let processedCell = cell;
    
    // Handle special case for Roman numerals in parentheses
    const isRomanNumeral = /^\([IVX]+\)$/.test(cell.trim());
    if (isRomanNumeral) {
      return `<span class="roman-numeral">${cell}</span>`;
    }
    
    // Special case for simple label notation like (P), (Q), (R), (S), (T), (U)
    const isSimpleLabel = /^\([A-Za-z]\)$/.test(cell.trim());
    if (isSimpleLabel) {
      return `<span class="label-notation">${cell}</span>`;
    }
    
    // Enhanced pattern detection for math expressions
    const mathPatterns = [
      // LaTeX commands
      /\\[a-zA-Z]+/,
      // Fractions
      /\\frac/,
      // Square roots
      /\\sqrt/,
      // Subscripts and superscripts
      /[_^]/,
      // Special LaTeX symbols
      /\\(times|cdot|alpha|beta|gamma|delta|triangle)/,
      // Brackets and parentheses in math context
      /\\(left|right)/,
      // Text command in math
      /\\text/
    ];
    
    // Check if cell contains any math patterns
    const hasMathPattern = mathPatterns.some(pattern => pattern.test(cell));
    
    // Handle math expressions
    if (hasMathPattern) {
      // Ensure proper handling of nested LaTeX commands
      
      // First, extract and protect any \text{} commands to prevent nesting issues
      const textPlaceholders: {[key: string]: string} = {};
      let textCounter = 0;
      
      // Replace \text{} commands with placeholders
      processedCell = processedCell.replace(/\\text\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, (match, content) => {
        const placeholder = `__TEXT_PLACEHOLDER_${textCounter}__`;
        textPlaceholders[placeholder] = content;
        textCounter++;
        return placeholder;
      });
      
      // Now fully wrap in math delimiters if needed
      if (!processedCell.startsWith('$')) {
        processedCell = `$${processedCell}$`;
      }
      
      // Process various LaTeX math commands
      processedCell = processedCell
        // Fix square root formatting
        .replace(/\\sqrt\{(\d+)\}/g, '\\sqrt{$1}')
        // Fix fraction formatting - be careful with nested braces
        .replace(/\\frac\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, 
                '\\frac{$1}{$2}');
                
      // Restore text placeholders with proper \text{} formatting
      Object.keys(textPlaceholders).forEach(placeholder => {
        processedCell = processedCell.replace(
          placeholder, 
          `\\text{${textPlaceholders[placeholder]}}`
        );
      });
      
      // Special handling for multipart expressions
      if (cell.includes('&')) {
        // Ensure math parts are properly spaced
        processedCell = processedCell.replace(/\$ & \$/g, '$ \\quad & \\quad $');
      }
    } 
    // Process text commands outside math mode
    else {
      processedCell = processLatexInText(processedCell);
    }
    
    return processedCell;
  };

  // Define a registry of environment handlers
  const environmentHandlers: Record<string, (content: string, options?: any) => string> = {
    // Lists
    'enumerate': (content: string) => processEnumerateEnvironment(content),
    'itemize': (content: string) => processItemizeEnvironment(content),
    'description': (content: string) => processDescriptionEnvironment(content),
    
    // Alignment
    'center': (content: string) => `<div class="latex-center">${content}</div>`,
    'flushleft': (content: string) => `<div class="latex-flushleft">${content}</div>`,
    'flushright': (content: string) => `<div class="latex-flushright">${content}</div>`,
    
    // Tables and tabular
    'tabular': (content: string, options) => processTabularEnvironment(content, options),
    'table': (content: string) => `<div class="latex-table">${content}</div>`,
    
    // Quotes
    'quote': (content: string) => `<blockquote class="latex-quote">${content}</blockquote>`,
    'quotation': (content: string) => `<blockquote class="latex-quotation">${content}</blockquote>`,
    
    // Theorems and proofs
    'theorem': (content: string) => `<div class="latex-theorem"><strong>Theorem.</strong> ${content}</div>`,
    'lemma': (content: string) => `<div class="latex-lemma"><strong>Lemma.</strong> ${content}</div>`,
    'proof': (content: string) => `<div class="latex-proof"><strong>Proof.</strong> ${content}</div>`,
    'definition': (content: string) => `<div class="latex-definition"><strong>Definition.</strong> ${content}</div>`,
    
    // Other text environments
    'verbatim': (content: string) => `<pre class="latex-verbatim">${content}</pre>`,
    'minipage': (content: string) => `<div class="latex-minipage">${content}</div>`,
  };

  // Generic environment processor - handles any environment
  const processEnvironment = (environmentName: string, content: string, options?: any): string => {
    // If we have a specific handler for this environment, use it
    if (environmentHandlers[environmentName]) {
      return environmentHandlers[environmentName](content, options);
    }
    
    // For math environments, we'll let MathJax handle them directly
    const mathEnvironments = [
      'equation', 'align', 'align*', 'aligned', 'gather', 'gathered',
      'eqnarray', 'multline', 'split', 'array', 'matrix', 'pmatrix',
      'bmatrix', 'vmatrix', 'Vmatrix', 'cases', 'subequations'
    ];
    
    if (mathEnvironments.includes(environmentName)) {
      // Just return the original LaTeX for MathJax to process
      return `\\begin{${environmentName}}${content}\\end{${environmentName}}`;
    }
    
    // For unknown environments, wrap in a div with appropriate class
    return `<div class="latex-${environmentName}">${content}</div>`;
  };

  // Render the math content
  const renderMathContent = () => {
    // Simplify processing for better performance
    try {
      // Store environment blocks that shouldn't be split
      const environments: string[] = [];
      const enumEnvironments: {content: string, placeholder: string, type?: string, options?: string, colSpec?: string}[] = [];
      
      // Function to create a placeholder for environment blocks
      const createPlaceholder = (index: number) => `__ENV_PLACEHOLDER_${index}__`;
      const createEnumPlaceholder = (index: number) => `__ENUM_PLACEHOLDER_${index}__`;
      
      // Pre-process: extract LaTeX environments to protect them from line break processing
      let processedText = text;
      
      // Find and process all LaTeX environments
      let enumIndex = 0;
      
      // Generic regex to match any LaTeX environment
      const generalEnvRegex = /\\begin\{([^}]+)\}((?:\{[^}]*\})*)?([\s\S]*?)\\end\{\1\}/g;
      let envMatch;
      
      while ((envMatch = generalEnvRegex.exec(text)) !== null) {
        const fullMatch = envMatch[0];
        const envName = envMatch[1];
        const options = envMatch[2] || '';
        const content = envMatch[3];
        const placeholder = createEnumPlaceholder(enumIndex);
        
        // Special handling for tabular which has a required argument
        if (envName === 'tabular') {
          enumEnvironments.push({
            content: fullMatch,
            placeholder,
            type: envName,
            colSpec: options
          });
        } else {
          enumEnvironments.push({
            content: fullMatch,
            placeholder,
            type: envName,
            options: options
          });
        }
        
        processedText = processedText.replace(fullMatch, placeholder);
        enumIndex++;
      }
      
      // Process inline and display math separately
      // We don't need to replace these as they are handled in a later step
      
      // Now handle other mathematical environments that should be passed directly to MathJax
      const mathEnvRegex = /\\begin\{(equation|align|align\*|gather|gathered|eqnarray|multline|split|array|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|cases|subequations)\}[\s\S]*?\\end\{\1\}/g;
      
      // Extract environments and replace with placeholders
      let mathMatch;
      let envIndex = 0;
      
      while ((mathMatch = mathEnvRegex.exec(processedText)) !== null) {
        const fullMatch = mathMatch[0];
        environments.push(fullMatch);
        processedText = processedText.replace(fullMatch, createPlaceholder(envIndex));
        envIndex++;
      }
      
      // Now split by line breaks, knowing that environment internals are protected
      const lines = processedText.split(/(?:\\\\)/g);
      
      return (
        <div className={`math-renderer ${className}`}>
          {lines.map((line, lineIndex) => {
            // Process each line separately
            let processedLine = line
              // Handle \item commands
              .replace(/\\item\s+/g, '• ')
              // Process section commands
              .replace(/\\section\*\{(.*?)\}/g, (match) => processSection(match))
              // Process subsection commands
              .replace(/\\subsection\*\{(.*?)\}/g, (match) => processSubsection(match));
              
            // Restore all environment placeholders with processed HTML using the generic processor
            enumEnvironments.forEach((env, idx) => {
              if (processedLine.includes(env.placeholder)) {
                // Extract content between begin and end tags
                const content = env.content.match(new RegExp(`\\\\begin\\{${env.type}\\}(?:\\{.*?\\})?([\\s\\S]*?)\\\\end\\{${env.type}\\}`));
                
                if (content && content[1]) {
                  // Use the generic environment processor
                  let processedHtml;
                  
                  // Handle special cases
                  if (env.type === 'tabular' && env.colSpec) {
                    processedHtml = processTabularEnvironment(content[1], env.colSpec);
                  } else {
                    // Use the generic processor with appropriate options
                    processedHtml = processEnvironment(env.type!, content[1], env.options);
                  }
                  
                  processedLine = processedLine.replace(env.placeholder, processedHtml);
                } else {
                  // If we can't extract content, just use the original
                  processedLine = processedLine.replace(env.placeholder, env.content);
                }
              }
            });
            
            // Restore other environment placeholders in this line
            environments.forEach((env, idx) => {
              processedLine = processedLine.replace(
                createPlaceholder(idx), 
                env
              );
            });
            
            // Split each line by math delimiters
            const parts = processedLine.split(/(\$\$[^\$]+\$\$|\$[^\$]+\$)/g);
            
            return (
              <div key={lineIndex} className="math-line">
                {parts.map((part, partIndex) => {
                  if (part.startsWith('$$') && part.endsWith('$$')) {
                    const math = part.slice(2, -2);
                    return (
                      <div key={partIndex} className="block my-2">
                        {`\\[${math}\\]`}
                      </div>
                    );
                  } else if (part.startsWith('$') && part.endsWith('$')) {
                    const math = part.slice(1, -1);
                    return <span key={partIndex}>{`\\(${math}\\)`}</span>;
                  }
                  // For non-math parts, preserve formatting
                  return <span key={partIndex} dangerouslySetInnerHTML={{ __html: part }} />;
                })}
              </div>
            );
          })}
        </div>
      );
    } catch (error) {
      console.error('Error rendering math content:', error);
      // Fallback rendering for when processing fails
      return (
        <div className={`math-renderer ${className}`}>
          <div className="math-line">
            <span>{text}</span>
          </div>
        </div>
      );
    }
  };

  return renderMathContent();
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if the text or className has changed
  return prevProps.text === nextProps.text && prevProps.className === nextProps.className;
});