export function getFileTypeFromPath(filePath: string): string {
    const parts = filePath.split('.')
    try {
        return parts[parts.length - 1]
    } catch (e) {
        console.log('File probably has no extension')
        return ''
    }
}

export function getFilenameFromPath(filePath: string): string {
    try {
        const parts = filePath.split('/')
        return parts[parts.length - 1]
    } catch (e) {
        return ''
    }
}