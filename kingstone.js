// Kingstone Character Module
// 🦁 Kingstone - King of the PRIDE with Leo spawning and evolution

class KingstoneModule {
  static prideMembers = []; // Global array to track all Pride members
  static leoProjectiles = []; // Track Leo projectiles waiting to evolve

  static initializeAbilities(character) {
    if (character.emoji !== "🦁") return;
    
    character.abilityData = {
      // Pride management
      isPrideLeader: true, // This is the original Kingstone
      prideSize: 0, // Number of evolved Pride members (excluding Kingstone)
      directHitDamage: 1, // Base damage for Kingstone's hits
      
      // Visual scaling
      baseSizeMultiplier: 1.0,
      currentSizeMultiplier: 1.0,
      
      // Hit tracking
      lastHitTime: 0,
      hitCooldown: 30 // 0.5 second cooldown between hits
    };
    
    // Register as Pride leader
    if (!this.prideMembers.find(m => m.isPrideLeader)) {
      this.prideMembers.push(character);
    }
  }

  static handleAbilities(character) {
    if (character.emoji !== "🦁" || character.isDead) return;
    
    // Update Pride size and damage for the leader
    if (character.abilityData && character.abilityData.isPrideLeader) {
      this.updatePrideLeaderStats(character);
    }
    
    // Update visual scaling
    this.updateVisualScaling(character);
    
    // Clean up dead Pride members
    this.cleanupPrideMembers();
  }

  static updatePrideLeaderStats(character) {
    const data = character.abilityData;
    
    // Count living Pride members (excluding leader)
    const livingPrideCount = this.prideMembers.filter(m => 
      !m.isDead && !m.abilityData.isPrideLeader
    ).length;
    
    data.prideSize = livingPrideCount;
    data.directHitDamage = Math.max(1, livingPrideCount); // At least 1 damage
    
    // Update size based on Pride members
    data.currentSizeMultiplier = data.baseSizeMultiplier + (livingPrideCount * 0.2);
  }

  static updateVisualScaling(character) {
    if (!character.abilityData) return;
    
    const data = character.abilityData;
    if (data.isPrideLeader) {
      // Apply size scaling to Kingstone
      const newSize = character.baseSize * data.currentSizeMultiplier;
      if (Math.abs(character.size - newSize) > 0.1) {
        character.size = newSize;
        console.log(`🦁 Kingstone size updated: ${data.currentSizeMultiplier.toFixed(1)}x (${data.prideSize} Pride members)`);
      }
    }
  }

  static handleDirectHit(kingstone, enemy) {
    if (!kingstone.abilityData || !kingstone.abilityData.isPrideLeader) return false;
    
    const currentTime = gameTime;
    const data = kingstone.abilityData;
    
    // Check hit cooldown
    if (currentTime - data.lastHitTime < data.hitCooldown) {
      return false;
    }
    
    // Deal damage based on Pride size
    const damage = data.directHitDamage;
    enemy.takeDamage(damage, kingstone);
    data.lastHitTime = currentTime;
    
    // Spawn Leo
    this.spawnLeo(kingstone, enemy);
    
    console.log(`🦁 Kingstone hit enemy for ${damage} damage! (Pride size: ${data.prideSize})`);
    audio.hit();
    
    return true;
  }

  static spawnLeo(kingstone, enemy) {
    // Calculate spawn position near the hit
    const angle = Math.random() * Math.PI * 2;
    const distance = kingstone.size + 20;
    const spawnX = kingstone.x + Math.cos(angle) * distance;
    const spawnY = kingstone.y + Math.sin(angle) * distance;
    
    // Calculate initial velocity (random bounce direction)
    const speed = 3;
    const bounceAngle = Math.random() * Math.PI * 2;
    const vx = Math.cos(bounceAngle) * speed;
    const vy = Math.sin(bounceAngle) * speed;
    
    // Create Leo projectile
    const leo = new Projectile(
      spawnX, spawnY,
      vx, vy,
      "♌", 0, kingstone, "leo",
      {
        kingstoneOwner: kingstone,
        canEvolve: true,
        bounceCount: 0
      }
    );
    
    projectiles.push(leo);
    this.leoProjectiles.push(leo);
    
    console.log(`♌ Leo spawned! Current Leos waiting to evolve: ${this.leoProjectiles.length}`);
    audio.shoot();
  }

  static handleLeoHit(projectile, character) {
    if (projectile.type !== "leo") return;
    
    const owner = projectile.data.kingstoneOwner;
    
    // Check if Leo hits Kingstone (evolution trigger)
    if (character === owner && projectile.data.canEvolve) {
      this.evolveLeoToPride(projectile, owner);
      return;
    }
    
    // Leo ignores enemy abilities and doesn't deal damage
    // Just continue bouncing
  }

