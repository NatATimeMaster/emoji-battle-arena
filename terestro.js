// Terestro Character Module
// 👽 Terestro - Star projectiles with Cosmic Blink and Galactic Overload

class TerestroModule {
  static initializeAbilities(character) {
    if (character.emoji !== "👽") return;
    
    character.abilityData = {
      lastStarTime: 0,
      starsFired: 0,
      starsPerBarrage: 4,
      starCooldown: 0,
      nextBarrageCooldown: 180, // 3 seconds
      
      // Galactic Overload system
      galacticOverloadReady: false,
      galacticOverloadActive: false,
      enhancedStarsHit: 0,
      requiredEnhancedHits: 3,
      overloadBarrages: 0,
      maxOverloadBarrages: 3,
      
      // Cosmic Blink system
      blinkCooldown: 0,
      blinkRadius: 48 // 3x his size (16 * 3)
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "👽" || character.isDead) return;
    
    const currentTime = gameTime;
    
    // Handle Cosmic Blink detection and cooldown
    this.updateBlinkAbility(character, currentTime);
    
    // Handle star shooting
    this.handleStarShooting(character, currentTime);
  }

  static updateBlinkAbility(character, currentTime) {
    // Reduce blink cooldown
    if (character.abilityData.blinkCooldown > 0) {
      character.abilityData.blinkCooldown--;
    }
    
    // Check for projectiles in blink radius if not on cooldown
    if (character.abilityData.blinkCooldown === 0) {
      this.checkBlinkTrigger(character);
    }
  }

  static checkBlinkTrigger(character) {
    const blinkRadius = character.abilityData.blinkRadius;
    
    // Check all projectiles for proximity
    projectiles.forEach(projectile => {
      // Skip own team's projectiles
      if (projectile.owner && projectile.owner.team === character.team) return;
      
      const distance = Math.hypot(projectile.x - character.x, projectile.y - character.y);
      if (distance <= blinkRadius) {
        this.activateCosmicBlink(character);
      }
    });
  }

  static activateCosmicBlink(character) {
    // Find the most clear area in the arena
    const clearAreas = this.findClearAreas();
    if (clearAreas.length === 0) return;
    
    const bestArea = clearAreas[0]; // Best area (highest safety score)
    
    // Flash effect
    if (character.element) {
      character.element.classList.add('blinkFlash');
      setTimeout(() => {
        character.element.classList.remove('blinkFlash');
      }, 300);
    }
    
    // Teleport to clear area
    character.x = bestArea.x;
    character.y = bestArea.y;
    character.abilityData.blinkCooldown = 600; // 10 second cooldown
    
    console.log("👽 Terestro activates Cosmic Blink!");
    audio.ability();
  }

  static findClearAreas() {
    const areas = [];
    const margin = 50;
    
    // Sample the arena in a grid
    for (let x = margin; x < canvas.width - margin; x += 50) {
      for (let y = margin; y < canvas.height - margin; y += 50) {
        let isClear = true;
        
        // Check distance from characters
        charactersInArena.forEach(char => {
          if (!char.isDead && Math.hypot(char.x - x, char.y - y) < 60) {
            isClear = false;
          }
        });
        
        // Check distance from projectiles
        projectiles.forEach(proj => {
          if (Math.hypot(proj.x - x, proj.y - y) < 40) {
            isClear = false;
          }
        });
        
        if (isClear) {
          areas.push({ x, y, safety: Math.random() });
        }
      }
    }
    
    // Sort by safety score (highest first)
    return areas.sort((a, b) => b.safety - a.safety);
  }

  static handleStarShooting(character, currentTime) {
    // Handle cooldown
    if (character.abilityData.starCooldown > 0) {
      character.abilityData.starCooldown--;
      return;
    }
    
    // Handle Galactic Overload shooting
    if (character.abilityData.galacticOverloadActive) {
      this.handleOverloadShooting(character, currentTime);
      return;
    }
    
    // Normal star shooting
    if (character.abilityData.starsFired < character.abilityData.starsPerBarrage) {
      this.shootStar(character, currentTime);
      character.abilityData.starsFired++;
      character.abilityData.starCooldown = 30; // 0.5 second between stars
      
      // If last star of barrage, apply next barrage cooldown
      if (character.abilityData.starsFired >= character.abilityData.starsPerBarrage) {
        character.abilityData.starCooldown = character.abilityData.nextBarrageCooldown;
      }
    } else {
      // Reset for next barrage
      character.abilityData.starsFired = 0;
    }
  }

