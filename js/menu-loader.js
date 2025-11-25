// menu-loader.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * fetchMenu tries several sensible locations:
 * 1) doc posMenu/menu -> expects { Drinks: [...], Food: [...] }
 * 2) doc menu/menu (fallback)
 *
 * returns normalized object:
 * { Drinks: [{name,price}], Food: [{name,price}] }
 */
export async function loadMenu() {
  const statusEl = document.getElementById('menuStatus');
  statusEl.textContent = 'Loading menu from Firebase...';

  async function fetchDoc(pathCollection, pathDoc) {
    try {
      const d = await getDoc(doc(db, pathCollection, pathDoc));
      if (d.exists()) return d.data();
    } catch (e) {
      console.error('fetchDoc error', pathCollection, pathDoc, e);
    }
    return null;
  }

  // try posMenu/menu
  let data = await fetchDoc('posMenu', 'menu');
  if (!data) data = await fetchDoc('menu', 'menu');

  if (!data) {
    statusEl.textContent = 'No menu found in Firestore.';
    return { Drinks: [], Food: [] };
  }

  // If data already has Drinks/Food arrays (upload script format), use directly
  if (data.Drinks && data.Food) {
    statusEl.textContent = 'Menu loaded (posMenu/menu).';
    return { Drinks: data.Drinks, Food: data.Food };
  }

  // If data stored as {drinks: {name:price,...}, foods: {...}} or menu/drinks docs,
  // try to normalize both cases:
  const norm = { Drinks: [], Food: [] };

  // if data.drinks (object map)
  if (data.drinks && typeof data.drinks === 'object') {
    for (const [name, price] of Object.entries(data.drinks)) {
      norm.Drinks.push({ name, price });
    }
  }

  if (data.foods && typeof data.foods === 'object') {
    for (const [name, price] of Object.entries(data.foods)) {
      norm.Food.push({ name, price });
    }
  }

  // if nothing normalized, attempt to look for top-level keys that look like arrays
  if (norm.Drinks.length === 0 && Array.isArray(data.Drinks)) norm.Drinks = data.Drinks;
  if (norm.Food.length === 0 && Array.isArray(data.Food)) norm.Food = data.Food;

  statusEl.textContent = 'Menu loaded (normalized).';
  return norm;
}

