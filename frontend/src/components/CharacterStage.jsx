import { useRef, useState } from 'react'
import PropTypes from 'prop-types'

const CharacterStage = ({ characters }) => {
  const [states, setStates] = useState({})
  const timers = useRef({})

  const handleAction = (character) => {
    const { id, animationClasses, duration, actionDescription } = character

    setStates((prev) => ({
      ...prev,
      [id]: {
        classes: animationClasses,
        message: actionDescription,
      },
    }))

    if (timers.current[id]) {
      clearTimeout(timers.current[id])
    }

    timers.current[id] = setTimeout(() => {
      setStates((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }, duration)
  }

  return (
    <section className="section characters" id="characters">
      <div className="section-heading">
        <p className="eyebrow">Playground</p>
        <h2>Meet the CrossPay crew.</h2>
        <p className="subhead">
          Each avatar mirrors a core module: onboarding, FX, payouts, reporting,
          and employer tools. Tap a move to trigger a React-driven animation and
          reuse the pattern across the app.
        </p>
        <p className="micro-callout">Tap a move to animate their signature skill.</p>
      </div>
      <div className="character-stage">
        {characters.map((character) => {
          const active = states[character.id]
          const animationClass = ['character-image', `idle-${character.id}`, ...(active?.classes || [])]
            .filter(Boolean)
            .join(' ')

          return (
            <article key={character.id} className="character-bubble glass-card lift" data-character={character.id}>
              <img src={character.image} alt={character.name} className={animationClass} />
              <div className="bubble-info">
                <h3>{character.name}</h3>
                <p>{character.tagline}</p>
                <button type="button" className="ripple" onClick={() => handleAction(character)}>
                  {character.buttonLabel}
                </button>
                <span aria-live="polite">{active?.message || character.idle}</span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

CharacterStage.propTypes = {
  characters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      tagline: PropTypes.string.isRequired,
      buttonLabel: PropTypes.string.isRequired,
      idle: PropTypes.string.isRequired,
      animationClasses: PropTypes.arrayOf(PropTypes.string).isRequired,
      duration: PropTypes.number.isRequired,
      actionDescription: PropTypes.string.isRequired,
    })
  ).isRequired,
}

export default CharacterStage
