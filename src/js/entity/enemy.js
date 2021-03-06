define(['entity/entity'], function() {

    /**
     * 敵クラス
     * ActiveTurn制で行動をする。いわゆるFFのATBのパクリ。
     * @constructor
     */
    kariShoot.Entity.Enemy = Class.create(kariShoot.Entity, {
        initialize: function(width, height, status, imagePath) {
            kariShoot.Entity.call(this, width, height, status, imagePath);

            /**
             * フレーム管理用変数
             * @type {Number}
             */
            this.acount = 0;

            /**
             * @type {kariShoot.manage.Turn}
             * @private
             */
            this.turn_ = kariShoot.manage.Turn.getInstance();

            /**
             * ATB的なパラメータ。100で行動開始
             * @type {Number}
             * @private
             */
            this.activeGauge_ = Math.random() * 10;

            /**
             * 行動中か
             * @type {boolean}
             */
            this.isAction = false;
        },

        onenterframe: function() {
            kariShoot.Entity.prototype.onenterframe.call(this);
            this.processActiveGauge_();
            if (this.acount++ > core.fps) {
                this.acount = 0;
            }
        },

        /**
         * AGをすすめる
         * @private
         */
        processActiveGauge_: function() {
            if (!this.isAction) {
                this.activeGauge_ += this.agi * 1;
            }

            if (this.activeGauge_ > kariShoot.manage.Turn.MAX_ACTIVE_GAUGE) {
                this.activeGauge_ = 0;
                this.turn_.addEntity(this);
            }
        },

        /**
         * @override
         */
        action: function() {
            kariShoot.Entity.prototype.action.call(this);
            this.isAction = true;
        },

        /**
         * 指定したentityに攻撃する
         * @param {Sprite} entity
         */
        attack: function(entity) {
            var bullet = new kariShoot.Bullet();
            bullet.position = {x: this.centerX - 100 , y: this.centerY};
            core.rootScene.mainStage.addChild(bullet);

            bullet.shot(entity.x+100, entity.y, this);

        }
    });
});
