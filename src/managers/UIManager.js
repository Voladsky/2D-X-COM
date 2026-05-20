export class UIManager {
    constructor(scene) {
        this.scene = scene;
    }

    createHelpText() {
        this.scene.helpText = this.scene.add.text(640, 30, '', {
            fontSize: '16px', fontFamily: 'Segoe UI', color: '#64748b'
        }).setOrigin(0.5).setDepth(10);
    }

    updateHelpText() {
        const phase = this.scene.phase;
        if (phase === 'player') {
            if (!this.scene.selectedUnit) this.scene.helpText.setText('Выберите бойца');
            else if (this.scene.actionMode) this.scene.helpText.setText('Выберите цель');
            else this.scene.helpText.setText('Переместитесь или выберите действие');
        } else {
            this.scene.helpText.setText('Ход противника...');
        }
    }
}