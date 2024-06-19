import { Button, Flex, Tooltip, useToast } from "@chakra-ui/react"
import { FiChevronRight } from "react-icons/fi"
import { authenticate } from "../../functions/auth"
import useUserStore from "../../store/user"
import { useState } from "react"

const Auth = () => {
    const login = useUserStore(state => state.login)
    const [loginLoading, setLoginLoading] = useState<boolean>(false)

    const toast = useToast()

    function initAuth() {
        setLoginLoading(true)
        authenticate()
            .then((user) => {
                login(user)
            })
            .catch(() => {
                toast({
                    title: 'Unable to login.',
                    description: 'Please contact developer at dushyant9309@gmail.com',
                    status: 'error'
                })
            })
            .finally(() => setLoginLoading(false))
    }

    console.log('in auth')

    return (
        <Flex
            width="100%"
            justifyContent="center"
            alignItems="center"
         >
            <Flex
                direction='column'
                width='250px'
                mb='100px'
            >
                <Flex
                    fontSize='40px'
                    fontWeight='700'
                >
                    Tune Prism.
                </Flex>
                <Flex
                    mb='12px'
                >
                    De-mix music, as many tracks as you want, forever.
                </Flex>

                <Flex
                    height='1px'
                    borderRadius='50px'
                    bg='rgba(255,255,255,0.1)'
                    mb='16px'
                />
                <Button
                    onClick={initAuth}
                    colorScheme='purple'
                    borderRadius='3px'
                    rightIcon={<FiChevronRight />}
                    isLoading={loginLoading}
                >
                    Continue with Google
                </Button>

                <Tooltip
                    label='It makes it easier for us to deliver updates, and it lets you buy once and use Tuneprism on as many computers as you want.'
                    bg='#000'
                    placement='bottom-start'
                    padding='4px 8px'
                    color='#8D8D92'
                >
                    <Flex
                        mt='16px'
                        fontSize='12px'
                        cursor='pointer'
                        color='#5A5A5E'
                        _hover={{
                            textDecoration: 'underline'
                        }}
                    >
                        Why do you need to login?
                    </Flex>
                </Tooltip>
            </Flex>
        </Flex>
    )
}

export default Auth
