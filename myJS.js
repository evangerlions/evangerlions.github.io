var CanvasWidth = 720;
var CanvasHeight = 900;
var SPRITE_AIM = 8;

var BOX_WIDTH = 60; // Box's width length, used to random add box.
var BOX_HEIGHT = 120;
var locationX = BOX_WIDTH * 1.5; // New box's location X, used to random add box, will change when add box.
var locationY = BOX_HEIGHT * 0.5; // This value doesn't change.
var sleepTimeLimit = 0.25; //  Add box per row, sleep this time.
var sleepTimeNow = 0; // How long has it sleep.
var WeaponInterval = 0.5;   //  Weapon interval, Using seconds
var WeaponIntervalNow = 99;  //  How long has it elapse from last shoot,Using seconds

var SCORE = 0; //  Player's scroll in this game.
var BEST = 0; // Player's best scroll in history.

var TIME = 30;  // Time limit in one game.
var currentTime = 30; // This game's current time.

var isGaming = false;

//  Audio files
var shootAudio;
var breakAudio;
var startAudio;
$(document).ready(function () {
  
  shootAudio = document.getElementById("shoot_audio");
  breakAudio = document.getElementById("break_audio");
  startAudio = document.getElementById("start_audio");

  var canvas = document.getElementById("Main");
  canvas.width = CanvasWidth;
  canvas.height = CanvasHeight;
  Q = Quintus()
    .include("Sprites, Scenes, Input, 2D, Touch, UI, Anim")
    .setup('Main')
    .controls()
    .touch();
  Q.gravityY = 1000;
  Q.input.mouseControls();
  Q.Sprite.extend("background", {
    init: function (p) {
      this._super(p, {
        asset: "background.png",
        type: Q.SPRITE_NONE,
        collisionMask: Q.SPRITE_NONE,
        x: 0,
        y: 0,
        cx: 0,
        cy: 0
      });
    }
  });
  Q.Sprite.extend("defaultBox", {
    init: function (p) {
      this._super(p, {
        asset: "default.png",
        boxType: "box",
        collisionMask: Q.SPRITE_DEFAULT,
        x: 0,
        y: 0,
        score: 10,
        health: 1,
        hasSearched: 0, // Used for connection destroy, prevent search itself.
      });
      this.add("2d");
    },

  });
  Q.Sprite.extend("grey", {
    init: function (p) {
      this._super(p, {
        asset: "grey.png",
        boxType: "box",
        collisionMask: Q.SPRITE_DEFAULT,
        x: 0,
        y: 0,
        score: 15,
        health: 2,
        hasSearched: 0, // Used for connection destroy, prevent search itself.
      });
      this.add("2d");
      this.on("landing", this, "collision");
    },
    collison: function (col) {

    },
  });
  Q.Sprite.extend("red", {
    init: function (p) {
      this._super(p, {
        asset: "red.png",
        boxType: "box",
        collisionMask: Q.SPRITE_DEFAULT,
        x: 0,
        y: 0,
        score: 50,
        health: 2,
        hasSearched: 0, // Used for connection destroy, prevent search itself.
      });
      this.add("2d");
    },
  });
  Q.Sprite.extend("x", {
    init: function (p) {
      this._super(p, {
        asset: "x.png",
        boxType: "xBox",
        collisionMask: Q.SPRITE_DEFAULT,
        x: 0,
        y: 0,
        score: -100,
        health: 1,
      });
      this.add("2d");
    },
    step: function () {
      if (this.p.y >= CanvasHeight - 120) {
        this.destroy();
      }
    },
  });
  Q.Sprite.extend("time", {
    init: function (p) {
      this._super(p, {
        asset: "time.png",
        boxType: "timeBox",
        collisionMask: Q.SPRITE_DEFAULT,
        x: 0,
        y: 0,
        score: 0,
        health: 1,
        addTime: 2
      });
      this.add("2d");
    },
    step: function () {
      if (this.p.y >= CanvasHeight - 120) {
        this.destroy();
      }
    },
  });
  Q.Sprite.extend("yellow", {
    init: function (p) {
      this._super(p, {
        asset: "yellow.png",
        boxType: "box",
        collisionMask: Q.SPRITE_DEFAULT,
        x: 0,
        y: 0,
        score: 20,
        health: 1,
        hasSearched: 0, // Used for connection destroy, prevent search itself.
      });
      this.add("2d");
    },
  });
  Q.Sprite.extend("floor", {
    init: function (p) {
      this._super(p, {
        asset: "floor.png",
        x: 360,
        y: CanvasHeight - 30,
      });
      // this.add("2d");
      // this.p.gravityY = 0;
    },
  });
  Q.Sprite.extend("aim", {
    init: function (p) {
      this._super(p, {
        asset: "aim.png",
        collisionMask: Q.SPRITE_NONE,
        x: 0,
        y: 0,
      });
    },

    step: function (dt) {
      //  prevent aim up to mask container.

      this.p.x = Q.inputs['mouseX'];
      if (Q.inputs['mouseY'] <= BOX_HEIGHT) {
        this.p.y = BOX_HEIGHT;
      } else {

        this.p.y = Q.inputs['mouseY'];
      }
    }
  });
  Q.Sprite.extend("hole", {
    init: function (p) {
      this._super(p, {
        asset: "hole.png",
        collisionMask: Q.SPRITE_NONE,
        x: 0,
        y: 0,
      });
    },
    setLocation: function (x, y) {
      this.p.x = x;
      this.p.y = y;
      setTimeout(() => {
        this.p.x = 9999;
      }, 500);
    }
  });
  Q.Sprite.extend("addBox", {
    init: function (p) {
      this._super(p, {
        x: 0,
        y: 0,
      });
    },

    step: function (dt) {
      //  handle weapon interval.
      WeaponIntervalNow += dt;
      // end 

      //  Constrain gaming place, prevent add box on two sides of canvas about 2 box width.
      var stage = Q.stage();
      if (locationX > CanvasWidth - (BOX_WIDTH * 1.5)) {
        // Sleep sometime.
        if (sleepTimeNow > sleepTimeLimit) {
          locationX = BOX_WIDTH * 1.5;
          sleepTimeNow = 0;
        } else {
          sleepTimeNow += dt;
        }
        return;
      }
      var obj = stage.locate(locationX, locationY, Q.SPRITE_DEFAULT);
      //  If here is no box, add one.
      if (!obj) {
        var randomA = Math.random() * 20; //  random  between 0-19. 5% Time, 30% default, 10% grey, 30% yellow, 20% red, 5% x.
        randomA = parseInt(randomA);
        if (randomA == 0) {
          stage.insert(new Q.time({ x: locationX }));
        } else if (randomA >= 1 && randomA <= 6) {
          stage.insert(new Q.defaultBox({ x: locationX }));
        } else if (randomA >= 7 && randomA <= 8) {
          stage.insert(new Q.grey({ x: locationX }));
        } else if (randomA >= 9 && randomA <= 14) {
          stage.insert(new Q.yellow({ x: locationX }));
        } else if (randomA >= 15 && randomA <= 18) {
          stage.insert(new Q.red({ x: locationX }));
        } else if (randomA == 19) {
          stage.insert(new Q.x({ x: locationX }));
        } else {
          console.log("ERROR, wrong random");
        }
        /*
        switch (randomA) {
          case 0:
            stage.insert(new Q.defaultBox({ x: locationX }));
            break;
          case 1:
            stage.insert(new Q.defaultBox({ x: locationX }));
            break;
          case 2:
            stage.insert(new Q.defaultBox({ x: locationX }));
            break;
          case 3:
            stage.insert(new Q.yellow({ x: locationX }));
            break;
          case 4:
            stage.insert(new Q.red({ x: locationX }));
            break;
          case 5:
            stage.insert(new Q.x({ x: locationX }));
            break;
          case 6:
            stage.insert(new Q.time({ x: locationX }));
            break;
          case 7:
            stage.insert(new Q.yellow({ x: locationX }));
            break;
          case 8:
            stage.insert(new Q.defaultBox({ x: locationX }));
            break;
          case 9:
            stage.insert(new Q.grey({ x: locationX }));
            break;
          default:
            break;
        }
        */

      }
      locationX = locationX + BOX_WIDTH;
    }
  });
  // When game start, some boxes may add to left side of canvas, doesn't know reason, so add check.
  Q.Sprite.extend("checkBox", {
    init: function (p) {
      this._super(p, {
        x: 0,
        y: 0,
      });
    },

    step: function (dt) {
      //  Constrain gaming place, prevent add box on two sides of canvas about 2 box width. Now judge box init addition is over or not.
      var stage = Q.stage();
      // Hardcode.
      // Destroy itself when very right column all hava boxes.
      for (var i = 30; i <= 870; i = i + BOX_HEIGHT) {
        if (!stage.locate(630, i, Q.SPRITE_DEFAULT)) {
          break;
        } else if (i == 870) {
          isGaming = true;
          this.destroy();
        }
      }
      /*
      var obj;
      obj = stage.locate(0, CanvasHeight - 90);
      if (obj) {
        obj.destroy();
      }
      obj = stage.locate(30, CanvasHeight - 90);
      if (obj) {
        obj.destroy();
      }
      obj = stage.locate(60, CanvasHeight - 90);
      if (obj) {
        obj.destroy();
      }
      obj = stage.locate(0, CanvasHeight - 150);
      if (obj) {
        obj.destroy();
      }
      obj = stage.locate(30, CanvasHeight - 150);
      if (obj) {
        obj.destroy();
      }
      obj = stage.locate(60, CanvasHeight - 150);
      if (obj) {
        obj.destroy();
      }
      */
    }
  });


  Q.UI.Text.extend("TimeController", {
    init: function (p) {
      this._super({
        label: "Time: 30s",
        color: "black",
        x: 0,
        y: 0,
      });
    },
    step: function (dt) {
      if (!isGaming) {
        return;
      }
      currentTime -= dt;
      this.p.label = "Time: " + Math.round(currentTime) + "s";
      if (currentTime <= 0) {
        isGaming = false;
        Q.clearStage(1);
        Q.clearStage(2);

        Q.stageScene("endGame", 2);
      }
    },
  });

  //  Masking the very top row, remind preventing shoot them.
  Q.UI.Container.extend("MaskContainer", {
    init: function (p) {
      this._super({
        x: 0,
        y: 0,
        fill: "rgba(67,67,67,0.7)",
      });
    }
  });

  Q.UI.Container.extend("TimeContainer", {
    init: function (p) {
      this._super({
        x: Q.width / 2,
        y: 50,
        fill: "gray",
        border: 5,
        shadow: 10,
        shadowColor: "rgba(0,0,0,0.5)",
      });
    }
  });

  Q.UI.Text.extend("Score", {
    init: function (p) {
      this._super({
        label: "Scroll: 0\nBest: 0",
        color: "white",
        x: 0,
        y: 0,
      });
    },
    step: function (dt) {
      ChangeScore(this, SCORE, BEST);
    },
  });
  Q.UI.Container.extend("ScoreContainer", {
    init: function (p) {
      this._super({
        x: 125,
        y: 50,
        fill: "gray",
        border: 5,
        shadow: 10,
        shadowColor: "rgba(0,0,0,0.5)",
      });
    }
  });
  Q.UI.Button.extend("startButton", {
    init: function (p) {
      this._super({
        asset: "start_button.png",
        x: Q.width / 2,
        y: Q.height - 290 / 2,
        type: Q.SPRITE_UI,
      }, function () {
        Q.clearStages();

        startAudio.currentTime = 0;
        startAudio.play();
        
        Q.stageScene("Gaming");
        Q.stageScene("Aim", 1);
        Q.stageScene("UI", 2);
      });
    },
  });
  Q.Sprite.extend("startScene", {
    init: function (p) {
      this._super(p, {
        asset: "start_scene.png",
        x: Q.width / 2,
        y: Q.height / 2,
      });
    },
  });
  Q.Sprite.extend("cursor", {
    init: function (p) {
      this._super(p, {
        asset: "cursor.png",
        x: 0,
        y: 0,
        cx: 0,
        cy: 0,
      });
    },

    step: function (dt) {
      this.p.x = Q.inputs['mouseX'];
      this.p.y = Q.inputs['mouseY'];
    }
  });
  Q.scene("Start", function (stage) {
    if (!localStorage.getItem("best")) {
      localStorage.setItem("best", 0);
    } else {
      BEST = parseInt(localStorage.getItem("best"));
    }
    var startScene = stage.insert(new Q.startScene());
    var startButton = stage.insert(new Q.startButton());
    var cursor = stage.insert(new Q.cursor());
    // Q.debug = true;
    // Q.debugFill = true;
  });
  Q.scene("Gaming", function (stage) {
    // var defaultBox = stage.insert(new Q.defaultBox({ x: 180 }));
    // var grey = stage.insert(new Q.grey({ x: 30 }));
    // var red = stage.insert(new Q.red({ x: 60 }));
    // var x = stage.insert(new Q.x({ x: 90 }));
    // var time = stage.insert(new Q.time({ x: 120 }));
    var background = stage.insert(new Q.background());
    var floor = stage.insert(new Q.floor());
    // var yellow = stage.insert(new Q.yellow({ x: 150 }));
    var addBox = stage.insert(new Q.addBox());
    var checkBox = stage.insert(new Q.checkBox());
  });


  Q.scene("Aim", function (stage) {
    var hole = stage.insert(new Q.hole());
    hole.p.x = 9999;  // Make bullet hole invisible.
    var aim = stage.insert(new Q.aim());
  });
  Q.scene("UI", function (stage) {
    var MaskContainer = stage.insert(new Q.MaskContainer());
    var label = MaskContainer.insert(new Q.UI.Text({
      x: 0, y: 0,
      label: " "
    }), MaskContainer);
    MaskContainer.fit(BOX_HEIGHT - 15, Q.width);
    var ScoreContainer = stage.insert(new Q.ScoreContainer());
    var Score = stage.insert(new Q.Score(), ScoreContainer);
    ScoreContainer.fit(20, 60);
    var TimeContainer = stage.insert(new Q.TimeContainer());
    var TimeController = stage.insert(new Q.TimeController(), TimeContainer);
    TimeContainer.fit(10, 10)
  });

  Q.scene("endGame", function (stage) {
    if (parseInt(localStorage.getItem("best")) < SCORE) {
      BEST = SCORE;
      localStorage.setItem("best", SCORE);
    }

    var container = stage.insert(new Q.UI.Container({
      x: Q.width / 2, y: Q.height / 2, fill: "rgba(255,255,255,0.8)",
      border: 5,
      shadow: 10,
      shadowColor: "rgba(0,0,0,0.5)",
    }));

    var button = container.insert(new Q.UI.Button({
      x: 0, y: 20, fill: "#EE7600",
      label: "Play Again",

    }));
    // Rank score.
    var rankWord = "Rank: ";
    if (SCORE < 2000) {
      rankWord += "Bronze";
    } else if (SCORE < 2500) {
      rankWord += "Silver";
    } else if (SCORE < 3000) {
      rankWord += "Gold";
    } else if (SCORE < 3500) {
      rankWord += "Platnum";
    } else if (SCORE < 4000) {
      rankWord += "Diamond";
    } else if (SCORE < 4500) {
      rankWord += "Master";
    } else {
      rankWord += "Challenger";
    }
    var label = container.insert(new Q.UI.Text({
      x: 10, y: -20 - button.p.h,
      label: rankWord + "\nScore: " + SCORE + "\nBest: " + BEST
    }), container);
    container.fit(50);
    var cursor = stage.insert(new Q.cursor());
    button.on("click", function () {
      currentTime = TIME;
      SCORE = 0;

      startAudio.currentTime = 0;
      startAudio.play();

      Q.clearStages();
      locationX = BOX_WIDTH * 1.5;
      Q.stageScene("Gaming");
      Q.stageScene("Aim", 1);
      Q.stageScene("UI", 2);
    });
  });

  Q.load("default.png,floor.png,red.png,grey.png,x.png,time.png,yellow.png,aim.png,start_scene.png,start_button.png, cursor.png,hole.png,background.png", function () {
    Q.stageScene("Start");
  });
  // Handle shoot action.
  Q.el.addEventListener('click', function (e) {
    //   Haven't prepare next shoot.
    if (WeaponIntervalNow <= WeaponInterval || !isGaming) {
      return;
    } else {
      //  It's time to shoot.
      WeaponIntervalNow = 0;
    }
    //  Locate object where clicked.
    var x = e.offsetX || e.layerX,
      y = e.offsetY || e.layerY,
      stage = Q.stage(0);
    var stageX = Q.canvasToStageX(x, stage),
      stageY = Q.canvasToStageY(y, stage);

    //  Prevent shoot up to mask container.      
    if (stageY < BOX_HEIGHT) {
      return;
    }
    shootAudio.currentTime = 0;
    shootAudio.play();
    var obj = stage.locate(stageX, stageY, Q.SPRITE_DEFAULT);
    //  Draw bullet hole.
    var hole = Q("hole", 1).first();
    hole.setLocation(stageX, stageY);
    if (obj) {
      //  Exclude floor.
      if (obj.p.asset != "floor.png") {
        if (obj.p.boxType == "box") {
          //  Collection destroy on Boxes.
          obj.p.health -= 1;
          if (obj.p.health <= 0) {
            connectionDestroy(obj, Q);
          }
        } else if (obj.p.boxType == "xBox") {
          SCORE += obj.p.score;  // Execute sup score.
          obj.destroy();
        } else if (obj.p.boxType == "timeBox") {
          currentTime += obj.p.addTime;
          obj.destroy();
        } else {
          //console.log("Error! Unknown boxType of box");
        }
      }
    }
  });
  // If cursor is over the start button, scale it.
  Q.el.addEventListener('mousemove', function (e) {
    // If game began, just return.
    if (isGaming) {
      return;
    }
    var x = e.offsetX || e.layerX,
      y = e.offsetY || e.layerY,
      stage = Q.stage();

    var stageX = Q.canvasToStageX(x, stage),
      stageY = Q.canvasToStageY(y, stage);
    var obj = stage.locate(stageX, stageY, Q.SPRITE_UI);
    if (!obj) {
      var startButton = Q("startButton").first();
      if (startButton) {
        startButton.p.scale = 1.0;
      }
      return;
    }
    if (obj.p.asset == "start_button.png") {
      obj.p.scale = 1.2;
    } else {
      obj.p.scale = 1.0;
    }
  });
});
/// tag used to prevent search it's father. value 0,1,2,3,4
function connectionDestroy(box, Q) {
  var tempX = box.p.x;
  box.p.hasSearched = 1;
  setTimeout(() => {
    breakAudio.currentTime = 0;
    breakAudio.play();
    box.p.x = 9999; //  Make it invisible, and later destroy.
    SCORE += box.p.score;  //Execute add score.
    var obj;

    obj = Q.stage().locate(tempX, box.p.y + BOX_HEIGHT, Q.SPRITE_DEFAULT);
    if (obj && obj.p.asset == box.p.asset && obj.p.hasSearched == 0) {
      connectionDestroy(obj, Q);
    }

    obj = Q.stage().locate(tempX, box.p.y - BOX_HEIGHT, Q.SPRITE_DEFAULT);
    if (obj && obj.p.asset == box.p.asset && obj.p.hasSearched == 0) {
      connectionDestroy(obj, Q);
    }

    obj = Q.stage().locate(tempX + BOX_WIDTH, box.p.y, Q.SPRITE_DEFAULT);
    if (obj && obj.p.asset == box.p.asset && obj.p.hasSearched == 0) {
      connectionDestroy(obj, Q);
    }

    obj = Q.stage().locate(tempX - BOX_WIDTH, box.p.y, Q.SPRITE_DEFAULT);
    if (obj && obj.p.asset == box.p.asset && obj.p.hasSearched == 0) {
      connectionDestroy(obj, Q);
    }
    box.destroy();
  }, 100);
}
function ChangeScore(obj, score, best) {
  obj.p.label = "Score: " + score + "\nBest: " + best;
};
