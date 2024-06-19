import { invoke } from "@tauri-apps/api/tauri"
import { Project } from "../store/project/types"

export async function createProject(filepath: string): Promise<Project> {
    const result: any = await invoke("create_project", {
        audioFilepath: filepath,
    })
    if (result.status === "Success") {
        return result.project as Project
    } else {
        console.log("Unable to create project:", result)
        throw new Error("Unable to create project")
    }
}

export async function getAllProjects(): Promise<Project[]> {
    const result: any = await invoke("get_all_projects", {})
    if (result.status === "Success") {
        return result.projects as Project[]
    } else {
        console.log("Unable to get projects", result)
        throw new Error("Unable to get projects.")
    }
}
