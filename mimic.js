// Mimic Character Module
// 🤡 Mimic - Red ball bouncing with Greatest Mimicry transformation

class MimicModule {
  static initializeAbilities(character) {
    if (character.emoji !== "🤡") return;
    
    character.abilityData = {
      // Red ball mechanics
      activeBall: null, // Current red ball projectile
      ballBounces: 0, // Current bounce count for active ball
      ballActive: false, // Whether a ball is currently active
      
      // Greatest Mimicry mechanics
      originalEmoji: "🤡", // Store original emoji
      mimicForm: null, // Current mimic target emoji
      mimicStartTime: 0, // When mimicry started
      mimicDuration: 300, // 5 seconds at 60fps
      mimicCooldownStart: 0, // When cooldown started
      mimicCooldownDuration: 600, // 10 seconds at 60fps
      isMimicking: false, // Whether currently in mimic form
      mimicOnCooldown: false, // Whether mimicry is on cooldown
      
      // Balloon mechanics (during mimicry)
      balloonsThrown: 0, // Number of balloons thrown in current mimicry
      maxBalloons: 5, // Max balloons per mimicry
      lastBalloonTime: 0, // Last time a balloon was thrown
      balloonInterval: 60, // 1 second between balloons
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🤡" && !character.abilityData.isMimicking) return;
    if (character.isDead) return;
    
    const currentTime = gameTime;
    const data = character.abilityData;
    
    // Handle mimicry duration and cooldown
    this.handleMimicryStates(character, currentTime);
    
    if (data.isMimicking) {
      // In mimicry form - throw balloons
      this.handleBalloonThrowing(character, currentTime);
    } else {
      // Normal form - handle red ball
      this.handleRedBall(character, currentTime);
    }
  }

  static handleMimicryStates(character, currentTime) {
    const data = character.abilityData;
    
    // Check if mimicry should end
    if (data.isMimicking && currentTime - data.mimicStartTime >= data.mimicDuration) {
      this.endMimicry(character, currentTime);
    }
    
    // Check if cooldown should end
    if (data.mimicOnCooldown && currentTime - data.mimicCooldownStart >= data.mimicCooldownDuration) {
      data.mimicOnCooldown = false;
      console.log(`Mimic cooldown ended! Greatest Mimicry ready.`);
    }
  }

  static handleRedBall(character, currentTime) {
    const data = character.abilityData;
    
    // Throw new ball if none is active
    if (!data.ballActive) {
      this.throwRedBall(character);
    }
  }

  static throwRedBall(character) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 4;
    
    // Create red ball projectile
    const ball = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "🔴", 1, character, "redball",
      { 
        mimicOwner: character,
        bounceCount: 0,
        maxBounces: 10
      }
    );
    
    projectiles.push(ball);
    data.activeBall = ball;
    data.ballActive = true;
    data.ballBounces = 0;
    
