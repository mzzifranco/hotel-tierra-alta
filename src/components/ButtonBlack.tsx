'use client'

import Link from 'next/link'

interface ButtonBlackProps {
  href?: string
  text?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export default function ButtonBlack({ 
  href = '/dining', 
  text = 'EXPLORE DINING',
  onClick,
  type = 'button'
}: ButtonBlackProps) {
  
  const buttonClasses = `
    inline-block px-12 py-2 
    text-sm font-medium tracking-[0.15em]
    rounded-[30px]
    bg-[#f3eee7] text-[#404040] border border-[#404040]
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