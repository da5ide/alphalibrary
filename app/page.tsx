import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.wrap}>
      <Link href="/library" className={styles.primary}>
        Enter the Library
      </Link>
      <a href="https://www.instagram.com/alphagallery.co" target="_blank" rel="noopener noreferrer" className={styles.secondary}>
        @alphagallery.co
      </a>
    </main>
  )
}
