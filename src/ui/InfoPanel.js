export class InfoPanel {
    constructor(scene) {
        this.scene = scene;
        this.container = scene.add.container(0, 0).setDepth(10).setVisible(false);


        this.bg = scene.add.rectangle(0, 0, 300, 240, 0x1e293b)
            .setStrokeStyle(2, 0x334155)
            .setOrigin(0, 0);
        this.container.add(this.bg);


        this.title = scene.add.text(150, 15, 'ЮНИТ', {
            fontSize: '14px', fontFamily: 'Segoe UI', color: '#64748b'
        }).setOrigin(0.5, 0);
        this.container.add(this.title);


        this.nameText = scene.add.text(20, 35, '', {
            fontSize: '16px', fontFamily: 'Segoe UI', color: '#e2e8f0', fontStyle: 'bold'
        }).setOrigin(0, 0);
        this.container.add(this.nameText);


        this.typeText = scene.add.text(170, 35, '', {
            fontSize: '14px', fontFamily: 'Segoe UI', color: '#94a3b8', fontStyle: 'bold'
        }).setOrigin(0, 0);
        this.container.add(this.typeText);


        this.statsText = scene.add.text(20, 60, '', {
            fontSize: '13px', fontFamily: 'Segoe UI', color: '#cbd5e1', lineSpacing: 6
        }).setOrigin(0, 0);
        this.container.add(this.statsText);


        this.actionsText = scene.add.text(20, 88, '', {
            fontSize: '14px', fontFamily: 'Segoe UI', color: '#e2e8f0', fontStyle: 'bold'
        }).setOrigin(0, 0);
        this.container.add(this.actionsText);


        this.hpLabel = scene.add.text(20, 112, 'HP:', { fontSize: '12px', color: '#94a3b8' }).setOrigin(0, 0);
        this.hpBarBg = scene.add.rectangle(80, 117, 100, 10, 0x334155).setOrigin(0, 0.5);
        this.hpBar = scene.add.rectangle(80, 117, 100, 10, 0x22c55e).setOrigin(0, 0.5);
        this.hpText = scene.add.text(130, 117, '', { fontSize: '10px', color: '#ffffff' }).setOrigin(0.5);
        this.container.add([this.hpLabel, this.hpBarBg, this.hpBar, this.hpText]);


        this.actionBtn1 = scene.add.text(20, 145, '', {
            fontSize: '13px', fontFamily: 'Segoe UI', color: '#ffffff',
            backgroundColor: '#2563eb', padding: { x: 10, y: 5 }
        }).setOrigin(0, 0.5).setInteractive();
        this.actionBtn2 = scene.add.text(20, 175, '', {
            fontSize: '13px', fontFamily: 'Segoe UI', color: '#ffffff',
            backgroundColor: '#7c3aed', padding: { x: 10, y: 5 }
        }).setOrigin(0, 0.5).setInteractive();
        this.skipBtn = scene.add.text(160, 175, 'Пропустить', {
            fontSize: '13px', fontFamily: 'Segoe UI', color: '#cbd5e1',
            backgroundColor: '#334155', padding: { x: 10, y: 5 }
        }).setOrigin(0, 0.5).setInteractive();
        this.container.add([this.actionBtn1, this.actionBtn2, this.skipBtn]);


        this.closeBtn = scene.add.text(280, 5, '✕', {
            fontSize: '16px', fontFamily: 'Segoe UI', color: '#94a3b8',
            backgroundColor: '#1e293b', padding: { x: 4, y: 2 }
        }).setOrigin(1, 0).setInteractive();
        this.container.add(this.closeBtn);

        this.closeBtn.on('pointerover', () => this.closeBtn.setColor('#e2e8f0'));
        this.closeBtn.on('pointerout', () => this.closeBtn.setColor('#94a3b8'));
        this.closeBtn.on('pointerdown', () => this.scene.clearSelection());

        this.hide();
    }

    update(unit) {
        this.show();

        this.nameText.setText(unit.name);
        const typeText = unit.type === 'player' ? 'Добрые' : 'Злые';
        const typeColor = unit.type === 'player' ? '#22d3ee' : '#ef4444';
        this.typeText.setText(typeText).setColor(typeColor);
        this.typeText.setX(this.nameText.x + this.nameText.width + 10);


        this.statsText.setText(
            `Атака: ${unit.attack} | Защита: ${unit.defense} | Точность: ${unit.accuracy}%`
        );
        this.actionsText.setText(`Действий: ${unit.actionsLeft}/2`);


        const hpPercent = unit.hp / unit.maxHp;
        this.hpBar.setScale(hpPercent, 1);
        this.hpText.setText(`${unit.hp}/${unit.maxHp}`);
        if (hpPercent > 0.6) this.hpBar.setFillStyle(0x22c55e);
        else if (hpPercent > 0.3) this.hpBar.setFillStyle(0xeab308);
        else this.hpBar.setFillStyle(0xef4444);


        if (unit.type === 'player' && unit.actionsLeft > 0 && this.scene.phase === 'player') {
            this._showActionButtons(unit);
        } else {
            this._hideActionButtons();
        }


        this._positionPanel(unit);
    }

    _showActionButtons(unit) {
        this.actionBtn1.setText('Стрельба').setVisible(true);
        this.actionBtn2.setVisible(true);
        this.skipBtn.setVisible(true);

        let skillText = 'Навык';
        switch (unit.role) {
            case 'medic': skillText = 'Лечение'; break;
            case 'sniper': skillText = 'Точный выстрел'; break;
            case 'assault': skillText = 'Удар вблизи'; break;
        }
        this.actionBtn2.setText(skillText);

        this.actionBtn1.off('pointerdown').on('pointerdown', () => this.scene.startAction('shoot'));
        this.actionBtn2.off('pointerdown').on('pointerdown', () => this.scene.startAction('skill'));
        this.skipBtn.off('pointerdown').on('pointerdown', () => this.scene.skipUnitTurn());
    }

    _hideActionButtons() {
        this.actionBtn1.setVisible(false);
        this.actionBtn2.setVisible(false);
        this.skipBtn.setVisible(false);
    }

    _positionPanel(unit) {
        const sprite = unit.sprite;
        const panelWidth = 300;
        const panelHeight = 240;
        const margin = 20;


        if (sprite.x < 400 && sprite.y < 400) {
            this.container.setPosition(1280 - panelWidth - margin, 720 - panelHeight - margin);
        } else {

            this.container.setPosition(margin, margin);
        }
    }

    show() {
        this.container.setVisible(true);
    }

    hide() {
        this.container.setVisible(false);
    }
}