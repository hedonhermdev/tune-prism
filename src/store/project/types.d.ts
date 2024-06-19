export type Project = {
    _id: string
    base_dir: string
    created_at: number
    name: string
    stem_paths: string[]
}

export interface StoreState {
    projects: Record<string, Project>,
    selectedProjectId: string,
    addProject: (project: Project) => void,
    setProjects: (projects: Project[]) => void,
    deleteProject: (projectId: string) => void,
    selectProject: (projectId: string) => void,
    addStems: (projectId: string, stems: string[]) => void
}