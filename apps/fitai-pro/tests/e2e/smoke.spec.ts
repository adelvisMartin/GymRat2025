import { expect, test } from '@playwright/test';

test('setup → navigate → generate routine → start workout → register set → persist after lock', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('CONFIGURACIÓN INICIAL')).toBeVisible();

  await page.getByLabel('Nombre').fill('QA FitAI');
  await page.getByLabel('Objetivo').selectOption('hypertrophy');
  await page.getByLabel('PIN local').fill('2468');
  await page.getByRole('button', { name: 'Crear FitAI Pro' }).click();

  await expect(page.getByText(/Tu objetivo es hipertrofia/i)).toBeVisible();
  await page.getByRole('button', { name: 'Entreno' }).click();
  await page.getByRole('button', { name: 'Generar rutina' }).click();

  const firstRoutine = page.getByRole('button', { name: /^Iniciar / }).first();
  await expect(firstRoutine).toBeVisible();
  await firstRoutine.click();

  await expect(page.getByText('ENTRENAMIENTO ACTIVO')).toBeVisible();
  const registerButtons = page.getByRole('button', { name: 'Registrar serie' });
  await expect(registerButtons.first()).toBeVisible();
  await registerButtons.first().click();
  await expect(page.getByText('1 series registradas')).toBeVisible();

  await page.getByRole('button', { name: 'Finalizar y guardar entrenamiento' }).click();
  await expect(page.getByText(/Entrenamiento guardado/)).toBeVisible();

  await page.getByRole('button', { name: 'Bloquear' }).click();
  await expect(page.getByText('Desbloquear FitAI Pro')).toBeVisible();
  await page.getByLabel('PIN').fill('2468');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText(/Tu objetivo es hipertrofia/i)).toBeVisible();

  await page.getByRole('button', { name: /^↗ Progreso$/ }).click();
  await expect(page.getByText('Volumen por sesión')).toBeVisible();
});
