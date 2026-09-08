import { Redirect } from 'expo-router'

/**
 * Rota "fantasma" só pra reservar o slot central da tab bar. O botão
 * (FabTabButton) intercepta o toque e abre o sheet, então esta tela nunca
 * aparece; se por algum motivo for navegada, volta pro início.
 */
export default function New() {
  return <Redirect href="/" />
}
