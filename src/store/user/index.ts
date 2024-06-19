import { create } from 'zustand'
import { StoreState } from './types'

const useUserStore = create<StoreState>()((set) => ({
    user: {
        name: '',
        email: '',
        locale: 'en',
        tier: 'FREE'
    },
    loggedIn: false,

    login: (user) => {
        set((state) => {
            return {
                ...state,
                user: user,
                loggedIn: true
            }
        })
    },

    logout: () => {
        set((state) => {
            return {
                ...state,
                user: {
                    name: '',
                    email: '',
                    locale: 'en',
                    tier: 'FREE'
                },
                loggedIn: false
            }
        })
    },

    setTier: (tier) => {
        set((state) => {
            return {
                ...state,
                user: {
                    ...state.user,
                    tier: tier
                }
            }
        })
    }
}))

export default useUserStore