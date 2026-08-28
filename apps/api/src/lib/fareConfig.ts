import { prisma } from "@vessel/db";
import { DEFAULT_FARE_CONFIG, type FareConfig } from "@vessel/shared";

const SETTING_ID = "default";

/** Reads the live fare rules, seeding the singleton row from defaults on first use. */
export async function getFareConfig(): Promise<FareConfig> {
  const setting = await prisma.fareSetting.upsert({
    where: { id: SETTING_ID },
    update: {},
    create: { id: SETTING_ID, ...DEFAULT_FARE_CONFIG },
  });
  return {
    baseFarePerRide: setting.baseFarePerRide,
    studentDiscount: setting.studentDiscount,
    pwdDiscount: setting.pwdDiscount,
    seniorDiscount: setting.seniorDiscount,
    childDiscount: setting.childDiscount,
  };
}
