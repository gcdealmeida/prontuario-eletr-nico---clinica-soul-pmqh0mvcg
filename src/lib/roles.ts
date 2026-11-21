/**
 * Helpers de perfil (role) do usuário da clínica SOUL.
 *
 * O backend (migration 0060) grava o campo `role` em users com os valores:
 *   - adm           → Administrador (acesso total)
 *   - admin         → legado gravado pelos hooks (tratar como ADM)
 *   - secretaria    → Secretária (acesso total)
 *   - profissional  → Profissional (acesso limitado)
 *   - professional  → legado gravado pelos hooks (tratar como Profissional)
 *
 * TODA comparação de role no frontend deve passar por estes helpers.
 */

export type AppRole = 'adm' | 'admin' | 'secretaria' | 'profissional' | 'professional'

export function normalizeRole(role?: string | null): AppRole | null {
  const r = (role || '').trim().toLowerCase()
  if (
    r === 'adm' ||
    r === 'admin' ||
    r === 'secretaria' ||
    r === 'profissional' ||
    r === 'professional'
  ) {
    return r as AppRole
  }
  return null
}

/** Rotula o perfil de forma legível. */
export function roleLabel(role?: string | null): string {
  const r = normalizeRole(role)
  switch (r) {
    case 'adm':
    case 'admin':
      return 'Administrador'
    case 'secretaria':
      return 'Secretária'
    case 'profissional':
    case 'professional':
      return 'Profissional'
    default:
      return 'Profissional'
  }
}

/** Perfis com acesso total: ADM (adm/admin legado) e Secretária. */
export function isGestorRole(role?: string | null): boolean {
  const r = normalizeRole(role)
  return r === 'adm' || r === 'admin' || r === 'secretaria'
}

/** É Secretária? */
export function isSecretariaRole(role?: string | null): boolean {
  return normalizeRole(role) === 'secretaria'
}

/** É Profissional (acesso limitado)? Legados professional contam como profissional. */
export function isProfissionalRole(role?: string | null): boolean {
  const r = normalizeRole(role)
  return r === 'profissional' || r === 'professional'
}
