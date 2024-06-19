import { create } from 'zustand'
import { Project, StoreState } from './types'

const useProjectStore = create<StoreState>()((set) => ({
    projects: {},
    selectedProjectId: '',

    setProjects: (projects) => {
        set((state) => {
            const projMap: Record<string, Project> = {}
            for (const proj of projects) {
                projMap[proj._id] = proj
            }

            const latestProjectId = projects.reduce((max, curr) => {
                return max.created_at > curr.created_at ? max : curr
            })._id

            return {
                ...state,
                selectedProjectId: latestProjectId,
                projects: projMap
            }
        })
    },
    addProject: (project) => {
        set((state) => {
            const newProjects = {...state.projects}
            newProjects[project._id] = project
            return {
                ...state,
                selectedProjectId: project._id,
                projects: newProjects
            }
        })
    },
    deleteProject: (id) => {
        set((state) => {
            const newProjects = {...state.projects}
            delete newProjects[id]
            return {
                ...state,
                projects: newProjects
            }
        })
    },
    selectProject: (id) => {
        set((state) => {
            if (!state.projects[id]) {
                console.log('Project does not exist, what the fuck happened?')
                return state
            }

            return {
                ...state,
                selectedProjectId: id
            }
        })
    },
    addStems: (id, stems) => {
        set((state) => {
            if (!state.projects[id]) {
                console.log('project does not exist, what the fuck happened?')
                return state
            }

            const newProjects = { ...state.projects }
            const newProject = { ...newProjects[id] }
            newProject.stem_paths = stems
            newProjects[id] = newProject
            
            return {
                ...state,
                projects: newProjects
            }
        })
    }
}))

export default useProjectStore