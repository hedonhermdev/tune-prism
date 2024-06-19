import { Flex, Grid, GridItem } from "@chakra-ui/react"

const TrackDetailItem = (props: { heading: string; children: any }) => {
    return (
        <GridItem>
            <Flex direction="column">
                <Flex
                    fontSize='14px'
                    fontWeight='700'
                >
                    {props.heading}
                </Flex>
                <Flex
                    fontSize='18px'
                >
                    {props.children}
                </Flex>
            </Flex>
        </GridItem>
    )
}

const TrackDetails = () => {
    return (
        <Flex 
            direction="column"
            // bg="tomato" 
            width="100%"
        >
            <Flex
                mb="8px"
                fontSize="18px"
                fontWeight="500"
                color="#989899"
            >
                Details
            </Flex>
            <Grid
                // bg='tomato'
                templateColumns='repeat(5, minmax(0, 1fr))'
            >
                <TrackDetailItem heading="BPM">172</TrackDetailItem>
                <TrackDetailItem heading="Key">C major</TrackDetailItem>
            </Grid>
        </Flex>
    )
}

export default TrackDetails
