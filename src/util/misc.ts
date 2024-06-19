export function formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000) // Convert seconds to milliseconds
    const day = date.getDate() // No padding for day
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ]
    const month = months[date.getMonth()] // Get the abbreviated month
    const year = date.getFullYear()
    return `${day} ${month}, ${year}`
}

export function formatName(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 2 && parts[0].length === 1 && parts[0].endsWith(".")) {
        // Name is an initial followed by a surname, return as is
        return name
    } else if (parts.length >= 2) {
        // Take the first name and the first letter of the last name
        return `${parts[0]} ${parts[1].charAt(0)}`
    }
    return name // Return the name if it doesn't fit the criteria above
}
