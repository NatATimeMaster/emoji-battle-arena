// Grinch Character Module
// 👹 Grinch - Giant boulder splitting with blood drop healing system

class GrinchModule {
  static initializeAbilities(character) {
    if (character.emoji !== "👹") return;
    
    character.abilityData = {
      // Boulder mechanics
      lastBoulderTime: 0, // Last time a boulder was thrown
      baseCooldown: 360, // 6 seconds at 60fps
      reducedCooldown: 180, // 3 seconds at 60fps (50% reduction)
      currentCooldown: 360, // Current cooldown being used
      
      // Blood drop mechanics
      bloodDrops: [], // Array of blood drops in arena
      bloodDropsCollected: 0, // Total blood drops collected
      bloodDropLifetime: 300, // 5 seconds at 60fps
      cooldownReduced: false, // Whether cooldown has been reduced
      
      // Boulder size references
      giantBoulderSize: character.size * 2, // Giant boulder is 2x character size
      boulderSize: character.size, // Boulder is 50% of giant (same as character)
      rockSize: character.size * 0.5, // Rock is 25% of giant (50% of character)
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "👹" || character.isDead) return;
    
    const currentTime = gameTime;
    const data = character.abilityData;
    
    // Handle boulder throwing
    this.handleBoulderThrowing(character, currentTime);
    
    // Update blood drops
    this.updateBloodDrops(character, currentTime);
    
    // Check for blood drop collection
    this.checkBloodDropCollection(character);
  }

  static handleBoulderThrowing(character, currentTime) {
    const data = character.abilityData;
    
    // Check if cooldown has passed
    if (currentTime - data.lastBoulderTime >= data.currentCooldown) {
      this.throwGiantBoulder(character, currentTime);
    }
  }

  static throwGiantBoulder(character, currentTime) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 2.5;
    
