import { create } from 'zustand'

export const PAINTS = [
  { id: 'magma', name: 'Rosso Magma', color: '#e01a08', accent: '#ff4a1c', finish: 'Tri-coat metallic' },
  { id: 'amber', name: 'Solar Amber', color: '#ff8a00', accent: '#ffa630', finish: 'Candy pearl' },
  { id: 'glacier', name: 'Glacier Silver', color: '#c4cad3', accent: '#cfe3ff', finish: 'Liquid metal' },
  { id: 'abyss', name: 'Abyss Blue', color: '#0a34c8', accent: '#4d86ff', finish: 'Deep metallic' },
  { id: 'aurora', name: 'Aurora Green', color: '#0a6a4a', accent: '#2fe0a2', finish: 'Heritage metallic' },
  { id: 'obsidian', name: 'Obsidian', color: '#0b0b0e', accent: '#c9ab7c', finish: 'Piano gloss' },
]

export const useStore = create((set) => ({
  paint: 0,
  setPaint: (paint) => set({ paint }),
}))

// Per-frame values shared between the DOM and the WebGL scene.
// Kept outside React so scrolling never triggers a re-render.
export const rig = {
  scroll: 0, // float: section index + progress to the next one
  intro: 0, // 0 → 1 opening shot
  pointer: { x: 0, y: 0 },
  drag: 0, // pending turntable rotation from the configurator
  speed: 0, // 0 → 1, written by the scene
}

export const SECTION = { HERO: 0, FORM: 1, POWER: 2, CRAFT: 3, COLOUR: 4, RESERVE: 5 }
