import TemplatesGallery from '@/components/templates-gallery'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Escolha seu Template — Momentu',
  description: '5 templates únicos para casais, bebês, famílias, minimalistas e viajantes.',
}

export default function TemplatesPage() {
  return <TemplatesGallery />
}
