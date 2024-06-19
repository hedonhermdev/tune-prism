import { 
    Flex, 
    Box, 
    IconButton, 
    DarkMode, 
    Divider, 
    Button, 
    Grid,
    GridItem 
} from "@chakra-ui/react"
import { FiPlay, FiPause } from "react-icons/fi"
import { FaAssistiveListeningSystems } from "react-icons/fa";
import { useEffect, useState } from "react"
import { appWindow } from "@tauri-apps/api/window"
import { convertFileSrc } from "@tauri-apps/api/tauri"
import { getFileTypeFromPath, getFilenameFromPath } from "../../util/project"
import WavesurferPlayer from "@wavesurfer/react"
import TrackDetails from "./TrackDetails"
import { createProject } from "../../functions/project";
import { Project } from "../../store/project/types";
import useProjectStore from "../../store/project";
import { splitStems } from "../../functions/split";
import { startDrag } from "@crabnebula/tauri-plugin-drag";
import { resolveResource } from '@tauri-apps/api/path'

type Color = 'teal' | 'purple' | 'cyan' | 'green' | 'yellow' | 'blue' | 'blue2' | 'red'

type ColorScheme = {
    background: string
    active?: string,
    played: string
}

const ACCEPTED_FILE_TYPES: Record<string, boolean> = {
    mp3: true
}

const WAVEFORM_COLOR_SCHEMES: Record<Color, ColorScheme> = {
    teal: {
        background: '#2C7A7B', // 600
        active: '#81E6D9', // 200
        played: '#234E52' // 800
    },
    cyan: {
        background: '#00A3C4', // 600
        active: '#9DECF9', // 200
        played: '#086F83' // 800
    },
    blue: {
        background: '#2B6CB0', // 600
        active: '#90CDF4', // 200
        played: '#2A4365' //800
    },
    blue2: {
        background: '#29B6F6', // 600
        active: '#81D4FA', // 200
        played: '#01579B' // 800
    },
    
    purple: {
        background: '#6B46C1', // 600
        active: '#D6BCFA', // 200
        played: '#44337A' //800
    },
    yellow: {
        background: '#B7791F', // 600
        active: '#FAF089', // 200
        played: '#744210' //800
    },
    red: {
        background: '#C53030', // 600
        active: '#FEB2B2', // 200
        played: '#822727' //800
    },
    green: {
        background: '#2F855A',
        active: '#9AE6B4',
        played: '#22543D',
    },
}

// const COLOR_ORDER = Object.keys(WAVEFORM_COLOR_SCHEMES)
const COLOR_ORDER: Color[] = ['green', 'yellow', 'red', 'blue']

type WaveformPlayerProps = {
    path: string
    filePath?: string
    color: Color
    height?: number
    barWidth?: number
}

const WaveformPlayer = ({
    path,
    filePath,
    color,
    height = 40,
    barWidth = 3
}: WaveformPlayerProps) => {
    const [wavesurfer, setWavesurfer] = useState<any>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [iconPath, setIconPath] = useState<string>('')

    useEffect(() => {
        console.log('we in here')
        // Need to do this whole thing in a useEffect because this fucking function is async.
        // Useless re-render, smh.
        resolveResource(`resources/${color}_stem_icon.png`)
            .then(result => {
                console.log('result:', result)
                setIconPath(result)
                return
            })
            .catch(e => console.log('resource error:', e))
    }, [])

    const { background, active, played } = WAVEFORM_COLOR_SCHEMES[color]


    const onReady = (ws: any) => {
        setWavesurfer(ws)
        setIsPlaying(false)
    }

    const onPlayPause = () => {
        wavesurfer && wavesurfer.playPause()
    }

    function handleDrag() {
        console.log('drag start', filePath)
        if (!filePath) {
            return
        }

        console.log('iconPath:', iconPath)
        // startDrag({ item: [filePath], icon: '/Users/dushyant/Projects/stem-split/src-tauri/icons/128x128.png' })
        startDrag({ item: [filePath], icon: iconPath })
    }

    return (
        <Flex
            width="100%"
            padding="16px"
            bg={background}
            borderRadius="5px"
            onDragStart={handleDrag}
            draggable
        >
            <Flex
                width="50px"
                // justifyContent='center'
                alignItems="center"
            >
                <DarkMode>
                    <IconButton
                        icon={isPlaying ? <FiPause /> : <FiPlay />}
                        aria-label="play-or-pause"
                        onClick={onPlayPause}
                        size="sm"
                        // colorScheme={color}
                    />
                </DarkMode>
            </Flex>
            <Box width="100%">
                <WavesurferPlayer
                    fillParent={true}
                    height={height}
                    // width={500}
                    waveColor={active || 'white'}
                    url={path}
                    onReady={onReady}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    barWidth={barWidth}
                    progressColor={played}
                />
            </Box>
        </Flex>
    )
}

