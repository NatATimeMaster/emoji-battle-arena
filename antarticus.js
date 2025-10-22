// Antarticus Character Module
// 🐻‍❄️ Antarticus - Frozeflake projectiles with Frozen Veins and Polar Execution

class AntarticusModule {
  static initializeAbilities(character) {
    if (character.emoji !== "🐻‍❄️") return;
    
    character.abilityData = {
      lastFrozeflakeTime: 0,
      frozeflakeCooldown: 180, // 3 seconds
      enemyFreezeHits: 0,
      maxFreezeHits: 10,
      canDirectHit: false,
      polarExecutionReady: false
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "🐻‍❄️" || character.isDead) return;
    
    const currentTime = gameTime;
    
    // Handle frozeflake shooting
    if (currentTime - character.abilityData.lastFrozeflakeTime >= character.abilityData.frozeflakeCooldown) {
      this.shootFrozeflake(character);
      character.abilityData.lastFrozeflakeTime = currentTime;
    }
    
    // Check for Polar Execution
    if (character.abilityData.polarExecutionReady) {
      this.executePolarExecution(character);
    }
  }

  static shootFrozeflake(character) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 3;
    
    // Create frozeflake projectile
    const frozeflake = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "❄️", 0, character, "frozeflake",
      {
        antarticusOwner: character,
        bounces: 0,
        maxBounces: 5
      }
    );
    
    projectiles.push(frozeflake);
    
    console.log("🐻‍❄️ Antarticus shoots frozeflake!");
    audio.shoot();
  }

  static handleFrozeflakeHit(projectile, character) {
    if (character.team === projectile.owner.team) return;
    
    const antarticus = projectile.owner;
    const data = antarticus.abilityData;
    
    // Check if enemy is already frozen
    if (character.isFrozen) {
      // Enemy is frozen - frozeflake bounces off
      console.log("❄️ Frozeflake bounced off frozen enemy!");
      
      // Enable direct hit damage for Antarticus
      data.canDirectHit = true;
      
      // Remove frozeflake (it bounced)
      const index = projectiles.indexOf(projectile);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
      return;
    }
    
    // Apply freeze effect
    this.freezeEnemy(character, antarticus);
    
    // Track hits for Polar Execution
    data.enemyFreezeHits++;
    
    console.log(`❄️ Frozeflake hit! Freeze hits: ${data.enemyFreezeHits}/${data.maxFreezeHits}`);
    
    // Check for Polar Execution trigger
    if (data.enemyFreezeHits >= data.maxFreezeHits) {
      data.polarExecutionReady = true;
      console.log("🐻‍❄️ Polar Execution ready!");
    }
    
    // Remove frozeflake
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
  }

  static freezeEnemy(enemy, antarticus) {
    const data = antarticus.abilityData;
    
    // Calculate freeze duration (increases with each hit)
    const baseDuration = 180; // 3 seconds
    const additionalDuration = (data.enemyFreezeHits) * 60; // +1 second per previous hit
    const freezeDuration = baseDuration + additionalDuration;
    
    // Apply freeze
    enemy.freeze(freezeDuration);
    
    // Apply damage over time
    this.applyFrozenVeinsDamage(enemy, freezeDuration, antarticus);
    
    console.log(`❄️ Enemy frozen for ${freezeDuration/60} seconds!`);
    audio.ability();
  }

  static applyFrozenVeinsDamage(enemy, duration, antarticus) {
    const damageInterval = 60; // 1 second intervals
    const damagePerSecond = 1;
    const totalTicks = Math.floor(duration / damageInterval);
    
    let tickCount = 0;
    const damageTimer = setInterval(() => {
      if (tickCount >= totalTicks || enemy.isDead || !enemy.isFrozen) {
        clearInterval(damageTimer);
        return;
      }
      
      enemy.takeDamage(damagePerSecond, antarticus);
      console.log("❄️ Frozen Veins: 1 damage per second");
      
      tickCount++;
    }, damageInterval * (1000/60)); // Convert to milliseconds
  }

  static handleDirectHit(attacker, victim) {
    if (attacker.emoji !== "🐻‍❄️") return;
    
    const data = attacker.abilityData;
    
    // Check if direct hit is enabled (enemy is frozen)
    if (!data.canDirectHit || !victim.isFrozen) return;
    
    // Apply direct hit damage
    victim.takeDamage(3, attacker);
    
    // Remove freeze effect
    victim.unfreeze();
    
    // Disable direct hit until next freeze bounce
    data.canDirectHit = false;
    
    console.log("🐻‍❄️ Antarticus direct hit! 3 damage + freeze removed!");
    audio.hit();
  }

  static executePolarExecution(character) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    const data = character.abilityData;
    
    // Stop following bounce behavior
    character.vx = 0;
    character.vy = 0;
    
    // Calculate direction to enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 6; // Fast charge
    
    // Charge directly at enemy
    character.vx = Math.cos(angle) * speed;
    character.vy = Math.sin(angle) * speed;
    
    // Check if reached enemy
    const distance = Math.hypot(enemy.x - character.x, enemy.y - character.y);
    if (distance < 30) {
      // Execute polar strike
      enemy.takeDamage(10, character);
      
      // Reset everything
      data.polarExecutionReady = false;
      data.enemyFreezeHits = 0;
      data.canDirectHit = false;
      
      // Resume normal movement
      character.vx = (Math.random() * 2 - 1) * 2;
      character.vy = (Math.random() * 2 - 1) * 2;
      
      console.log("🐻‍❄️ POLAR EXECUTION! 10 damage dealt! Counter reset!");
      audio.hit();
    }
  }

  static handleFrozeflakeWallBounce(projectile) {
    projectile.data.bounces++;
    
    if (projectile.data.bounces >= projectile.data.maxBounces) {
      console.log("❄️ Frozeflake disappeared after 5 bounces");
      
      // Remove frozeflake
      const index = projectiles.indexOf(projectile);
      if (index > -1) {
        projectiles.splice(index, 1);
      }
      
      return false; // Remove projectile
    }
    
    return true; // Continue bouncing
  }

  static handleCharacterDeath(character) {
    if (character.emoji !== "🐻‍❄️") return;
    
    // Clear any freeze timers and reset abilities
    character.abilityData.polarExecutionReady = false;
    character.abilityData.canDirectHit = false;
    
    console.log("🐻‍❄️ Antarticus died, polar effects ended");
  }
}

class FrozeflakeProjectile extends Projectile {
  update() {
    return super.update();
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

window.AntarticusModule = AntarticusModule;