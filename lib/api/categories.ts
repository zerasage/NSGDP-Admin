import { apiClient } from './client';
import type { PaginatedResponse } from '../types/common';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  datasetCount: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithDatasets extends Category {
  datasets: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
  }>;
}

export interface GetCategoriesParams {
  page?: number;
  limit?: number;
}

/**
 * Get all categories with pagination
 */
export async function getCategories(
  params?: GetCategoriesParams
): Promise<PaginatedResponse<Category>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<Category>>>('/categories', {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 50,
    },
  });
  return response.data.data;
}

/**
 * Get category by slug with datasets
 */
export async function getCategoryBySlug(
  slug: string
): Promise<CategoryWithDatasets> {
  const response = await apiClient.get<ApiResponse<CategoryWithDatasets>>(`/categories/${slug}`);
  return response.data.data;
}
