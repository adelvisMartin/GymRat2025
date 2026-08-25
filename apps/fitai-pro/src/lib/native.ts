import { Capacitor } from '@capacitor/core';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { CapacitorPedometer } from '@capgo/capacitor-pedometer';

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function scanProductBarcode(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    const { supported } = await BarcodeScanner.isSupported();
    if (!supported) throw new Error('El escáner de códigos no está disponible en este dispositivo.');

    if (Capacitor.getPlatform() === 'android') {
      const module = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
      if (!module.available) {
        await BarcodeScanner.installGoogleBarcodeScannerModule();
        throw new Error('Se está instalando el módulo de escaneo. Intenta nuevamente en unos segundos.');
      }
    }

    const { barcodes } = await BarcodeScanner.scan({
      formats: [
        BarcodeFormat.Ean13,
        BarcodeFormat.Ean8,
        BarcodeFormat.UpcA,
        BarcodeFormat.UpcE,
        BarcodeFormat.Code128,
      ],
      autoZoom: true,
    });
    const value = barcodes[0]?.rawValue?.trim();
    if (!value) throw new Error('No se detectó ningún código de producto.');
    return value;
  }

  const BarcodeDetectorCtor = (globalThis as typeof globalThis & {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string }>>;
    };
  }).BarcodeDetector;
  if (!BarcodeDetectorCtor) {
    throw new Error('Este navegador no soporta escaneo directo. Usa la entrada manual del código.');
  }
  throw new Error('En la PWA usa el campo manual o instala la app Android para escaneo con cámara.');
}

export async function startStepTracking(onSteps: (steps: number) => void): Promise<() => Promise<void>> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('El contador automático de pasos requiere la app Android instalada.');
  }
  const availability = await CapacitorPedometer.isAvailable();
  if (!availability.stepCounting) throw new Error('El sensor de pasos no está disponible.');

  let permission = await CapacitorPedometer.checkPermissions();
  if (permission.activityRecognition !== 'granted') {
    permission = await CapacitorPedometer.requestPermissions();
  }
  if (permission.activityRecognition !== 'granted') {
    throw new Error('Se necesita permiso de actividad física para contar pasos.');
  }

  const listener = await CapacitorPedometer.addListener('measurement', (measurement) => {
    const value = Math.max(0, Math.round(measurement.numberOfSteps));
    onSteps(value);
  });
  await CapacitorPedometer.startMeasurementUpdates();

  return async () => {
    await listener.remove();
    await CapacitorPedometer.stopMeasurementUpdates();
  };
}
