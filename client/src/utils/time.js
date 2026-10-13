export const getTimestamp = (value) => {
  if (!value) return 0
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export const formatTimestamp = (value) => {
  const timestamp = getTimestamp(value)
  if (!timestamp) return value || 'Unknown time'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp)
}
