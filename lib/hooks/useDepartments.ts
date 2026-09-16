import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/departments';
import type {
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from '../api/departments';

const QUERY_KEY = 'departments';
const MY_QUERY_KEY = 'my-departments';

export function useDepartments() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: api.getDepartments,
  });
}

export function useMyDepartments() {
  return useQuery({
    queryKey: [MY_QUERY_KEY],
    queryFn: api.getMyDepartments,
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => api.getDepartment(id),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => api.createDepartment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MY_QUERY_KEY] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDepartmentPayload }) =>
      api.updateDepartment(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MY_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.id] });
    },
  });
}

export function useDeactivateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deactivateDepartment(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MY_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MY_QUERY_KEY] });
    },
  });
}

export function useAddDepartmentMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ departmentId, userId }: { departmentId: string; userId: string }) =>
      api.addDepartmentMember(departmentId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MY_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.departmentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
    },
  });
}

export function useRemoveDepartmentMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ departmentId, userId }: { departmentId: string; userId: string }) =>
      api.removeDepartmentMember(departmentId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [MY_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.departmentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
    },
  });
}
