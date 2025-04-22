
import { useState } from 'react'
import './App.css'
import { MathRenderer } from './MathRenderer'
import { KatexRenderer } from './KatexRenderer'

function App() {
  const [latexInput, setLatexInput] = useState<string>(`$\\left.\\begin{array}{l}\\text { (i) } A \\cup B=B \\cup A \\\\ \\text { (ii) } A \\cap B=B \\cap A\\end{array}\\right\\}$ Commutative law 
 
$\\left.\\begin{array}{l}\\text { (i) }(A \\cup B) \\cup C=A \\cup(B \\cup C) \\\\ \\text { (ii) }(A \\cap B) \\cap C=A \\cap(B \\cap C)\\end{array}\\right\\}$ Associative law 
 
$\\left.\\begin{array}{l}\\text { (i) } A \\cup \\phi=A \\\\ \\text { (ii) } \\phi \\cap A=\\phi\\end{array}\\right\\}$ Law of identity element 
 
$\\left.\\begin{array}{l}\\text { - (i) } A \\cup A=A \\\\ \\text { (ii) } A \\cap A=A\\end{array}\\right\\}$ Idempotent law

$a \\approx b$ Approximately equal
$a \\sim b$ Similar to
$a \\simeq b$ Asymptotically equal
$a \\cong b$ Congruent to
$a \\equiv b$ Equivalent to
$a \\propto b$ Proportional to
$A \\subset B$ Subset
$A \\supset B$ Superset
$A \\subseteq B$ Subset or equal
$A \\supseteq B$ Superset or equal
$A \\implies B$ Implies
$A \\iff B$ If and only if
$A \\Rightarrow B$ Implies
$A \\Leftarrow B$ Is implied by
$A \\Leftrightarrow B$ Equivalent to`)
  const [renderText, setRenderText] = useState<string>(`$\\left.\\begin{array}{l}\\text { (i) } A \\cup B=B \\cup A \\\\ \\text { (ii) } A \\cap B=B \\cap A\\end{array}\\right\\}$ Commutative law 
 
$\\left.\\begin{array}{l}\\text { (i) }(A \\cup B) \\cup C=A \\cup(B \\cup C) \\\\ \\text { (ii) }(A \\cap B) \\cap C=A \\cap(B \\cap C)\\end{array}\\right\\}$ Associative law 
 
$\\left.\\begin{array}{l}\\text { (i) } A \\cup \\phi=A \\\\ \\text { (ii) } \\phi \\cap A=\\phi\\end{array}\\right\\}$ Law of identity element 
 
$\\left.\\begin{array}{l}\\text { - (i) } A \\cup A=A \\\\ \\text { (ii) } A \\cap A=A\\end{array}\\right\\}$ Idempotent law

$a \\approx b$ Approximately equal
$a \\sim b$ Similar to
$a \\simeq b$ Asymptotically equal
$a \\cong b$ Congruent to
$a \\equiv b$ Equivalent to
$a \\propto b$ Proportional to
$A \\subset B$ Subset
$A \\supset B$ Superset
$A \\subseteq B$ Subset or equal
$A \\supseteq B$ Superset or equal
$A \\implies B$ Implies
$A \\iff B$ If and only if
$A \\Rightarrow B$ Implies
$A \\Leftarrow B$ Is implied by
$A \\Leftrightarrow B$ Equivalent to`)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLatexInput(e.target.value)
  }

  const handleRender = () => {
    setRenderText(latexInput)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">LaTeX Equation Renderer</h1>
      
      <div className="mb-4">
        <label htmlFor="latex-input" className="block mb-2 font-medium">
          Enter LaTeX Equation:
        </label>
        <textarea
          id="latex-input"
          className="w-full p-2 border border-gray-300 rounded min-h-[100px]"
          value={latexInput}
          onChange={handleInputChange}
          placeholder="Enter your LaTeX equation here..."
        />
      </div>
      
      <button
        onClick={handleRender}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
      >
        Render Equation
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">MathJax Renderer:</h2>
          <div className="p-4 border border-gray-300 rounded bg-gray-50 min-h-[100px]">
            <MathRenderer text={renderText} />
          </div>
        </div>
        
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">KaTeX Renderer:</h2>
          <div className="p-4 border border-gray-300 rounded bg-gray-50 min-h-[100px]">
            <KatexRenderer text={renderText} />
          </div>
        </div>
      </div>
      
      
    </div>
  )
}

export default App
