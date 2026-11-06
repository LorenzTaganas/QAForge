const palette = [
  'bg-[#7C6CF2] text-[#0F1016]',
  'bg-[#59A8F5] text-[#0F1016]',
  'bg-[#35B77A] text-[#0F1016]',
  'bg-[#E7A94B] text-[#0F1016]',
  'bg-[#F06B70] text-[#0F1016]',
  'bg-[#9184FF] text-[#0F1016]',
]

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return `${parts[0][0]}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase()
}

const getTone = (name = '') => {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) hash = (hash * 31 + name.charCodeAt(index)) % 997
  return palette[hash % palette.length]
}

const sizes = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
}

const Avatar = ({ name, size = 'md', className = '', title }) => (
  <span
    title={title || name}
    className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${sizes[size]} ${getTone(name)} ${className}`}
    aria-hidden={title ? undefined : 'true'}
  >
    {getInitials(name)}
  </span>
)

export default Avatar
