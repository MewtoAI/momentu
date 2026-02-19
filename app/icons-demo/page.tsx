'use client'

import { useState } from 'react'
import {
  SparkleIcon,
  CameraIcon,
  AlbumIcon,
  HeartIcon,
  UploadIcon,
  LoadingDotsIcon,
  CheckIcon,
  PhotoStackIcon,
  MagicWandIcon,
  GeneratingAnimation,
} from '@/components/icons'

// ─────────────────────────────────────────
// Icon card wrapper
// ─────────────────────────────────────────
function IconCard({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 2px 12px rgba(44,24,16,0.06)',
        border: '1px solid rgba(201,96,122,0.1)',
        minHeight: 160,
      }}
    >
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {children}
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#2C1810', letterSpacing: '0.02em' }}>
          {label}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9B7A6E', lineHeight: 1.4 }}>
          {description}
        </p>
      </div>
    </div>
  )
}

// Small sub-label for states
function StateLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 10, color: '#C9607A', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {children}
    </span>
  )
}

// ─────────────────────────────────────────
// Demo Page
// ─────────────────────────────────────────
export default function IconsDemoPage() {
  const [animateAll, setAnimateAll] = useState(false)
  const [checkTriggered, setCheckTriggered] = useState(false)

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF7F5',
        padding: '48px 24px',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: 900, margin: '0 auto 48px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <SparkleIcon size={32} animate />
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#2C1810', letterSpacing: '-0.02em' }}>
          Momentu AI — Icon System
        </h1>
        <p style={{ margin: '8px 0 0', color: '#9B7A6E', fontSize: 15 }}>
          10 ícones customizados • Framer Motion • 100% originais
        </p>

        {/* Toggle button */}
        <button
          onClick={() => setAnimateAll(v => !v)}
          style={{
            marginTop: 24,
            padding: '10px 28px',
            borderRadius: 50,
            border: '2px solid #C9607A',
            background: animateAll ? '#C9607A' : 'transparent',
            color: animateAll ? '#FAF7F5' : '#C9607A',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            letterSpacing: '0.02em',
          }}
        >
          {animateAll ? '⏹ Parar animações' : '▶ Animar todos'}
        </button>
      </div>

      {/* Grid */}
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 20,
        }}
      >

        {/* 1. SparkleIcon */}
        <IconCard label="SparkleIcon" description="Botão Gerar / status AI">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <SparkleIcon size={32} animate={false} />
            <StateLabel>estático</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <SparkleIcon size={32} animate />
            <StateLabel>animado</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <SparkleIcon size={48} color="#C9A84C" animate />
            <StateLabel>gold / lg</StateLabel>
          </div>
        </IconCard>

        {/* 2. CameraIcon */}
        <IconCard label="CameraIcon" description="Upload de fotos / photo slots">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <CameraIcon size={32} animate={false} />
            <StateLabel>estático</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <CameraIcon size={32} animate={animateAll} />
            <StateLabel>shutter blink</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <CameraIcon size={48} color="#2C1810" />
            <StateLabel>dark / lg</StateLabel>
          </div>
        </IconCard>

        {/* 3. AlbumIcon */}
        <IconCard label="AlbumIcon" description="Álbum / galeria">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <AlbumIcon size={32} animate={false} />
            <StateLabel>estático</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <AlbumIcon size={32} animate={animateAll} />
            <StateLabel>fan out</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <AlbumIcon size={48} color="#C9A84C" />
            <StateLabel>gold / lg</StateLabel>
          </div>
        </IconCard>

        {/* 4. HeartIcon */}
        <IconCard label="HeartIcon" description="Memórias / álbum de amor">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <HeartIcon size={32} animate={false} />
            <StateLabel>estático</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <HeartIcon size={32} filled animate={animateAll} />
            <StateLabel>heartbeat</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <HeartIcon size={48} filled color="#C9A84C" />
            <StateLabel>filled gold</StateLabel>
          </div>
        </IconCard>

        {/* 5. UploadIcon */}
        <IconCard label="UploadIcon" description="Área de upload de fotos">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <UploadIcon size={32} animate={false} />
            <StateLabel>estático</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <UploadIcon size={32} animate={animateAll} />
            <StateLabel>floating</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <UploadIcon size={48} color="#C9A84C" animate={animateAll} />
            <StateLabel>gold / lg</StateLabel>
          </div>
        </IconCard>

        {/* 6. LoadingDotsIcon */}
        <IconCard label="LoadingDotsIcon" description="Estados de loading leve">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <LoadingDotsIcon size={32} />
            <StateLabel>sempre animado</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <LoadingDotsIcon size={48} color="#C9A84C" />
            <StateLabel>gold / lg</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <LoadingDotsIcon size={24} color="#2C1810" />
            <StateLabel>dark / sm</StateLabel>
          </div>
        </IconCard>

        {/* 7. CheckIcon */}
        <IconCard label="CheckIcon" description="Confirmações / sucesso">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <CheckIcon size={32} animate={false} />
            <StateLabel>estático</StateLabel>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
            onClick={() => {
              setCheckTriggered(false)
              setTimeout(() => setCheckTriggered(true), 50)
            }}
          >
            {checkTriggered
              ? <CheckIcon key={Date.now()} size={32} animate />
              : <CheckIcon size={32} animate={false} />
            }
            <StateLabel>clique p/ animar</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <CheckIcon size={48} color="#C9A84C" animate={false} />
            <StateLabel>gold / lg</StateLabel>
          </div>
        </IconCard>

        {/* 8. PhotoStackIcon */}
        <IconCard label="PhotoStackIcon" description="Agrupamento de fotos">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <PhotoStackIcon size={32} />
            <StateLabel>espalhado</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <PhotoStackIcon size={32} grouped={animateAll} animate={animateAll} />
            <StateLabel>agrupado</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <PhotoStackIcon size={48} color="#C9A84C" />
            <StateLabel>gold / lg</StateLabel>
          </div>
        </IconCard>

        {/* 9. MagicWandIcon */}
        <IconCard label="MagicWandIcon" description="Ação principal de geração AI">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <MagicWandIcon size={32} animate={false} />
            <StateLabel>estático</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <MagicWandIcon size={32} animate={animateAll} />
            <StateLabel>wand + sparkles</StateLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <MagicWandIcon size={48} color="#C9A84C" animate={animateAll} />
            <StateLabel>gold / lg</StateLabel>
          </div>
        </IconCard>

      </div>

      {/* GeneratingAnimation — full width card */}
      <div style={{ maxWidth: 900, margin: '20px auto 0' }}>
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '40px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 12px rgba(44,24,16,0.06)',
            border: '1px solid rgba(201,96,122,0.1)',
          }}
        >
          <p style={{ margin: '0 0 24px', fontWeight: 600, fontSize: 13, color: '#2C1810', letterSpacing: '0.02em' }}>
            GeneratingAnimation — Tela T10
          </p>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <GeneratingAnimation label="Criando seu álbum..." size={200} />
              <StateLabel>size 200</StateLabel>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <GeneratingAnimation label="Processando fotos..." size={140} />
              <StateLabel>size 140</StateLabel>
            </div>
          </div>
          <p style={{ margin: '16px 0 0', fontSize: 11, color: '#9B7A6E' }}>
            Álbum se constrói · estrelinhas orbitando · label animada
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ maxWidth: 900, margin: '40px auto 0', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, color: '#C9A84C', letterSpacing: '0.05em', fontWeight: 500 }}>
          ✦ MOMENTU AI · CUSTOM ICON SYSTEM · 100% ORIGINAL ✦
        </p>
      </div>
    </div>
  )
}
