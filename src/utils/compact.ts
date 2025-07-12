export const compact = <T>(array: T[]): NonNullable<T>[] => {
	return array.filter(
		(item) => item !== null && item !== undefined,
	) as NonNullable<T>[]
}
