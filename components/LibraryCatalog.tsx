'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Book, BookType, Category } from '@/lib/types'
import styles from './LibraryCatalog.module.css'

const CATEGORIES: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'art', label: 'Art' },
  { value: 'design', label: 'Design' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'food', label: 'Food' },
  { value: 'photography', label: 'Photography' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
]

const TYPES: { value: BookType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'book', label: 'Books' },
  { value: 'magazine', label: 'Magazines' },
]

export default function LibraryCatalog({ books }: { books: Book[] }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')
  const [activeType, setActiveType] = useState<BookType | 'all'>('all')
  const [sort, setSort] = useState<'title' | 'recent'>('recent')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = books
    if (activeCategory !== 'all') result = result.filter(b => b.tags?.includes(activeCategory) || b.category === activeCategory)
    if (activeType !== 'all') result = result.filter(b => b.type === activeType)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.publisher?.toLowerCase().includes(q)
      )
    }
    if (sort === 'recent') {
      result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title))
    }
    return result
  }, [books, search, activeCategory, activeType, sort])

  const availableCount = books.filter(b => b.available).length

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <p className={styles.about}>
            A few hundred books and magazines on art, architecture, design, fashion, photography and more, all free to borrow. Pick something from the catalog and come by. There's usually tea or coffee if you'd like to stay a moment.<br />To book a visit, you'll need an access code.
          </p>
        </div>
      </header>

      <div className={styles.controls}>
        <div className={styles.inner}>
          <div className={styles.topRow}>
            <div className={styles.searchWrap}>
            <input
              type="text"
              placeholder={`Search… ${availableCount} titles available`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && setSearch('')}
              className={styles.search}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Clear search">×</button>
            )}
            </div>
          </div>
          <div className={styles.filters}>
            <div className={styles.filterRow}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`${styles.filterPill} ${activeCategory === cat.value ? styles.active : ''}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className={styles.filterRow}>
              {TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setActiveType(t.value)}
                  className={`${styles.filterPill} ${activeType === t.value ? styles.active : ''}`}
                >
                  {t.label}
                </button>
              ))}
              <div className={styles.filterDivider} />
              <button
                onClick={() => setSort(sort === 'title' ? 'recent' : 'title')}
                className={`${styles.filterPill} ${styles.sortPill}`}
              >
                {sort === 'title' ? 'A–Z' : 'Recent'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.inner}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>Nothing found{search ? ` for "${search}"` : ''}. Try a different search or filter.</p>
            </div>
          ) : (
            <ul className={styles.bookList}>
              {filtered.map(book => {
                const isExpanded = expandedId === book.id
                return (
                  <li key={book.id} className={styles.bookEntry}>
                    <div className={styles.bookMetaTop}>
                      <span className={styles.bookTypeTag}>{book.type}</span>
                      {(book.tags && book.tags.length ? book.tags : [book.category]).filter(Boolean).map(tag => (
                        <span key={tag} className={styles.bookCategoryTag}>{tag}</span>
                      ))}
                    </div>
                    <h2 className={styles.bookTitle}>
                      {book.title}
                      {book.instagram_url && (
                        <a
                          href={book.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.igLink}
                          title="View on Instagram"
                          onClick={e => e.stopPropagation()}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{display:'inline-block',verticalAlign:'middle',marginLeft:'8px',marginBottom:'2px'}}>
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                            <circle cx="12" cy="12" r="4"/>
                            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
                          </svg>
                        </a>
                      )}
                    </h2>
                    {book.author && <p className={styles.bookAuthor}>{book.author}</p>}
                    {book.publisher && (
                      <p className={styles.bookPublisher}>
                        {book.publisher}{book.year ? `, ${book.year}` : ''}
                      </p>
                    )}
                    {book.description && (
                      <div className={styles.bookDescriptionWrap}>
                        <p
                          className={`${styles.bookDescription} ${isExpanded ? styles.expanded : styles.collapsed}`}
                          onClick={() => !isExpanded && setExpandedId(book.id)}
                          style={!isExpanded ? {cursor: 'pointer'} : undefined}
                        >
                          {book.description}
                        </p>
                        <div className={styles.bookInlineActions}>
                          <button
                            className={styles.textAction}
                            onClick={() => setExpandedId(isExpanded ? null : book.id)}
                          >
                            {isExpanded ? 'Less' : 'More'}
                          </button>
                          {book.available && (
                            <>
                              <span className={styles.actionSep}>·</span>
                              <Link href={`/library/borrow/${book.id}`} className={styles.borrowLink}>
                                Borrow
                              </Link>
                            </>
                          )}
                          {!book.available && (
                            <>
                              <span className={styles.actionSep}>·</span>
                              <span className={styles.borrowedLabel}>On loan</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {!book.description && (
                      <div className={styles.bookInlineActions} style={{marginTop: '8px'}}>
                        {book.available ? (
                          <Link href={`/library/borrow/${book.id}`} className={styles.borrowLink}>Borrow</Link>
                        ) : (
                          <span className={styles.borrowedLabel}>On loan</span>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.inner}>
          <p>
            <a href="https://alphagallery.co" className={styles.footerLink}>Alphagallery</a>
            <span className={styles.footerSep}>·</span>
            <a href="https://instagram.com/alphagallery.co" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>@alphagallery.co</a>
            <span className={styles.footerSep}>·</span>
            <a href="https://github.com/da5ide/alphalibrary" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>Clone this project</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
