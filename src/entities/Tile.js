export const TILE_TYPES = {
    WALL: 'wall',
    FLOOR: 'floor',
    COVER_LOW: 'cover_low',
    COVER_HIGH: 'cover_high',
    RUBBLE: 'rubble',
};


export class Tile {
    constructor(gridX, gridY, type = TILE_TYPES.WALL) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.type  = type;

        this.setType(type);

        this.unit = null;
        this.sprite = null;
    }

    setType(type) {
        this.type = type;

        this.walkable =
            type !== TILE_TYPES.WALL &&
            type !== TILE_TYPES.COVER_HIGH;

        this.coverValue =
            type === TILE_TYPES.COVER_LOW ? 0.3 :
            type === TILE_TYPES.COVER_HIGH ? 0.7 :
            0;

        this.moveCost = type === TILE_TYPES.RUBBLE ? 2 : 1;
    }
}