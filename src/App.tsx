
import { useState } from 'react'
import './App.css'
import { MathRenderer } from './MathRenderer'

function App() {
  const [latexInput, setLatexInput] = useState<string>('E = mc^2')
  const [renderText, setRenderText] = useState<string>('E = mc^2')

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
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Rendered Output:</h2>
        <div className="p-4 border border-gray-300 rounded bg-gray-50 min-h-[100px]">
          <MathRenderer text={renderText} />
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Example LaTeX Equations:</h3>
        <ul className="list-disc pl-5">
          <li className="mb-1">Simple equation: <code>E = mc^2</code></li>
          
        </ul>
      </div>
    </div>
  )
}

export default App
