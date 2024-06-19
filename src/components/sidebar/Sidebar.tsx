import {
    Box,
    Flex,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Button,
    DarkMode,
    Avatar,
} from "@chakra-ui/react"
import { useEffect, useMemo } from "react"
import { getAllProjects } from "../../functions/project"
import useProjectStore from "../../store/project"
import { Project } from "../../store/project/types"
import { formatDate, formatName } from "../../util/misc"
import useUserStore from "../../store/user"
import { FiLogOut } from "react-icons/fi"
import { RiSparklingFill } from "react-icons/ri"
import useUiStore from "../../store/ui"

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
    const user = useUserStore(state => state.user)
    const logout = useUserStore(state => state.logout)
    const openPaymentDrawer = useUiStore(state => state.openPaymentDrawer)

    useEffect(() => {
        getAllProjects().then((res) => {
            setProjects(res)
        })
    }, [])

    function handleBuyNow() {
        openPaymentDrawer('USER_INITIATED')
    }

    console.log("projects", projects)

    const recentProjects = useMemo(
        () =>
            Object.values(projects).sort((a, b) => b.created_at - a.created_at),
        [projects]
    )

    const tier = user.tier
    // const tier = 'FREE'

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
            {tier === 'FREE' && (
                <Flex
                    px='16px'
                    alignItems='center'
                >
                    <DarkMode>
                        <Button
                            borderRadius='3px'
                            variant='ghost'
                            leftIcon={<RiSparklingFill size='24px' color='#9F7AEA' />}
                            py='28px'
                            mb='8px'
                            colorScheme='purple'
                            onClick={handleBuyNow}
                        >
                            <Flex
                                direction='column'
                                ml='8px'
                            >
                                <Flex
                                    // color='#989899'
                                    color='purple.400'
                                    fontWeight='600'
                                    fontSize='16px'
                                >
                                    Buy full version
                                </Flex>
                                <Flex
                                    fontSize='12px'
                                    color='purple.200'
                                    mt='4px'
                                >
                                    Pay once, own forever.
                                </Flex>
                            </Flex>
                        </Button>
                    </DarkMode>
                </Flex>
            )}
            <Flex
                // bg='tomato'
                // py='16px'
                mb='16px'

                px='16px'
                justifyContent='center'
            >
                <DarkMode>
                    <Menu
                        gutter={8}
                        matchWidth
                    >
                        <MenuButton
                            as={Button}
                            borderRadius='3px'
                            width='100%'
                            variant='ghost'
                            py='32px'
                            px='8px'
                            margin={0}
                        >
                            <Flex
                                alignItems='center'
                            >
                                <Avatar 
                                    name={user.name} 
                                    width='40px'
                                    height='40px'
                                    bg='#989899'
                                    // bg='purple.500' 
                                    // color='white'
                                />
                                <Flex
                                    direction='column'
                                    ml='16px'
                                >
                                    <Flex
                                        color='#989899'
                                    >
                                        {formatName(user.name)}
                                    </Flex>
                                    <Flex
                                        fontSize='14px'
                                        mt='4px'
                                        // color={tier === 'FREE' ? '' : '#989899'}
                                        color='#989899'
                                        // opacity={tier === 'FREE' ? undefined : '0.5'}
                                    >
                                        {tier === 'FREE' ? 'Free trial' : 'Premium'}
                                    </Flex>
                                </Flex>
                            </Flex>
                        </MenuButton>
                        <MenuList
                            bg='#1c1c1e'
                            fontSize='16px'
                            py='0'
                            borderRadius='3px'
                            border='none'
                            maxWidth='10px'
                            margin='0'
                            minWidth='full'
                        >
                            <MenuItem
                                onClick={logout}
                                _hover={{
                                    bg: 'rgba(255, 255, 255, 0.05)'
                                }}
                                bg='#1c1c1e'
                                icon={<FiLogOut size='20px' />}
                                color='#989899'
                                py='12px'
                            >
                                Logout
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </DarkMode>
            </Flex>
        </Flex>
    )
}

export default Sidebar
