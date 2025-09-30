import { db } from "./db";
import { users, departments, pillars, kpis, targets } from "@shared/schema";
import bcrypt from "bcrypt";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Starting database seed...");

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log("Clearing existing data...");
    await db.delete(targets);
    await db.delete(kpis);
    await db.delete(pillars);
    await db.delete(users);
    await db.delete(departments);

    // Create departments
    console.log("Creating departments...");
    const departmentsResult = await db.insert(departments).values([
      {
        name: "Directorate of Legal and Corporate Services",
        code: "DLCB",
        description: "Handles legal affairs and corporate governance",
      },
      {
        name: "Directorate of Enterprise Infrastructure Development",
        code: "DEID",
        description: "Develops and maintains digital infrastructure",
      },
      {
        name: "Directorate of General and Corporate Services",
        code: "DGCS",
        description: "Provides general administrative and corporate services",
      },
      {
        name: "Directorate of e-Government Services",
        code: "DEGS",
        description: "Delivers e-government services and digital transformation",
      },
    ]).returning() as any[];
    
    const dlcb = departmentsResult[0];
    const deid = departmentsResult[1];
    const dgcs = departmentsResult[2];
    const degs = departmentsResult[3];

    console.log(`Created ${departmentsResult.length} departments`);

    // Create admin user
    console.log("Creating admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db.insert(users).values({
      username: "admin",
      email: "admin@nitda.gov.ng",
      password: hashedPassword,
      role: "admin",
      departmentId: dlcb.id,
    }).returning() as any[];

    console.log(`Created admin user (username: admin, password: admin123)`);

    // Create department owners
    console.log("Creating department owner users...");
    const ownersResult = await db.insert(users).values([
      {
        username: "dlcb_owner",
        email: "dlcb@nitda.gov.ng",
        password: await bcrypt.hash("password123", 10),
        role: "department_owner",
        departmentId: dlcb.id,
      },
      {
        username: "deid_owner",
        email: "deid@nitda.gov.ng",
        password: await bcrypt.hash("password123", 10),
        role: "department_owner",
        departmentId: deid.id,
      },
      {
        username: "dgcs_owner",
        email: "dgcs@nitda.gov.ng",
        password: await bcrypt.hash("password123", 10),
        role: "department_owner",
        departmentId: dgcs.id,
      },
      {
        username: "degs_owner",
        email: "degs@nitda.gov.ng",
        password: await bcrypt.hash("password123", 10),
        role: "department_owner",
        departmentId: degs.id,
      },
    ]).returning() as any[];
    
    const dlcbOwner = ownersResult[0];
    const deidOwner = ownersResult[1];
    const dgcsOwner = ownersResult[2];
    const degsOwner = ownersResult[3];

    console.log(`Created ${ownersResult.length} department owner users`);

    // Update departments with head users
    await db.update(departments).set({ headUserId: dlcbOwner.id }).where(sql`id = ${dlcb.id}`);
    await db.update(departments).set({ headUserId: deidOwner.id }).where(sql`id = ${deid.id}`);
    await db.update(departments).set({ headUserId: dgcsOwner.id }).where(sql`id = ${dgcs.id}`);
    await db.update(departments).set({ headUserId: degsOwner.id }).where(sql`id = ${degs.id}`);

    // Create pillars (SRAP 2.0 strategic pillars)
    console.log("Creating SRAP 2.0 pillars...");
    const pillarData = [
      { name: "Digital Literacy & Skills Development", description: "Enhance digital literacy and skills across Nigeria", orderIndex: 1 },
      { name: "Digital Infrastructure", description: "Develop robust digital infrastructure nationwide", orderIndex: 2 },
      { name: "Digital Services & Platforms", description: "Provide accessible digital services and platforms", orderIndex: 3 },
      { name: "Emerging Technologies & Innovation", description: "Foster innovation and adoption of emerging technologies", orderIndex: 4 },
      { name: "Digital Society & Economy", description: "Build a thriving digital society and economy", orderIndex: 5 },
    ];

    const createdPillars = await db.insert(pillars).values(pillarData).returning();
    console.log(`Created ${createdPillars.length} pillars`);

    // Create KPIs for each department
    console.log("Creating KPIs...");
    const kpiData = [
      // DLCB KPIs - Digital Literacy & Legal Framework
      {
        name: "Digital Literacy Rate",
        description: "Percentage of citizens with basic digital literacy",
        pillarId: createdPillars[0].id,
        departmentId: dlcb.id,
        unit: "percentage",
        dataType: "numeric",
        frequency: "quarterly",
      },
      {
        name: "Policy Compliance Rate",
        description: "Percentage of departments compliant with NITDA policies",
        pillarId: createdPillars[0].id,
        departmentId: dlcb.id,
        unit: "percentage",
        dataType: "numeric",
        frequency: "quarterly",
      },
      // DEID KPIs - Infrastructure Development
      {
        name: "Internet Penetration Rate",
        description: "Percentage of population with internet access",
        pillarId: createdPillars[1].id,
        departmentId: deid.id,
        unit: "percentage",
        dataType: "numeric",
        frequency: "quarterly",
      },
      {
        name: "Network Uptime",
        description: "Percentage uptime of critical digital infrastructure",
        pillarId: createdPillars[1].id,
        departmentId: deid.id,
        unit: "percentage",
        dataType: "numeric",
        frequency: "monthly",
      },
      {
        name: "Broadband Coverage",
        description: "Percentage of geographic area with broadband coverage",
        pillarId: createdPillars[1].id,
        departmentId: deid.id,
        unit: "percentage",
        dataType: "numeric",
        frequency: "quarterly",
      },
      // DGCS KPIs - Service Delivery
      {
        name: "Service Delivery Efficiency",
        description: "Average time to complete service requests",
        pillarId: createdPillars[2].id,
        departmentId: dgcs.id,
        unit: "days",
        dataType: "numeric",
        frequency: "monthly",
      },
      {
        name: "Staff Training Completion Rate",
        description: "Percentage of staff completing mandatory digital training",
        pillarId: createdPillars[0].id,
        departmentId: dgcs.id,
        unit: "percentage",
        dataType: "numeric",
        frequency: "quarterly",
      },
      // DEGS KPIs - e-Government Services
      {
        name: "Digital Service Adoption Rate",
        description: "Percentage of citizens using e-government services",
        pillarId: createdPillars[2].id,
        departmentId: degs.id,
        unit: "percentage",
        dataType: "numeric",
        frequency: "quarterly",
      },
      {
        name: "Platform Availability",
        description: "Uptime percentage of e-government platforms",
        pillarId: createdPillars[2].id,
        departmentId: degs.id,
        unit: "percentage",
        dataType: "numeric",
        frequency: "monthly",
      },
      {
        name: "Digital Transaction Volume",
        description: "Number of transactions processed through digital channels",
        pillarId: createdPillars[4].id,
        departmentId: degs.id,
        unit: "count",
        dataType: "numeric",
        frequency: "monthly",
      },
      {
        name: "Innovation Projects Completed",
        description: "Number of innovation projects completed",
        pillarId: createdPillars[3].id,
        departmentId: degs.id,
        unit: "count",
        dataType: "numeric",
        frequency: "quarterly",
      },
    ];

    const createdKPIs = await db.insert(kpis).values(kpiData).returning();
    console.log(`Created ${createdKPIs.length} KPIs`);

    // Create targets for Q1 2025
    console.log("Creating Q1 2025 targets...");
    const targetData = [
      // Digital Literacy Rate (DLCB) - Target 58%, current ~50%
      {
        kpiId: createdKPIs[0].id,
        year: 2025,
        quarter: 1,
        targetValue: "58.00",
        threshold: { green: 58, amber: 52, red: 48 },
      },
      // Policy Compliance Rate (DLCB) - Target 85%
      {
        kpiId: createdKPIs[1].id,
        year: 2025,
        quarter: 1,
        targetValue: "85.00",
        threshold: { green: 85, amber: 75, red: 65 },
      },
      // Internet Penetration Rate (DEID) - Target 65%
      {
        kpiId: createdKPIs[2].id,
        year: 2025,
        quarter: 1,
        targetValue: "65.00",
        threshold: { green: 65, amber: 58, red: 50 },
      },
      // Network Uptime (DEID) - Target 99.5%
      {
        kpiId: createdKPIs[3].id,
        year: 2025,
        quarter: 1,
        targetValue: "99.50",
        threshold: { green: 99.5, amber: 98, red: 95 },
      },
      // Broadband Coverage (DEID) - Target 70%
      {
        kpiId: createdKPIs[4].id,
        year: 2025,
        quarter: 1,
        targetValue: "70.00",
        threshold: { green: 70, amber: 62, red: 55 },
      },
      // Service Delivery Efficiency (DGCS) - Target 5 days
      {
        kpiId: createdKPIs[5].id,
        year: 2025,
        quarter: 1,
        targetValue: "5.00",
        threshold: { green: 5, amber: 7, red: 10 }, // Lower is better
      },
      // Staff Training Completion Rate (DGCS) - Target 90%
      {
        kpiId: createdKPIs[6].id,
        year: 2025,
        quarter: 1,
        targetValue: "90.00",
        threshold: { green: 90, amber: 80, red: 70 },
      },
      // Digital Service Adoption Rate (DEGS) - Target 55%
      {
        kpiId: createdKPIs[7].id,
        year: 2025,
        quarter: 1,
        targetValue: "55.00",
        threshold: { green: 55, amber: 48, red: 40 },
      },
      // Platform Availability (DEGS) - Target 99.9%
      {
        kpiId: createdKPIs[8].id,
        year: 2025,
        quarter: 1,
        targetValue: "99.90",
        threshold: { green: 99.9, amber: 99, red: 97 },
      },
      // Digital Transaction Volume (DEGS) - Target 50000
      {
        kpiId: createdKPIs[9].id,
        year: 2025,
        quarter: 1,
        targetValue: "50000.00",
        threshold: { green: 50000, amber: 42000, red: 35000 },
      },
      // Innovation Projects Completed (DEGS) - Target 8
      {
        kpiId: createdKPIs[10].id,
        year: 2025,
        quarter: 1,
        targetValue: "8.00",
        threshold: { green: 8, amber: 6, red: 4 },
      },
    ];

    const createdTargets = await db.insert(targets).values(targetData).returning();
    console.log(`Created ${createdTargets.length} targets for Q1 2025`);

    console.log("\n=== Seed completed successfully! ===");
    console.log("\nLogin credentials:");
    console.log("  Admin: username=admin, password=admin123");
    console.log("  DLCB Owner: username=dlcb_owner, password=password123");
    console.log("  DEID Owner: username=deid_owner, password=password123");
    console.log("  DGCS Owner: username=dgcs_owner, password=password123");
    console.log("  DEGS Owner: username=degs_owner, password=password123");
    console.log("\nSummary:");
    console.log(`  - ${departmentsResult.length} departments`);
    console.log(`  - ${ownersResult.length + 1} users (1 admin + ${ownersResult.length} department owners)`);
    console.log(`  - ${createdPillars.length} SRAP 2.0 pillars`);
    console.log(`  - ${createdKPIs.length} KPIs`);
    console.log(`  - ${createdTargets.length} Q1 2025 targets`);

  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("\nDatabase seeded successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nSeed error:", error);
    process.exit(1);
  });
