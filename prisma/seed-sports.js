const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_SPORTS = [
  { name: 'boxing',    nameAr: 'ملاكمة',         icon: '🥊', sortOrder: 1 },
  { name: 'swimming',  nameAr: 'سباحة',           icon: '🏊', sortOrder: 2 },
  { name: 'taekwondo', nameAr: 'تايكوندو',        icon: '🥋', sortOrder: 3 },
  { name: 'fitness',   nameAr: 'اللياقة البدنية', icon: '🏋️', sortOrder: 4 },
  { name: 'karate',    nameAr: 'الكاراتيه',       icon: '🤺', sortOrder: 5 },
  { name: 'football',  nameAr: 'كرة القدم',       icon: '⚽', sortOrder: 6 },
  { name: 'basketball',nameAr: 'كرة السلة',       icon: '🏀', sortOrder: 7 },
  { name: 'cycling',   nameAr: 'دراجات',          icon: '🚴', sortOrder: 8 },
];

async function main() {
  console.log('🌱 Seeding sports...');
  let created = 0;
  let skipped = 0;

  for (const sport of DEFAULT_SPORTS) {
    const existing = await prisma.sport.findUnique({ where: { name: sport.name } });
    if (existing) {
      console.log(`  ⏭️  Skipped "${sport.nameAr}" (already exists)`);
      skipped++;
    } else {
      await prisma.sport.create({ data: { ...sport, isActive: true } });
      console.log(`  ✅ Created "${sport.nameAr}" ${sport.icon}`);
      created++;
    }
  }

  console.log(`\n✅ Done: ${created} created, ${skipped} skipped.`);
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