  static evolveLeoToPride(leoProjectile, kingstone) {
    // Remove Leo from projectiles
    const projectileIndex = projectiles.indexOf(leoProjectile);
    if (projectileIndex > -1) {
      projectiles.splice(projectileIndex, 1);
    }
    
    const leoIndex = this.leoProjectiles.indexOf(leoProjectile);
    if (leoIndex > -1) {
      this.leoProjectiles.splice(leoIndex, 1);
    }
    
    // Create new Pride member
    const prideMember = this.createPrideMember(leoProjectile.x, leoProjectile.y, kingstone);
    
    // Add HP bonus to all Pride members
    this.applyPrideHPBonus();
    
    console.log(`♌ → 🦁 Leo evolved! Pride size now: ${this.prideMembers.filter(m => !m.abilityData.isPrideLeader).length}`);
    audio.hit();
  }

  static createPrideMember(x, y, kingstone) {
    // Create new Pride member character
    const prideMember = new ArenaCharacter("🦁", x, y);
    
    // Initialize as Pride member (not leader)
    prideMember.abilityData = {
      isPrideLeader: false,
      prideSize: 0,
      directHitDamage: 1, // Pride members deal 1 damage
      baseSizeMultiplier: 1.0,
      currentSizeMultiplier: 1.0,
      lastHitTime: 0,
      hitCooldown: 30,
      
      // Pride member specific
      baseHp: 15, // Updated base HP
      bonusHp: 0
    };
    
    // Set initial HP (15 + any existing bonuses for better balance)
    const existingPrideCount = this.prideMembers.filter(m => !m.abilityData.isPrideLeader).length;
    const bonusHp = existingPrideCount * 8; // Increased bonus for more excitement
    prideMember.maxHp = 15 + bonusHp;
    prideMember.hp = prideMember.maxHp;
    prideMember.abilityData.bonusHp = bonusHp;
    
    // Add to arena and Pride
    charactersInArena.push(prideMember);
    this.prideMembers.push(prideMember);
    
    // Create HP display for new member
    this.createPrideMemberHPDisplay(prideMember);
    
    return prideMember;
  }

  static applyPrideHPBonus() {
    // All Pride members (excluding leader) get +5 HP
    const prideMembers = this.prideMembers.filter(m => 
      !m.isDead && !m.abilityData.isPrideLeader
    );
    
    prideMembers.forEach(member => {
      if (member.abilityData) {
        member.abilityData.bonusHp += 8; // Increased bonus
        const newMaxHp = 15 + member.abilityData.bonusHp; // Use new base HP
        const hpIncrease = newMaxHp - member.maxHp;
        
        member.maxHp = newMaxHp;
        member.hp += hpIncrease; // Also increase current HP
        
        console.log(`🦁 Pride member gained +8 HP! Now ${member.hp}/${member.maxHp}`);
      }
    });
    
    // Update HP displays
    updateHPDisplays();
  }

  static createPrideMemberHPDisplay(prideMember) {
    // Find the arena container to add HP display
    const arenaContainer = document.querySelector('.arena-container');
    if (!arenaContainer) return;
    
    // Create HP display similar to main characters
    const hpDisplay = document.createElement('div');
    hpDisplay.className = 'pride-hp-display';
    hpDisplay.innerHTML = `
      <div class="character-label">${prideMember.emoji}</div>
      <div class="hp-bar">
        <div class="current-hp"></div>
        <div class="fakehp"></div>
        <div class="shield"></div>
      </div>
      <div class="hp-text">${prideMember.hp}/${prideMember.maxHp}</div>
      <div class="status-indicators"></div>
    `;
    
    arenaContainer.appendChild(hpDisplay);
    prideMember.hpDisplay = hpDisplay;
  }

  static handlePrideMemberHit(prideMember, enemy) {
    if (!prideMember.abilityData || prideMember.abilityData.isPrideLeader) return false;
    
    const currentTime = gameTime;
    const data = prideMember.abilityData;
    
    // Check hit cooldown
    if (currentTime - data.lastHitTime < data.hitCooldown) {
      return false;
    }
    
    // Deal 1 damage
    enemy.takeDamage(1, prideMember);
    data.lastHitTime = currentTime;
    
    console.log(`🦁 Pride member hit enemy for 1 damage!`);
    audio.hit();
    
    return true;
  }

