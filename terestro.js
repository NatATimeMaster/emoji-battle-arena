// Terestro Character Module
// 👽 Terestro - Star projectiles with Cosmic Blink and Galactic Overload

class TerestroModule {
  static initializeAbilities(character) {
    if (character.emoji !== "👽") return;
    
    character.abilityData = {
      // Star shooting mechanics
      starsFired: 0, // Count of stars in current barrage (0-3 normal, 4th enhanced)
      lastStarTime: 0, // Last time a star was fired
      nextBarrageTime: 0, // When next barrage can start
      starCooldown: 0, // Current cooldown between stars
      
      // Cosmic Blink mechanics
      lastBlinkTime: -600, // Last time blink was used (start ready)
      blinkRadius: character.size * 3, // Detection radius for projectiles
      
      // Galactic Overload mechanics
      enhancedStarsHitEnemies: 0, // Count of enhanced stars that hit enemies
      overloadActive: false, // Whether Galactic Overload is active
      overloadBarragesLeft: 0, // How many enhanced barrages left in overload
      overloadStarsFired: 0, // Stars fired in current overload barrage
      
      // Timing
      normalBarrageCooldown: 180, // 3 seconds between barrages
      extendedBarrageCooldown: 300, // 5 seconds after overload
      normalStarInterval: 20, // ~0.33 seconds between stars
      overloadStarInterval: 15, // Faster during overload
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "👽" || character.isDead) return;
    
    const currentTime = gameTime;
    const data = character.abilityData;
    
    // Handle Cosmic Blink detection
    this.handleCosmicBlink(character, currentTime);
    
    // Handle star shooting
    this.handleStarShooting(character, currentTime);
  }

  static handleCosmicBlink(character, currentTime) {
    const data = character.abilityData;
    const BLINK_COOLDOWN = 600; // 10 seconds at 60fps
    
    // Check if blink is on cooldown
    if (currentTime - data.lastBlinkTime < BLINK_COOLDOWN) return;
    
    // Check for projectiles within radius
    const dangerousProjectile = projectiles.find(p => {
      if (p.owner === character) return false; // Ignore own projectiles
      
      const dx = p.x - character.x;
      const dy = p.y - character.y;
      const distance = Math.hypot(dx, dy);
      
      return distance <= data.blinkRadius;
    });
    
    if (dangerousProjectile) {
      this.performCosmicBlink(character, currentTime);
    }
  }

  static performCosmicBlink(character, currentTime) {
    const data = character.abilityData;
    
    // Find the most clear area in the arena
    const newPosition = this.findClearestArea(character);
    
    // Teleport
    character.x = newPosition.x;
    character.y = newPosition.y;
    
    // Reset velocity to prevent weird movement
    character.vx *= 0.5;
    character.vy *= 0.5;
    
    // Set cooldown
    data.lastBlinkTime = currentTime;
    
    // Visual effect
    this.createBlinkEffect(character);
    
    console.log(`Cosmic Blink activated! Teleported to (${Math.round(newPosition.x)}, ${Math.round(newPosition.y)})`);
    audio.ability();
  }

  static findClearestArea(character) {
    const canvas = document.getElementById('arena');
    const margin = character.size * 2;
    const attempts = 20; // Number of positions to try
    let bestPosition = { x: character.x, y: character.y };
    let maxDistance = 0;
    
    for (let i = 0; i < attempts; i++) {
      const x = margin + Math.random() * (canvas.width - 2 * margin);
      const y = margin + Math.random() * (canvas.height - 2 * margin);
      
      // Calculate minimum distance to all threats (enemies, projectiles)
      let minThreatDistance = Infinity;
      
      // Check distance to enemies
      charactersInArena.forEach(c => {
        if (c !== character && !c.isDead && c.team !== character.team) {
          const distance = Math.hypot(x - c.x, y - c.y);
          minThreatDistance = Math.min(minThreatDistance, distance);
        }
      });
      
      // Check distance to projectiles
      projectiles.forEach(p => {
        if (p.owner !== character) {
          const distance = Math.hypot(x - p.x, y - p.y);
          minThreatDistance = Math.min(minThreatDistance, distance);
        }
      });
      
      if (minThreatDistance > maxDistance) {
        maxDistance = minThreatDistance;
        bestPosition = { x, y };
      }
    }
    
    return bestPosition;
  }

