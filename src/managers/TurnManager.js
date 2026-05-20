export class TurnManager {
    constructor(scene) {
        this.scene = scene;
    }

    endUnitTurn(unit) {
        unit.deselect();
        this.scene.movementManager.clearHighlights();
        this.scene.targetManager.clearTargetHighlights();
        this.scene.infoPanel.hide();
        this.scene.selectedUnit = null;
        this.scene.actionMode = null;
        this.scene.uiManager.updateHelpText();
        this.checkEndPlayerPhase();
    }

    skipUnitTurn() {
        if (this.scene.selectedUnit) {
            this.scene.selectedUnit.endTurn();
            this.endUnitTurn(this.scene.selectedUnit);
        }
    }

    clearSelection() {
        if (this.scene.selectedUnit) {
            this.scene.selectedUnit.deselect();
            this.scene.movementManager.clearHighlights();
            this.scene.targetManager.clearTargetHighlights();
            this.scene.infoPanel.hide();
            this.scene.selectedUnit = null;
            this.scene.actionMode = null;
            this.scene.uiManager.updateHelpText();
        }
    }

    checkEndPlayerPhase() {
        const playerUnits = this.scene.unitManager.playerUnits;
        if (!playerUnits.some(u => u.hasActions())) {
            this.startEnemyPhase();
        }
    }

    startPlayerPhase() {
        this.scene.phase = 'player';
        this.scene.unitManager.playerUnits.forEach(u => u.resetActions());
        this.scene.uiManager.updateHelpText();
    }

    startEnemyPhase() {
        this.scene.phase = 'enemy';
        this.scene.uiManager.updateHelpText();
        this.scene.unitManager.enemyUnits.forEach(e => e.resetActions());
        this.scene.time.delayedCall(500, () => this.processEnemyTurn());
    }

    processEnemyTurn() {
        const enemies = this.scene.unitManager.enemyUnits;
        const active = enemies.filter(e => e.hasActions() && e.hp > 0);
        if (active.length === 0) {
            this.startPlayerPhase();
            return;
        }
        this.enemyAct(active[0]);
    }

    enemyAct(enemy) {
        const players = this.scene.unitManager.playerUnits;
        let closest = null, minDist = Infinity;
        players.forEach(p => {
            if (p.hp <= 0) return;
            const d = this.gridDistance(enemy.tile, p.tile);
            if (d < minDist) { minDist = d; closest = p; }
        });
        if (!closest) { enemy.endTurn(); this.processEnemyTurn(); return; }

        const combat = this.scene.combatManager;
        if (minDist <= 1) {
            combat.performRangedAttack(enemy, closest);
            enemy.endTurn();
            this.scene.time.delayedCall(300, () => this.processEnemyTurn());
            return;
        }

        const pathfinder = this.scene.pathfinder;
        const tilemap = this.scene.tilemap;
        const neighbours = pathfinder.getTilesInRange(closest.tile, 1)
            .filter(t => t.walkable && !t.unit);
        if (neighbours.length === 0) {
            enemy.endTurn();
            this.processEnemyTurn();
            return;
        }

        let bestTile = neighbours[0];
        let bestDist = this.gridDistance(enemy.tile, bestTile);
        for (const tile of neighbours) {
            const d = this.gridDistance(enemy.tile, tile);
            if (d < bestDist) {
                bestDist = d;
                bestTile = tile;
            }
        }

        const path = pathfinder.findPath(enemy.tile, bestTile, enemy.moveRange);
        if (path && path.length > 0) {
            const finalTile = path[path.length - 1];
            enemy.tile.unit = null;
            enemy.tile = finalTile;
            finalTile.unit = enemy;
            const { x, y } = tilemap.gridToWorld(finalTile.gridX, finalTile.gridY);
            enemy.sprite.setPosition(x, y);
            enemy.useAction(1);

            if (enemy.hasActions() && this.gridDistance(enemy.tile, closest.tile) <= 1) {
                combat.performRangedAttack(enemy, closest);
                enemy.endTurn();
            }
        } else {
            enemy.endTurn();
        }
        this.scene.time.delayedCall(300, () => this.processEnemyTurn());
    }

    gridDistance(a, b) {
        return Math.abs(a.gridX - b.gridX) + Math.abs(a.gridY - b.gridY);
    }
}