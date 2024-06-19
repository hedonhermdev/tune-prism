import { invoke } from "@tauri-apps/api/tauri"

type StemSplitSuccessResult = {
    status: 'Success',
    stems: string[]
}

type StemSplitErrorResult = {
    status: 'Error',
    message: string
}

export type StemSplitResult = StemSplitSuccessResult | StemSplitErrorResult

export async function splitStems(projectId: string): Promise<string[]> {
    const result: StemSplitResult = await invoke('split_stems', {
        projectId: projectId
    })

    if (result.status === 'Success') {
        return result.stems
    } else{
        throw new Error(result.message)
    }
}