const SUPABASE_URL = 'https://lldmgalcgrmghsqlrmjp.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Dn20aHNT1JqsyPGCXo4wxg_wOJEW5sJ'
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

async function getBooks() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/books?select=id,title,author,publisher,year&order=created_at.asc`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  })
  return res.json()
}

async function getYear(title, author, publisher) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `What is the publication year of this book or magazine?

Title: ${title}
${author ? `Author/Editor: ${author}` : ''}
${publisher ? `Publisher: ${publisher}` : ''}

Respond with ONLY a 4-digit year number (e.g. 2019). If you cannot determine it with reasonable confidence, respond with null.`
      }]
    })
  })
  const data = await res.json()
  const text = data.content?.[0]?.text?.trim()
  if (!text || text === 'null') return null
  const year = parseInt(text)
  return isNaN(year) ? null : year
}

async function updateYear(id, year) {
  await fetch(`${SUPABASE_URL}/rest/v1/books?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ year })
  })
}

async function run() {
  const books = await getBooks()
  console.log(`Processing ${books.length} books...`)

  for (const book of books) {
    if (book.year) {
      console.log(`✓ ${book.title} — already has year ${book.year}`)
      continue
    }
    const year = await getYear(book.title, book.author, book.publisher)
    if (year) {
      await updateYear(book.id, year)
      console.log(`✓ ${book.title} → ${year}`)
    } else {
      console.log(`? ${book.title} → could not determine year`)
    }
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 300))
  }
  console.log('Done.')
}

run().catch(console.error)
