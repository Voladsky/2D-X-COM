export class MovementManager {
    constructor(scene) {
        this.scene = scene;
    }

    showMoveRange(unit) {
        this.clearHighlights();
        const pathfinder = this.scene.pathfinder;
        const tilemap = this.scene.tilemap;
        const tiles = pathfinder.getTilesInRange(unit.tile, unit.moveRange);
        tiles.forEach(tile => {
            const { x, y } = tilemap.gridToWorld(tile.gridX, tile.gridY);
            const highlight = this.scene.add.rectangle(x, y, 36, 36, 0x00ff00, 0.3).setDepth(2);
            highlight.setInteractive();
            highlight.on('pointerdown', () => this.moveUnitTo(unit, tile));
            this.scene.highlightedTiles.push(highlight);
        });
    }

    moveUnitTo(unit, targetTile) {
        this.clearHighlights();
        const pathfinder = this.scene.pathfinder;
        const tilemap = this.scene.tilemap;
        const path = pathfinder.findPath(unit.tile, targetTile, unit.moveRange);
        if (!path || path.length === 0) return;

        unit.tile.unit = null;
        unit.tile = targetTile;
        targetTile.unit = unit;
        const { x, y } = tilemap.gridToWorld(targetTile.gridX, targetTile.gridY);
        unit.sprite.setPosition(x, y);
        unit.marker.setPosition(x, y - 30);
        unit.nameLabel.setPosition(x, y - 45);

        unit.useAction(1);
        this.scene.infoPanel.update(unit);

        if (unit.actionsLeft > 0) {
            this.showMoveRange(unit);
        } else {
            this.scene.turnManager.endUnitTurn(unit);
        }
    }

    clearHighlights() {
        this.scene.highlightedTiles.forEach(s => s.destroy());
        this.scene.highlightedTiles = [];
    }
}