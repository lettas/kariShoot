define([], function() {
    var IMAGE_PATH = '../../img/entity/slime.png';
    var HIT_EFFECT_PATH = '../../img/hiteffect.png';
    core.preload([IMAGE_PATH, HIT_EFFECT_PATH]);
    /**
     * キャラクラス
     * @param {number} width
     * @param {number} height
     * @param {kariGolf.Entity.Status=} opt_status
     * @param {string=} opt_imagePath
     * @constructor
     */
    kariGolf.Entity = Class.create(PhyBoxSprite, {
        initialize: function(width, height, opt_status, opt_imagePath) {
            PhyBoxSprite.call(this, width, height, enchant.box2d.DYNAMIC_SPRITE, 1.0, 1, 0.6, true);
            var imagePath = opt_imagePath || IMAGE_PATH;
            this.image = core.assets[imagePath];

            /**
             * 最大体力
             * @type {number}
             */
            this.maxHp = opt_status ? opt_status.hp : 2000;

            /**
             * 残り体力
             * @type {number}
             */
            this.hp = this.maxHp;

            /**
             * 防御力 ( ダメージ = 弾の速さ * 弾の攻撃力 / deffence )
             * @type {number}
             */
            this.deffence = opt_status ? opt_status.deffence : 1;

            /**
             * HPバーの枠
             * @type {Sprite}
             * @private
             */
            this.hpBarOuter_;


            /**
             * HPバーの可変部分
             * @type {Sprite}
             * @private
             */
            this.hpBarInner_;

            /**
             * ダメージカウンタのY位置
             * @type {number}
             * @private
             */
            this.damegeLabelY_ = 0;

            /**
             * ダメージ総数
             * @type {number}
             * @private
             */
            this.totalDamage_ = 0;

            /**
             * ダメージ総数ラベル
             * @type {Label}
             * @private
             */
            this.totalDamaleLabel_;

            /**
             * アニメーションのフレーム番号
             * @type {number}
             */
            this.frameCount = 0;

            this.account;

            this.addEventListener('enterframe', this.handleEnterframe);
        },

        handleEnterframe: function() {
            if (this.hp <= 0) {
                this.destroyEffect_();
            }
        },

        /**
         * 何かが衝突した時
         * @param {Sprite} entity
         */
        hit: function(entity) {
            var velocity = entity.velocity;
            //  ダメージ計算 = 弾の速さ * 弾の攻撃力 / 敵の防御力
            var damage = Math.ceil((Math.abs(velocity.x) + Math.abs(velocity.y) * entity.attack ) / this.deffence);

            if (damage > 0) {
                var label = new Label(damage);
                var labelX = this.position.x;
                this.damageLabelY_ = this.damageLabelY_ ? this.damageLabelY_ - 16 : this.position.y - this.height;
                label.moveTo(labelX, this.damageLabelY_);
                label.color = 'red';
                label.font = "16px 'Consolas', 'Monaco', 'MSゴシック'";
                core.rootScene.mainStage.addChild(label);
                label.tl.moveTo(labelX, this.damageLabelY_ - 10, 10).fadeOut(30).then($.proxy(function() {
                    this.damageLabelY_ = this.position.y - this.height;
                    core.rootScene.mainStage.removeChild(label);
                }, this));

                this.hp = this.hp - damage > 0 ? this.hp - damage : 0;
                this.totalDamage_ += damage;
                this.totalDamageLabel_ && core.rootScene.mainStage.removeChild(this.totalDamageLabel_);
                this.totalDamageLabel_ = new Label('Total: ' + this.totalDamage_ + ' Damage!');
                this.totalDamageLabel_.moveTo(labelX + 50, this.position.y - this.height);
                this.totalDamageLabel_.font = "23px 'Consolas', 'Monaco', 'MSゴシック'";
                this.totalDamageLabel_.color = 'black';
                core.rootScene.mainStage.addChild(this.totalDamageLabel_);
                this.totalDamageLabel_.tl.fadeIn(10).wait(40).fadeOut(30);

                this.showHpBar_();

                if (this.acount++ > core.fps / 3) {
                    this.hitEffect_(entity);
                    this.acount = 0;
                }
            }
        },

        /**
         * HPバーを表示
         * @private
         */
        showHpBar_: function() {
            var hpRatio = this.hp / this.maxHp;
            var barWidth = 100;
            var barHeight = 10;
            var outerX = this.x;
            var outerY = this.y - 20;
            var borderSize = 1;
            var innerWidth = hpRatio > 0 ? barWidth * hpRatio - (borderSize * 2) : 0;
            var innerHeight = hpRatio > 0 ? barHeight - (borderSize * 2) : 0;

            if (this.hpBarOuter_) {
                core.rootScene.mainStage.removeChild(this.hpBarOuter_);
                delete this.hpBarOuter_;
            }
            if (this.hpBarInner_) {
                core.rootScene.mainStage.removeChild(this.hpBarInner_);
                delete this.hpBarInner_;
            }

            // HPバーの外側の描写
            this.hpBarOuter_ = new Sprite(STAGE_WIDTH, STAGE_HEIGHT);
            var surfaceOuter = new Surface(STAGE_WIDTH, STAGE_HEIGHT);
            var contextOuter = surfaceOuter.context;
            this.hpBarOuter_.image = surfaceOuter;
            contextOuter.strokeStyle = 'rgb(0, 0, 0)';
            contextOuter.beginPath();
            contextOuter.strokeRect(outerX, outerY, barWidth, barHeight);

            // HPバーの可変部分の描写
            this.hpBarInner_ = new Sprite(STAGE_WIDTH, STAGE_HEIGHT);
            var surfaceInner = new Surface(STAGE_WIDTH, STAGE_HEIGHT);
            var contextInner = surfaceInner.context;
            this.hpBarInner_.image = surfaceInner;
            contextInner.fillStyle = 'rgb(255, 0, 0)';
            contextInner.beginPath();
            contextInner.fillRect(outerX + borderSize, outerY + borderSize, innerWidth, innerHeight);

            core.rootScene.mainStage.addChild(this.hpBarOuter_);
            core.rootScene.mainStage.addChild(this.hpBarInner_);
            this.hpBarOuter_.tl.fadeIn(5).delay(50).fadeOut(30);
            this.hpBarInner_.tl.fadeIn(5).delay(50).fadeOut(30);
        },

        /**
         * ヒット時のエフェクト
         * @param {Sprite} entity
         * @private
         */
        hitEffect_: function(entity) {
            var effect = new Sprite(16, 16);
            var frameCount = 0;
            effect.image = core.assets[HIT_EFFECT_PATH];
            effect.x = this.centerX - (this.centerX - entity.centerX);
            effect.y = this.centerY - (this.centerY - entity.centerY);

            effect.addEventListener('enterframe', function() {
                if (Math.floor(core.getTime()) % 3 == 0) {
                    this.frame = frameCount++;
                }
                if (frameCount > 4) {
                    core.rootScene.mainStage.removeChild(this);
                }
            });
            core.rootScene.mainStage.addChild(effect);
        },

        destroyEffect_: function() {
            this.tl.fadeOut(30).then(this.destroy);

        }
    });

    /**
     * @typedef{{
     *     hp: number,      // 最大HP
     *     deffence: number // 防御力 min=1, max=100
     * }}
     */
    kariGolf.Entity.Status;
});