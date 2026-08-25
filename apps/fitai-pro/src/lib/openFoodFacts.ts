import type { OpenFoodFactsProduct } from './types';

const BARCODE_RE = /^[0-9]{8,14}$/;
const TIMEOUT_MS = 8_000;

export async function lookupFood(barcode: string): Promise<OpenFoodFactsProduct> {
  const normalized = barcode.replace(/\s+/g, '');
  if (!BARCODE_RE.test(normalized)) throw new Error('El código debe contener entre 8 y 14 dígitos.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(normalized)}.json?fields=code,product_name,brands,serving_size,nutriments`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      },
    );
    if (!response.ok) throw new Error(`Open Food Facts respondió ${response.status}.`);
    const body: unknown = await response.json();
    if (!isRecord(body) || body.status !== 1 || !isRecord(body.product)) {
      throw new Error('No encontramos ese producto en Open Food Facts.');
    }
    const product = body.product;
    const nutriments = isRecord(product.nutriments) ? product.nutriments : {};
    return {
      barcode: normalized,
      name: text(product.product_name) || 'Producto sin nombre',
      brand: text(product.brands) || undefined,
      servingSize: text(product.serving_size) || undefined,
      nutrition: {
        calories: number(nutriments['energy-kcal_100g']),
        proteinG: number(nutriments.proteins_100g),
        carbsG: number(nutriments.carbohydrates_100g),
        fatG: number(nutriments.fat_100g),
      },
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La consulta de alimentos tardó demasiado. Revisa tu conexión.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 180) : '';
}

function number(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 10) / 10) : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
