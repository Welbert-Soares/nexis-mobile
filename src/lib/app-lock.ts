import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'

const KEY = 'app-lock'

// Flag "bloqueio ligado" persistida no SecureStore (mesmo storage do cookie de
// sessão). Erro de storage → trata como desligado.
export async function isAppLockEnabled(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(KEY)) === '1'
  } catch {
    return false
  }
}

export async function setAppLockEnabled(v: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, v ? '1' : '0')
  } catch {
    /* noop */
  }
}

// Só dá pra ligar o bloqueio se o device tem hardware biométrico E algo
// enrolado (Face ID / Touch ID / PIN do sistema).
export async function canUseAppLock(): Promise<boolean> {
  try {
    const [hw, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ])
    return hw && enrolled
  } catch {
    return false
  }
}

// Pede a autenticação nativa. `disableDeviceFallback` fica false — quem tem só
// passcode (sem biometria) ainda consegue.
export async function runAuth(): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear o Nexis',
      fallbackLabel: 'Usar senha do celular',
    })
    return r.success
  } catch {
    return false
  }
}
