'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Book, Category } from '@/lib/types'

const CATEGORIES: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'art', label: 'Art' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'design', label: 'Design' },
  { value: 'photography', label: 'Photography' },
  { value: 'other', label: 'Other' },
]

export default function LibraryCatalog({ books }: { books: Book[] }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')
  const [sort, setSort] = useState<'title' | 'recent'>('title')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = books

    if (activeCategory !== 'all') {
      result = result.filter(b => b.category === activeCategory)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.publisher?.toLowerCase().includes(q)
      )
    }

    if (sort === 'recent') {
      result = [...result].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } else {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title))
    }

    return result
  }, [books, search, activeCategory, sort])

  const availableCount = books.filter(b => b.available).length

  return (
    <div className="library-wrap">
      <header className="library-header">
        <div className="library-inner">
          <p className="library-about">
            A few hundred books and magazines on art, fashion, architecture, design, and photography, all free to borrow. Pick something from the catalog and come by. There's usually tea or coffee if you'd like to stay a moment. To visit and borrow, you'll need an access code.
          </p>
        </div>
      </header>

      <div className="library-controls">
        <div className="library-inner">
          <div className="library-top-row">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="library-search"
              placeholder={`Search… ${availableCount} items available`}
            />
          </div>
          <div className="library-filters">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`library-filter-pill ${activeCategory === cat.value ? 'active' : ''}`}
              >
                {cat.label}
              </button>
            ))}
            <div className="filter-divider" />
            <button
              onClick={() => setSort(sort === 'title' ? 'recent' : 'title')}
              className="library-filter-pill sort-pill"
            >
              {sort === 'title' ? 'A–Z' : 'Recent'}
            </button>
          </div>
        </div>
      </div>

      <main className="library-main">
        <div className="library-inner">
          {filtered.length === 0 ? (
            <div className="library-empty">
              <p>Nothing found{search ? ` for "${search}"` : ''}. Try a different search or filter.</p>
            </div>
          ) : (
            <ul className="book-list">
              {filtered.map(book => {
                const isExpanded = expandedId === book.id
                return (
                  <li key={book.id} className="book-entry">
                    <div className="book-meta-top">
                      <span className="book-type-tag">{book.type}</span>
                      <span className="book-category-tag">{book.category}</span>
                    </div>
                    <h2 className="book-title">
                      {book.title}
                      {book.instagram_url && (
                        <a
                          href={book.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="book-ig-link"
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
                    {book.author && <p className="book-author">{book.author}</p>}
                    {book.publisher && (
                      <p className="book-publisher">
                        {book.publisher}{book.year ? `, ${book.year}` : ''}
                      </p>
                    )}
                    {book.description && (
                      <div className="book-description-wrap">
                        <p className={`book-description ${isExpanded ? 'expanded' : 'collapsed'}`}>
                          {book.description}
                        </p>
                        <div className="book-inline-actions">
                          <button
                            className="text-action"
                            onClick={() => setExpandedId(isExpanded ? null : book.id)}
                          >
                            {isExpanded ? 'Less' : 'More'}
                          </button>
                          {book.available && (
                            <>
                              <span className="action-sep">·</span>
                              <Link href={`/library/borrow/${book.id}`} className="borrow-link-el">
                                Borrow
                              </Link>
                            </>
                          )}
                          {!book.available && (
                            <>
                              <span className="action-sep">·</span>
                              <span className="borrowed-label">On loan</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {!book.description && (
                      <div className="book-inline-actions" style={{marginTop: '8px'}}>
                        {book.available ? (
                          <Link href={`/library/borrow/${book.id}`} className="borrow-link-el">
                            Borrow
                          </Link>
                        ) : (
                          <span className="borrowed-label">On loan</span>
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

      <footer className="library-footer">
        <div className="library-inner">
          <p>
            <a href="#" className="footer-link">Alphagallery</a>
            <span className="footer-sep">·</span>
            <a href="https://instagram.com/alphagallery.co" target="_blank" rel="noopener noreferrer" className="footer-link">@alphagallery.co</a>
          </p>
        </div>
      </footer>

      <style jsx global>{`
        .borrow-link-el {
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #8C4A2F;
          text-decoration: none;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          border-bottom: 1px solid rgba(140,74,47,0.4);
          padding-bottom: 1px;
          transition: color 0.12s, border-color 0.12s;
        }
        .borrow-link-el:hover { color: #6B3020; border-bottom-color: transparent; }
      `}</style>
      <style jsx>{`
        .library-wrap {
          min-height: 100vh;
          background: #FAFAF8;
          color: #111110;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .library-inner {
          max-width: 720px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .library-header {
          padding: 52px 0 0;
        }

        .library-about {
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 24px;
          font-weight: 400;
          line-height: 1.65;
          color: #8C4A2F;
          margin: 0;
          padding-bottom: 36px;
          border-bottom: 1px solid #E8E4DF;
        }

        .library-controls {
          padding: 24px 0 0;
        }

        .library-top-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .library-search {
          flex: 1;
          border: 1.5px solid #E8E4DF;
          border-radius: 6px;
          padding: 8px 13px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          background: white;
          color: #111110;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }

        .library-search:focus { border-color: #8C4A2F; }
        .library-search::placeholder { color: #C0BCB8; }

        .library-count {
          font-size: 14px;
          color: #9B9793;
          letter-spacing: 0.02em;
          margin: 0;
          white-space: nowrap;
        }

        .library-filters {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          padding-bottom: 16px;
          align-items: center;
        }

        .library-filter-pill {
          border: 1.5px solid #E8E4DF;
          background: white;
          border-radius: 100px;
          padding: 5px 13px;
          font-size: 12px;
          font-family: 'Inter', sans-serif;
          color: #6B6560;
          cursor: pointer;
          letter-spacing: 0.03em;
          transition: all 0.12s;
        }

        .library-filter-pill:hover { border-color: #555250; color: #111110; }
        .library-filter-pill.active { background: #6B6560; border-color: #6B6560; color: white; }

        .filter-divider {
          width: 1px;
          height: 16px;
          background: #E8E4DF;
          margin: 0 2px;
        }

        .sort-pill {
          color: #9B9793;
          border-style: dashed;
        }

        .sort-pill:hover { border-style: solid; color: #111110; }

        .library-main { padding: 24px 0 80px; }
        .book-list { list-style: none; padding: 0; margin: 0; }

        .book-entry {
          padding: 22px 0;
          border-bottom: 1px solid #E8E4DF;
        }

        .book-meta-top {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 7px;
        }

        .book-type-tag, .book-category-tag {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
          color: #6B6560;
          background: #F2EFE9;
          padding: 2px 8px;
          border-radius: 100px;
        }

        .book-ig-link {
          color: #8C4A2F;
          transition: opacity 0.12s;
        }
        .book-ig-link:hover { opacity: 0.6; }

        .book-ig-link:hover { opacity: 0.6; }

        .book-title {
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 23px;
          font-weight: 500;
          line-height: 1.25;
          letter-spacing: -0.01em;
          margin-bottom: 5px;
          color: #111110;
        }

        .book-author {
          font-size: 15px;
          color: #555250;
          margin-bottom: 2px;
        }

        .book-publisher {
          font-size: 14px;
          color: #9B9793;
        }

        .book-description-wrap { margin-top: 8px; }

        .book-description {
          font-size: 15px;
          line-height: 1.65;
          color: #444240;
          max-width: 560px;
          margin: 0;
        }

        .book-description.collapsed {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .book-description.expanded { display: block; }

        .book-inline-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 5px;
          flex-wrap: wrap;
        }

        .text-action {
          background: none;
          border: none;
          padding: 0;
          font-size: 11px;
          color: #B0ACA8;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-weight: 500;
          border-bottom: 1px solid rgba(176,172,168,0.5);
          padding-bottom: 1px;
          transition: color 0.12s, border-color 0.12s;
        }

        .text-action:hover { color: #111110; border-bottom-color: transparent; }

        .action-sep {
          font-size: 11px;
          color: #D0CCC8;
        }

        .borrow-link {
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #8C4A2F;
          text-decoration: none;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          border-bottom: 1px solid rgba(140, 74, 47, 0.4);
          padding-bottom: 1px;
          transition: color 0.12s, border-color 0.12s;
        }

        .borrow-link:hover { color: #6B3020; border-bottom-color: transparent; }

        .borrowed-label {
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #C0BCB8;
          font-family: 'Inter', sans-serif;
        }

        .library-empty {
          padding: 60px 0;
          color: #9B9793;
          font-size: 15px;
        }

        .library-footer {
          border-top: 1px solid #E8E4DF;
          padding: 24px 0;
        }

        .library-footer p {
          font-size: 12px;
          color: #9B9793;
          letter-spacing: 0.03em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-link { color: #9B9793; text-decoration: none; }
        .footer-link:hover { color: #111110; }
        .footer-sep { color: #D0CCC8; }

        @media (max-width: 600px) {
          .library-inner { padding: 0 20px; }
          .library-header { padding: 40px 0 0; }
          .library-about { font-size: 21px; }
          .book-title { font-size: 22px; }
          .book-author { font-size: 15px; }
          .book-description { font-size: 15px; }
          .library-top-row { flex-direction: column; align-items: flex-start; gap: 8px; }
          .library-search { width: 100%; }
        }
      `}</style>
    </div>
  )
}
