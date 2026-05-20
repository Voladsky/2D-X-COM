export class PathfindingService {
    constructor(grid, cols, rows) {
        this.grid = grid;
        this.cols = cols;
        this.rows = rows;
    }


    getTilesInRange(startTile, range) {
        const visited = new Set();
        const queue = [{ tile: startTile, steps: 0 }];
        const reachable = [];
        visited.add(this._key(startTile));
        while (queue.length > 0) {
            const { tile, steps } = queue.shift();
            if (steps > 0) reachable.push(tile);
            if (steps >= range) continue;
            for (const neighbor of this._getNeighbors(tile)) {
                if (!neighbor.walkable) continue;
                if (neighbor.unit && neighbor.unit !== startTile.unit) continue;
                const key = this._key(neighbor);
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push({ tile: neighbor, steps: steps + 1 });
                }
            }
        }
        return reachable;
    }


    findPath(start, end, maxSteps = Infinity) {
        if (start === end) return [];
        const visited = new Map();
        const queue = [{ tile: start, steps: 0, path: [] }];
        visited.set(this._key(start), 0);
        while (queue.length > 0) {
            const { tile, steps, path } = queue.shift();
            if (tile === end) return path;
            for (const neighbor of this._getNeighbors(tile)) {
                if (!neighbor.walkable) continue;
                if (neighbor.unit && neighbor.unit !== start.unit) continue;
                const newSteps = steps + 1;
                if (newSteps > maxSteps) continue;
                const key = this._key(neighbor);
                if (!visited.has(key) || visited.get(key) > newSteps) {
                    visited.set(key, newSteps);
                    queue.push({ tile: neighbor, steps: newSteps, path: [...path, neighbor] });
                }
            }
        }
        return null;
    }

    _getNeighbors(tile) {
        const neighbors = [];
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (const [dx, dy] of dirs) {
            const nx = tile.gridX + dx;
            const ny = tile.gridY + dy;
            if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
                neighbors.push(this.grid[ny][nx]);
            }
        }
        return neighbors;
    }

    _key(tile) { return `${tile.gridX},${tile.gridY}`; }
}