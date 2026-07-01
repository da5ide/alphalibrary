export type BookType = 'book' | 'magazine'
export type Category = 'art' | 'fashion' | 'architecture' | 'design' | 'photography' | 'food' | 'travel' | 'other'

export interface Book {
  id: string
  created_at: string
  title: string
  author: string | null
  publisher: string | null
  type: BookType
  category: Category
  description: string | null
  notes: string | null
  price: number | null
  link: string | null
  cover_url: string | null
  photo_urls: string[] | null
  available: boolean
  private: boolean
  borrower: string | null
  borrower_contact: string | null
  borrowed_at: string | null
  due_at: string | null
  instagram_url: string | null
  tags: string[] | null
  year: number | null
  sort_order: number | null
}

export interface Slot {
  id: string
  date: string
  start_time: string
  end_time: string
  booked: boolean
  created_at: string
}

export interface Booking {
  id: string
  book_id: string
  slot_id: string
  borrower_name: string
  borrower_email: string
  created_at: string
  confirmation_sent: boolean
  reminder_sent: boolean
  return_reminder_sent: boolean
  returned: boolean
  returned_at: string | null
}