  static createBlinkEffect(character) {
    // Create visual blink effect (could be enhanced with particles)
    const canvas = document.getElementById('arena');
    const rect = canvas.getBoundingClientRect();
    
    // Simple flash effect
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.left = `${rect.left + character.x - 30}px`;
    flash.style.top = `${rect.top + character.y - 30}px`;
    flash.style.width = '60px';
    flash.style.height = '60px';
    flash.style.background = 'radial-gradient(circle, rgba(255,255,255,0.8), transparent)';
    flash.style.borderRadius = '50%';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '1000';
    flash.style.animation = 'blinkFlash 0.5s ease-out forwards';
    
    document.body.appendChild(flash);
    
    setTimeout(() => flash.remove(), 500);
  }

  static handleStarShooting(character, currentTime) {
    const data = character.abilityData;
    
    // Check if we can start a new barrage
    if (currentTime < data.nextBarrageTime) return;
    
    // Determine if we're in overload mode
    const isOverload = data.overloadActive && data.overloadBarragesLeft > 0;
    const starsInBarrage = 4;
    const starInterval = isOverload ? data.overloadStarInterval : data.normalStarInterval;
    
    // Check if we need to start a new barrage
    if (data.starsFired === 0) {
      // Starting new barrage
      data.lastStarTime = currentTime;
      data.starsFired = 0;
      
      if (isOverload) {
        data.overloadStarsFired = 0;
      }
    }
    
    // Check if it's time to fire the next star
    if (currentTime - data.lastStarTime >= starInterval) {
      this.fireStar(character, currentTime, isOverload);
      data.lastStarTime = currentTime;
      data.starsFired++;
      
      if (isOverload) {
        data.overloadStarsFired++;
      }
    }
    
    // Check if barrage is complete
    if (data.starsFired >= starsInBarrage) {
      this.completeBarrage(character, currentTime, isOverload);
    }
  }

  static fireStar(character, currentTime, isOverload) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    // Determine star type and damage
    const isEnhanced = isOverload || data.starsFired === 3; // 4th star is enhanced in normal mode
    const emoji = isEnhanced ? "🌟" : "⭐";
    const damage = isEnhanced ? 2 : 1;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 4;
    
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
    
