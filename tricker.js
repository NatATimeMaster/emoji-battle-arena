// Tricker Character Module
// 🎃 Tricker - Single bat, trap webs, Blood Suck, and Master of Trickery clone system

class TrickerModule {
  static initializeAbilities(character) {
    if (character.emoji !== "🎃") return;
    
    character.abilityData = {
      // Bat mechanics
      bat: null, // Single bat projectile for entire match
      batSpawned: false, // Whether bat has been spawned
      
      // Trap Web mechanics
      webs: [], // Array of web positions
      lastWebTime: 0, // Last time a web was placed
      webCooldown: 600, // 10 seconds at 60fps
      lastPosition: { x: character.x, y: character.y }, // Track movement
      
      // Blood Suck mechanics
      trappedEnemies: [], // Enemies currently trapped in webs
      
      // Master of Trickery mechanics
      clone: null, // Clone character object
      cloneActive: false, // Whether clone is active
      wallBounces: 0, // Real body wall bounce count
      hasCreatedClone: false, // Whether clone has been created
      swapPositions: false, // Flag for position swapping
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🎃" || character.isDead) return;
    
    const currentTime = gameTime;
    const data = character.abilityData;
    
    // Spawn bat if not yet spawned
    if (!data.batSpawned) {
      this.spawnBat(character);
    }
    
    // Handle trap web placement
    this.handleWebPlacement(character, currentTime);
    
    // Update trapped enemies
    this.updateTrappedEnemies(character, currentTime);
    
    // Update clone
    this.updateClone(character);
    
    // Check for web collisions with enemies
    this.checkWebCollisions(character);
  }

  static spawnBat(character) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 3;
    
    // Create bat projectile
    const bat = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "🦇", 1, character, "bat",
      { 
        trickerOwner: character,
        isBloodSucking: false,
        bloodSuckTarget: null
      }
    );
    
    projectiles.push(bat);
    data.bat = bat;
    data.batSpawned = true;
    
