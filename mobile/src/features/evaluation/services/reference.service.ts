import { apiGet } from '@/src/api/client';
import { endpoints } from '@/src/api/endpoints';
import type { Criterion, Dimension, DimensionCode, EvaluationTask } from '@/src/types/models';

export async function getMamDimensions() {
  return apiGet<Dimension[]>(endpoints.mam.dimensions);
}

export async function getMamCriteria(dimensionCode?: DimensionCode) {
  return apiGet<Criterion[]>(endpoints.mam.criteria, dimensionCode ? { dimensionCode } : undefined);
}

export async function getEvaluationTasks() {
  return apiGet<EvaluationTask[]>(endpoints.evaluation.tasks);
}
