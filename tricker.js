// Tricker Character Module
// 🎃 Tricker - Single persistent bat with web traps and Master of Trickery clone system

class TrickerModule {
  static initializeAbilities(character) {
    if (character.emoji !== "🎃") return;
    
    character.abilityData = {
      batSpawned: false,
      activeBat: null,
      webPositions: [],
      lastWebTime: 0,
      webCooldown: 600, // 10 seconds
      isMoving: false,
      lastMoveTime: 0,
      
      // Master of Trickery
      cloneCreated: false,
      clonePosition: null,
      bounceCount: 0,
      
      // Blood Suck
      bloodSuckActive: false,
      bloodSuckTarget: null,
      bloodSuckStartTime: 0,
      bloodSuckDuration: 300 // 5 seconds
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🎃" || character.isDead) return;
    
    const currentTime = gameTime;
    
    // Track movement for web placement
    this.trackMovement(character, currentTime);
    
    // Spawn bat if not already spawned
    if (!character.abilityData.batSpawned) {
      this.spawnBat(character);
    }
    
    // Handle Blood Suck
    this.handleBloodSuck(character, currentTime);
  }

  static trackMovement(character, currentTime) {
    const data = character.abilityData;
    const minMovement = 0.1;
    
    // Check if character is moving
    const isMoving = Math.abs(character.vx) > minMovement || Math.abs(character.vy) > minMovement;
    
    if (isMoving && !data.isMoving) {
      data.isMoving = true;
      data.lastMoveTime = currentTime;
    } else if (!isMoving && data.isMoving) {
      data.isMoving = false;
      
      // Check if moved for 10 seconds and can place web
      const moveDuration = currentTime - data.lastMoveTime;
      if (moveDuration >= data.webCooldown) {
        this.placeWeb(character);
        data.lastMoveTime = currentTime;
      }
    }
  }

  static spawnBat(character) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2;
    
    const bat = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "🦇", 1, character, "bat",
      {
        trickerOwner: character,
        persistent: true
      }
    );
    
    projectiles.push(bat);
    character.abilityData.batSpawned = true;
    character.abilityData.activeBat = bat;
    