    console.log(`Mimic threw red ball! 🔴`);
    audio.shoot();
  }

  static handleBalloonThrowing(character, currentTime) {
    const data = character.abilityData;
    
    // Check if can throw more balloons
    if (data.balloonsThrown >= data.maxBalloons) return;
    
    // Check cooldown
    if (currentTime - data.lastBalloonTime < data.balloonInterval) return;
    
    this.throwBalloon(character, currentTime);
  }

  static throwBalloon(character, currentTime) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 3;
    
    // Create balloon projectile
    const balloon = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "🎈", 3, character, "balloon",
      { 
        mimicOwner: character
      }
    );
    
    projectiles.push(balloon);
    data.balloonsThrown++;
    data.lastBalloonTime = currentTime;
    
    console.log(`Mimic threw balloon! ${data.balloonsThrown}/${data.maxBalloons} 🎈`);
    audio.shoot();
  }

  static handleRedBallBounce(projectile) {
    if (projectile.type !== "redball") return false;
    
    const owner = projectile.owner;
    const data = projectile.data;
    
    data.bounceCount++;
    
    console.log(`Red ball bounced! (${data.bounceCount}/${data.maxBounces})`);
    audio.bounce();
    
    // Check if ball should disappear after 10th bounce
    if (data.bounceCount >= data.maxBounces) {
      this.removeRedBall(owner, projectile);
      return false;
    }
    
    return true;
  }

  static handleRedBallHit(projectile, character) {
    if (projectile.type !== "redball") return;
    
    const owner = projectile.owner;
    const data = projectile.data;
    
    if (character === owner) {
      // Ball hit Mimic - count as bounce but don't damage
      data.bounceCount++;
      console.log(`Red ball hit Mimic! (${data.bounceCount}/${data.maxBounces})`);
    } else {
      // Ball hit enemy
      data.bounceCount++;
      
      // Check for 10th Impact
      if (data.bounceCount >= data.maxBounces) {
        // 10th Impact - 5 damage
        character.takeDamage(5, owner);
        console.log(`10th Impact! 5 damage to ${character.emoji}`);
        this.removeRedBall(owner, projectile);
        
        // Trigger Greatest Mimicry
        this.triggerGreatestMimicry(owner, character);
        return;
      } else {
        // Normal hit - 1 damage
        character.takeDamage(1, owner);
        console.log(`Red ball hit! 1 damage (${data.bounceCount}/${data.maxBounces})`);
        
        // Trigger Greatest Mimicry on any enemy hit
        this.triggerGreatestMimicry(owner, character);
      }
    }
    
    // Ball continues bouncing (doesn't disappear on character hit unless 10th)
    audio.hit();
  }

  static triggerGreatestMimicry(mimic, target) {
    const data = mimic.abilityData;
    
    // Check if mimicry is on cooldown or already active
    if (data.mimicOnCooldown || data.isMimicking) return;
    
    // Start mimicry
    data.isMimicking = true;
    data.mimicForm = target.emoji;
    data.mimicStartTime = gameTime;
    data.balloonsThrown = 0;
    data.lastBalloonTime = gameTime;
    
    // Change visual appearance
    mimic.emoji = target.emoji;
    
    console.log(`🎭 Greatest Mimicry activated! Mimic transformed into ${target.emoji}`);
    audio.ability();
    
    // Create transformation effect
    this.createMimicryEffect(mimic);
  }

  static endMimicry(character, currentTime) {
    const data = character.abilityData;
    
    // Restore original form
    character.emoji = data.originalEmoji;
    data.isMimicking = false;
    data.mimicForm = null;
    
    // Start cooldown
    data.mimicOnCooldown = true;
    data.mimicCooldownStart = currentTime;
    
    console.log(`Mimicry ended! Cooldown started (10 seconds).`);
  }

  static createMimicryEffect(character) {
    const canvas = document.getElementById('arena');
    const rect = canvas.getBoundingClientRect();
    
    // Create transformation effect
    const effect = document.createElement('div');
    effect.style.position = 'absolute';
    effect.style.left = `${rect.left + character.x - 40}px`;
    effect.style.top = `${rect.top + character.y - 40}px`;
    effect.style.width = '80px';
    effect.style.height = '80px';
    effect.style.background = 'radial-gradient(circle, rgba(255,20,147,0.8), rgba(138,43,226,0.4), transparent)';
    effect.style.borderRadius = '50%';
    effect.style.pointerEvents = 'none';
    effect.style.zIndex = '1000';
    effect.style.animation = 'mimicryPulse 1.5s ease-out forwards';
    
    document.body.appendChild(effect);
    
    setTimeout(() => effect.remove(), 1500);
  }

  static handleBalloonHit(projectile, character) {
    if (projectile.type !== "balloon") return;
    
    if (character === projectile.owner) return; // Balloons don't hit Mimic
    
    // Balloon hit enemy - 3 damage and pop
    character.takeDamage(3, projectile.owner);
    console.log(`Balloon hit! 3 damage to ${character.emoji}`);
    
    // Remove balloon
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
  }

  static handleBalloonWallHit(projectile) {
    if (projectile.type !== "balloon") return false;
    
    // Balloons pop when hitting walls
    console.log(`Balloon popped on wall! 🎈`);
    audio.bounce();
    return false; // Remove balloon
  }

  static handleProjectileVsMimic(projectile, mimic) {
    // During mimicry, Mimic is immune to all projectiles
    if (mimic.emoji !== "🤡" && mimic.abilityData && mimic.abilityData.isMimicking) {
      console.log(`Projectile passed through mimicking Mimic!`);
      return true; // Projectile passes through
    }
    return false; // Normal collision
  }

  static removeRedBall(mimic, ball) {
    if (!mimic.abilityData) return;
    
    const data = mimic.abilityData;
    
    // Clear ball reference
    if (data.activeBall === ball) {
      data.activeBall = null;
      data.ballActive = false;
    }
    
    // Remove from projectiles
    const index = projectiles.indexOf(ball);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
    
    console.log(`Red ball removed after ${ball.data.bounceCount} bounces.`);
  }

  static handleCharacterDeath(character) {
    // Clean up when Mimic dies
    if (character.abilityData && character.abilityData.originalEmoji === "🤡") {
      const data = character.abilityData;
      
      // Remove active ball
      if (data.activeBall) {
        this.removeRedBall(character, data.activeBall);
      }
      
      // Restore original form if mimicking
      if (data.isMimicking) {
        character.emoji = data.originalEmoji;
      }
    }
  }

  static getStatusInfo(character) {
    if (!character.abilityData || character.abilityData.originalEmoji !== "🤡") return null;
    
    const data = character.abilityData;
    return {
      ballActive: data.ballActive,
      ballBounces: data.ballBounces,
      isMimicking: data.isMimicking,
      mimicForm: data.mimicForm,
      mimicCooldown: data.mimicOnCooldown
    };
  }
}

