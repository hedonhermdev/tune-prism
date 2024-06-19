import { Flex, Input } from "@chakra-ui/react"
import { useState } from "react"

const SongSearch = () => {
    const [input, setInput] = useState<string>('')

    return (
        <Flex
            width='100%'
            position='relative'
        >
            <Input
                variant='filled'
                width='100%'
                borderRadius='3px'
                placeholder="Search by name or paste a link."
                value={input}
                onChange={e => setInput(e.target.value)}
            />
        </Flex>
    )
}

export default SongSearch