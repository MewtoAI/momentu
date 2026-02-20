'use client'

import dynamic from 'next/dynamic'

const KonvaEditor = dynamic(
  () => import('@/components/konva-editor'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAF7F5',
          gap: 16,
        }}
      >
        <div
          className="spinner"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '3px solid #EDE8E6',
            borderTopColor: '#C9607A',
          }}
        />
        <p style={{ fontSize: 14, color: '#8C7B82', fontFamily: 'Inter, sans-serif' }}>
          Carregando editor...
        </p>
      </div>
    ),
  }
)

export default function EditorPage({ params }: { params: { sessionId: string } }) {
  return <KonvaEditor templateId={params.sessionId} />
}
