'use client'

import Link from 'next/link'

interface ButtonWhiteProps {
  href?: string
  text?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export default function ButtonWhite({ 
  href = '/dining', 
  text = 'EXPLORE DINING',
  onClick,
  type = 'button'
}: ButtonWhiteProps) {
  
  const buttonClasses = `
    inline-block px-12 py-2 
    text-sm font-medium tracking-[0.15em]
    rounded-[30px]
    bg-[#ffffff] text-[#404040] border border-[#ffffff]
    hover:bg-[#404040] hover:text-[#ffffff] hover:border-[#404040]
    transition-all duration-300 ease-in-out
    cursor-pointer
  `

  if (onClick || type === 'submit') {
    return (
      <button 
        type={type}
        onClick={onClick}
        className={buttonClasses}
      >
        {text}
      </button>
    )
  }

  return (
    <Link 
      href={href}
      className={buttonClasses}
    >
      {text}
    </Link>
  )
}