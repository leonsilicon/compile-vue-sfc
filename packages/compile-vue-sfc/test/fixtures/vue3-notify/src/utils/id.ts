// We start at -1 so that the first ID returned is 0
let nextId = -1;

/**
	Sequential ID generator
*/
export function generateId() {
	nextId += 1;
	return nextId;
}
