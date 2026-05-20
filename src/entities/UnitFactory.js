import { Unit } from './Unit.js';

export class UnitFactory {
    constructor(scene) {
        this.scene = scene;
    }

    createTextureMap() {
        // Создаем текстуры для юнитов
        const graphics = this.scene.add.graphics();

        // Текстура игрока
        graphics.clear();
        graphics.fillStyle(0x22d3ee);
        graphics.fillCircle(20, 20, 20);
        graphics.generateTexture('player_unit', 40, 40);

        // Текстура противника
        graphics.clear();
        graphics.fillStyle(0xef4444);
        graphics.fillCircle(20, 20, 20);
        graphics.generateTexture('enemy_unit', 40, 40);

        graphics.destroy();
    }

    createPlayerUnit(x, y, config = {}) {
        return new Unit(this.scene, x, y, 'player', {
            name: config.name || 'Солдат',
            hp: config.hp || 100,
            attackPower: config.attackPower || 15,
            defense: config.defense || 8,
            accuracy: config.accuracy || 75,
            moveRange: config.moveRange || 3,
            role: config.role || null
        });
    }

    createEnemyUnit(x, y, config = {}) {
        return new Unit(this.scene, x, y, 'enemy', 'enemy_unit', {
            name: config.name || 'Пришелец',
            hp: config.hp || 80,
            ap: config.ap || 2,
            attackPower: config.attackPower || 12,
            defense: config.defense || 4,
            accuracy: config.accuracy || 65,
            moveRange: config.moveRange || 3,
        });
    }
}