  static cleanupPrideMembers() {
    // Remove dead Pride members
    this.prideMembers = this.prideMembers.filter(member => {
      if (member.isDead) {
        // Remove HP display if it exists
        if (member.hpDisplay) {
          member.hpDisplay.remove();
        }
        // Remove from arena
        const arenaIndex = charactersInArena.indexOf(member);
        if (arenaIndex > -1) {
          charactersInArena.splice(arenaIndex, 1);
        }
        return false;
      }
      return true;
    });
    
    // Clean up Leo projectiles that no longer exist
    this.leoProjectiles = this.leoProjectiles.filter(leo => 
      projectiles.includes(leo)
    );
  }

  static handleCharacterDeath(character) {
    // Clean up when any Kingstone-related character dies
    if (character.emoji === "🦁") {
      // Remove from Pride members
      const index = this.prideMembers.indexOf(character);
      if (index > -1) {
        this.prideMembers.splice(index, 1);
      }
      
      // Remove HP display if it exists
      if (character.hpDisplay) {
        character.hpDisplay.remove();
      }
      
      // If this was the Pride leader, clean up everything
      if (character.abilityData && character.abilityData.isPrideLeader) {
        // Remove all Leo projectiles
        projectiles = projectiles.filter(p => p.type !== "leo");
        this.leoProjectiles = [];
        
        // Remove all Pride members
        this.prideMembers.forEach(member => {
          if (!member.abilityData.isPrideLeader) {
            member.die();
          }
        });
        this.prideMembers = [];
        
        console.log(`🦁 Kingstone died - Pride disbanded!`);
      }
    }
  }

  static getStatusInfo(character) {
    if (character.emoji !== "🦁" || !character.abilityData) return null;
    
    const data = character.abilityData;
    if (data.isPrideLeader) {
      return {
        prideSize: data.prideSize,
        directHitDamage: data.directHitDamage,
        sizeMultiplier: data.currentSizeMultiplier,
        activeLeos: this.leoProjectiles.length,
        totalPrideMembers: this.prideMembers.length
      };
    } else {
      return {
        baseHp: data.baseHp,
        bonusHp: data.bonusHp,
        totalHp: data.baseHp + data.bonusHp,
        isPrideMember: true
      };
    }
  }

  // Method to handle Leo projectile bouncing
  static handleLeoBounce(leoProjectile) {
    leoProjectile.data.bounceCount++;
    // Leos just bounce normally, no special behavior
  }
}

// Leo Projectile class extension
class LeoProjectile extends Projectile {
  constructor(x, y, vx, vy, emoji, damage, owner, type, data) {
    super(x, y, vx, vy, emoji, damage, owner, type, data);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;

    // Handle wall bouncing
    const margin = this.size;
    let bounced = false;
    
    if (this.x <= margin || this.x >= canvas.width - margin) {
      this.vx = -this.vx;
      this.x = Math.max(margin, Math.min(canvas.width - margin, this.x));
      bounced = true;
    }
    
    if (this.y <= margin || this.y >= canvas.height - margin) {
      this.vy = -this.vy;
      this.y = Math.max(margin, Math.min(canvas.height - margin, this.y));
      bounced = true;
    }
    
    if (bounced && window.KingstoneModule) {
      KingstoneModule.handleLeoBounce(this);
    }

    return true;
  }

  draw(ctx) {
    ctx.save();
    ctx.font = `${this.size * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Leo-specific visual effects
    ctx.shadowColor = "#ffd700"; // Golden glow
    ctx.shadowBlur = 12;
    
    // Gentle rotation
    const rotation = this.age * 0.1;
    ctx.translate(this.x, this.y);
    ctx.rotate(rotation);
    
    // Pulsing effect to show it can evolve
    if (this.data.canEvolve) {
      const pulse = Math.sin(this.age * 0.2) * 0.2 + 1.0;
      ctx.scale(pulse, pulse);
    }
    
    ctx.fillText(this.emoji, 0, 0);
    ctx.restore();
  }
}

// CSS for Pride member HP displays
const kingstoneStyles = `
  .pride-hp-display {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 5px 0;
    padding: 5px 10px;
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 5px;
    font-size: 0.9em;
  }
  
  .pride-hp-display .character-label {
    font-size: 1.2em;
    min-width: 30px;
  }
  
  .pride-hp-display .hp-bar {
    position: relative;
    width: 100px;
    height: 10px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 5px;
    overflow: hidden;
  }
  
  .pride-hp-display .current-hp {
    height: 100%;
    background: linear-gradient(90deg, #ff6b6b 0%, #ffd93d 50%, #6bcf7f 100%);
    transition: width 0.3s ease;
  }
  
  .pride-hp-display .hp-text {
    font-size: 0.8em;
    color: #ffd700;
    font-weight: bold;
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = kingstoneStyles;
  document.head.appendChild(style);
}

// Export for global access
if (typeof window !== 'undefined') {
  window.KingstoneModule = KingstoneModule;
  window.LeoProjectile = LeoProjectile;
}