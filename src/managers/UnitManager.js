import { Unit } from '../entities/Unit.js';

export class UnitManager {
    constructor(scene) {
        this.scene = scene;
        this.playerUnits = [];
        this.enemyUnits = [];
        this.allUnits = [];
    }

    createUnits(tilemapService) {
        const toXY = (tile) => tilemapService.gridToWorld(tile.gridX, tile.gridY);
        const playerTiles = tilemapService.getSpawnTiles('left', 3);
        const enemyTiles = tilemapService.getSpawnTiles('right', 3);

        const playerDefs = [
            { name: 'Медик', hp: 100, attack: 10, defense: 8, accuracy: 70, role: 'medic', moveRange: 3 },
            { name: 'Снайпер', hp: 80, attack: 15, defense: 5, accuracy: 85, role: 'sniper', moveRange: 3 },
            { name: 'Штурмовик', hp: 120, attack: 18, defense: 10, accuracy: 65, role: 'assault', moveRange: 3 },
        ];
        const enemyDefs = [
            { name: 'Пришелец-солдат', hp: 70, attack: 12, defense: 4, accuracy: 60, role: null, moveRange: 3 },
            { name: 'Пришелец-элита', hp: 100, attack: 16, defense: 6, accuracy: 70, role: null, moveRange: 3 },
            { name: 'Пришелец-разведчик', hp: 60, attack: 10, defense: 3, accuracy: 75, role: null, moveRange: 3 },
        ];

        playerDefs.forEach((def, i) => {
            const tile = playerTiles[i];
            if (!tile) return;
            const { x, y } = toXY(tile);
            const unit = new Unit(this.scene, x, y, { ...def, type: 'player' });
            unit.tile = tile;
            tile.unit = unit;
            this.playerUnits.push(unit);
            this.allUnits.push(unit);
        });

        enemyDefs.forEach((def, i) => {
            const tile = enemyTiles[i];
            if (!tile) return;
            const { x, y } = toXY(tile);
            const unit = new Unit(this.scene, x, y, { ...def, type: 'enemy' });
            unit.tile = tile;
            tile.unit = unit;
            this.enemyUnits.push(unit);
            this.allUnits.push(unit);
        });
    }

    killUnit(unit) {
        unit.hp = 0;
        unit.actionsLeft = 0;
        if (unit.tile) unit.tile.unit = null;
        unit.sprite.setVisible(false);
        unit.marker.setVisible(false);
        unit.nameLabel.setVisible(false);
    }
}