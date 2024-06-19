import {
    Button,
    Flex,
    Box,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    DarkMode,
} from "@chakra-ui/react"
import { useEffect, useState } from "react"
import useUiStore from "../../store/ui"
import { getPayment } from "../../functions/payment"
import useUserStore from "../../store/user"
import { FiCheckCircle } from "react-icons/fi"

type PaymentModalProps = {
    isOpen: boolean
    onClose: () => void
}

type DrawerState = "PROMPTED" | "WAITING" | "FAILED" | "SUCCESS" | 'TIMEOUT'

type CountdownTimerProps = {
    onTimeout: () => void
}
const CountdownTimer = (props: CountdownTimerProps) => {
    // Initial time set to 5 minutes in seconds
    const initialTime = 5 * 60
    const [timeLeft, setTimeLeft] = useState<number>(initialTime)

    useEffect(() => {
        let localTimeLeft = 5 * 60
        const interval = setInterval(() => {
            localTimeLeft -= 1
            setTimeLeft(x => x-1)
            console.log('localtimeleft', localTimeLeft)
            if (localTimeLeft <= 0) {
                props.onTimeout()
                clearInterval(interval)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [])


    const minutes = Math.floor(timeLeft / 60).toString()
    const seconds = (timeLeft % 60).toString().padStart(2, '0')

    return (
        <Flex>
            <Flex
                color='#5A5A5E'
            >
                In the next
            </Flex>
            <Flex
                fontSize="48px" width='120px'
                justifyContent='center'
            >
                {minutes}:{seconds}
            </Flex>
            <Flex
                color='#5A5A5E'
            >
                minutes
            </Flex>
        </Flex>
    )
}

const PaymentDrawer = ({ isOpen, onClose }: PaymentModalProps) => {
    const [drawerState, setDrawerState] = useState<DrawerState>('PROMPTED')
    const paymentDrawerIntent = useUiStore((state) => state.paymentDrawerIntent)
    const logout = useUserStore(state => state.logout)
    const setTier = useUserStore(state => state.setTier)

    function handleBuyClick() {
        setDrawerState("WAITING")
        getPayment()
            .then((result) => {
                console.log("init_payment result", result)
                switch (result) {
                    case 'Success': {
                        setTier('FULL')
                        return setDrawerState('SUCCESS')
                    }
                    case 'Timeout': return setDrawerState('TIMEOUT')
                    case 'Cancelled': return setDrawerState('FAILED')
                    default: return setDrawerState('FAILED')
                }
            })
            .catch(() => {
                setDrawerState('FAILED')
            })
    }

    let heading = "Uh-oh, your trial has expired."
    if (paymentDrawerIntent === "USER_INITIATED") {
        heading = "Get the full version."
    }

    let subtitle =
        "The trial version only allows for de-mixing 3 tracks. Pay one-time and buy the full version today to de-mix an\
    unlimited number of tracks, forever."

    const waitingComponent = (
        <>
            <Flex
                mb="16px"
                fontSize="2.5rem"
                width="500px"
                lineHeight="140%"
                textAlign="center"
            >
                Please complete your payment in the browser.
            </Flex>
            <Flex
                color="#c1c1c1"
                fontSize="1.2rem"
                width="500px"
                lineHeight="160%"
                minHeight="100px"
                justifyContent="center"
                alignItems="center"
            >
                <CountdownTimer onTimeout={() => setDrawerState('TIMEOUT')} />
            </Flex>
            <Flex justifyContent="center">
                <DarkMode>
                    <Button mt="32px" borderRadius="3px" width="140px" onClick={() => setDrawerState('PROMPTED')}>
                        Cancel
                    </Button>
                </DarkMode>
            </Flex>
        </>
    )

    const timeoutComponent = (
        <>
            <Flex
                mb="16px"
                fontSize="2.5rem"
                // width="500px"
                lineHeight="140%"
                width='100%'
                textAlign="center"
                justifyContent='center'
            >
                Your payment timed out.
            </Flex>
            <Flex
                color="#c1c1c1"
                fontSize="1.2rem"
                width="500px"
                lineHeight="160%"
                minHeight="100px"
                justifyContent="center"
                alignItems="center"
                textAlign='center'
            >
                If money was deducted from your account, please log out and log in again.
            </Flex>
            <Flex justifyContent="center">
                <DarkMode>
                    <Button mt="32px" borderRadius="3px" width="140px" onClick={logout}>
                        Logout
                    </Button>
                </DarkMode>
            </Flex>
        </>
    )

    const failComponent = (
        <>
            <Flex
                mb="16px"
                fontSize="2.5rem"
                width="500px"
                lineHeight="140%"
                // width='100%'
                textAlign="center"
                justifyContent='center'
            >
                There was an error processing your payment.
            </Flex>
            <Flex
                color="#c1c1c1"
                fontSize="1.2rem"
                width="500px"
                lineHeight="160%"
                minHeight="100px"
                justifyContent="center"
                alignItems="center"
                textAlign='center'
            >
                If money was deducted from your account, please log out and log in again. If your tier is still not upgraded, please contact us.
            </Flex>
            <Flex justifyContent="center">
                <Button mt="32px" borderRadius="3px" colorScheme='purple' width="140px" onClick={handleBuyClick}>
                    Try again
                </Button>
            </Flex>
        </>
    )

    const successComponent = (
        <>
            <Flex
                fontSize='2rem'
                color='green.400'
                bg='rgba(134, 239, 172, 0.2)'
                border='2px solid !important'
                borderRadius='8px'
                borderColor='green.800 !important'
                padding='12px 24px'
                display='flex'
                alignItems='center'
                width='520px'
            >
                <FiCheckCircle/>
                <Flex
                    ml='16px'
                >
                    Your payment was successful!
                </Flex>

            </Flex>
            <Flex
                color="#c1c1c1"
                fontSize="1.2rem"
                width="520px"
                lineHeight="160%"
                minHeight="100px"
                justifyContent="center"
                alignItems="center"
                textAlign='center'
                mt='8px'
            >
                You can now de-mix an unlimited number of songs, on as many devices as you want, forever.
            </Flex>
            <Flex justifyContent="center">
                <Button mt="24px" borderRadius="3px" width="140px" onClick={onClose}>
                    Continue
                </Button>
            </Flex>
        </>
    )

    const promptedComponent = (
        <>
            <Flex mb="16px" fontSize="2.5rem" width="400px" lineHeight="140%">
                {heading}
            </Flex>
            <Flex
                color="#c1c1c1"
                fontSize="1.2rem"
                width="500px"
                lineHeight="160%"
                minHeight="100px"
            >
                {subtitle}
            </Flex>
            <Button mt="32px" colorScheme="purple" borderRadius="3px" onClick={handleBuyClick}>
                Buy full version
            </Button>
            <Flex mt="16px" fontSize="16px" color="#5A5A5E">
                You will be redirected to our website.
            </Flex>
        </>
    )

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            placement="bottom"
            size="full"
            closeOnEsc={true}
        >
            <DrawerOverlay />
            <DrawerContent bg="#1C1C1E" color="#fafafa">
                <DrawerCloseButton />
                <Flex
                    height="100%"
                    width="100%"
                    justifyContent="center"
                    alignItems="center"
                >
                    <Box mb="64px">
                        {drawerState === 'FAILED' && failComponent}
                        {drawerState === 'SUCCESS' && successComponent}
                        {drawerState === "TIMEOUT" && timeoutComponent}
                        {drawerState === "WAITING" && waitingComponent}
                        {drawerState === "PROMPTED" && promptedComponent}
                    </Box>
                </Flex>
            </DrawerContent>
        </Drawer>
    )
}

export default PaymentDrawer
