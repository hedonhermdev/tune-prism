export type UserTier = 'FREE' | 'FULL'

export type User = {
    name: string
    locale: string
    email: string
    tier: UserTier
}

export interface StoreState {
    loggedIn: boolean
    user: User
    login: (user: User) => void,
    logout: () => void,
    setTier: (tier: UserTier) => void
}