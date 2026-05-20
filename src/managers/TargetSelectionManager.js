export class TargetSelectionManager {
    constructor(scene) {
        this.scene = scene;
    }

    startAction(action) {
        const unit = this.scene.selectedUnit;
        if (!unit || this.scene.phase !== 'player') return;
        this.scene.actionMode = action;
        this.scene.movementManager.clearHighlights();
        this.setUnitsInteractive(false);
        this.showTargetsForAction(action);
        this.scene.uiManager.updateHelpText();
    }

    showTargetsForAction(action) {
        this.clearTargetHighlights();
        const unit = this.scene.selectedUnit;
        let maxRange = 5, targetAllies = false, onlyAdjacent = false;

        if (action === 'shoot') maxRange = 5;
        else if (action === 'skill') {
            if (unit.role === 'medic') { maxRange = 1; targetAllies = true; }
            else if (unit.role === 'sniper') maxRange = 12;
            else if (unit.role === 'assault') { maxRange = 1; onlyAdjacent = true; }
        }

        const candidates = targetAllies ? this.scene.unitManager.playerUnits : this.scene.unitManager.enemyUnits;
        const tilemap = this.scene.tilemap;
        candidates.forEach(target => {
            if (target === unit || target.hp <= 0) return;
            const dist = this.gridDistance(unit.tile, target.tile);
            if (dist === 0 || dist > maxRange) return;
            if (onlyAdjacent && dist > 1) return;

            const { x, y } = tilemap.gridToWorld(target.tile.gridX, target.tile.gridY);
            const color = targetAllies ? 0x00ff00 : 0xff0000;
            const marker = this.scene.add.rectangle(x, y, 36, 36, color, 0.4).setDepth(2);
            marker.setInteractive();
            marker.on('pointerdown', () => this.executeAction(action, target));
            this.scene.highlightedTargets.push(marker);
        });
    }

    executeAction(action, target) {
        this.clearTargetHighlights();
        this.setUnitsInteractive(true);
        this.scene.actionMode = null;
        const unit = this.scene.selectedUnit;
        if (!unit || !unit.hasActions()) return;

        unit.endTurn();

        const combat = this.scene.combatManager;
        if (action === 'shoot') {
            combat.performRangedAttack(unit, target);
        } else if (action === 'skill') {
            switch (unit.role) {
                case 'medic': combat.performHeal(unit, target); break;
                case 'sniper': combat.performSniperShot(unit, target); break;
                case 'assault': combat.performMeleeAttack(unit, target); break;
                default: combat.performRangedAttack(unit, target);
            }
        }

        this.scene.turnManager.endUnitTurn(unit);
    }

    clearTargetHighlights() {
        this.scene.highlightedTargets.forEach(s => s.destroy());
        this.scene.highlightedTargets = [];
    }

    setUnitsInteractive(enabled) {
        this.scene.unitManager.allUnits.forEach(u => {
            if (enabled) u.sprite.setInteractive();
            else u.sprite.disableInteractive();
        });
    }

    gridDistance(a, b) {
        return Math.abs(a.gridX - b.gridX) + Math.abs(a.gridY - b.gridY);
    }
}