import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

import type { SheetRef } from '#/components/ui/sheet'
import type { Transaction } from '#/schemas/transaction'
import { TransactionSheet } from '#/components/transactions/transaction-sheet'

type Ctx = {
  openNew: () => void
  openEdit: (tx: Transaction) => void
}

const TransactionSheetContext = createContext<Ctx | null>(null)

/**
 * Mantém o sheet de transação montado uma vez e expõe `openNew` / `openEdit`.
 * O FAB e (futuramente) atalhos do Dashboard disparam por aqui, de qualquer aba.
 */
export function TransactionSheetProvider({ children }: { children: ReactNode }) {
  const sheetRef = useRef<SheetRef>(null)
  const [editing, setEditing] = useState<Transaction | undefined>()

  const openNew = useCallback(() => {
    setEditing(undefined)
    sheetRef.current?.present()
  }, [])

  const openEdit = useCallback((tx: Transaction) => {
    // objeto novo a cada abertura → o useEffect([tx]) do sheet repopula mesmo
    // reabrindo a mesma transação sem refetch no meio.
    setEditing({ ...tx })
    sheetRef.current?.present()
  }, [])

  const value = useMemo(() => ({ openNew, openEdit }), [openNew, openEdit])

  return (
    <TransactionSheetContext.Provider value={value}>
      {children}
      <TransactionSheet ref={sheetRef} tx={editing} onClose={() => setEditing(undefined)} />
    </TransactionSheetContext.Provider>
  )
}

export function useTransactionSheet(): Ctx {
  const ctx = useContext(TransactionSheetContext)
  if (!ctx) throw new Error('useTransactionSheet fora do TransactionSheetProvider')
  return ctx
}