    // Create giant boulder projectile
    const giantBoulder = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "🪨", 8, character, "giantboulder",
      { 
        grinchOwner: character,
        size: data.giantBoulderSize,
        boulderType: "giant",
        bloodDrops: 4,
        splitCount: 0
      }
    );
    
    projectiles.push(giantBoulder);
    data.lastBoulderTime = currentTime;
    
    console.log(`Grinch threw giant boulder! 🪨 (Size: ${data.giantBoulderSize})`);
    audio.shoot();
  }

  static handleBoulderHit(projectile, character) {
    if (!this.isBoulderType(projectile.type)) return;
    
    const owner = projectile.owner;
    const data = projectile.data;
    
    if (character === owner) return; // Boulders don't hit Grinch
    
    // Apply damage based on boulder type
    let damage = 0;
    let bloodDropCount = 0;
    
    switch (data.boulderType) {
      case "giant":
        damage = 8;
        bloodDropCount = 4;
        break;
      case "boulder":
        damage = 4;
        bloodDropCount = 2;
        break;
      case "rock":
        damage = 2;
        bloodDropCount = 1;
        break;
    }
    
    character.takeDamage(damage, owner);
    
    // Spawn blood drops at hit location
    this.spawnBloodDrops(character.x, character.y, bloodDropCount, owner);
    
    console.log(`${data.boulderType} hit! ${damage} damage, ${bloodDropCount} blood drops spawned`);
    
    // Remove the boulder
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
    
    audio.hit();
  }

  static handleBoulderWallBounce(projectile) {
    if (!this.isBoulderType(projectile.type)) return false;
    
    const data = projectile.data;
    
    // Split boulder based on type
    if (data.boulderType === "giant") {
      this.splitGiantBoulder(projectile);
    } else if (data.boulderType === "boulder") {
      this.splitBoulder(projectile);
    } else if (data.boulderType === "rock") {
      // Rocks vanish when hitting border
      console.log(`Rock vanished on border hit! 🪨`);
      const index = projectiles.indexOf(projectile);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
      return false;
    }
    
    // Remove original boulder after splitting
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
    
    audio.bounce();
    return false; // Original boulder is removed
  }

  static splitGiantBoulder(projectile) {
    const data = projectile.data;
    const owner = data.grinchOwner;
    
    // Create 2 boulders (50% of giant size)
    const speed = 2;
    const angles = [
      Math.atan2(projectile.vy, projectile.vx) + Math.PI / 4,
      Math.atan2(projectile.vy, projectile.vx) - Math.PI / 4
    ];
    
    angles.forEach(angle => {
      const boulder = new Projectile(
        projectile.x, projectile.y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        "🪨", 4, owner, "boulder",
        { 
          grinchOwner: owner,
          size: owner.abilityData.boulderSize,
          boulderType: "boulder",
          bloodDrops: 2,
          splitCount: 1
        }
      );
      
      projectiles.push(boulder);
    });
    
    console.log(`Giant boulder split into 2 boulders! 🪨🪨`);
  }

  static splitBoulder(projectile) {
    const data = projectile.data;
    const owner = data.grinchOwner;
    
    // Create 2 rocks (25% of giant size = 50% of boulder size)
    const speed = 1.5;
    const angles = [
      Math.atan2(projectile.vy, projectile.vx) + Math.PI / 3,
      Math.atan2(projectile.vy, projectile.vx) - Math.PI / 3
    ];
    
    angles.forEach(angle => {
      const rock = new Projectile(
        projectile.x, projectile.y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        "🪨", 2, owner, "rock",
        { 
          grinchOwner: owner,
          size: owner.abilityData.rockSize,
          boulderType: "rock",
          bloodDrops: 1,
          splitCount: 2
        }
      );
      
      projectiles.push(rock);
    });
    
    console.log(`Boulder split into 2 rocks! 🪨🪨`);
  }

  static spawnBloodDrops(x, y, count, grinch) {
    const data = grinch.abilityData;
    
    for (let i = 0; i < count; i++) {
      // Spawn blood drops in a small radius around hit location
      const offsetX = (Math.random() - 0.5) * 40;
      const offsetY = (Math.random() - 0.5) * 40;
      
      const bloodDrop = {
        x: x + offsetX,
        y: y + offsetY,
        spawnTime: gameTime,
        collected: false,
        grinchOwner: grinch
      };
      
      data.bloodDrops.push(bloodDrop);
    }
    
    console.log(`${count} blood drops spawned at (${Math.round(x)}, ${Math.round(y)})`);
  }

  static updateBloodDrops(character, currentTime) {
    const data = character.abilityData;
    
    // Remove expired blood drops
    data.bloodDrops = data.bloodDrops.filter(drop => {
      const age = currentTime - drop.spawnTime;
      if (age >= data.bloodDropLifetime) {
        console.log(`Blood drop expired after 5 seconds 🩸`);
        return false;
      }
      return true;
    });
  }

  static checkBloodDropCollection(character) {
    const data = character.abilityData;
    
    // Check if Grinch is touching any blood drops
    data.bloodDrops.forEach((drop, index) => {
      if (drop.collected) return;
      
      const distance = Math.hypot(character.x - drop.x, character.y - drop.y);
      
      if (distance < 25) { // Collection radius
        this.collectBloodDrop(character, index);
      }
    });
  }

  static collectBloodDrop(character, dropIndex) {
    const data = character.abilityData;
    const drop = data.bloodDrops[dropIndex];
    
    if (drop.collected) return;
    
    // Mark as collected and remove
    drop.collected = true;
    data.bloodDrops.splice(dropIndex, 1);
    
    // Heal Grinch
    character.heal(3);
    data.bloodDropsCollected++;
    
    console.log(`Blood drop collected! +3 HP. Total collected: ${data.bloodDropsCollected}/10`);
    
    // Check for cooldown reduction
    if (data.bloodDropsCollected >= 10 && !data.cooldownReduced) {
      data.cooldownReduced = true;
      data.currentCooldown = data.reducedCooldown;
      console.log(`🩸 Bloodlust achieved! Boulder cooldown reduced to 3 seconds! 🩸`);
      audio.ability();
    }
    
    audio.hit();
  }

  static drawBloodDrops(ctx, character) {
    const data = character.abilityData;
    
    data.bloodDrops.forEach(drop => {
      if (drop.collected) return;
      
      ctx.save();
      ctx.font = "20px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Add blood glow
      ctx.shadowColor = "#8b0000";
      ctx.shadowBlur = 8;
      
      // Add pulsing effect
      const age = gameTime - drop.spawnTime;
      const pulse = Math.sin(age * 0.2) * 0.3 + 0.7;
      ctx.globalAlpha = pulse;
      
      // Fade out as it approaches expiration
      const fadeStart = data.bloodDropLifetime * 0.7; // Start fading at 70% lifetime
      if (age > fadeStart) {
        const fadeProgress = (age - fadeStart) / (data.bloodDropLifetime - fadeStart);
        ctx.globalAlpha *= (1 - fadeProgress);
      }
      
      ctx.fillText("🩸", drop.x, drop.y);
      ctx.restore();
    });
  }

  static isBoulderType(type) {
    return type === "giantboulder" || type === "boulder" || type === "rock";
  }

  static handleCharacterDeath(character) {
    // Clean up when Grinch dies
    if (character.emoji === "👹") {
      const data = character.abilityData;
      
      // Remove all blood drops
      data.bloodDrops = [];
      
      // Remove all boulder projectiles
      projectiles = projectiles.filter(p => {
        if (this.isBoulderType(p.type) && p.owner === character) {
          return false;
        }
        return true;
      });
    }
  }

  static getStatusInfo(character) {
    if (character.emoji !== "👹" || !character.abilityData) return null;
    
    const data = character.abilityData;
    return {
      bloodDropsCollected: data.bloodDropsCollected,
      activeBloodDrops: data.bloodDrops.length,
      cooldownReduced: data.cooldownReduced,
      currentCooldown: data.currentCooldown / 60 // Convert to seconds
    };
  }
}

// Boulder Projectile class extension
class BoulderProjectile extends Projectile {
  constructor(x, y, vx, vy, emoji, damage, owner, type, data) {
    super(x, y, vx, vy, emoji, damage, owner, type, data);
    this.size = data.size; // Override size based on boulder type
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;

    // Handle wall bouncing and splitting
    const margin = this.size / 2;
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
      return GrinchModule.handleBoulderWallBounce(this);
    }

    return true;
  }

  draw(ctx) {
    ctx.save();
    
    // Scale font based on boulder size
    const fontSize = this.size * 1.5;
    ctx.font = `${fontSize}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Add boulder glow effect based on type
    if (this.data.boulderType === "giant") {
      ctx.shadowColor = "#8b4513";
      ctx.shadowBlur = 15;
    } else if (this.data.boulderType === "boulder") {
      ctx.shadowColor = "#8b4513";
      ctx.shadowBlur = 10;
    } else if (this.data.boulderType === "rock") {
      ctx.shadowColor = "#8b4513";
      ctx.shadowBlur = 5;
    }
    
    // Add rotation effect
    const rotation = this.age * 0.05;
    ctx.translate(this.x, this.y);
    ctx.rotate(rotation);
    
    ctx.fillText(this.emoji, 0, 0);
    ctx.restore();
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  window.GrinchModule = GrinchModule;
  window.BoulderProjectile = BoulderProjectile;
}