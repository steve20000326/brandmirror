import {
  FASHION_PACK_ID,
  FASHION_PACK_LABEL,
  FASHION_PACK_VERSION,
  FASHION_PLAN_QUOTA,
} from "./constants";
import { generateFashionQuestions } from "./generator";
import { FASHION_QUESTION_BANK } from "./question-bank";
import type { IndustryPack } from "../types";

export const fashionPack: IndustryPack = {
  id: FASHION_PACK_ID,
  version: FASHION_PACK_VERSION,
  label: FASHION_PACK_LABEL,
  planQuota: FASHION_PLAN_QUOTA,
  templates: FASHION_QUESTION_BANK,
  generateQuestions: generateFashionQuestions,
};

export {
  FASHION_PACK_ID,
  FASHION_PACK_LABEL,
  FASHION_PACK_VERSION,
  FASHION_PLAN_QUOTA,
} from "./constants";
export { FASHION_QUESTION_BANK, countByCategory } from "./question-bank";
export { generateFashionQuestions } from "./generator";
