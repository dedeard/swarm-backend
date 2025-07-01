import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate random hex color
const randomColor = () => faker.internet.color();

// Generate categories
const generateCategories = (count: number = 10) => {
  return Array.from({ length: count }, () => ({
    name: faker.commerce.department(),
    description: faker.lorem.sentence(),
    metadata: {
      icon: faker.helpers.arrayElement([
        'code',
        'edit',
        'analyze',
        'chat',
        'search',
        'translate',
      ]),
      color: randomColor(),
    },
  }));
};

// Generate tools
const generateTools = (count: number = 20) => {
  const methods = ['sse', 'stdio', 'http'];
  const statuses = ['active', 'inactive', 'deprecated'];

  return Array.from({ length: count }, () => ({
    name: faker.commerce.productName(),
    description: faker.lorem.paragraph(),
    version: faker.system.semver(),
    cmd_run: `npm run ${faker.word.verb()}`,
    cmd_install: faker.helpers.arrayElement([
      'npm install',
      'yarn add',
      'pip install',
      'go get',
    ]),
    port: faker.number.int({ min: 3000, max: 9000 }),
    method: faker.helpers.arrayElement(methods),
    env: {
      API_KEY: faker.helpers.arrayElement(['required', 'optional']),
      BASE_URL: faker.internet.url(),
      TIMEOUT: faker.number.int({ min: 1000, max: 30000 }),
    },
    status: faker.helpers.arrayElement(statuses),
    logo_url: faker.image.url(),
    slug: faker.helpers.slugify(faker.commerce.productName()),
    website: faker.internet.url(),
    developer: faker.company.name(),
    source: `https://github.com/${faker.internet.userName()}/${faker.helpers.slugify(faker.commerce.productName())}`,
    license: faker.helpers.arrayElement(['MIT', 'Apache-2.0', 'GPL-3.0']),
    detailed_description: faker.lorem.paragraphs(3),
    security_note: faker.lorem.paragraph(),
    usage_suggestions: {
      examples: Array.from({ length: 3 }, () => ({
        title: faker.lorem.sentence(),
        code: faker.lorem.lines(3),
      })),
    },
    functions: {
      [faker.word.verb()]: {
        description: faker.lorem.sentence(),
        parameters: Array.from(
          { length: faker.number.int({ min: 1, max: 4 }) },
          () => faker.word.noun(),
        ),
      },
    },
    is_public: faker.datatype.boolean(),
  }));
};

async function main() {
  console.log('Starting to seed categories and tools...');

  // Create a sample company
  const company = await prisma.company.create({
    data: {
      name: faker.company.name(),
      description: faker.company.catchPhrase(),
      industry: faker.company.buzzPhrase(),
      email: faker.internet.email(),
      website: faker.internet.url(),
      founded_date: faker.date.past(),
      company_size: faker.helpers.arrayElement([
        '1-10',
        '11-50',
        '51-200',
        '201-500',
        '500+',
      ]),
    },
  });
  const tools = generateTools();
  console.log(`Generated ${tools.length} tools`);

  for (const tool of tools) {
    await prisma.tool.create({
      data: tool,
    });
  }
  console.log('Tools seeded successfully');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
