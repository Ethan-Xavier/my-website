// --- Utility Functions ---

// Shortcut for document.getElementById
const $ = id => document.getElementById(id);

// Generate unique ID for tables/orders
function uid(){ return "ID-" + Math.random().toString(36).slice(2,9); }

// Format price as string with $ (or pass string directly)
function formatPrice(p){ return typeof p==='string'?p:`$${p}`; }

/* Notes:
- All POS items use uid() to generate IDs.
- formatPrice is used for display only; numeric price calculations rely on raw numbers.
- $() is used throughout pos.js for element selection.
*/
