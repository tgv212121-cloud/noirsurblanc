import { NextResponse } from 'next/server'

// Page de retour apres succes de la connexion Unipile.
// Redirige juste vers le portail/settings avec un flag de succes.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  // Tu peux personnaliser la redirection. Ici on pousse vers /settings?unipile=connected
  return NextResponse.redirect(new URL(`/settings?unipile=connected${userId ? `&user=${userId}` : ''}`, req.url))
}
