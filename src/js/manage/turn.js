/**
 * @fileoverview 進行ターンを管理するクラス
 */

define(['manage/manage'], function() {
    kariShoot.manage.Turn = function() {

        /**
         * ステージに存在する（ターンが回ってくる可能性のある）Entityの一覧
         * @type {Array.<Sprite>}
         * @private
         */
        this.entities_ = [];

        /**
         * entitiesの何番目がターン番を持っているか
         * @type {number}
         * @private
         */
        this.cursor_ = 0;

        /**
         * 誰のターンか
         * @type {kariShoot.manage.Turn.TargetType
         * @private
         */
        this.target_ = kariShoot.manage.Turn.TargetType.PLAYER;


        this.scrollTarget_ = null;

        core.rootScene.addEventListener('enterframe', $.proxy(function() {
            if (this.scrollTarget_) {
                this.scrollTo(this.scrollTarget_);
            }
        }, this));
    };

    kariShoot.manage.Turn.TargetType = {
        PLAYER: 'player',
        ENEMY: 'enemy'
    };

    /**
     * @param {Sprite} entity
     */
    kariShoot.manage.Turn.prototype.addEntity = function(entity) {
        // 複数回行動 ( すばやさ100ごとに +1回行動)
        var multipleTurn = Math.floor(entity.agi / 100) || 1;

        for (var i = 0;i < multipleTurn;i++) {
            this.entities_.push(entity);
        }

        // 素早さ順に並び替え
        this.entities_.sort(function(a, b) {
            return a.agi < b.agi;
        });

        this.cursor_ = 0;
    };

    /**
     * @param {Sprite} entity
     */
    kariShoot.manage.Turn.prototype.removeEntity = function(entity) {
        var newEntities = [];
        $.each(this.entities_, $.proxy(function(index, e) {
            if (e != entity) {
                newEntities.push(e);
            }
        }, this));
        this.entities_ = newEntities;
    };

    /**
     * ターンを終了する
     * ターンが終わったSpriteがこれを呼ぶイメージ。
     */
    kariShoot.manage.Turn.prototype.end = function() {
        this.nextTurn();
        var nextEntity = this.entities_[this.cursor_];
        this.scrollTarget_ = nextEntity;
    };

    kariShoot.manage.Turn.prototype.nextTurn = function() {
        if (this.cursor_ + 1 >= this.entities_.length) {
            this.cursor_ = 0;
        } else {
            this.cursor_++;
        }
    };

    /**
     * entityのもとへスクロールする
     * @param {Sprite} entity
     */
    kariShoot.manage.Turn.prototype.scrollTo = function(entity) {
        var x = Math.min((core.width / 2 - entity.width) - entity.x, 0);
        var mainStageX = core.rootScene.mainStage.x;
        var mainStageY = core.rootScene.mainStage.y;
        var direction = 1;
        if (mainStageX + core.width < entity.x) {
            direction = -1;
        }

        var dx = 100 * direction;
        var dy = 50;// * direction;
        if ((direction > 0 && (mainStageX + dx > x) || (direction < 0 && (mainStageX + dx < x)))) {
            core.rootScene.mainStage.x = x;
            this.scrollFinishX_ = true;
        } else if (mainStageX < entity.x) {
            core.rootScene.mainStage.x += dx;
        }

        if (mainStageY + dy > 0) {
            core.rootScene.mainStage.y = 0;
            this.scrollFinishY_ = true;
        } else if (mainStageY < entity.y) {
            core.rootScene.mainStage.y += dy;
        }

        if (this.scrollFinishX_ && this.scrollFinishY_) {
            this.scrollTarget_ = null;
            this.scrollFinishX_ = false;
            this.scrollFinishY_ = false;

            // スクロール後はデフォで1秒くらい待ってから行動開始するようにする
            setTimeout(function() {
                entity.action();
            }, 1000);
        }
    };

    /**
     * singleton
     * @type {kariShoot.manage.Turn}
     * @private
     */
    kariShoot.manage.Turn.instance_ = new kariShoot.manage.Turn();

    kariShoot.manage.Turn.getInstance = function() {
        return kariShoot.manage.Turn.instance_;
    }
});