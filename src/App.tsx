import { Flex } from "@chakra-ui/react"
import Project from "./components/project/project"
import Sidebar from "./components/sidebar/Sidebar"
import {
    BrowserRouter,
    Route,
    Routes,
} from "react-router-dom"

const MainScreen = () => {
    return (
        <>
            <Sidebar />
            <Project />
        </>
    )
}

function App() {
    return (
        <Flex width="100vw" height="100vh" bg="#1C1C1E">
            <Flex
                width="100vw"
                height="100vh"
                color="#fafafa"
                background={`linear-gradient(0deg, rgba(0,0,0, 0.8), rgba(0,0,0, 0.8)),url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}
            >
                <BrowserRouter>
                <Routes>
                    <Route path="/" element={<MainScreen />} />
                </Routes>
            </BrowserRouter>
            </Flex>
        </Flex>
    )
}

export default App
