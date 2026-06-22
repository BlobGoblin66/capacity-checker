import { useState, useEffect } from 'react'
import './index.css'

const CAPACITY_BANDS = [
  {
    id: 'energised',
    label: 'Energised',
    description: 'Ready to take on new tasks in addition to my typical routine/commitments',
    min: 8,
    max: 10,
  },
  {
    id: 'stable',
    label: 'Stable',
    description: 'In a position to meet my typical routine/commitments',
    min: 5,
    max: 7,
  },
  {
    id: 'delicate',
    label: 'Delicate',
    description: 'Having a bit of difficulty imagining how I will fulfill my typical routine/commitments',
    min: 2,
    max: 4,
  },
  {
    id: 'underwater',
    label: 'Underwater',
    description: 'Greatly struggling to imagine how I will fulfill my typical routine/commitments',
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
  { value: 0, label: 'Not relevant' },
  { value: 1, label: 'Not really' },
  { value: 2, label: 'Somewhat' },
  { value: 3, label: 'Definitely' },
]

const ASSESSMENT_QUESTIONS = [
  { id: 'minimise', q: 'Can the task be minimised or rearranged to make it easier?' },
  { id: 'delegate', q: 'Can the task be partially or fully delegated to someone else without considerable effort?' },
  { id: 'still_want', q: 'If others involved in the task knew how challenging it would be for you to complete, would they still want you to do it?' },
]

const STORAGE_KEY = 'capacity-checker-session'

const STEPS = [
  { type: 'capacity-band' },
  { type: 'capacity-slider' },
  ...IMPORTANCE_CRITERIA.map((c) => ({ type: 'importance', criterion: c })),
  ...ASSESSMENT_QUESTIONS.map((q) => ({ type: 'assessment', question: q })),
  { type: 'result' },
]

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

  const [stepIndex, setStepIndex] = useState(saved?.stepIndex ?? 0)
  const [direction, setDirection] = useState('forward')
  const [capacityBand, setCapacityBand] = useState(saved?.capacityBand ?? null)
  const [capacityValue, setCapacityValue] = useState(saved?.capacityValue ?? null)
  const [bump, setBump] = useState(false)
  const [importanceAnswers, setImportanceAnswers] = useState(saved?.importanceAnswers ?? {})
  const [assessmentAnswers, setAssessmentAnswers] = useState(saved?.assessmentAnswers ?? {})
  const [trail, setTrail] = useState([])

  const step = STEPS[stepIndex]
  const progressSteps = STEPS.length - 1
  const progressPercent = step.type === 'result' ? 100 : Math.round((stepIndex / progressSteps) * 100)

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ stepIndex, capacityBand, capacityValue, importanceAnswers, assessmentAnswers })
    )
  }, [stepIndex, capacityBand, capacityValue, importanceAnswers, assessmentAnswers])

  useEffect(() => {
    const id = Date.now()
    setTrail((prev) => [...prev, { id, percent: progressPercent }])
    const timeout = setTimeout(() => {
      setTrail((prev) => prev.filter((t) => t.id !== id))
    }, 900)
    return () => clearTimeout(timeout)
  }, [progressPercent])


  function goNext() {
    setDirection('forward')
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }

  function goBack() {
    setDirection('backward')
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  function selectBand(band) {
    setCapacityBand(band.id)
    setCapacityValue(band.min)
  }

  function setCapacityValueWithBump(v) {
    setCapacityValue(v)
    setBump(true)
    setTimeout(() => setBump(false), 150)
  }

  function setImportance(id, value) {
    setImportanceAnswers((prev) => ({ ...prev, [id]: value }))
  }

  function setAssessment(id, value) {
    setAssessmentAnswers((prev) => ({ ...prev, [id]: value }))
  }

  function reset() {
    setStepIndex(0)
    setDirection('forward')
    setCapacityBand(null)
    setCapacityValue(null)
    setImportanceAnswers({})
    setAssessmentAnswers({})
    localStorage.removeItem(STORAGE_KEY)
  }

  function calculateResult() {
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

const requiredImportance = Math.max(0, Math.min(10, 10 - capacityScore))
const diff = adjustedImportance - requiredImportance

let verdict, verdictClass, detail
if (diff >= -1) {
  verdict = 'Take it on'
  verdictClass = 'go'
  detail = 'Given your current capacity, this task clears the bar — go ahead.'
} else if (diff >= -4) {
  verdict = 'Manageable, but be mindful'
  verdictClass = 'caution'
  detail = "This task is on the edge of what your current capacity can comfortably support. Proceed with care."
} else {
  verdict = 'Defer or seek support'
  verdictClass = 'stop'
  detail = 'At your current capacity, this task would need to be far more important to justify taking on right now. Consider delaying, delegating, or asking for help.'
}

let tips = []

if (assessmentAnswers.minimise === true) {
  tips.push('You may be able to simplify or reduce the scope of this task.')
}

if (assessmentAnswers.delegate === true) {
  tips.push('Some or all of this task could potentially be delegated.')
}

if (assessmentAnswers.still_want === false) {
  tips.push('It may be worth reconsidering whether you need to be the person doing this.')
}

if (tips.length === 0) {
  tips.push('No specific adjustments were identified — your initial assessment looks complete.')
}
    
    return {
      capacityScore,
      rawImportance: Math.round(rawImportance * 10) / 10,
      adjustment,
      adjustedImportance: Math.round(adjustedImportance * 10) / 10,
      requiredImportance: Math.round(requiredImportance * 10) / 10,
      verdict,
      verdictClass,
      detail,
      tips
    }
  }

  let canAdvance = true
  if (step.type === 'capacity-band') canAdvance = !!capacityBand
  if (step.type === 'capacity-slider') canAdvance = capacityValue !== null
  if (step.type === 'importance') canAdvance = importanceAnswers[step.criterion.id] !== undefined
  if (step.type === 'assessment') canAdvance = assessmentAnswers[step.question.id] !== undefined

  const selectedBand = CAPACITY_BANDS.find((b) => b.id === capacityBand)

  return (
    <div className="screen">
      {step.type !== 'result' && (
       <div className="progress-track">
  <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
  {trail.map((t) => (
    <div key={t.id} className="trail-dot" style={{ left: `${t.percent}%` }} />
  ))}
  <div className="progress-marker" style={{ left: `${progressPercent}%` }} />
</div>
      )}

      <div className="wizard-row">
        {step.type !== 'result' && (
          <button
            className="side-nav-btn"
            onClick={goBack}
            disabled={stepIndex === 0}
            type="button"
            aria-label="Back"
          >
            ‹
          </button>
        )}

        <div className="step-stage">
          <div className={`step-content slide-${direction}`} key={stepIndex}>
            {step.type === 'capacity-band' && (
              <>
                <h1 className="step-title">How do you feel <i>right now</i>?</h1>
                <div className="band-list">
                  {CAPACITY_BANDS.map((band) => (
                    <button
                      key={band.id}
                      className={`band-option ${capacityBand === band.id ? 'selected' : ''}`}
                      onClick={() => selectBand(band)}
                      type="button"
                    >
                      <span className="band-label">{band.label}</span>
                      <span className="band-description">{band.description}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step.type === 'capacity-slider' && selectedBand && (
              <>
                <h1 className="step-title">You selected "{selectedBand.label}"</h1>
                <p className="step-subtext"> Use the slider to fine-tune this. A higher number reflects more capacity.</p>
                <div className={`big-number ${bump ? 'bump' : ''}`}>{capacityValue}</div>
                <input
                  type="range"
                  min={selectedBand.min}
                  max={selectedBand.max}
                  step={1}
                  value={capacityValue}
                  onChange={(e) => setCapacityValueWithBump(Number(e.target.value))}
                  className="big-slider"
                />
              </>
            )}

            {step.type === 'importance' && (
              <>
                <h1 className="step-title">{step.criterion.q}</h1>
                <div className="scale-grid">
                  {SCALE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`scale-card ${importanceAnswers[step.criterion.id] === opt.value ? 'selected' : ''}`}
                      onClick={() => setImportance(step.criterion.id, opt.value)}
                      type="button"
                    >
                      <span className="scale-num">{opt.value}</span>
                      <span className="scale-label">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step.type === 'assessment' && (
              <>
                <p className="step-kicker">Task assessment</p>
                <h1 className="step-title">{step.question.q}</h1>
                <div className="yesno-grid">
                  <button
                    className={`yesno-card ${assessmentAnswers[step.question.id] === true ? 'selected' : ''}`}
                    onClick={() => setAssessment(step.question.id, true)}
                    type="button"
                  >
                    Yes
                  </button>
                  <button
                    className={`yesno-card ${assessmentAnswers[step.question.id] === false ? 'selected' : ''}`}
                    onClick={() => setAssessment(step.question.id, false)}
                    type="button"
                  >
                    No
                  </button>
                </div>
              </>
            )}

           {step.type === 'result' && (() => {
  const result = calculateResult()
  return (
    <div className="result-content">
      <div className="scorecard">
        <p className="scorecard-label">Capacity check result</p>

        <div className="stat-grid">
          <div className="stat-tile">
            <div className="stat-num">{result.capacityScore}</div>
            <div className="stat-label">Capacity</div>
          </div>
          <div className="stat-tile">
            <div className="stat-num">{result.adjustedImportance}</div>
            <div className="stat-label">Importance</div>
          </div>
        </div>

        <div className={`verdict-banner ${result.verdictClass}`}>
          {result.verdict}
        </div>
        
        
<p className="verdict-detail">{result.detail}</p>

<details className="formula-disclosure">
  <summary>Show the formula</summary>
  <div className="adjust-note">
    Raw importance score: {result.rawImportance} / 10
    <br />
    Task assessment adjustment: {result.adjustment} point(s)
    <br />
    Adjusted importance: {result.adjustedImportance} / 10
  </div>
</details>

{(result.verdictClass === 'caution' || result.verdictClass === 'stop') && result.tips?.length > 0 && (
  <div className="tips-section">
    <p className="tips-title">Tips</p>

    <ul className="tips-list">
      {result.tips.map((tip, i) => (
        <li key={i} className="tips-item">
          {tip}
        </li>
      ))}
    </ul>
  </div>
)}
        
<button
  className="primary-btn"
  onClick={reset}
  type="button"
>
  Start a new assessment
</button>

</div>
</div>
  )
})()}
          </div>
        </div>

        {step.type !== 'result' && (
          <button
            className="side-nav-btn"
            onClick={goNext}
            disabled={!canAdvance}
            type="button"
            aria-label={stepIndex === STEPS.length - 2 ? 'See result' : 'Next'}
          >
            ›
          </button>
        )}
      </div>
    </div>
  )
}

export default App
