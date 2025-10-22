// Grinch Character Module
// 👹 Grinch - Boulder projectiles with splitting and blood drop collection

class GrinchModule {
  static initializeAbilities(character) {
    if (character.emoji !== "👹") return;
    
    character.abilityData = {
      lastBoulderTime: 0,
      boulderCooldown: 360, // 6 seconds
      bloodDrops: [],
      bloodDropsCollected: 0,
      cooldownReduced: false
    };
  }

  static handleAbilities(character) {
    if (character.emoji !== "👹" || character.isDead) return;
    
    const currentTime = gameTime;
    
    // Boulder throwing
    if (currentTime - character.abilityData.lastBoulderTime >= character.abilityData.boulderCooldown) {
      this.throwBoulder(character);
      character.abilityData.lastBoulderTime = currentTime;
    }
    
    // Clean up old blood drops
    this.cleanupBloodDrops(character, currentTime);
  }

  static throwBoulder(character) {
    const enemy = character.getNearestEnemy();
    if (!enemy) return;
    
    // Calculate direction towards enemy
    const angle = Math.atan2(enemy.y - character.y, enemy.x - character.x);
    const speed = 2;
    
    // Create giant boulder (twice Grinch's size)
    const boulder = new Projectile(
      character.x, character.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      "🪨", 8, character, "giantboulder",
      {
        boulderType: "giant",
        grinchOwner: character,
        size: character.size * 2,
        generation: 1 // Track splitting generation
      }
    );
    
    projectiles.push(boulder);
    audio.shoot();
    console.log("👹 Grinch throws giant boulder!");
  }

  static handleBoulderHit(projectile, character) {
    if (character.team === projectile.owner.team) return;
    
    const boulderType = projectile.data.boulderType;
    let damage = 0;
    let bloodDropCount = 0;
    
    // Determine damage and blood drops based on boulder type
    switch (boulderType) {
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
    
    // Apply damage
    character.takeDamage(damage, projectile.owner);
    
    // Create blood drops at enemy location
    this.createBloodDrops(projectile.owner, character.x, character.y, bloodDropCount);
    
    console.log(`🪨 ${boulderType} hit for ${damage} damage! ${bloodDropCount} blood drops created.`);
    
    // Remove the boulder
    const index = projectiles.indexOf(projectile);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
  }

  static handleBoulderWallBounce(projectile) {
    const boulderType = projectile.data.boulderType;
    
    audio.bounce();
    
    // Split boulder based on type
    switch (boulderType) {
      case "giant":
        this.splitIntoSmallerBoulders(projectile, "boulder");
        break;
      case "boulder":
        this.splitIntoSmallerBoulders(projectile, "rock");
        break;
      case "rock":
        // Rocks vanish when hitting border
        console.log("🪨 Rock vanished after hitting border");
        const index = projectiles.indexOf(projectile);
        if (index > -1) {
          projectiles.splice(index, 1);
        }
        return false;
    }
    
    return false; // Remove original boulder after splitting
  }

  static splitIntoSmallerBoulders(originalBoulder, newType) {
    const owner = originalBoulder.owner;
    const x = originalBoulder.x;
    const y = originalBoulder.y;
    
    // Determine new properties
    let newEmoji = "🪨";
    let newSize = originalBoulder.data.size * 0.5; // 50% of original size
    let newDamage = 0;
    
    switch (newType) {
      case "boulder":
        newDamage = 4;
        break;
      case "rock":
        newDamage = 2;
        break;
    }
    
    // Create 2 smaller boulders
    for (let i = 0; i < 2; i++) {
      const angle = (Math.PI * i) + Math.random() * Math.PI * 0.5; // Spread them out
      const speed = 2;
      
      const smallerBoulder = new Projectile(
        x, y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        newEmoji, newDamage, owner, newType,
        {
          boulderType: newType,
          grinchOwner: owner,
          size: newSize,
          generation: originalBoulder.data.generation + 1
        }
      );
      
      projectiles.push(smallerBoulder);
    }
    
    console.log(`🪨 ${originalBoulder.data.boulderType} split into 2 ${newType}s!`);
    
    // Remove original boulder
    const index = projectiles.indexOf(originalBoulder);
    if (index > -1) {
      projectiles.splice(index, 1);
    }
  }

  static createBloodDrops(grinch, x, y, count) {
    for (let i = 0; i < count; i++) {
      // Scatter blood drops around the hit location
      const offsetX = (Math.random() * 60) - 30;
      const offsetY = (Math.random() * 60) - 30;
      
      const bloodDrop = {
        x: x + offsetX,
        y: y + offsetY,
        size: 15,
        createdTime: gameTime,
        lifetime: 300, // 5 seconds
        collected: false
      };
      
      grinch.abilityData.bloodDrops.push(bloodDrop);
    }
    
    console.log(`🩸 ${count} blood drops created!`);
  }

  static cleanupBloodDrops(character, currentTime) {
    const data = character.abilityData;
    
    // Remove expired blood drops
    data.bloodDrops = data.bloodDrops.filter(drop => {
      const age = currentTime - drop.createdTime;
      return age < drop.lifetime && !drop.collected;
    });
  }

  static checkBloodDropCollection(character) {
    const data = character.abilityData;
    
    data.bloodDrops.forEach(drop => {
      if (drop.collected) return;
      
      const distance = Math.hypot(character.x - drop.x, character.y - drop.y);
      if (distance < character.size + drop.size) {
        // Collect blood drop
        this.collectBloodDrop(character, drop);
      }
    });
  }

  static collectBloodDrop(character, drop) {
    const data = character.abilityData;
    
    // Mark as collected
    drop.collected = true;
    
    // Heal Grinch
    character.heal(3);
    
    // Increment collection counter
    data.bloodDropsCollected++;
    
    console.log(`🩸 Blood drop collected! Healed 3 HP. Total collected: ${data.bloodDropsCollected}`);
    
    // Check for cooldown reduction
    if (data.bloodDropsCollected >= 10 && !data.cooldownReduced) {
      data.cooldownReduced = true;
      data.boulderCooldown = 180; // Reduce to 3 seconds (50% reduction)
      console.log("👹 Bloodlust activated! Boulder cooldown reduced to 3 seconds!");
      audio.ability();
    }
  }

  static drawBloodDrops(ctx, character) {
    if (character.emoji !== "👹") return;
    
    const data = character.abilityData;
    
    data.bloodDrops.forEach(drop => {
      if (drop.collected) return;
      
      ctx.save();
      ctx.font = `${drop.size}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Add pulsing effect
      const pulse = Math.sin((gameTime - drop.createdTime) * 0.1) * 0.2 + 0.8;
      ctx.globalAlpha = pulse;
      
      ctx.fillText("🩸", drop.x, drop.y);
      ctx.restore();
    });
  }

  static handleCharacterDeath(character) {
    if (character.emoji !== "👹") return;
    
    // Clear blood drops when Grinch dies
    character.abilityData.bloodDrops = [];
    console.log("👹 Grinch died, blood drops cleared");
  }
}

class BoulderProjectile extends Projectile {
  update() {
    return super.update();
  }

  draw(ctx) {
    super.draw(ctx);
  }
}

window.GrinchModule = GrinchModule;