    console.log(`Tricker spawned bat! 🦇`);
    audio.shoot();
  }

  static handleWebPlacement(character, currentTime) {
    const data = character.abilityData;
    
    // Check if Tricker has moved and if enough time has passed
    const hasMovedSignificantly = Math.hypot(
      character.x - data.lastPosition.x,
      character.y - data.lastPosition.y
    ) > 5; // Minimum movement threshold
    
    if (hasMovedSignificantly && currentTime - data.lastWebTime >= data.webCooldown) {
      this.placeWeb(character, currentTime);
    }
    
    // Update last position
    data.lastPosition = { x: character.x, y: character.y };
  }

  static placeWeb(character, currentTime) {
    const data = character.abilityData;
    
    // Create web at current position
    const web = {
      x: character.x,
      y: character.y,
      placedTime: currentTime,
      active: true
    };
    
    data.webs.push(web);
    data.lastWebTime = currentTime;
    
    console.log(`Trap web placed at (${Math.round(web.x)}, ${Math.round(web.y)})! Total webs: ${data.webs.length}`);
    audio.ability();
  }

  static checkWebCollisions(character) {
    const data = character.abilityData;
    
    // Check if any enemies stepped on webs
    charactersInArena.forEach(enemy => {
      if (enemy.team === character.team || enemy.isDead) return;
      
      data.webs.forEach((web, webIndex) => {
        if (!web.active) return;
        
        const distance = Math.hypot(enemy.x - web.x, enemy.y - web.y);
        
        if (distance < 20) { // Web trigger radius
          this.triggerBloodSuck(character, enemy, webIndex);
        }
      });
    });
  }

  static triggerBloodSuck(character, enemy, webIndex) {
    const data = character.abilityData;
    
    // Remove the web
    data.webs[webIndex].active = false;
    data.webs.splice(webIndex, 1);
    
    // Trap the enemy
    const trap = {
      enemy: enemy,
      startTime: gameTime,
      duration: 300, // 5 seconds at 60fps
      originalVx: enemy.vx,
      originalVy: enemy.vy
    };
    
    data.trappedEnemies.push(trap);
    
    // Freeze the enemy
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.frozen = true;
    enemy.frozenUntil = gameTime + trap.duration;
    
    // Make bat target this enemy
    if (data.bat) {
      data.bat.data.isBloodSucking = true;
      data.bat.data.bloodSuckTarget = enemy;
      console.log(`Blood Suck activated! ${enemy.emoji} trapped for 5 seconds!`);
    }
    
    audio.ability();
  }

  static updateTrappedEnemies(character, currentTime) {
    const data = character.abilityData;
    
    // Update trapped enemies
    data.trappedEnemies = data.trappedEnemies.filter(trap => {
      const timeElapsed = currentTime - trap.startTime;
      
      if (timeElapsed >= trap.duration) {
        // Release the enemy
        trap.enemy.frozen = false;
        trap.enemy.vx = trap.originalVx;
        trap.enemy.vy = trap.originalVy;
        
        // Stop blood sucking
        if (data.bat && data.bat.data.bloodSuckTarget === trap.enemy) {
          data.bat.data.isBloodSucking = false;
          data.bat.data.bloodSuckTarget = null;
        }
        
        console.log(`${trap.enemy.emoji} released from web trap!`);
        return false; // Remove from array
      }
      
      return true; // Keep in array
    });
  }

  static handleBatUpdate(projectile) {
    if (projectile.type !== "bat") return true;
    
    const data = projectile.data;
    
    if (data.isBloodSucking && data.bloodSuckTarget) {
      // Move directly towards trapped target
      const target = data.bloodSuckTarget;
      const dx = target.x - projectile.x;
      const dy = target.y - projectile.y;
      const distance = Math.hypot(dx, dy);
      
      if (distance < 20) {
        // Reached target - deal 5 damage
        target.takeDamage(5, projectile.owner);
        console.log(`Blood Suck complete! 5 damage to ${target.emoji}`);
        
        // Stop blood sucking and resume bouncing
        data.isBloodSucking = false;
        data.bloodSuckTarget = null;
        
        audio.hit();
      } else {
        // Move towards target
        const speed = 4;
        projectile.vx = (dx / distance) * speed;
        projectile.vy = (dy / distance) * speed;
      }
    }
    
    return true;
  }

  static handleBatWallBounce(projectile) {
    if (projectile.type !== "bat") return true;
    
    console.log(`Bat bounced off wall! 🦇`);
    audio.bounce();
    return true;
  }

  static handleBatHit(projectile, character) {
    if (projectile.type !== "bat") return;
    
    if (character === projectile.owner) return; // Bat doesn't hit Tricker
    
    // Normal bat hit - 1 damage
    character.takeDamage(1, projectile.owner);
    console.log(`Bat hit! 1 damage to ${character.emoji}`);
    
    // Bat continues bouncing (doesn't disappear)
    audio.hit();
  }

  static handleWallCollision(character, side) {
    if (character.emoji !== "🎃") return;
    
    const data = character.abilityData;
    
    // Create clone on first wall bounce
    if (!data.hasCreatedClone) {
      this.createClone(character);
      data.hasCreatedClone = true;
    }
    
    // Count wall bounces for swapping
    data.wallBounces++;
    
    // Swap positions every 3rd bounce
    if (data.wallBounces % 3 === 0 && data.cloneActive) {
      this.swapWithClone(character);
    }
  }

  static createClone(character) {
    const data = character.abilityData;
    
    // Create clone at current position
    data.clone = {
      x: character.x,
      y: character.y,
      vx: character.vx,
      vy: character.vy,
      angle: character.angle,
      size: character.size,
      team: character.team,
      opacity: 0.4 // Low visibility like a spirit
    };
    
    data.cloneActive = true;
    
    console.log(`Master of Trickery activated! Clone created! 👻`);
    audio.ability();
  }

  static updateClone(character) {
    const data = character.abilityData;
    
    if (!data.cloneActive || !data.clone) return;
    
    const clone = data.clone;
    
    // Update clone position
    clone.x += clone.vx;
    clone.y += clone.vy;
    clone.angle += 0.05;
    
    // Handle clone wall bouncing
    const canvas = document.getElementById('arena');
    const r = clone.size;
    
    if (clone.x < r) {
      clone.x = r;
      clone.vx *= -1;
    } else if (clone.x > canvas.width - r) {
      clone.x = canvas.width - r;
      clone.vx *= -1;
    }
    
    if (clone.y < r) {
      clone.y = r;
      clone.vy *= -1;
    } else if (clone.y > canvas.height - r) {
      clone.y = canvas.height - r;
      clone.vy *= -1;
    }
  }

  static swapWithClone(character) {
    const data = character.abilityData;
    
    if (!data.cloneActive || !data.clone) return;
    
    const clone = data.clone;
    
    // Store current positions and velocities
    const tempX = character.x;
    const tempY = character.y;
    const tempVx = character.vx;
    const tempVy = character.vy;
    
    // Swap positions
    character.x = clone.x;
    character.y = clone.y;
    character.vx = clone.vx;
    character.vy = clone.vy;
    
    clone.x = tempX;
    clone.y = tempY;
    clone.vx = tempVx;
    clone.vy = tempVy;
    
    console.log(`Tricker swapped places with clone! 🔄`);
    audio.ability();
  }

  static drawClone(ctx, character) {
    const data = character.abilityData;
    
    if (!data.cloneActive || !data.clone) return;
    
    const clone = data.clone;
    
    ctx.save();
    ctx.globalAlpha = clone.opacity;
    
    // Add ghostly glow
    ctx.shadowColor = "#9370db";
    ctx.shadowBlur = 15;
    
    ctx.translate(clone.x, clone.y);
    ctx.rotate(clone.angle);
    ctx.font = "32px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    ctx.fillText("🎃", 0, 0);
    
    ctx.restore();
  }

  static drawWebs(ctx, character) {
    const data = character.abilityData;
    
    data.webs.forEach(web => {
      if (!web.active) return;
      
      ctx.save();
      ctx.font = "24px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Add web glow
      ctx.shadowColor = "#8b4513";
      ctx.shadowBlur = 8;
      
      // Add pulsing effect
      const pulse = Math.sin((gameTime - web.placedTime) * 0.1) * 0.2 + 0.8;
      ctx.globalAlpha = pulse;
      
      ctx.fillText("🕸️", web.x, web.y);
      ctx.restore();
    });
  }

  static handleCharacterDeath(character) {
    // Clean up when Tricker dies
    if (character.emoji === "🎃") {
      const data = character.abilityData;
      
      // Remove bat
      if (data.bat) {
        const index = projectiles.indexOf(data.bat);
        if (index > -1) {
          projectiles.splice(index, 1);
        }
      }
      
      // Release trapped enemies
      data.trappedEnemies.forEach(trap => {
        trap.enemy.frozen = false;
        trap.enemy.vx = trap.originalVx;
        trap.enemy.vy = trap.originalVy;
      });
      
      data.trappedEnemies = [];
      data.cloneActive = false;
    }
  }

  static getStatusInfo(character) {
    if (character.emoji !== "🎃" || !character.abilityData) return null;
    
    const data = character.abilityData;
    return {
      batActive: !!data.bat,
      websPlaced: data.webs.length,
      trappedEnemies: data.trappedEnemies.length,
      cloneActive: data.cloneActive,
      wallBounces: data.wallBounces
    };
  }
}

