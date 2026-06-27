const SUPABASE_URL = 'https://lldmgalcgrmghsqlrmjp.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Dn20aHNT1JqsyPGCXo4wxg_wOJEW5sJ'
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

const VALID_TAGS = ['art', 'fashion', 'architecture', 'design', 'photography', 'other']

async function getBooks() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/books?select=id,title,author,publisher,description,category&order=created_at.asc`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  })
  return res.json()
}

async function getTags(title, author, publisher, description) {
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
        content: `Assign 1-3 tags to this book from this list only: art, fashion, architecture, design, photography, other.

Title: ${title}
${author ? `Author: ${author}` : ''}
${publisher ? `Publisher: ${publisher}` : ''}
${description ? `Description: ${description}` : ''}

Respond with ONLY a JSON array of tags, e.g. ["art", "photography"]. Use the minimum number of tags that accurately represent the work.`
      }]
    })
  })
  const data = await res.json()
  const text = data.content?.[0]?.text?.trim()
  try {
    const tags = JSON.parse(text)
    return tags.filter(t => VALID_TAGS.includes(t))
  } catch {
    return null
  }
}

async function updateTags(id, tags, category) {
  await fetch(`${SUPABASE_URL}/rest/v1/books?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ tags, category: tags[0] || category })
  })
}

async function run() {
  const books = await getBooks()
  console.log(`Processing ${books.length} books...`)

  for (const book of books) {
    const tags = await getTags(book.title, book.author, book.publisher, book.description)
    if (tags && tags.length) {
      await updateTags(book.id, tags, book.category)
      console.log(`✓ ${book.title} → [${tags.join(', ')}]`)
    } else {
      console.log(`? ${book.title} → could not determine tags`)
    }
    await new Promise(r => setTimeout(r, 300))
  }
  console.log('Done.')
}

run().catch(console.error)
