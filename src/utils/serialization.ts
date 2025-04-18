/**
 * Serializes BigInt values in an object or array to strings.
 * @param obj - The object or array to serialize.
 * @returns The serialized object or array with BigInt values as strings.
 */
export function serializeBigInt(obj: any): any {
    if (typeof obj === "bigint") {
        return obj.toString(); // Convert BigInt to string
    }

    if (obj instanceof Date) {
        return obj.toISOString(); // Convert Date to ISO string
    }

    if (Array.isArray(obj)) {
        return obj.map(serializeBigInt); // Recursively handle arrays
    }

    if (obj !== null && typeof obj === "object") {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
        );
    }

    return obj; // Return other types as is
}