  static shootStar(character, currentTime) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 4;
    
    // Determine if this is the 4th (enhanced) star
    const isEnhanced = character.abilityData.starsFired === 3; // 0,1,2,3 - so 3 is the 4th
    const emoji = isEnhanced ? "🌟" : "⭐";
    const damage = isEnhanced ? 2 : 1;
    
    // Create star projectile
    const star = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      emoji, damage, character, "star",
      {
        enhanced: isEnhanced,
        terestroOwner: character
      }
    );
    
    projectiles.push(star);
    audio.shoot();
    console.log(`👽 Terestro shoots ${emoji}!`);
  }

  static handleOverloadShooting(character, currentTime) {
    if (character.abilityData.starsFired < character.abilityData.starsPerBarrage) {
      this.shootEnhancedStar(character);
      character.abilityData.starsFired++;
      character.abilityData.starCooldown = 15; // Faster shooting during overload
    } else {
      // Barrage complete
      character.abilityData.starsFired = 0;
      character.abilityData.overloadBarrages++;
      character.abilityData.starCooldown = 60; // 1 second between overload barrages
      
      if (character.abilityData.overloadBarrages >= character.abilityData.maxOverloadBarrages) {
        this.endGalacticOverload(character);
      }
    }
  }

  static shootEnhancedStar(character) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 4;
    
    // All overload stars are enhanced
    const star = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "🌟", 2, character, "star",
      {
        enhanced: true,
        terestroOwner: character
      }
    );
    
    projectiles.push(star);
    console.log("👽 Terestro fires Galactic Overload star 🌟!");
  }

  static handleStarHit(projectile, character) {
    if (character.team === projectile.owner.team) return;
    
    // Apply damage
    character.takeDamage(projectile.damage, projectile.owner);
    console.log(`⭐ Star hit ${character.emoji} for ${projectile.damage} damage!`);
    
    // Track enhanced star hits for Galactic Overload
    if (projectile.data.enhanced) {
      this.trackEnhancedStarHit(projectile.owner);
    }
  }

  static trackEnhancedStarHit(terestro) {
    terestro.abilityData.enhancedStarsHit++;
    console.log(`👽 Enhanced stars hit: ${terestro.abilityData.enhancedStarsHit}/${terestro.abilityData.requiredEnhancedHits}`);
    
    if (terestro.abilityData.enhancedStarsHit >= terestro.abilityData.requiredEnhancedHits) {
      this.activateGalacticOverload(terestro);
    }
  }

  static activateGalacticOverload(character) {
    character.abilityData.galacticOverloadActive = true;
    character.abilityData.enhancedStarsHit = 0; // Reset counter
    character.abilityData.overloadBarrages = 0;
    character.abilityData.starsFired = 0;
    character.abilityData.starCooldown = 0; // Start immediately
    
    // Visual effect
    if (character.element) {
      character.element.classList.add('overloadPulse');
    }
    
    console.log("👽 GALACTIC OVERLOAD ACTIVATED!");
    audio.ability();
  }

  static endGalacticOverload(character) {
    character.abilityData.galacticOverloadActive = false;
    character.abilityData.nextBarrageCooldown = 300; // 5 second penalty
    character.abilityData.starCooldown = 300;
    
    // Remove visual effect
    if (character.element) {
      character.element.classList.remove('overloadPulse');
    }
    
    console.log("👽 Galactic Overload ended. Next barrage in 5 seconds.");
    
    // Reset to normal cooldown after penalty
    setTimeout(() => {
      character.abilityData.nextBarrageCooldown = 180; // Back to normal 3 seconds
    }, 5000);
  }

  static handleCharacterDeath(character) {
    if (character.emoji !== "👽") return;
    
    // Stop Galactic Overload if active
    character.abilityData.galacticOverloadActive = false;
  }
}

class StarProjectile extends Projectile {
  update() {
    return super.update();
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

window.TerestroModule = TerestroModule;