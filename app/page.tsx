import Link from 'next/link'

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#FAFAF8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      fontFamily: 'var(--font-inter), -apple-system, sans-serif',
    }}>
      <Link href="/library" style={{
        fontSize: '15px',
        color: '#111110',
        textDecoration: 'none',
        letterSpacing: '0.02em',
        borderBottom: '1px solid #111110',
        paddingBottom: '1px',
      }}>
        Enter the Library
      </Link>
      <a href="https://www.instagram.com/alphagallery.co" target="_blank" rel="noopener noreferrer" style={{
        fontSize: '15px',
        color: '#9B9793',
        textDecoration: 'none',
        letterSpacing: '0.02em',
      }}>
        @alphagallery.co
      </a>
    </main>
  )
}
