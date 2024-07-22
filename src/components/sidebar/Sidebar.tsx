import {
    Box,
    Flex,
} from "@chakra-ui/react"
import { useEffect, useMemo } from "react"
import { getAllProjects } from "../../functions/project"
import useProjectStore from "../../store/project"
import { Project } from "../../store/project/types"
import { formatDate } from "../../util/misc"

type ProjectItemProps = {
    project: Project
    active: boolean
    onClick: () => void
}

const ProjectItem = ({
    project,
    active = false,
    onClick,
}: ProjectItemProps) => {
    return (
        <Flex
            width="100%"
            direction="column"
            mb="4px"
            bg={active ? "rgba(255, 255, 255, 0.1)" : undefined}
            borderRadius="3px"
            padding="4px 8px"
            cursor="pointer"
            _hover={{
                bg: "rgba(255, 255, 255, 0.08)",
            }}
            onClick={onClick}
            // bg='#fafafa'
        >
            <Box
                fontSize="14px"
                overflow="hidden"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                mb="4px"
                color="#8D8D92"

                // color='#DCDCDD'
            >
                {project.name}
            </Box>
            <Box fontSize="12px">{formatDate(project.created_at)}</Box>
        </Flex>
    )
}

const Sidebar = () => {
    const setProjects = useProjectStore((state) => state.setProjects)
    const selectProject = useProjectStore((state) => state.selectProject)
    const projects = useProjectStore((state) => state.projects)
    const selectedProjectId = useProjectStore(
        (state) => state.selectedProjectId
    )

    useEffect(() => {
        getAllProjects().then((res) => {
            setProjects(res)
        })
    }, [])

    const recentProjects = useMemo(
        () =>
            Object.values(projects).sort((a, b) => b.created_at - a.created_at),
        [projects]
    )

    return (
        <Flex
            // width='300px'
            maxWidth="220px"
            minWidth="220px"
            direction="column"
            bg="#000000"
            // bg='#1C1C1E'

            // pt='8px'
            // px='16px'
            fontSize="32px"
            fontWeight="500"
            color="#5A5A5E"
        >
            <Box pt="8px" px="24px">
                History
            </Box>
            <Flex
                width="100%"
                position="relative"
                overflow="auto"
                flex="1 1 auto"
            >
                <Flex
                    mt="20px"
                    direction="column"
                    px="16px"
                    position="absolute"
                >
                    {recentProjects.map((project) => (
                        <ProjectItem
                            key={project._id}
                            project={project}
                            active={project._id === selectedProjectId}
                            onClick={() => selectProject(project._id)}
                        />
                    ))}
                </Flex>
            </Flex>
        </Flex>
    )
}

export default Sidebar
