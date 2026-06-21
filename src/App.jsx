import { useState, useEffect } from 'react'
import './index.css'

const CAPACITY_BANDS = [
  {
    id: 'energised',
    label: 'Energised and ready to take on new tasks in addition to my typical routine/commitments',
    min: 8,
    max: 10,
  },
  {
    id: 'stable',
    label: 'Stable and in a position to meet my typical routine/commitments',
    min: 5,
    max: 7,
  },
  {
    id: 'delicate',
    label: 'Delicate and having a bit of difficulty imagining how I will fulfill my typical routine/commitments',
    min: 2,
    max: 4,
  },
  {
    id: 'underwater',
    label: 'Underwater and greatly struggling to imagine how I will fulfill my typical routine/commitments',
    min: 0,
    max: 1,
  },
]

const IMPORTANCE_CRITERIA = [
  { id: 'harder_later', q: 'The task will be more difficult to execute at a later time' },
  { id: 'deadline', q: 'There is a deadline for the task' },
  { id: 'consequences', q: 'There are real and tangible consequences for not completing the task' },
  { id: 'aspirational', q: 'The task is something aspirational that will remove me from my comfort zone in a positive way' },
  { id: 'depend', q: 'Others depend on me completing the task' },
  { id: 'financial', q: 'There is a financial cost to delaying the task' },
]

const SCALE_OPTIONS = [
  { value: 0, label: 'N/A' },
  { value: 1, label: 'Very little' },
  { value: 2, label: 'Somewhat' },
  { value: 3, label: 'Definitely' },
]

const ASSESSMENT_QUESTIONS = [
  { id: 'minimise', q: 'Can the task be minimised or rearranged to make it easier?' },
  { id: 'delegate', q: 'Can the task be partially or fully delegated to someone else without considerable effort?' },
  { id: 'still_want', q: 'If others involved in the task knew how challenging it would be for you to complete, would they still want you to do it?' },
]

