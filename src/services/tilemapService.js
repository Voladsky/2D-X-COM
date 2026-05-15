import { Tile, TILE_TYPES } from '../entities/Tile';

const TILE_FRAMES = {
    [TILE_TYPES.FLOOR]: 0,
    [TILE_TYPES.WALL]: 1,
    [TILE_TYPES.COVER_LOW]: 2,
    [TILE_TYPES.COVER_HIGH]: 3,
    [TILE_TYPES.RUBBLE]: 4,
};

class BSPNode {
    constructor(x, y, w, h) {
        this.x = x; 
        this.y = y;

        this.w = w; 
        this.h = h;

        this.left = null;
        this.right = null;
        this.room = null; 
    }

    get isLeaf() {
        return !this.left && !this.right; 
    }
}

export class TilemapService {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} [cfg]
     * @param {number} [cfg.tileSize=40]
     * @param {number} [cfg.cols=32]
     * @param {number} [cfg.rows=13]
     * @param {number} [cfg.offsetX=0]
     * @param {number} [cfg.offsetY=0]
     * @param {number} [cfg.seed]
     */
    constructor(scene, cfg = {}) {
        this.scene = scene;
        this.TILE_SIZE = cfg.tileSize ?? 40;
        this.COLS = cfg.cols ?? 32;
        this.ROWS = cfg.rows ?? 13;
        this.offsetX = cfg.offsetX ?? 0;
        this.offsetY = cfg.offsetY ?? 0;
        this.seed = cfg.seed ?? Math.floor(Math.random() * 0xFFFFFF);

        this._rng = this._mulberry32(this.seed);
        this.grid = [];
        this.rooms = [];
        this._sprites = [];
    }

    // Публичное API

    /** Генерирует карту. */
    generate() {
        this._initGrid();
        this.rooms = [];

        const root = new BSPNode(0, 0, this.COLS, this.ROWS);
        this._split(root, 4);
        this._carve(root);
        this._addCover();
        this._addRubble();

        return this;
    }

    /** Рендер карты */
    render() {
        const TS = this.TILE_SIZE;
        const ox = this.offsetX;
        const oy = this.offsetY;

        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
                const tile = this.grid[y][x];

                const px = ox + x * TS + TS / 2;
                const py = oy + y * TS + TS / 2;

                const baseType =
                    tile.type === TILE_TYPES.WALL
                        ? TILE_TYPES.WALL
                        : TILE_TYPES.FLOOR;

                const base = this.scene.add
                    .sprite(
                        px,
                        py,
                        'tiles',
                        TILE_FRAMES[baseType]
                    )
                    .setDepth(0);

                this._sprites.push(base);

                if (
                    tile.type === TILE_TYPES.COVER_LOW ||
                    tile.type === TILE_TYPES.COVER_HIGH ||
                    tile.type === TILE_TYPES.RUBBLE
                ) {
                    const overlay = this.scene.add
                        .sprite(
                            px,
                            py,
                            'tiles',
                            TILE_FRAMES[tile.type]
                        )
                        .setDepth(1);

                    tile.sprite = overlay;
                    this._sprites.push(overlay);
                } else {
                    tile.sprite = base;
                }
            }
        }

        return this;
    }

    gridToWorld(gx, gy) {
        return {
            x: this.offsetX + gx * this.TILE_SIZE + this.TILE_SIZE / 2,
            y: this.offsetY + gy * this.TILE_SIZE + this.TILE_SIZE / 2,
        };
    }

    worldToGrid(wx, wy) {
        return {
            x: Math.floor((wx - this.offsetX) / this.TILE_SIZE),
            y: Math.floor((wy - this.offsetY) / this.TILE_SIZE),
        };
    }

    getTile(gx, gy) {
        if (gx < 0 || gx >= this.COLS || gy < 0 || gy >= this.ROWS) 
            return null;

        return this.grid[gy][gx];
    }

    getTileMap() {
        return this.grid;
    }

    getSpawnTiles(side, count) {
        const mid = Math.floor(this.COLS / 2);
        const minX = side === 'left' ? 0 : mid + 1;
        const maxX = side === 'left' ? mid - 1 : this.COLS - 1;

        let pool = this._floorInRegion(minX, maxX, 0, this.ROWS - 1);

        if (pool.length < count) {
            pool = this._floorInRegion(0, this.COLS - 1, 0, this.ROWS - 1);
        }

        return this._shuffle(pool).slice(0, count);
    }

    _initGrid() {
        this.grid = [];
        for (let y = 0; y < this.ROWS; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.COLS; x++) {
                this.grid[y][x] = new Tile(x, y, TILE_TYPES.WALL);
            }
        }
    }

    _setTile(x, y, type) {
        if (x < 0 || x >= this.COLS || y < 0 || y >= this.ROWS) 
            return;

        const tile = this.grid[y][x];
        tile.setType(type);
    }

    _split(node, depth) {
        const MIN = 4; 

        const canH = node.w >= MIN * 2;
        const canV = node.h >= MIN * 2;

        if (depth === 0 || (!canH && !canV)) {
            this._placeRoom(node);
            return;
        }

        let splitH;
        if (canH && !canV) 
            splitH = true;
        else if (!canH) 
            splitH = false;
        else 
            splitH = node.w >= node.h; 

        if (splitH) {
            const at = this._rand(Math.floor(node.w * 0.35), Math.floor(node.w * 0.65));
            node.left = new BSPNode(node.x, node.y, at, node.h);
            node.right = new BSPNode(node.x + at, node.y, node.w - at, node.h);
        } else {
            const at = this._rand(Math.floor(node.h * 0.35), Math.floor(node.h * 0.65));
            node.left = new BSPNode(node.x, node.y, node.w, at);
            node.right = new BSPNode(node.x, node.y + at, node.w, node.h - at);
        }

        this._split(node.left, depth - 1);
        this._split(node.right, depth - 1);
    }

    _placeRoom(node) {
        const PAD = 1;
        const minW = Math.max(3, Math.floor(node.w * 0.5));
        const minH = Math.max(3, Math.floor(node.h * 0.5));
        const maxW = node.w - PAD * 2;
        const maxH = node.h - PAD * 2;

        if (maxW < 2 || maxH < 2) 
            return;

        const w = this._rand(minW, maxW);
        const h = this._rand(minH, maxH);
        const x = node.x + this._rand(PAD, node.w - w - PAD);
        const y = node.y + this._rand(PAD, node.h - h - PAD);

        node.room = { x, y, w, h };
    }

    _carve(node) {
        if (node.isLeaf) {
            if (node.room) {
                this._carveRoom(node.room);
                this.rooms.push(node.room);
            }
            return;
        }

        this._carve(node.left);
        this._carve(node.right);

        const a = this._anyRoom(node.left);
        const b = this._anyRoom(node.right);
        if (a && b) this._connectRooms(a, b);
    }

    _carveRoom(r) {
        for (let y = r.y; y < r.y + r.h; y++)
            for (let x = r.x; x < r.x + r.w; x++)
                this._setTile(x, y, TILE_TYPES.FLOOR);
    }

    _anyRoom(node) {
        if (!node) return null;
        if (node.isLeaf) return node.room;
        return this._anyRoom(node.left) || this._anyRoom(node.right);
    }

    _connectRooms(a, b) {
        const ax = Math.floor(a.x + a.w / 2);
        const ay = Math.floor(a.y + a.h / 2);
        const bx = Math.floor(b.x + b.w / 2);
        const by = Math.floor(b.y + b.h / 2);

        if (this._rng() < 0.5) {
            this._corridorH(ax, bx, ay);
            this._corridorV(ay, by, bx);
        } else {
            this._corridorV(ay, by, ax);
            this._corridorH(ax, bx, by);
        }
    }

    _corridorH(x1, x2, y) {
        const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
        for (let x = lo; x <= hi; x++) {
            this._setTile(x, y, TILE_TYPES.FLOOR);
            this._setTile(x, y + 1, TILE_TYPES.FLOOR);
        }
    }

    _corridorV(y1, y2, x) {
        const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
        for (let y = lo; y <= hi; y++) {
            this._setTile(x, y, TILE_TYPES.FLOOR);
            this._setTile(x + 1, y, TILE_TYPES.FLOOR);
        }
    }

    _addCover() {
        for (const r of this.rooms) {
            if (r.w < 4 || r.h < 4) continue;
            const n = this._rand(1, Math.max(1, Math.floor((r.w * r.h) / 10)));

            for (let i = 0; i < n; i++) {
                const tx = r.x + this._rand(1, r.w - 2);
                const ty = r.y + this._rand(1, r.h - 2);

                if (this.grid[ty][tx].type === TILE_TYPES.FLOOR) {
                    const type = this._rng() < 0.6 ? TILE_TYPES.COVER_LOW : TILE_TYPES.COVER_HIGH;
                    this._setTile(tx, ty, type);
                }
            }
        }
    }

    _addRubble() {
        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
                if (this.grid[y][x].type === TILE_TYPES.FLOOR && this._rng() < 0.12) {
                    this._setTile(x, y, TILE_TYPES.RUBBLE);
                }
            }
        }
    }

    _floorInRegion(x0, x1, y0, y1) {
        const out = [];
        for (let y = y0; y <= y1; y++)
            for (let x = x0; x <= x1; x++) {
                const t = this.getTile(x, y);
                if (t && t.type === TILE_TYPES.FLOOR) out.push(t);
            }
        return out;
    }

    _shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(this._rng() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    _rand(min, max) {
        return min + Math.floor(this._rng() * (max - min + 1));
    }

    /** Детерминированный рандом **/
    _mulberry32(seed) {
        let s = seed >>> 0;
        return () => {
            s = (s + 0x6D2B79F5) >>> 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
}