type TrackViewProps = {
    project: Project
}
const TrackView = ({
    project
}: TrackViewProps) => {
    const addStems = useProjectStore(state => state.addStems)
    const projectFilePath = `${project.base_dir}/project_data/${project._id}/main.mp3`
    const webFilePath = convertFileSrc(projectFilePath)
    const [extractStemsLoading, setExtractStemsLoading] = useState<boolean>(false)

    async function handleStemExtractClick() {
        setExtractStemsLoading(true)
        splitStems(project._id)
            .then((stems) => {
                addStems(project._id, stems)
            })
            .catch(e => console.log('Error splitting stems:', e))
            .finally(() => setExtractStemsLoading(false))
    }
    
    console.log('stem_paths', project.stem_paths)

    return (
        <Flex
            height="100%"
            width="100%"
            direction="column"
            padding="8px 24px"
            position='relative'
        >
            <Flex fontSize="32px" fontWeight={500}>
                {project.name}
            </Flex>
            <Flex
                width='100%'
                position='relative'
                overflow='auto'
                flex='1 1 auto'
            >
                <Flex
                    direction='column'
                    width='100%'
                    position='absolute'
                >
                    <Flex
                        mt='18px'
                        direction='column'
                    >
                        <Flex
                            mb='8px'
                            fontSize='22px'
                            fontWeight='500'
                            color='#989899'
                        >
                            Original track
                        </Flex>
                        <WaveformPlayer path={webFilePath} color='purple' />
                    </Flex>
                    <Flex
                        mt='22px'
                    >
                        <TrackDetails />
                    </Flex>

                    <Divider
                        mt='32px'
                        borderColor='#5A5A5E'
                    />

                    <Flex
                        mt='22px'
                        mb='8px'
                        fontSize='22px'
                        fontWeight='500'
                        color='#989899'
                    >
                        Stems
                    </Flex>

                    {project.stem_paths.length !== 0 && (
                        <Grid
                            templateColumns='repeat(2, minmax(0, 1fr))'
                            gap='16px'
                            mb='32px'
                        >
                            {project.stem_paths.map((stemPath, idx) => (
                                <GridItem>
                                    <Flex
                                        width='100%'
                                        direction='column'
                                    >
                                        <Flex
                                            mb='4px'
                                            fontSize='12px'
                                            ml='1px'
                                            fontWeight={500}
                                            color='#5A5A5E'
                                        >
                                            {getFilenameFromPath(stemPath)}
                                        </Flex>
                                        <WaveformPlayer
                                            filePath={stemPath}
                                            path={convertFileSrc(stemPath)}
                                            color={COLOR_ORDER[idx % COLOR_ORDER.length] as Color}
                                            height={30}
                                            barWidth={3}
                                        />
                                    </Flex>
                                </GridItem>
                            ))}
                        </Grid>
                    )}

                    <DarkMode>
                        <Button
                            width='200px'
                            leftIcon={<FaAssistiveListeningSystems />}
                            onClick={handleStemExtractClick}
                            isLoading={extractStemsLoading}
                        >
                            Extract stems
                        </Button>
                    </DarkMode>
                </Flex>
            </Flex>
        </Flex>
    )
}

const ProjectController = () => {
    const addProject = useProjectStore(state => state.addProject)
    const currentProject = useProjectStore(state => state.projects[state.selectedProjectId])

    // Hover control state
    const [_fileOk, setFileOk] = useState<boolean>(true)
    const [_hovering, setHovering] = useState<boolean>(false)

    useEffect(() => {
        const unlistenPromise = appWindow.onFileDropEvent((event) => {
            if (event.payload.type === "hover") {
                setHovering(true)
                const fileType = getFileTypeFromPath(event.payload.paths[0])
                if (ACCEPTED_FILE_TYPES[fileType]) {
                    setFileOk(true)
                } else {
                    setFileOk(false)
                }

                console.log("event:", event)
            } else if (event.payload.type === "drop") {
                setHovering(false)
                console.log("User dropped", event.payload.paths)
                const fileType = getFileTypeFromPath(event.payload.paths[0])
                if (ACCEPTED_FILE_TYPES[fileType]) {
                    setFileOk(true)
                    const filePath = event.payload.paths[0]

                    createProject(filePath)
                        .then(project => {
                            addProject(project)
                        })
                } else {
                    setFileOk(false)
                }
            } else {
                setHovering(false)
            }
        })

        return () => {
            unlistenPromise.then((u) => u())
        }
    }, [])

    if (!currentProject) {
        return (
            <Flex
                width='100%'
                direction='column'
                padding='8px 24px'
            >
                <Flex fontSize="32px" fontWeight={500}>
                    You have no projects.
                </Flex>
                <Flex
                    color='#989899'
                    fontSize='16px'
                    mt='8px'
                >
                    Drop any track in this window to get started.
                </Flex>
            </Flex>
        )
    }

    return (
        <TrackView
            project={currentProject}
        />
    )
}

export default ProjectController
