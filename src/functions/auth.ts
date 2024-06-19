import { invoke } from "@tauri-apps/api/tauri"
import { User } from "../store/user/types"

export async function authenticate() {
    const result: User = await invoke("authenticate", {})
    return result
}

export async function getUser() {
    const result: User = await invoke("get_user", {})
    return result
}