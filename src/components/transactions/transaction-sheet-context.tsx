import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

import type { SheetRef } from '#/components/ui/sheet'
import type { Transaction } from '#/schemas/transaction'
import { useHaptic } from '#/lib/haptics'
import { TransactionSheet } from '#/components/transactions/transaction-sheet'

type YearMonth = { year: number; month: number }

type Ctx = {
  openNew: () => void
  openEdit: (tx: Transaction) => void
  /** Mês (1..12) da última transação criada — a tela de Transações usa pra
   *  pular pro mês certo e não "perder" o lançamento recém-criado. */
  createdMonth: YearMonth | null
  consumeCreatedMonth: () => void
}

const TransactionSheetContext = createContext<Ctx | null>(null)

/**
 * Mantém o sheet de transação montado uma vez e expõe `openNew` / `openEdit`.
 * O FAB e (futuramente) atalhos do Dashboard disparam por aqui, de qualquer aba.
 */
export function TransactionSheetProvider({ children }: { children: ReactNode }) {
  const sheetRef = useRef<SheetRef>(null)
  const haptic = useHaptic()
  const [editing, setEditing] = useState<Transaction | undefined>()
  const [createdMonth, setCreatedMonth] = useState<YearMonth | null>(null)

  const openNew = useCallback(() => {
    haptic.tap()
    setEditing(undefined)
    sheetRef.current?.present()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openEdit = useCallback((tx: Transaction) => {
    haptic.tap()
    // objeto novo a cada abertura → o useEffect([tx]) do sheet repopula mesmo
    // reabrindo a mesma transação sem refetch no meio.
    setEditing({ ...tx })
    sheetRef.current?.present()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const consumeCreatedMonth = useCallback(() => setCreatedMonth(null), [])

  const value = useMemo(
    () => ({ openNew, openEdit, createdMonth, consumeCreatedMonth }),
    [openNew, openEdit, createdMonth, consumeCreatedMonth],
  )

  return (
    <TransactionSheetContext.Provider value={value}>
      {children}
      <TransactionSheet
        ref={sheetRef}
        tx={editing}
        onClose={() => setEditing(undefined)}
        onCreated={(date) => setCreatedMonth({ year: date.getFullYear(), month: date.getMonth() + 1 })}
      />
    </TransactionSheetContext.Provider>
  )
}

export function useTransactionSheet(): Ctx {
  const ctx = useContext(TransactionSheetContext)
  if (!ctx) throw new Error('useTransactionSheet fora do TransactionSheetProvider')
  return ctx
}
