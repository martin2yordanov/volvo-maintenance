import { useState } from 'react'

// Normalize a car make name into a SimpleIcons slug.
// SimpleIcons uses lowercase, no spaces/hyphens/dots.
function normalize(make) {
  return make.toLowerCase().trim().replace(/[\s\-_.]/g, '')
}

// Known aliases / common user inputs → official SimpleIcons slug.
const ALIASES = {
  vw:           'volkswagen',
  chevy:        'chevrolet',
  benz:         'mercedes',
  mercedesbenz: 'mercedes',
  rangerover:   'landrover',
  rover:        'landrover',
  rollsroyce:   'rollsroyce',
  astonmartin:  'astonmartin',
  alfaromeo:    'alfaromeo',
  alfa:         'alfaromeo',
}

function getLogoUrl(make) {
  if (!make) return null
  const norm = normalize(make)
  const slug = ALIASES[norm] || norm
  return `https://cdn.simpleicons.org/${slug}/ffffff`
}

export default function CarLogo({ make }) {
  const [errored, setErrored] = useState(false)

  if (!make) return <span className="car-fallback">🚗</span>
  if (errored) return <span className="car-fallback">{make[0].toUpperCase()}</span>

  return (
    <img
      className="car-logo-img"
      src={getLogoUrl(make)}
      alt={make}
      onError={() => setErrored(true)}
    />
  )
}
