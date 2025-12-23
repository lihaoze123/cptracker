/**
 * @deprecated This file has been reorganized into src/services/oj/
 * Please import from @/services/oj instead
 *
 * This file is kept for backward compatibility
 * All exports are re-exported from the new service modules
 */

export {
  fetchCodeforces,
  fetchAtCoder,
  fetchLuogu,
  // Export types for backward compatibility
  type CodeforcesSubmission,
  type CodeforcesResponse,
  type AtCoderSubmission,
  type AtCoderProblemModel,
  type AtCoderProblemModels,
  type AtCoderProblem,
  type LuoguUserSummary,
  type LuoguUserSearchResponse,
  type LuoguProblemSummary,
  type LuoguRecord,
  type LuoguRecordList,
  type LuoguRecordListResponse,
  type LuoguPracticeData,
  type LuoguPracticeResponse,
} from "@/services/oj";