const STORAGE_KEY = 'capacity-checker-session'

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function App() {
  const saved = loadSession()

  const [capacityBand, setCapacityBand] = useState(saved?.capacityBand ?? null)
  const [capacityValue, setCapacityValue] = useState(saved?.capacityValue ?? null)
  const [importanceAnswers, setImportanceAnswers] = useState(saved?.importanceAnswers ?? {})
  const [assessmentAnswers, setAssessmentAnswers] = useState(saved?.assessmentAnswers ?? {})
  const [result, setResult] = useState(saved?.result ?? null)

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ capacityBand, capacityValue, importanceAnswers, assessmentAnswers, result })
    )
  }, [capacityBand, capacityValue, importanceAnswers, assessmentAnswers, result])

  function selectBand(band) {
    setCapacityBand(band.id)
    setCapacityValue(band.min)
    setResult(null)
  }

  function setImportance(id, value) {
    setImportanceAnswers((prev) => ({ ...prev, [id]: value }))
    setResult(null)
  }

  function setAssessment(id, value) {
    setAssessmentAnswers((prev) => ({ ...prev, [id]: value }))
    setResult(null)
  }

  const allImportanceAnswered = IMPORTANCE_CRITERIA.every(
    (c) => importanceAnswers[c.id] !== undefined
  )
  const allAssessmentAnswered = ASSESSMENT_QUESTIONS.every(
    (q) => assessmentAnswers[q.id] !== undefined
  )
  const canSubmit = capacityBand && allImportanceAnswered && allAssessmentAnswered

  function calculate() {
    const capacityScore = capacityValue

    const rawSum = IMPORTANCE_CRITERIA.reduce(
      (sum, c) => sum + (importanceAnswers[c.id] ?? 0),
      0
    )
    const rawImportance = (rawSum / 18) * 10

    let adjustment = 0
    if (assessmentAnswers.minimise === true) adjustment -= 1
    if (assessmentAnswers.delegate === true) adjustment -= 1
    if (assessmentAnswers.still_want === false) adjustment -= 1

    const adjustedImportance = Math.max(0, rawImportance + adjustment)

    const diff = capacityScore - adjustedImportance

    let verdict, verdictClass, detail
    if (diff >= 2) {
      verdict = 'Take it on'
      verdictClass = 'go'
      detail = 'Your capacity comfortably covers this task right now.'
    } else if (diff >= -2) {
      verdict = 'Manageable, but be mindful'
      verdictClass = 'caution'
      detail = 'Capacity and importance are close. Proceed with care, and check in with yourself as you go.'
    } else {
      verdict = 'Defer or seek support'
      verdictClass = 'stop'
      detail = 'This task currently asks more than your capacity can comfortably give. Consider delaying, delegating, or asking for help.'
    }

    setResult({
      capacityScore,
      rawImportance: Math.round(rawImportance * 10) / 10,
      adjustment,
      adjustedImportance: Math.round(adjustedImportance * 10) / 10,
      verdict,
      verdictClass,
      detail,
    })
  }

  function reset() {
    setCapacityBand(null)
    setCapacityValue(null)
    setImportanceAnswers({})
    setAssessmentAnswers({})
    setResult(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const selectedBand = CAPACITY_BANDS.find((b) => b.id === capacityBand)

  return (
    <>
      <h1 className="app-title">Capacity Checker</h1>
      <p className="app-subtitle">
        Compare your current capacity against a task's real demands before you commit.
      </p>

      {result ? (
        <div className="card result-card">
          <h2>Your Result</h2>
          <div className="result-score">
            <div className="score-block">
              <div className="score-num">{result.capacityScore}</div>
              <div className="score-label">Capacity</div>
            </div>
            <div className="score-block">
              <div className="score-num">{result.adjustedImportance}</div>
              <div className="score-label">Adjusted Importance</div>
            </div>
          </div>
          <div className={`verdict ${result.verdictClass}`}>{result.verdict}</div>
          <p className="verdict-detail">{result.detail}</p>
          <div className="adjust-note">
            Raw importance score: {result.rawImportance} / 10
            <br />
            Task assessment adjustment: {result.adjustment} point(s)
            <br />
            Adjusted importance: {result.adjustedImportance} / 10
          </div>
          <button className="reset-btn" onClick={reset}>
            Start a new assessment
          </button>
        </div>
      ) : (
        <>
          <div className="card">
            <h2>1. Capacity Checker</h2>
            <p className="hint">Choose the statement that best describes you right now.</p>
            {CAPACITY_BANDS.map((band) => (
              <div
                key={band.id}
                className={`option ${capacityBand === band.id ? 'selected' : ''}`}
                onClick={() => selectBand(band)}
              >
                <input
                  type="radio"
                  checked={capacityBand === band.id}
                  onChange={() => selectBand(band)}
                />
                <div>
                  <div className="option-label">{band.label}</div>
                  <div className="option-range">Capacity range: {band.min}–{band.max}</div>
                </div>
              </div>
            ))}

            {selectedBand && (
              <div className="slider-row">
                <label>
                  <span>Fine-tune within your band</span>
                  <span>{capacityValue}</span>
                </label>
                <input
                  type="range"
                  min={selectedBand.min}
                  max={selectedBand.max}
                  step={1}
                  value={capacityValue}
                  onChange={(e) => {
                    setCapacityValue(Number(e.target.value))
                    setResult(null)
                  }}
                />
              </div>
            )}
          </div>

          <div className="card">
            <h2>2. Task Importance Criteria</h2>
            <p className="hint">
              Rate each statement: 0 = not relevant, 1 = very little, 2 = somewhat, 3 = definitely.
            </p>
            {IMPORTANCE_CRITERIA.map((c) => (
              <div className="criteria-row" key={c.id}>
                <div className="q">{c.q}</div>
                <div className="scale-buttons">
                  {SCALE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`scale-btn ${importanceAnswers[c.id] === opt.value ? 'active' : ''}`}
                      onClick={() => setImportance(c.id, opt.value)}
                      type="button"
                    >
                      {opt.value} · {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h2>3. Task Assessment</h2>
            <p className="hint">These answers adjust the task's real demand on you.</p>
            {ASSESSMENT_QUESTIONS.map((q) => (
              <div className="yesno-row" key={q.id}>
                <div className="q">{q.q}</div>
                <div className="yesno-buttons">
                  <button
                    type="button"
                    className={`yn-btn ${assessmentAnswers[q.id] === true ? 'active' : ''}`}
                    onClick={() => setAssessment(q.id, true)}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`yn-btn ${assessmentAnswers[q.id] === false ? 'active' : ''}`}
                    onClick={() => setAssessment(q.id, false)}
                  >
                    No
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button className="submit-btn" disabled={!canSubmit} onClick={calculate}>
            {canSubmit ? 'Calculate my result' : 'Answer all questions to continue'}
          </button>
        </>
      )}
    </>
  )
}

export default App
