/**
 * Catalogue nav mapping — canonical source of truth for the left nav tree.
 *
 * NAV_CAT_MAP:     category nav ID  → CostCategory string
 * NAV_SECTION_MAP: subcategory ID   → { cat, sections[] }
 *
 * sections[] is an array so future nav nodes can group multiple data sections.
 * Right now every entry maps 1:1 to a single section string.
 */

import type { CostCategory } from '../types/catalogue.types';

export const NAV_CAT_MAP: Record<string, CostCategory> = {
  'general':      'General',
  'flooring':     'Flooring',
  'painting':     'Painting',
  'trim-doors':   'Trim & Doors',
  'accent-walls': 'Accent Walls',
};

export interface NavSectionEntry {
  cat: CostCategory;
  sections: string[];
}

export const NAV_SECTION_MAP: Record<string, NavSectionEntry> = {
  // General
  'site-prep':      { cat: 'General',      sections: ['Site Preparation'] },
  'cleanup':        { cat: 'General',      sections: ['Cleanup & Waste'] },
  'repairs':        { cat: 'General',      sections: ['Repairs & Prep'] },
  'admin':          { cat: 'General',      sections: ['Travel & Admin'] },
  // Flooring
  'subfloor':       { cat: 'Flooring',     sections: ['Subfloor Prep'] },
  'demo':           { cat: 'Flooring',     sections: ['Demo & Removal'] },
  'hardwood':       { cat: 'Flooring',     sections: ['Hardwood'] },
  'lvp':            { cat: 'Flooring',     sections: ['LVP & LVT'] },
  'laminate':       { cat: 'Flooring',     sections: ['Laminate'] },
  'carpet':         { cat: 'Flooring',     sections: ['Carpet'] },
  'tile':           { cat: 'Flooring',     sections: ['Tile'] },
  'transitions':    { cat: 'Flooring',     sections: ['Transitions & Trim'] },
  'stairs':         { cat: 'Flooring',     sections: ['Stairs'] },
  // Painting
  'surface-prep':   { cat: 'Painting',     sections: ['Surface Prep'] },
  'walls':          { cat: 'Painting',     sections: ['Walls'] },
  'ceilings':       { cat: 'Painting',     sections: ['Ceilings'] },
  'ext-paint':      { cat: 'Painting',     sections: ['Exterior'] },
  'pnt-specialty':  { cat: 'Painting',     sections: ['Specialty'] },
  // Trim & Doors
  'baseboards':     { cat: 'Trim & Doors', sections: ['Baseboards'] },
  'casings':        { cat: 'Trim & Doors', sections: ['Door Casings'] },
  'crown':          { cat: 'Trim & Doors', sections: ['Crown Moulding'] },
  'int-doors':      { cat: 'Trim & Doors', sections: ['Interior Doors'] },
  'hardware':       { cat: 'Trim & Doors', sections: ['Door Hardware'] },
  'ext-doors':      { cat: 'Trim & Doors', sections: ['Exterior Doors'] },
  // Accent Walls
  'acc-painted':    { cat: 'Accent Walls', sections: ['Painted'] },
  'wallpaper':      { cat: 'Accent Walls', sections: ['Wallpaper'] },
  'wood-slat':      { cat: 'Accent Walls', sections: ['Wood & Slat'] },
  'acc-tile':       { cat: 'Accent Walls', sections: ['Tile & Stone'] },
  'acc-specialty':  { cat: 'Accent Walls', sections: ['Specialty'] },
};

// Tree structure for the left nav — ordered as displayed
export interface NavCatNode {
  id: string;           // key in NAV_CAT_MAP
  label: string;        // display label
  subcategories: Array<{ id: string; label: string }>;
}

export const NAV_TREE: NavCatNode[] = [
  {
    id: 'general',
    label: 'General',
    subcategories: [
      { id: 'site-prep',  label: 'Site Preparation' },
      { id: 'cleanup',    label: 'Cleanup & Waste' },
      { id: 'repairs',    label: 'Repairs & Prep' },
      { id: 'admin',      label: 'Travel & Admin' },
    ],
  },
  {
    id: 'flooring',
    label: 'Flooring',
    subcategories: [
      { id: 'subfloor',    label: 'Subfloor Prep' },
      { id: 'demo',        label: 'Demo & Removal' },
      { id: 'hardwood',    label: 'Hardwood' },
      { id: 'lvp',         label: 'LVP & LVT' },
      { id: 'laminate',    label: 'Laminate' },
      { id: 'carpet',      label: 'Carpet' },
      { id: 'tile',        label: 'Tile' },
      { id: 'transitions', label: 'Transitions & Trim' },
      { id: 'stairs',      label: 'Stairs' },
    ],
  },
  {
    id: 'painting',
    label: 'Painting',
    subcategories: [
      { id: 'surface-prep',  label: 'Surface Prep' },
      { id: 'walls',         label: 'Walls' },
      { id: 'ceilings',      label: 'Ceilings' },
      { id: 'ext-paint',     label: 'Exterior' },
      { id: 'pnt-specialty', label: 'Specialty' },
    ],
  },
  {
    id: 'trim-doors',
    label: 'Trim & Doors',
    subcategories: [
      { id: 'baseboards', label: 'Baseboards' },
      { id: 'casings',    label: 'Door Casings' },
      { id: 'crown',      label: 'Crown Moulding' },
      { id: 'int-doors',  label: 'Interior Doors' },
      { id: 'hardware',   label: 'Door Hardware' },
      { id: 'ext-doors',  label: 'Exterior Doors' },
    ],
  },
  {
    id: 'accent-walls',
    label: 'Accent Walls',
    subcategories: [
      { id: 'acc-painted',   label: 'Painted' },
      { id: 'wallpaper',     label: 'Wallpaper' },
      { id: 'wood-slat',     label: 'Wood & Slat' },
      { id: 'acc-tile',      label: 'Tile & Stone' },
      { id: 'acc-specialty', label: 'Specialty' },
    ],
  },
];
