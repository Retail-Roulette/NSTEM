/**
 * Product data - parses target.txt and walmart.txt from public folder
 */

function parseProductFile(text) {
  const lines = text.split('\n');
  const categories = {};
  let currentCategory = 'All';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const prevEmpty = i === 0 || lines[i - 1].trim() === '';
    const nextEmpty = i === lines.length - 1 || lines[i + 1].trim() === '';

    if (!trimmed) continue;

    // Category: non-empty line surrounded by blank lines (above and below)
    if (prevEmpty && nextEmpty) {
      currentCategory = trimmed;
      if (!categories[currentCategory]) {
        categories[currentCategory] = [];
      }
    } else {
      // Product: belongs to current category
      if (!categories[currentCategory]) categories[currentCategory] = [];
      categories[currentCategory].push(trimmed);
    }
  }

  return categories;
}

let targetProducts = null;
let walmartProducts = null;

export async function loadProducts() {
  if (targetProducts && walmartProducts) {
    return { target: targetProducts, walmart: walmartProducts };
  }

  try {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') + '/';
    const [targetRes, walmartRes] = await Promise.all([
      fetch(`${base}target.txt`),
      fetch(`${base}walmart.txt`)
    ]);

    if (targetRes.ok && walmartRes.ok) {
      const [targetText, walmartText] = await Promise.all([
        targetRes.text(),
        walmartRes.text()
      ]);
      targetProducts = { store: 'target', categories: parseProductFile(targetText) };
      walmartProducts = { store: 'walmart', categories: parseProductFile(walmartText) };
    }
  } catch (e) {
    console.warn('Could not load product files:', e);
  }

  if (!targetProducts) {
    targetProducts = { store: 'target', categories: { 'Home': ['Threshold 300 Thread Count Ultra Soft Sheet Set, Queen, White'] } };
  }
  if (!walmartProducts) {
    walmartProducts = { store: 'walmart', categories: { 'Home': ['AmazonBasics Lightweight Microfiber Sheet Set, Queen, White'] } };
  }

  return { target: targetProducts, walmart: walmartProducts };
}

export function getAllProducts(storeData) {
  return Object.values(storeData.categories || {}).flat();
}

export function getProductsByCategories(storeData, selectedCategories) {
  const all = storeData.categories || {};
  if (!selectedCategories || selectedCategories.includes('All Categories')) {
    return Object.values(all).flat();
  }
  return selectedCategories.flatMap(cat => all[cat] || []);
}

export function getRandomProducts(productList, count) {
  const shuffled = [...productList].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, productList.length));
}

export function getCategories(storeData) {
  return Object.keys(storeData.categories || {});
}