    console.log(`${character.emoji} fired ${emoji} (${damage} damage) - Barrage: ${data.starsFired + 1}/4`);
  }

  static completeBarrage(character, currentTime, isOverload) {
    const data = character.abilityData;
    
    if (isOverload) {
      data.overloadBarragesLeft--;
      data.overloadStarsFired = 0;
      
      if (data.overloadBarragesLeft <= 0) {
        // End overload mode
        data.overloadActive = false;
        data.nextBarrageTime = currentTime + data.extendedBarrageCooldown; // 5 second cooldown
        console.log(`Galactic Overload complete! Next barrage in 5 seconds.`);
      } else {
        // Continue overload with faster cooldown
        data.nextBarrageTime = currentTime + data.normalStarInterval * 2; // Quick transition between overload barrages
        console.log(`Overload barrage complete! ${data.overloadBarragesLeft} enhanced barrages remaining.`);
      }
    } else {
      // Normal barrage complete
      data.nextBarrageTime = currentTime + data.normalBarrageCooldown; // 3 second cooldown
    }
    
    data.starsFired = 0;
  }

  static handleStarHit(projectile, character) {
    if (projectile.type !== "star" || character === projectile.owner) return;
    
    const owner = projectile.owner;
    const isEnhanced = projectile.data.enhanced;
    
    // Apply damage
    character.takeDamage(projectile.damage, owner);
    
    // Track enhanced star hits for Galactic Overload
    if (isEnhanced && owner.abilityData) {
      owner.abilityData.enhancedStarsHitEnemies++;
      console.log(`Enhanced star hit! Count: ${owner.abilityData.enhancedStarsHitEnemies}/3`);
      
      // Check for Galactic Overload trigger
      if (owner.abilityData.enhancedStarsHitEnemies >= 3) {
        this.triggerGalacticOverload(owner);
      }
    }
    
    console.log(`Star hit: ${projectile.damage} damage (${isEnhanced ? 'Enhanced' : 'Normal'})`);
  }

  static triggerGalacticOverload(terestro) {
    const data = terestro.abilityData;
    
    data.overloadActive = true;
    data.overloadBarragesLeft = 3; // 3 enhanced barrages
    data.enhancedStarsHitEnemies = 0; // Reset counter
    data.starsFired = 0; // Reset current barrage
    data.nextBarrageTime = gameTime; // Start immediately
    
    console.log(`🌟 GALACTIC OVERLOAD ACTIVATED! 🌟 - 12 enhanced stars incoming!`);
    audio.ability();
    
    // Visual effect for overload activation
    this.createOverloadEffect(terestro);
  }

  static createOverloadEffect(character) {
    const canvas = document.getElementById('arena');
    const rect = canvas.getBoundingClientRect();
    
    // Create pulsing effect around Terestro
    const overload = document.createElement('div');
    overload.style.position = 'absolute';
    overload.style.left = `${rect.left + character.x - 40}px`;
    overload.style.top = `${rect.top + character.y - 40}px`;
    overload.style.width = '80px';
    overload.style.height = '80px';
    overload.style.background = 'radial-gradient(circle, rgba(255,215,0,0.6), rgba(255,255,255,0.3), transparent)';
    overload.style.borderRadius = '50%';
    overload.style.pointerEvents = 'none';
    overload.style.zIndex = '1000';
    overload.style.animation = 'overloadPulse 2s ease-out forwards';
    
    document.body.appendChild(overload);
    
    setTimeout(() => overload.remove(), 2000);
  }

  static handleCharacterDeath(character) {
    // Clean up any Terestro-specific effects when character dies
    if (character.emoji === "👽") {
      // Reset any ongoing overload effects
      if (character.abilityData) {
        character.abilityData.overloadActive = false;
        character.abilityData.overloadBarragesLeft = 0;
      }
    }
  }
}

// Star Projectile class extension
class StarProjectile extends Projectile {
  constructor(x, y, vx, vy, emoji, damage, owner, type, data) {
    super(x, y, vx, vy, emoji, damage, owner, type, data);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;

    if (this.age > this.lifetime) {
      return false;
    }

    // Check wall collision - stars stop when hitting walls
    const margin = this.size;
    if (this.x <= margin || this.x >= canvas.width - margin ||
        this.y <= margin || this.y >= canvas.height - margin) {
      return false; // Star disappears when hitting wall
    }

    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.font = `${this.size * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Add glow effect for enhanced stars
    if (this.data.enhanced) {
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 15;
    } else {
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 8;
    }
    
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

// Add CSS animations for effects
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes blinkFlash {
      0% { 
        transform: scale(0) rotate(0deg);
        opacity: 1;
      }
      50% {
        transform: scale(1) rotate(180deg);
        opacity: 0.8;
      }
      100% { 
        transform: scale(0) rotate(360deg);
        opacity: 0;
      }
    }
    
    @keyframes overloadPulse {
      0% { 
        transform: scale(0);
        opacity: 1;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.8;
      }
      100% { 
        transform: scale(2);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Export for global access
if (typeof window !== 'undefined') {
  window.TerestroModule = TerestroModule;
  window.StarProjectile = StarProjectile;
}