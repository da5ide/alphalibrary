import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  const html = readFileSync(join(process.cwd(), 'public/library/admin/catalog/index.html'), 'utf-8')
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}
