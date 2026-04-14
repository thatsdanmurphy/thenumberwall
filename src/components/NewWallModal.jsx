import { useState } from 'react'
import { X, ChevronRight, Trophy, Flame, Shield, Diamond, Zap, ClipboardList, Users, Swords, Map, Plus } from 'lucide-react'
import { getActivePrompts } from '../data/seasonalPrompts.js'

// Map lucideIcon string → React component
const ICON_MAP = {
  trophy: Trophy,
  flame: Flame,
  shield: Shield,
  diamond: Diamond,
  zap: Zap,
  'clipboard-list': ClipboardList,
  users: Users,
  swords: Swords,
  map: Map,
}

export default function NewWallModal({ open, onClose, onSelect }) {
  if (!open) return null

  const prompts = getActivePrompts()
  const seasonal = prompts.filter(p => p.months !== null)
  const evergreen = prompts.filter(p => p.months === null)

  return (
    <div className="tnw-overlay nw-modal__overlay" onClick={onClose}>
      <div className="nw-modal" onClick={e => e.stopPropagation()}>
        <div className="nw-modal__header">
          <span className="nw-modal__title">BUILD A NEW WALL</span>
          <button className="nw-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="nw-modal__body">
          {seasonal.length > 0 && (
            <>
              <span className="nw-modal__section-label">IN SEASON</span>
              {seasonal.map(p => {
                const Icon = ICON_MAP[p.lucideIcon] || Trophy
                return (
                  <button key={p.id} className="nw-modal__prompt-row" onClick={() => onSelect(p)}>
                    <span className="nw-modal__prompt-icon nw-modal__prompt-icon--seasonal">
                      <Icon size={16} />
                    </span>
                    <span className="nw-modal__prompt-info">
                      <span className="nw-modal__prompt-name">{p.name}</span>
                      <span className="nw-modal__prompt-desc">{p.description}</span>
                    </span>
                    <ChevronRight size={14} className="nw-modal__prompt-arrow" />
                  </button>
                )
              })}
            </>
          )}

          {evergreen.length > 0 && (
            <>
              <span className="nw-modal__section-label">FOR YOUR CREW</span>
              {evergreen.map(p => {
                const Icon = ICON_MAP[p.lucideIcon] || Users
                return (
                  <button key={p.id} className="nw-modal__prompt-row" onClick={() => onSelect(p)}>
                    <span className="nw-modal__prompt-icon">
                      <Icon size={16} />
                    </span>
                    <span className="nw-modal__prompt-info">
                      <span className="nw-modal__prompt-name">{p.name}</span>
                      <span className="nw-modal__prompt-desc">{p.description}</span>
                    </span>
                    <ChevronRight size={14} className="nw-modal__prompt-arrow" />
                  </button>
                )
              })}
            </>
          )}

          <button className="nw-modal__prompt-row nw-modal__prompt-row--blank" onClick={() => onSelect(null)}>
            <span className="nw-modal__prompt-icon nw-modal__prompt-icon--blank">
              <Plus size={16} />
            </span>
            <span className="nw-modal__prompt-info">
              <span className="nw-modal__prompt-name">Blank Wall</span>
              <span className="nw-modal__prompt-desc">Start from scratch. Name it whatever you want.</span>
            </span>
            <ChevronRight size={14} className="nw-modal__prompt-arrow" />
          </button>
        </div>
      </div>
    </div>
  )
}
