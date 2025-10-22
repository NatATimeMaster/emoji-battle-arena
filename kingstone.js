// Kingstone Character Module
// 🦁 Kingstone - Direct damage and Leo spawning with Pride mechanics

class KingstoneModule {
  static initializeAbilities(character) {
    if (character.emoji !== "🦁") return;
    
    character.abilityData = {
      prideMembers: [],
      lastDirectHitTime: 0,
      directHitCooldown: 30, // 0.5 seconds to prevent spam
      baseSize: character.size,
      currentSizeMultiplier: 1.0
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🦁" || character.isDead) return;
    
    const currentTime = gameTime;
    
    // Update Pride members
    this.updatePrideMembers(character, currentTime);
    
    // Update Kingstone's size based on Pride count
    this.updateKingstoneSize(character);
  }

  static handleDirectHit(attacker, victim) {
    if (attacker.emoji !== "🦁") return;
    
    const currentTime = gameTime;
    const data = attacker.abilityData;
    
    // Check cooldown to prevent spam damage
    if (currentTime - data.lastDirectHitTime < data.directHitCooldown) {
      return;
    }
    
    // Calculate damage based on Pride size
    const prideDamage = Math.max(1, data.prideMembers.length + 1); // +1 for Kingstone himself
    
    // Apply damage
    victim.takeDamage(prideDamage, attacker);
    data.lastDirectHitTime = currentTime;
    
    // Spawn Leo
    this.spawnLeo(attacker, victim);
    
    console.log(`🦁 Kingstone direct hit! ${prideDamage} damage. Pride size: ${data.prideMembers.length}`);
    audio.hit();
  }

  static spawnLeo(kingstone, target) {
    // Calculate direction towards enemy
    const angle = Math.atan2(target.y - kingstone.y, target.x - kingstone.x);
    const speed = 3;
    
    // Create Leo projectile
    const leo = new Projectile(
      kingstone.x, kingstone.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "♌", 0, kingstone, "leo",
      {
        kingstoneOwner: kingstone,
        birthTime: gameTime,
        hasEvolved: false
      }
    );
    
    projectiles.push(leo);
    
    console.log("♌ Leo spawned!");
    audio.shoot();
  }

  static handleLeoKingstoneCollision(leo, kingstone) {
    if (leo.data.hasEvolved) return;
    
    // Evolve Leo into Pride member
    this.evolveLeoToPrideMember(leo, kingstone);
  }

  static evolveLeoToPrideMember(leo, kingstone) {
    const data = kingstone.abilityData;
    
    // Create new Pride member
    const prideMember = new Projectile(
      leo.x, leo.y,
      (Math.random() * 2 - 1) * 2, (Math.random() * 2 - 1) * 2,
      "🦁", 1, kingstone, "pridemember",
      {
        kingstoneOwner: kingstone,
        hp: 15, // Base HP for Pride members
        maxHp: 15,
        birthTime: gameTime,
        isDead: false
      }
    );
    
    // Add HP bonus to all existing Pride members
    data.prideMembers.forEach(member => {
      if (!member.isDead) {
        member.data.maxHp += 8;
        member.data.hp += 8;
      }
    });
    
    // Add HP bonus to the new member based on existing Pride size
    const hpBonus = data.prideMembers.length * 8;
    prideMember.data.maxHp += hpBonus;
    prideMember.data.hp += hpBonus;
    
    // Add to Pride
    data.prideMembers.push(prideMember);
    projectiles.push(prideMember);
    
    console.log(`♌ Leo evolved into Pride member! HP: ${prideMember.data.hp} (${data.prideMembers.length} total Pride members)`);
    
    // Remove original Leo
    const leoIndex = projectiles.indexOf(leo);
    if (leoIndex > -1) {
      projectiles.splice(leoIndex, 1);
    }
    
    audio.ability();
  }

  static handlePrideMemberHit(prideMember, enemy) {
    if (enemy.team === prideMember.owner.team) return;
    
    // Pride members deal 1 damage
    enemy.takeDamage(1, prideMember.owner);
    console.log("🦁 Pride member hit for 1 damage!");
  }

  static handlePrideMemberDamage(prideMember, damage, attacker) {
    // Apply damage to Pride member
    prideMember.data.hp -= damage;
    
    if (prideMember.data.hp <= 0) {
      this.killPrideMember(prideMember);
    }
    
    console.log(`🦁 Pride member took ${damage} damage! HP: ${prideMember.data.hp}/${prideMember.data.maxHp}`);
  }

  static killPrideMember(prideMember) {
    const kingstone = prideMember.owner;
    const data = kingstone.abilityData;
    
    prideMember.data.isDead = true;
    
    // Remove from Pride array
    const index = data.prideMembers.indexOf(prideMember);
    if (index > -1) {
      data.prideMembers.splice(index, 1);
    }
    
    // Remove from projectiles
    const projIndex = projectiles.indexOf(prideMember);
    if (projIndex > -1) {
      projectiles.splice(projIndex, 1);
    }
    
    console.log(`🦁 Pride member died! Remaining: ${data.prideMembers.length}`);
  }

  static updatePrideMembers(character, currentTime) {
    const data = character.abilityData;
    
    // Clean up dead Pride members
    data.prideMembers = data.prideMembers.filter(member => !member.data.isDead);
    
    // Update Pride member behavior
    data.prideMembers.forEach(member => {
      if (member.data.isDead) return;
      
      // Pride members follow bounce behavior
      // This is handled by the base Projectile update
    });
  }

  static updateKingstoneSize(character) {
    const data = character.abilityData;
    const prideCount = data.prideMembers.length;
    
    // Each Pride member adds 0.2x size
    const newMultiplier = 1.0 + (prideCount * 0.2);
    
    if (newMultiplier !== data.currentSizeMultiplier) {
      data.currentSizeMultiplier = newMultiplier;
      character.size = data.baseSize * newMultiplier;
      
      console.log(`🦁 Kingstone size updated: ${newMultiplier.toFixed(1)}x (${prideCount} Pride members)`);
    }
  }

  static drawPrideMembers(ctx, character) {
    if (character.emoji !== "🦁") return;
    
    const data = character.abilityData;
    
    data.prideMembers.forEach(member => {
      if (member.data.isDead) return;
      
      // Draw Pride member
      ctx.save();
      ctx.font = "24px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Add glow effect
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 8;
      
      ctx.fillText(member.emoji, member.x, member.y);
      ctx.restore();
      
      // Draw HP bar for Pride members
      this.drawPrideMemberHP(ctx, member);
    });
  }

  static drawPrideMemberHP(ctx, member) {
    const barWidth = 30;
    const barHeight = 4;
    const x = member.x - barWidth / 2;
    const y = member.y - 20;
    
    // Background
    ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // HP bar
    const hpPercent = member.data.hp / member.data.maxHp;
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(x, y, barWidth * hpPercent, barHeight);
    
    // Border
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

  static handleCharacterDeath(character) {
    if (character.emoji !== "🦁") return;
    
    const data = character.abilityData;
    
    // Remove all Pride members when Kingstone dies
    data.prideMembers.forEach(member => {
      const index = projectiles.indexOf(member);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
    });
    
    data.prideMembers = [];
    console.log("🦁 Kingstone died, Pride disbanded");
  }
}

class LeoProjectile extends Projectile {
  update() {
    return super.update();
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

window.KingstoneModule = KingstoneModule;