// Red Ball and Balloon Projectile extensions
class MimicProjectile extends Projectile {
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

    // Handle specific projectile behaviors
    if (this.type === "redball") {
      return this.handleRedBallUpdate();
    } else if (this.type === "balloon") {
      return this.handleBalloonUpdate();
    }

    return true;
  }

  handleRedBallUpdate() {
    // Handle wall bouncing for red ball
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
      return MimicModule.handleRedBallBounce(this);
    }

    return true;
  }

  handleBalloonUpdate() {
    // Check wall collision for balloons - they pop
    const margin = this.size;
    if (this.x <= margin || this.x >= canvas.width - margin ||
        this.y <= margin || this.y >= canvas.height - margin) {
      return MimicModule.handleBalloonWallHit(this);
    }

    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.font = `${this.size * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Add effects for different projectiles
    if (this.type === 'redball') {
      ctx.shadowColor = "#ff4444";
      ctx.shadowBlur = 8;
      // Add rotation effect
      const rotation = this.age * 0.1;
      ctx.translate(this.x, this.y);
      ctx.rotate(rotation);
      ctx.fillText(this.emoji, 0, 0);
    } else if (this.type === 'balloon') {
      ctx.shadowColor = "#ff69b4";
      ctx.shadowBlur = 6;
      // Add floating effect
      const float = Math.sin(this.age * 0.2) * 2;
      ctx.fillText(this.emoji, this.x, this.y + float);
    } else {
      ctx.fillText(this.emoji, this.x, this.y);
    }
    
    ctx.restore();
  }
}

// Add CSS animations for effects
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes mimicryPulse {
      0% { 
        transform: scale(0) rotate(0deg);
        opacity: 1;
      }
      50% {
        transform: scale(1.5) rotate(180deg);
        opacity: 0.8;
      }
      100% { 
        transform: scale(0) rotate(360deg);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Export for global access
if (typeof window !== 'undefined') {
  window.MimicModule = MimicModule;
  window.MimicProjectile = MimicProjectile;
}