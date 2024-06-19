import { create } from 'zustand'
import { PaymentDrawerIntent, StoreState } from './types'

const useUiStore = create<StoreState>()((set) => ({
    paymentDrawerOpen: false,
    paymentDrawerIntent: undefined,

    openPaymentDrawer: (intent: PaymentDrawerIntent) => {
        set((state) => {
            return {
                ...state,
                paymentDrawerIntent: intent,
                paymentDrawerOpen: true
            }
        })
    },

    closePaymentDrawer: () => {
        set((state) => {
            return {
                ...state,
                paymentDrawerOpen: false
            }
        })
    }
}))

export default useUiStore