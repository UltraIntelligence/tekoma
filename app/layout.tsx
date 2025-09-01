import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tekoma Energy | Website Refresh Project Tracker',
  description: 'Tekoma Energy Website Refresh Project Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}