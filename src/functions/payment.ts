import { invoke } from "@tauri-apps/api/tauri"

type PaymentResult = 'Success' | 'Cancelled' | 'Timeout'

export async function getPayment(): Promise<PaymentResult> {
    const result = await invoke('init_payment')
    return result as PaymentResult
}

// export function pollPaymentStatus(pollInterval: number = 3000, timeout: number = 5*60*1000) {
//     // return new Promise((resolve, reject) => {
//     //     const startTime = Date.now()
//     //     const timeout = setInterval(() => {
//     //         const userDetails = await getUser

//     //         if (Date.now() - startTime > timeout) {
//     //             clearTimeout(timeout)
//     //             reject(new Error('TIMEOUT'))
//     //             return
//     //         }
//     //     }, pollInterval)
//     // })
// }