    console.log("🎃 Tricker spawns persistent bat!");
    audio.shoot();
  }

  static placeWeb(character) {
    const web = {
      x: character.x,
      y: character.y,
      size: 20,
      active: true
    };
    
    character.abilityData.webPositions.push(web);
    
    console.log(`🎃 Web placed at (${Math.round(web.x)}, ${Math.round(web.y)})! Total webs: ${character.abilityData.webPositions.length}`);
    audio.ability();
  }

  static handleWallCollision(character, side) {
    if (character.emoji !== "🎃") return;
    
    character.abilityData.bounceCount++;
    
    // Create clone on first border bounce
    if (!character.abilityData.cloneCreated) {
      this.createClone(character);
    }
    
    // Handle position swapping every 3rd bounce
    if (character.abilityData.bounceCount >= 3) {
      this.swapWithClone(character);
      character.abilityData.bounceCount = 0;
    }
    
    console.log(`🎃 Tricker bounced! Count: ${character.abilityData.bounceCount}`);
  }

  static createClone(character) {
    // Place clone at opposite corner of arena
    const cloneX = canvas.width - character.x;
    const cloneY = canvas.height - character.y;
    
    character.abilityData.clonePosition = {
      x: cloneX,
      y: cloneY,
      vx: -character.vx,
      vy: -character.vy
    };
    
    character.abilityData.cloneCreated = true;
    
    console.log("🎃 Master of Trickery: Clone created!");
    audio.ability();
  }

  static swapWithClone(character) {
    if (!character.abilityData.cloneCreated || !character.abilityData.clonePosition) return;
    
    const clone = character.abilityData.clonePosition;
    
    // Store current position and velocity
    const tempX = character.x;
    const tempY = character.y;
    const tempVx = character.vx;
    const tempVy = character.vy;
    
    // Swap positions
    character.x = clone.x;
    character.y = clone.y;
    character.vx = clone.vx;
    character.vy = clone.vy;
    
    // Update clone position
    clone.x = tempX;
    clone.y = tempY;
    clone.vx = tempVx;
    clone.vy = tempVy;
    
    console.log("🎃 Master of Trickery: Position swapped with clone!");
    audio.ability();
  }

  static handleBatHit(projectile, character) {
    if (character.team === projectile.owner.team) return;
    
    // Check if enemy stepped on web
    const steppedOnWeb = this.checkWebCollision(character, projectile.owner);
    
    if (steppedOnWeb) {
      this.activateBloodSuck(projectile.owner, character);
    } else {
      // Normal bat hit
      character.takeDamage(1, projectile.owner);
      console.log("🦇 Bat hit for 1 damage!");
    }
    
    audio.hit();
  }

  static checkWebCollision(enemy, tricker) {
    const data = tricker.abilityData;
    
    for (let i = 0; i < data.webPositions.length; i++) {
      const web = data.webPositions[i];
      if (!web.active) continue;
      
      const dx = enemy.x - web.x;
      const dy = enemy.y - web.y;
      const distance = Math.hypot(dx, dy);
      
      if (distance < web.size + enemy.size) {
        // Enemy stepped on web
        web.active = false;
        console.log("🕸️ Enemy stepped on web!");
        return true;
      }
    }
    
    return false;
  }

  static activateBloodSuck(tricker, enemy) {
    const data = tricker.abilityData;
    
    data.bloodSuckActive = true;
    data.bloodSuckTarget = enemy;
    data.bloodSuckStartTime = gameTime;
    
    // Trap enemy in place
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.frozenUntil = gameTime + data.bloodSuckDuration;
    enemy.isFrozen = true;
    
    console.log("🕸️ Blood Suck activated! Enemy trapped for 5 seconds!");
    audio.ability();
  }

  static handleBloodSuck(character, currentTime) {
    const data = character.abilityData;
    
    if (!data.bloodSuckActive) return;
    
    // Check if Blood Suck duration expired
    if (currentTime - data.bloodSuckStartTime >= data.bloodSuckDuration) {
      this.endBloodSuck(character);
      return;
    }
    
    // Redirect bat to attack trapped enemy
    if (data.activeBat && data.bloodSuckTarget) {
      this.redirectBatToEnemy(data.activeBat, data.bloodSuckTarget);
    }
  }

  static redirectBatToEnemy(bat, enemy) {
    // Calculate direction to enemy
    const angle = Math.atan2(enemy.y - bat.y, enemy.x - bat.x);
    const speed = 3; // Faster during Blood Suck
    
    bat.vx = Math.cos(angle) * speed;
    bat.vy = Math.sin(angle) * speed;
    bat.data.isBloodSucking = true;
    
    // Check if bat reached enemy
    const dx = bat.x - enemy.x;
    const dy = bat.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    
    if (distance < 20) {
      // Bat reached enemy - deal 5 damage
      enemy.takeDamage(5, bat.owner);
      console.log("🦇 Blood Suck complete! 5 damage dealt!");
      this.endBloodSuck(bat.owner);
    }
  }

  static endBloodSuck(character) {
    const data = character.abilityData;
    
    data.bloodSuckActive = false;
    data.bloodSuckTarget = null;
    
    // Reset bat behavior
    if (data.activeBat) {
      data.activeBat.data.isBloodSucking = false;
      // Resume normal bouncing
      const angle = Math.random() * Math.PI * 2;
      const speed = 2;
      data.activeBat.vx = Math.cos(angle) * speed;
      data.activeBat.vy = Math.sin(angle) * speed;
    }
    
    console.log("🕸️ Blood Suck ended");
  }

  static handleBatUpdate(bat) {
    // Keep bat alive (persistent)
    return true;
  }

  static handleBatWallBounce(bat) {
    // Bat bounces normally unless Blood Sucking
    if (!bat.data.isBloodSucking) {
      audio.bounce();
    }
  }

  static drawWebs(ctx, character) {
    if (character.emoji !== "🎃") return;
    
    const data = character.abilityData;
    
    data.webPositions.forEach(web => {
      if (!web.active) return;
      
      ctx.save();
      ctx.font = `${web.size}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(139, 69, 19, 0.8)";
      ctx.fillText("🕸️", web.x, web.y);
      ctx.restore();
    });
  }

  static drawClone(ctx, character) {
    if (character.emoji !== "🎃" || !character.abilityData.cloneCreated) return;
    
    const clone = character.abilityData.clonePosition;
    if (!clone) return;
    
    ctx.save();
    ctx.globalAlpha = 0.5; // Semi-transparent
    ctx.font = "32px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎃", clone.x, clone.y);
    ctx.restore();
  }

  static handleCharacterDeath(character) {
    if (character.emoji !== "🎃") return;
    
    // Remove bat when Tricker dies
    if (character.abilityData.activeBat) {
      const index = projectiles.indexOf(character.abilityData.activeBat);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
    }
    
    // End Blood Suck
    if (character.abilityData.bloodSuckActive) {
      this.endBloodSuck(character);
    }
    
    console.log("🎃 Tricker died, bat removed");
  }
}

class BatProjectile extends Projectile {
  update() {
    return super.update();
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

window.TrickerModule = TrickerModule;