import { supabase } from '@/lib/supabase'
import { Book, Slot } from '@/lib/types'
import { notFound } from 'next/navigation'
import BorrowForm from '@/components/BorrowForm'

async function getBook(id: string): Promise<Book | null> {
  const { data } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .eq('private', false)
    .single()
  return data
}

async function getSlots(): Promise<Slot[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('slots')
    .select('*')
    .eq('booked', false)
    .gte('date', today)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
  return data || []
}

export default async function BorrowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [book, slots] = await Promise.all([getBook(id), getSlots()])
  if (!book) notFound()
  return <BorrowForm book={book} slots={slots} />
}
