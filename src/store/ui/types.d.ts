type PaymentDrawerIntent = 'TRIAL_EXPIRED' | 'USER_INITIATED'

export interface StoreState {
    paymentDrawerOpen: boolean
    paymentDrawerIntent: PaymentDrawerIntent | undefined
    openPaymentDrawer: (intent: PaymentDrawerIntent) => void
    closePaymentDrawer: () => void
}