import { supabase } from '@/lib/supabase'
import { Book } from '@/lib/types'
import LibraryCatalog from '@/components/LibraryCatalog'

export const revalidate = 60

async function getBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('private', false)
    .order('title', { ascending: true })

  if (error) {
    console.error('Error fetching books:', error)
    return []
  }
  return data || []
}

export default async function LibraryPage() {
  const books = await getBooks()
  return <LibraryCatalog books={books} />
}
