function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length === 1 ? parts[0].charAt(0).toUpperCase() : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const SIZES = {
  xs: 'w-5 h-5 text-[8px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-xl',
}

export default function Avatar({ url, name, size = 'sm', border = false }) {
  const cls = SIZES[size] || SIZES.sm
  const borderCls = border ? 'border-2 border-[#F5EFE0]' : ''

  if (url) {
    return (
      <img
        src={url}
        alt={name || ''}
        className={`${cls} rounded-full object-cover flex-shrink-0 ${borderCls} ${!border ? 'border border-[#1C3829]/10' : ''}`}
      />
    )
  }

  return (
    <div className={`${cls} rounded-full bg-[#1C3829]/10 flex items-center justify-center text-[#1C3829] font-semibold flex-shrink-0 ${borderCls}`}>
      {getInitials(name)}
    </div>
  )
}
