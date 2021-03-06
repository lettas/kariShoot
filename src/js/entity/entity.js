define([], function() {
    var IMAGE_PATH = 'img/entity/slime.png';
    var HIT_EFFECT_PATH = 'img/hiteffect.png';
    core.preload([IMAGE_PATH, HIT_EFFECT_PATH]);
    /**
     * キャラクラス
     * @param {number} width
     * @param {number} height
     * @param {kariShoot.Entity.Status=} opt_status
     * @param {string=} opt_imagePath
     * @constructor
     */
    kariShoot.Entity = Class.create(PhyBoxSprite, {
        initialize: function(width, height, opt_status, opt_imagePath) {
            PhyBoxSprite.call(this, width, height, enchant.box2d.DYNAMIC_SPRITE, 1.0, 1, 0.6, true);
            var imagePath = opt_imagePath || IMAGE_PATH;
            this.image = core.assets[imagePath];

            /**
             * 名前
             * @type {String}
             */
            this.name = 'Entity';

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
             * すばやさ
             * 大きいほどターン順が早く回ってくる
             * @type {number}
             */
            this.agi = 1;

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
        },

        onenterframe: function() {
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
         * ターンが回ってきた時の行動を書く
         * @protected
         */
        action: function() {
            console.log(this.name + 'のターン');
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
            kariShoot.manage.Turn.getInstance().removeEntity(this);
            this.tl.fadeOut(30).then($.proxy(function() {
                this.destroy();
            }, this));

        },

        /**
         * ようすをみる
         */
        nothingToDo: function() {
            var consoleWindow = new Group();
            var windowOuter =new Sprite(STAGE_WIDTH, STAGE_HEIGHT);
            var outer = new Surface(STAGE_WIDTH, STAGE_HEIGHT);
            var context = outer.context;
            var windowWidth = 128;
            var windowHeight = 35;
            windowOuter.image = outer;

            var windowRect = {
                x: this.x - ((this.x + windowWidth / 2) - this.centerX),
                y: this.y - windowHeight
            };

            context.strokeStyle = 'rgb(0, 0 ,0)';
            context.beginPath();
            context.fillRect(windowRect.x, windowRect.y, windowWidth, windowHeight);

            var windowInner = new Sprite(STAGE_WIDTH, STAGE_HEIGHT);
            var inner = new Surface(STAGE_WIDTH, STAGE_HEIGHT);
            var innerContext = inner.context;
            windowInner.image = inner;

            innerContext.strokeStyle = 'rgb(255, 255, 255)';
            innerContext.lineWidth = 2;
            innerContext.beginPath();
            innerContext.strokeRect(windowRect.x+5, windowRect.y+5, windowWidth-10, windowHeight-10);

            var text = new Label('ようすをみている。');
            var fontSize = 12;
            text.font = fontSize + 'px';
            text.color = 'white';
            text.x = windowRect.x + 10;
            text.y = windowRect.y + windowHeight / 2 - fontSize / 2 + 1;

            consoleWindow.addChild(windowOuter);
            consoleWindow.addChild(windowInner);
            consoleWindow.addChild(text);
            core.rootScene.mainStage.addChild(consoleWindow);
            setTimeout(function() {
                core.rootScene.mainStage.removeChild(consoleWindow);
            }, 3000);
        }
    });

    /**
     * @typedef{{
     *     hp: number,      // 最大HP
     *     deffence: number // 防御力 min=1, max=100
     * }}
     */
    kariShoot.Entity.Status;
});