// Bat Projectile class extension
class BatProjectile extends Projectile {
  constructor(x, y, vx, vy, emoji, damage, owner, type, data) {
    super(x, y, vx, vy, emoji, damage, owner, type, data);
  }

  update() {
    // Handle blood sucking behavior
    if (!TrickerModule.handleBatUpdate(this)) {
      return false;
    }
    
    this.x += this.vx;
    this.y += this.vy;
    this.age++;

    // Handle wall bouncing
    const margin = this.size;
    let hitWall = false;

    if (this.x <= margin) {
      this.x = margin;
      this.vx *= -1;
      hitWall = true;
    } else if (this.x >= canvas.width - margin) {
      this.x = canvas.width - margin;
      this.vx *= -1;
      hitWall = true;
    }

    if (this.y <= margin) {
      this.y = margin;
      this.vy *= -1;
      hitWall = true;
    } else if (this.y >= canvas.height - margin) {
      this.y = canvas.height - margin;
      this.vy *= -1;
      hitWall = true;
    }

    if (hitWall) {
      TrickerModule.handleBatWallBounce(this);
    }

    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.font = `${this.size * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Add bat glow effect
    if (this.data.isBloodSucking) {
      ctx.shadowColor = "#8b0000";
      ctx.shadowBlur = 12;
      // Pulsing effect during blood suck
      const pulse = Math.sin(this.age * 0.3) * 0.3 + 0.7;
      ctx.globalAlpha = pulse;
    } else {
      ctx.shadowColor = "#4b0082";
      ctx.shadowBlur = 8;
    }
    
    // Add wing flapping effect
    const flap = Math.sin(this.age * 0.4) * 0.1;
    ctx.translate(this.x, this.y);
    ctx.scale(1 + flap, 1 - flap * 0.5);
    
    ctx.fillText(this.emoji, 0, 0);
    ctx.restore();
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.TrickerModule = TrickerModule;
  window.BatProjectile = BatProjectile;
}